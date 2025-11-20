import { useState } from 'react'
import { DateRange } from 'react-day-picker'
import { subDays } from 'date-fns'
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
import type { AnalyticsFilters as Filters } from '@/types/analytics'

interface AnalyticsFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
  machines?: Array<{ id: string; name: string }>
  models?: Array<{ id: string; name: string }>
}

export function AnalyticsFilters({
  filters,
  onChange,
  machines = [],
  models = [],
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
    const to = new Date()
    const from = subDays(to, days)
    const range = { from, to }
    setDateRange(range)
    onChange({
      ...filters,
      dateRange: range,
    })
  }

  const handleReset = () => {
    const defaultRange = {
      from: subDays(new Date(), 30),
      to: new Date(),
    }
    setDateRange(defaultRange)
    onChange({
      dateRange: defaultRange,
      machineId: undefined,
      modelId: undefined,
    })
  }

  return (
    <Card elevation={3}>
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

          {/* Machine Filter */}
          <FormControl fullWidth>
            <InputLabel>{t('dashboard.machine')}</InputLabel>
            <Select
              value={filters.machineId || 'all'}
              label={t('dashboard.machine')}
              onChange={(e) =>
                onChange({
                  ...filters,
                  machineId: e.target.value === 'all' ? undefined : e.target.value,
                })
              }
            >
              <MenuItem value="all">{t('analytics.allMachines')}</MenuItem>
              {machines.map((machine) => (
                <MenuItem key={machine.id} value={machine.id}>
                  {machine.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Model Filter */}
          <FormControl fullWidth>
            <InputLabel>{t('dashboard.model')}</InputLabel>
            <Select
              value={filters.modelId || 'all'}
              label={t('dashboard.model')}
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
                  {model.name}
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
