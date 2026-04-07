/**
 * Model SPC Summary Table 컴포넌트
 * 모델별 SPC 요약 테이블 (정렬 + 페이지네이션)
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertTriangle, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ModelSPCSummary, CapabilityRating } from '@/types/spc'

type SortKey = 'model_name' | 'items_count' | 'avg_cpk' | 'overall_rating' | 'open_alerts_count'
type SortDir = 'asc' | 'desc'

const RATING_ORDER: Record<CapabilityRating, number> = {
  excellent: 4, good: 3, adequate: 2, poor: 1, inadequate: 0,
}

const PAGE_SIZE = 10

interface ModelSPCSummaryTableProps {
  data: ModelSPCSummary[]
  onRowClick?: (modelId: string) => void
}

export function ModelSPCSummaryTable({ data, onRowClick }: ModelSPCSummaryTableProps) {
  const { t } = useTranslation()
  const [sortKey, setSortKey] = useState<SortKey>('avg_cpk')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(0)
  }

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'model_name': cmp = a.model_name.localeCompare(b.model_name); break
        case 'items_count': cmp = a.items_count - b.items_count; break
        case 'avg_cpk': cmp = a.avg_cpk - b.avg_cpk; break
        case 'overall_rating': cmp = RATING_ORDER[a.overall_rating] - RATING_ORDER[b.overall_rating]; break
        case 'open_alerts_count': cmp = a.open_alerts_count - b.open_alerts_count; break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [data, sortKey, sortDir])

  const totalPages = Math.ceil(sortedData.length / PAGE_SIZE)
  const pagedData = sortedData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />
    return sortDir === 'asc'
      ? <ArrowUp className="ml-1 inline h-3 w-3" />
      : <ArrowDown className="ml-1 inline h-3 w-3" />
  }

  const getRatingBadge = (rating: CapabilityRating) => {
    const configs: Record<CapabilityRating, { className: string }> = {
      excellent: { className: 'bg-green-500 hover:bg-green-600' },
      good: { className: 'bg-blue-500 hover:bg-blue-600' },
      adequate: { className: 'bg-yellow-500 text-black hover:bg-yellow-600' },
      poor: { className: 'bg-orange-500 hover:bg-orange-600' },
      inadequate: { className: 'bg-red-500 hover:bg-red-600' },
    }
    const config = configs[rating]
    return (
      <Badge className={config.className}>
        {t(`spc.capability.${rating}`).split(' ')[0]}
      </Badge>
    )
  }

  const getCpkColor = (cpk: number) => {
    if (cpk >= 1.67) return 'text-green-600'
    if (cpk >= 1.33) return 'text-blue-600'
    if (cpk >= 1.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCpkProgressColor = (cpk: number) => {
    if (cpk >= 1.67) return 'bg-green-500'
    if (cpk >= 1.33) return 'bg-blue-500'
    if (cpk >= 1.0) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (data.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>{t('analytics.modelDefectDistribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">{t('spc.noData')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('spc.processCapability')} - {t('dashboard.model')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('model_name')}>
                  {t('dashboard.model')}<SortIcon col="model_name" />
                </TableHead>
                <TableHead className="cursor-pointer select-none text-center" onClick={() => handleSort('items_count')}>
                  {t('spc.kpi.totalMonitored')}<SortIcon col="items_count" />
                </TableHead>
                <TableHead className="cursor-pointer select-none text-center" onClick={() => handleSort('avg_cpk')}>
                  {t('spc.kpi.avgCpk')}<SortIcon col="avg_cpk" />
                </TableHead>
                <TableHead className="text-center">Min / Max Cpk</TableHead>
                <TableHead className="cursor-pointer select-none text-center" onClick={() => handleSort('overall_rating')}>
                  {t('dashboard.status')}<SortIcon col="overall_rating" />
                </TableHead>
                <TableHead className="cursor-pointer select-none text-center" onClick={() => handleSort('open_alerts_count')}>
                  {t('spc.alertsTitle')}<SortIcon col="open_alerts_count" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedData.map((model) => (
                <TableRow
                  key={model.model_id}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => onRowClick?.(model.model_id)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{model.model_name}</div>
                      <div className="text-xs text-muted-foreground">{model.model_code}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{model.items_count}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-lg font-bold ${getCpkColor(model.avg_cpk)}`}>
                        {model.avg_cpk.toFixed(2)}
                      </span>
                      <div className="w-full max-w-[100px]">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full transition-all ${getCpkProgressColor(model.avg_cpk)}`}
                            style={{ width: `${Math.min(100, (model.avg_cpk / 2) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-sm">
                      <span className={getCpkColor(model.min_cpk)}>{model.min_cpk.toFixed(2)}</span>
                      <span className="mx-1 text-muted-foreground">/</span>
                      <span className={getCpkColor(model.max_cpk)}>{model.max_cpk.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getRatingBadge(model.overall_rating)}
                  </TableCell>
                  <TableCell className="text-center">
                    {model.open_alerts_count > 0 ? (
                      <div className="flex items-center justify-center gap-1">
                        <AlertTriangle className={`h-4 w-4 ${
                          model.critical_alerts_count > 0 ? 'text-red-500' : 'text-yellow-500'
                        }`} />
                        <span className="font-medium">{model.open_alerts_count}</span>
                        {model.critical_alerts_count > 0 && (
                          <Badge variant="destructive" className="ml-1 text-xs">
                            {model.critical_alerts_count}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-3 mt-3">
            <span className="text-sm text-muted-foreground">
              {sortedData.length}{t('common.count', '개')} {t('common.of', '중')} {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, sortedData.length)}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={page === i ? 'default' : 'outline'}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
