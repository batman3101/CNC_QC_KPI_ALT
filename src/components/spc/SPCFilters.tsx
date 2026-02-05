/**
 * SPC Filters 컴포넌트
 * SPC 데이터 필터링 UI
 */

import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateRangePicker } from '@/components/analytics/DateRangePicker'
import { RotateCcw } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import type { ControlChartType } from '@/types/spc'

interface SPCFiltersProps {
  models: Array<{ id: string; name: string; code: string }>
  processes?: Array<{ id: string; name: string; code: string }>
  inspectionItems?: Array<{ id: string; name: string }>
  selectedModelId?: string
  selectedProcessId?: string
  selectedItemId?: string
  selectedChartType?: ControlChartType
  dateRange?: DateRange
  onModelChange: (modelId: string | undefined) => void
  onProcessChange?: (processId: string | undefined) => void
  onItemChange?: (itemId: string | undefined) => void
  onChartTypeChange?: (chartType: ControlChartType) => void
  onDateRangeChange: (range: DateRange | undefined) => void
  onReset: () => void
  showChartTypeFilter?: boolean
  showItemFilter?: boolean
}

export function SPCFilters({
  models,
  processes,
  inspectionItems,
  selectedModelId,
  selectedProcessId,
  selectedItemId,
  selectedChartType = 'p-chart',
  dateRange,
  onModelChange,
  onProcessChange,
  onItemChange,
  onChartTypeChange,
  onDateRangeChange,
  onReset,
  showChartTypeFilter = false,
  showItemFilter = false,
}: SPCFiltersProps) {
  const { t } = useTranslation()

  const chartTypes: Array<{ value: ControlChartType; label: string }> = [
    { value: 'p-chart', label: t('spc.pChart') },
    { value: 'np-chart', label: t('spc.npChart') },
    { value: 'x-mr', label: t('spc.xmrChart') },
    { value: 'x-bar-r', label: t('spc.xbarRChart') },
  ]

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* 모델 선택 */}
          <div className="min-w-[180px] flex-1">
            <label className="mb-1.5 block text-sm font-medium">
              {t('spc.selectModel')}
            </label>
            <Select
              value={selectedModelId || 'all'}
              onValueChange={(value) => onModelChange(value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('spc.selectModel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('analytics.allModels')}</SelectItem>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name} ({model.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 공정 선택 */}
          {processes && onProcessChange && (
            <div className="min-w-[180px] flex-1">
              <label className="mb-1.5 block text-sm font-medium">
                {t('spc.selectProcess')}
              </label>
              <Select
                value={selectedProcessId || 'all'}
                onValueChange={(value) => onProcessChange(value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('spc.selectProcess')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('analytics.allProcesses')}</SelectItem>
                  {processes.map((process) => (
                    <SelectItem key={process.id} value={process.id}>
                      {process.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 검사 항목 선택 */}
          {showItemFilter && inspectionItems && onItemChange && (
            <div className="min-w-[180px] flex-1">
              <label className="mb-1.5 block text-sm font-medium">
                {t('spc.selectItem')}
              </label>
              <Select
                value={selectedItemId || ''}
                onValueChange={(value) => onItemChange(value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('spc.selectItem')} />
                </SelectTrigger>
                <SelectContent>
                  {inspectionItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 차트 유형 선택 */}
          {showChartTypeFilter && onChartTypeChange && (
            <div className="min-w-[180px] flex-1">
              <label className="mb-1.5 block text-sm font-medium">
                {t('spc.selectChartType')}
              </label>
              <Select
                value={selectedChartType}
                onValueChange={(value) => onChartTypeChange(value as ControlChartType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('spc.selectChartType')} />
                </SelectTrigger>
                <SelectContent>
                  {chartTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 기간 선택 */}
          <div className="min-w-[280px] flex-1">
            <label className="mb-1.5 block text-sm font-medium">
              {t('spc.dateRange')}
            </label>
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
            />
          </div>

          {/* 초기화 버튼 */}
          <Button variant="outline" onClick={onReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            {t('analytics.resetFilter')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
