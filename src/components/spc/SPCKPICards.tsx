/**
 * SPC KPI Cards 컴포넌트
 * SPC 대시보드용 주요 지표 카드
 */

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'
import type { SPCKPISummary } from '@/types/spc'

interface SPCKPICardsProps {
  data: SPCKPISummary
}

export function SPCKPICards({ data }: SPCKPICardsProps) {
  const { t } = useTranslation()

  const getTrendIcon = (trend: SPCKPISummary['trend']) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />
    }
  }

  const getTrendLabel = (trend: SPCKPISummary['trend']) => {
    switch (trend) {
      case 'improving':
        return t('spc.kpi.improving')
      case 'declining':
        return t('spc.kpi.declining')
      default:
        return t('spc.kpi.stable')
    }
  }

  const getCpkColor = (cpk: number) => {
    if (cpk >= 1.67) return 'text-green-600'
    if (cpk >= 1.33) return 'text-blue-600'
    if (cpk >= 1.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 관리 항목 수 */}
      <Card className="shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('spc.kpi.totalMonitored')}
          </CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.total_monitored_items}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {data.excellent_count + data.good_count}
            </Badge>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
              <AlertCircle className="mr-1 h-3 w-3" />
              {data.adequate_count}
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
              <XCircle className="mr-1 h-3 w-3" />
              {data.poor_count}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 평균 Cpk */}
      <Card className="shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('spc.kpi.avgCpk')}
          </CardTitle>
          <div className="flex items-center gap-1">
            {getTrendIcon(data.trend)}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getCpkColor(data.avg_cpk)}`}>
            {data.avg_cpk.toFixed(2)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {getTrendLabel(data.trend)}
          </p>
          <div className="mt-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${
                  data.avg_cpk >= 1.67
                    ? 'bg-green-500'
                    : data.avg_cpk >= 1.33
                    ? 'bg-blue-500'
                    : data.avg_cpk >= 1.0
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, (data.avg_cpk / 2) * 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 미조치 알림 */}
      <Card className="shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('spc.kpi.openAlerts')}
          </CardTitle>
          <AlertTriangle className={`h-4 w-4 ${data.open_alerts > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.open_alerts}</div>
          {data.critical_alerts > 0 && (
            <Badge variant="destructive" className="mt-2">
              {t('spc.kpi.criticalAlerts')}: {data.critical_alerts}
            </Badge>
          )}
          {data.open_alerts === 0 && (
            <p className="mt-2 text-xs text-green-600">
              <CheckCircle2 className="mr-1 inline h-3 w-3" />
              {t('spc.chart.noViolation')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 공정능력 분포 */}
      <Card className="shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('spc.cpk')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600">{t('spc.capability.excellent')}</span>
              <span className="font-medium">{data.excellent_count}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-600">{t('spc.capability.good')}</span>
              <span className="font-medium">{data.good_count}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-600">{t('spc.capability.adequate')}</span>
              <span className="font-medium">{data.adequate_count}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-600">{t('spc.capability.poor')}</span>
              <span className="font-medium">{data.poor_count}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
