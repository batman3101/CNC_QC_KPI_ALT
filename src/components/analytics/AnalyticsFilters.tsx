import { useState } from 'react'
import { DateRange } from 'react-day-picker'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ButtonGroup,
} from '@mui/material'
import { FilterList, Refresh } from '@mui/icons-material'
import { DateRangePicker } from './DateRangePicker'
import { getRecentBusinessDays } from '@/lib/dateUtils'
import type { AnalyticsFilters as Filters } from '@/types/analytics'

interface AnalyticsFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
  models?: Array<{ id: string; name: string; code: string }>
  processes?: Array<{ id: string; name: string; code: string }>
}

export function AnalyticsFilters({
  filters,
  onChange,
  models = [],
  processes = [],
}: AnalyticsFiltersProps) {
  const { t } = useTranslation()

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: filters.dateRange.from,
    to: filters.dateRange.to,
  })

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      onChange({
        ...filters,
        dateRange: { from: range.from, to: range.to },
      })
    }
  }

  const handleQuickDate = (days: number) => {
    // Use business day range (08:00 ~ next day 07:59)
    const range = getRecentBusinessDays(days)
    setDateRange(range)
    onChange({
      ...filters,
      dateRange: range,
    })
  }

  const handleReset = () => {
    // Use business day range (08:00 ~ next day 07:59)
    const defaultRange = getRecentBusinessDays(30)
    setDateRange(defaultRange)
    onChange({
      dateRange: defaultRange,
      modelId: undefined,
      processId: undefined,
    })
  }

  return (
    <Card 
      elevation={3}
      sx={{
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <FilterList color="primary" />
          <Typography variant="h6" fontWeight={600}>
            {t('common.filter')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Date Range */}
          <Box>
            <Typography variant="subtitle2" fontWeight={500} gutterBottom>
              {t('analytics.period')}
            </Typography>
            <DateRangePicker value={dateRange} onChange={handleDateChange} />
            <ButtonGroup variant="outlined" size="small" fullWidth sx={{ mt: 1 }}>
              <Button onClick={() => handleQuickDate(7)}>{t('analytics.last7Days')}</Button>
              <Button onClick={() => handleQuickDate(30)}>{t('analytics.last30Days')}</Button>
              <Button onClick={() => handleQuickDate(90)}>{t('analytics.last90Days')}</Button>
            </ButtonGroup>
          </Box>

          {/* Model Filter - 모델 코드 기준 */}
          <FormControl fullWidth>
            <InputLabel>{t('management.modelCode')}</InputLabel>
            <Select
              value={filters.modelId || 'all'}
              label={t('management.modelCode')}
              onChange={(e) =>
                onChange({
                  ...filters,
                  modelId: e.target.value === 'all' ? undefined : e.target.value,
                })
              }
            >
              <MenuItem value="all">{t('analytics.allModels')}</MenuItem>
              {models.map((model) => (
                <MenuItem key={model.id} value={model.id}>
                  {model.code} - {model.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Process Filter - 공정 코드 기준 */}
          <FormControl fullWidth>
            <InputLabel>{t('inspection.process')}</InputLabel>
            <Select
              value={filters.processId || 'all'}
              label={t('inspection.process')}
              onChange={(e) =>
                onChange({
                  ...filters,
                  processId: e.target.value === 'all' ? undefined : e.target.value,
                })
              }
            >
              <MenuItem value="all">{t('analytics.allProcesses')}</MenuItem>
              {processes.map((process) => (
                <MenuItem key={process.id} value={process.id}>
                  {process.code} - {process.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Reset Button */}
          <Button
            variant="outlined"
            fullWidth
            startIcon={<Refresh />}
            onClick={handleReset}
          >
            {t('analytics.resetFilter')}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}
