import { useState } from 'react'
import { DateRange } from 'react-day-picker'
import { subDays } from 'date-fns'
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
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <FilterList color="primary" />
          <Typography variant="h6" fontWeight={600}>
            필터
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Date Range */}
          <Box>
            <Typography variant="subtitle2" fontWeight={500} gutterBottom>
              기간
            </Typography>
            <DateRangePicker value={dateRange} onChange={handleDateChange} />
            <ButtonGroup variant="outlined" size="small" fullWidth sx={{ mt: 1 }}>
              <Button onClick={() => handleQuickDate(7)}>최근 7일</Button>
              <Button onClick={() => handleQuickDate(30)}>최근 30일</Button>
              <Button onClick={() => handleQuickDate(90)}>최근 90일</Button>
            </ButtonGroup>
          </Box>

          {/* Machine Filter */}
          <FormControl fullWidth>
            <InputLabel>설비</InputLabel>
            <Select
              value={filters.machineId || 'all'}
              label="설비"
              onChange={(e) =>
                onChange({
                  ...filters,
                  machineId: e.target.value === 'all' ? undefined : e.target.value,
                })
              }
            >
              <MenuItem value="all">모든 설비</MenuItem>
              {machines.map((machine) => (
                <MenuItem key={machine.id} value={machine.id}>
                  {machine.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Model Filter */}
          <FormControl fullWidth>
            <InputLabel>제품 모델</InputLabel>
            <Select
              value={filters.modelId || 'all'}
              label="제품 모델"
              onChange={(e) =>
                onChange({
                  ...filters,
                  modelId: e.target.value === 'all' ? undefined : e.target.value,
                })
              }
            >
              <MenuItem value="all">모든 모델</MenuItem>
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
            필터 초기화
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}
