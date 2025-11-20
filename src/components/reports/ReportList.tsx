import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
  Skeleton,
  Tooltip,
} from '@mui/material'
import {
  Download,
  Delete,
  PictureAsPdf,
  TableChart,
  HourglassEmpty,
  CheckCircle,
  Error,
} from '@mui/icons-material'
import type { Report } from '@/types/report'
import * as reportService from '@/ui_test/mockServices/mockReportService'

interface ReportListProps {
  reports: Report[]
  isLoading: boolean
}

export function ReportList({ reports, isLoading }: ReportListProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportService.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })

  const downloadMutation = useMutation({
    mutationFn: (id: string) => reportService.downloadReport(id),
    onSuccess: (blob, id) => {
      // Find report to get the format
      const report = reports.find((r) => r.id === id)
      const extension = report?.format === 'excel' ? 'xlsx' : 'pdf'

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `report-${id}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
  })

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'daily':
        return t('reports.daily')
      case 'weekly':
        return t('reports.weekly')
      case 'monthly':
        return t('reports.monthly')
      case 'custom':
        return t('reports.custom')
      default:
        return type
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle fontSize="small" />
      case 'generating':
        return <HourglassEmpty fontSize="small" />
      case 'failed':
        return <Error fontSize="small" />
      default:
        return undefined
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'generating':
        return 'warning'
      case 'failed':
        return 'error'
      default:
        return 'default'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <Card elevation={3}>
        <CardHeader title={t('reports.reportList')} />
        <CardContent>
          <Box sx={{ py: 2 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={60} sx={{ mb: 1 }} />
            ))}
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (reports.length === 0) {
    return (
      <Card elevation={3}>
        <CardHeader title={t('reports.reportList')} />
        <CardContent>
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('reports.noReports')}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card elevation={3}>
      <CardHeader title={t('reports.reportList')} />
      <CardContent>
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('reports.reportTitle')}</TableCell>
                <TableCell>{t('reports.type')}</TableCell>
                <TableCell>{t('reports.format')}</TableCell>
                <TableCell>{t('reports.dateRange')}</TableCell>
                <TableCell>{t('reports.status')}</TableCell>
                <TableCell>{t('reports.createdAt')}</TableCell>
                <TableCell align="center">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {report.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getReportTypeLabel(report.type)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {report.format === 'pdf' ? (
                        <PictureAsPdf fontSize="small" color="error" />
                      ) : (
                        <TableChart fontSize="small" color="success" />
                      )}
                      <Typography variant="body2">
                        {report.format.toUpperCase()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(report.date_from).toLocaleDateString('ko-KR')} ~{' '}
                      {new Date(report.date_to).toLocaleDateString('ko-KR')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(report.status)}
                      label={t(`reports.status_${report.status}`)}
                      color={getStatusColor(report.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(report.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title={t('reports.download')}>
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            disabled={
                              report.status !== 'completed' ||
                              downloadMutation.isPending
                            }
                            onClick={() => downloadMutation.mutate(report.id)}
                          >
                            <Download fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={t('common.delete')}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(report.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}
