import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Alert,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  SelectChangeEvent,
} from '@mui/material'
import {
  PictureAsPdf,
  TableChart,
  CalendarToday,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ko } from 'date-fns/locale'
import { getRecentBusinessDays } from '@/lib/dateUtils'
import type { ReportType, ReportFormat, ReportFilters } from '@/types/report'
import * as reportService from '@/services/reportService'

interface ReportGeneratorProps {
  models: { id: string; name: string; code: string }[]
  processes: { id: string; name: string; code: string }[]
}

export function ReportGenerator({ models, processes }: ReportGeneratorProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [reportType, setReportType] = useState<ReportType>('daily')
  const [format, setFormat] = useState<ReportFormat>('pdf')
  // Use business day range (08:00 ~ next day 07:59)
  const initialRange = getRecentBusinessDays(7)
  const [dateFrom, setDateFrom] = useState<Date | null>(initialRange.from)
  const [dateTo, setDateTo] = useState<Date | null>(initialRange.to)
  const [modelId, setModelId] = useState<string>('')
  const [processId, setProcessId] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const generateMutation = useMutation({
    mutationFn: async (filters: ReportFilters) => {
      setSuccessMessage('')
      setErrorMessage('')
      const newReport = await reportService.generateReport(filters, format)
      return newReport
    },
    onSuccess: async (newReport) => {
      // Invalidate queries to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['reports'] })

      // Wait a bit for the cache to update
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Auto-download the generated report
      try {
        const blob = await reportService.downloadReport(newReport.id)
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${newReport.title}.${format === 'excel' ? 'xlsx' : 'pdf'}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        setSuccessMessage(t('reports.generateSuccess'))
      } catch (error) {
        console.error('Failed to download report:', error)
        setErrorMessage(t('reports.downloadError'))
      }
    },
    onError: (error) => {
      console.error('Failed to generate report:', error)
      setErrorMessage(t('reports.generateError'))
    },
  })

  const handleReportTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: ReportType | null
  ) => {
    if (newType) {
      setReportType(newType)
      // Auto-adjust date range based on report type (using business day range)
      switch (newType) {
        case 'daily': {
          const range = getRecentBusinessDays(0)
          setDateFrom(range.from)
          setDateTo(range.to)
          break
        }
        case 'weekly': {
          const range = getRecentBusinessDays(7)
          setDateFrom(range.from)
          setDateTo(range.to)
          break
        }
        case 'monthly': {
          const range = getRecentBusinessDays(30)
          setDateFrom(range.from)
          setDateTo(range.to)
          break
        }
        case 'custom':
          // Keep current dates for custom
          break
      }
    }
  }

  const handleFormatChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFormat: ReportFormat | null
  ) => {
    if (newFormat) {
      setFormat(newFormat)
    }
  }

  const handleGenerate = () => {
    if (!dateFrom || !dateTo) return

    const filters: ReportFilters = {
      dateRange: {
        from: dateFrom,
        to: dateTo,
      },
      reportType,
      modelId: modelId || undefined,
      processId: processId || undefined,
    }

    generateMutation.mutate(filters)
  }

  return (
    <Card elevation={3}>
      <CardHeader title={t('reports.generateTitle')} />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Report Type Selection */}
          <Box>
            <InputLabel sx={{ mb: 1, fontWeight: 600 }}>
              {t('reports.reportType')}
            </InputLabel>
            <ToggleButtonGroup
              value={reportType}
              exclusive
              onChange={handleReportTypeChange}
              fullWidth
              sx={{ mb: 2 }}
            >
              <ToggleButton value="daily">{t('reports.daily')}</ToggleButton>
              <ToggleButton value="weekly">{t('reports.weekly')}</ToggleButton>
              <ToggleButton value="monthly">{t('reports.monthly')}</ToggleButton>
              <ToggleButton value="custom">{t('reports.custom')}</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Date Range */}
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <DatePicker
                  label={t('reports.dateFrom')}
                  value={dateFrom}
                  onChange={setDateFrom}
                  slotProps={{
                    textField: { fullWidth: true },
                  }}
                  disabled={reportType !== 'custom'}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <DatePicker
                  label={t('reports.dateTo')}
                  value={dateTo}
                  onChange={setDateTo}
                  slotProps={{
                    textField: { fullWidth: true },
                  }}
                  disabled={reportType !== 'custom'}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>

          {/* Model and Process Filters - 코드 기준 */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>{t('management.modelCode')}</InputLabel>
                <Select
                  value={modelId}
                  onChange={(e: SelectChangeEvent) => setModelId(e.target.value)}
                  label={t('management.modelCode')}
                >
                  <MenuItem value="">{t('reports.allModels')}</MenuItem>
                  {models.map((model) => (
                    <MenuItem key={model.id} value={model.id}>
                      {model.code} - {model.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>{t('reports.process')}</InputLabel>
                <Select
                  value={processId}
                  onChange={(e: SelectChangeEvent) => setProcessId(e.target.value)}
                  label={t('reports.process')}
                >
                  <MenuItem value="">{t('reports.allProcesses')}</MenuItem>
                  {processes.map((process) => (
                    <MenuItem key={process.id} value={process.id}>
                      {process.code} - {process.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Format Selection */}
          <Box>
            <InputLabel sx={{ mb: 1, fontWeight: 600 }}>
              {t('reports.format')}
            </InputLabel>
            <ToggleButtonGroup
              value={format}
              exclusive
              onChange={handleFormatChange}
              fullWidth
            >
              <ToggleButton value="pdf">
                <PictureAsPdf sx={{ mr: 1 }} />
                PDF
              </ToggleButton>
              <ToggleButton value="excel">
                <TableChart sx={{ mr: 1 }} />
                Excel
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Generate Button */}
          <Button
            variant="contained"
            size="large"
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !dateFrom || !dateTo}
            startIcon={
              generateMutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                <CalendarToday />
              )
            }
          >
            {generateMutation.isPending
              ? t('reports.generating')
              : t('reports.generate')}
          </Button>

          {/* Success/Error Messages */}
          {successMessage && (
            <Alert severity="success" onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
