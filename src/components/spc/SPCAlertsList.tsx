/**
 * SPC Alerts List 컴포넌트
 * SPC 알림 목록 표시
 */

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Eye,
} from 'lucide-react'
import type { SPCAlert, SPCAlertSeverity, SPCAlertStatus } from '@/types/spc'

interface SPCAlertsListProps {
  alerts: SPCAlert[]
  onViewDetail?: (alert: SPCAlert) => void
  onAcknowledge?: (alertId: string) => void
  showActions?: boolean
  maxItems?: number
}

export function SPCAlertsList({
  alerts,
  onViewDetail,
  onAcknowledge,
  showActions = true,
  maxItems,
}: SPCAlertsListProps) {
  const { t } = useTranslation()

  const displayAlerts = maxItems ? alerts.slice(0, maxItems) : alerts

  const getSeverityIcon = (severity: SPCAlertSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityBadge = (severity: SPCAlertSeverity) => {
    const variants: Record<SPCAlertSeverity, { variant: 'default' | 'secondary' | 'destructive'; className: string }> = {
      critical: { variant: 'destructive', className: '' },
      warning: { variant: 'secondary', className: 'bg-yellow-500 text-black hover:bg-yellow-600' },
      info: { variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
    }
    const config = variants[severity]
    return (
      <Badge variant={config.variant} className={config.className}>
        {t(`spc.alerts.${severity}`)}
      </Badge>
    )
  }

  const getStatusBadge = (status: SPCAlertStatus) => {
    const configs: Record<SPCAlertStatus, { icon: React.ReactNode; className: string }> = {
      open: {
        icon: <AlertCircle className="mr-1 h-3 w-3" />,
        className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
      },
      acknowledged: {
        icon: <Eye className="mr-1 h-3 w-3" />,
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
      },
      in_progress: {
        icon: <Clock className="mr-1 h-3 w-3" />,
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      },
      resolved: {
        icon: <CheckCircle className="mr-1 h-3 w-3" />,
        className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
      },
      ignored: {
        icon: null,
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      },
    }
    const config = configs[status]
    return (
      <Badge variant="outline" className={config.className}>
        {config.icon}
        {t(`spc.alerts.${status}`)}
      </Badge>
    )
  }

  const getAlertTypeLabel = (alertType: string) => {
    const typeMap: Record<string, string> = {
      ucl_exceeded: 'uclExceeded',
      lcl_exceeded: 'lclExceeded',
      uwl_exceeded: 'uwlExceeded',
      run_above: 'runAbove',
      run_below: 'runBelow',
      trend_up: 'trendUp',
      trend_down: 'trendDown',
      two_thirds: 'twoThirds',
      stratification: 'stratification',
      mixture: 'mixture',
    }
    const key = typeMap[alertType] || alertType
    return t(`spc.alerts.${key}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (alerts.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>{t('spc.alertsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="mb-2 h-12 w-12 text-green-500" />
            <p>{t('spc.chart.noViolation')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {t('spc.alertsTitle')}
              <Badge variant="secondary">{alerts.length}</Badge>
            </CardTitle>
            <CardDescription>
              {t('spc.kpi.criticalAlerts')}: {alerts.filter(a => a.severity === 'critical').length}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>{t('spc.chart.date')}</TableHead>
                <TableHead>{t('dashboard.model')}</TableHead>
                <TableHead>{t('spc.chart.violation')}</TableHead>
                <TableHead>{t('dashboard.status')}</TableHead>
                {showActions && <TableHead className="text-right">{t('common.actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayAlerts.map((alert) => (
                <TableRow key={alert.id} className="hover:bg-muted/50">
                  <TableCell>{getSeverityIcon(alert.severity)}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDate(alert.created_at)}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{alert.model_name || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getSeverityBadge(alert.severity)}
                      <span className="text-xs text-muted-foreground">
                        {getAlertTypeLabel(alert.alert_type)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(alert.status)}</TableCell>
                  {showActions && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onViewDetail && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetail(alert)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {onAcknowledge && alert.status === 'open' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAcknowledge(alert.id)}
                          >
                            {t('common.confirm')}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {maxItems && alerts.length > maxItems && (
          <div className="mt-4 text-center">
            <Button variant="link" size="sm">
              {t('nav.viewAll')} ({alerts.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
