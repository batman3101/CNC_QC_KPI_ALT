import { useState } from 'react'
import { DateRange } from 'react-day-picker'
import { subDays } from 'date-fns'
import { Filter, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          필터
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range */}
        <div className="space-y-2">
          <Label>기간</Label>
          <DateRangePicker value={dateRange} onChange={handleDateChange} />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate(7)}
            >
              최근 7일
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate(30)}
            >
              최근 30일
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate(90)}
            >
              최근 90일
            </Button>
          </div>
        </div>

        {/* Machine Filter */}
        <div className="space-y-2">
          <Label>설비</Label>
          <Select
            value={filters.machineId || 'all'}
            onValueChange={(value) =>
              onChange({
                ...filters,
                machineId: value === 'all' ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="모든 설비" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 설비</SelectItem>
              {machines.map((machine) => (
                <SelectItem key={machine.id} value={machine.id}>
                  {machine.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Filter */}
        <div className="space-y-2">
          <Label>제품 모델</Label>
          <Select
            value={filters.modelId || 'all'}
            onValueChange={(value) =>
              onChange({
                ...filters,
                modelId: value === 'all' ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="모든 모델" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 모델</SelectItem>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        <Button variant="outline" className="w-full" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          필터 초기화
        </Button>
      </CardContent>
    </Card>
  )
}
