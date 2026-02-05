/**
 * SPC Alert Dialog 컴포넌트
 * 알림 상세 조회 및 조치 기능
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { updateSPCAlertStatus } from '@/services/spcService'
import type { SPCAlert, SPCAlertStatus, SPCAlertResolution } from '@/types/spc'

interface SPCAlertDialogProps {
  alert: SPCAlert | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SPCAlertDialog({
  alert,
  open,
  onOpenChange,
}: SPCAlertDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [status, setStatus] = useState<SPCAlertStatus>('acknowledged')
  const [resolutionNote, setResolutionNote] = useState('')
  const [rootCause, setRootCause] = useState('')
  const [correctiveAction, setCorrectiveAction] = useState('')

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; resolution: SPCAlertResolution }) =>
      updateSPCAlertStatus(data.id, data.resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spc-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['spc-open-alerts-count'] })
      queryClient.invalidateQueries({ queryKey: ['spc-recent-alerts'] })
      toast({
        title: t('common.success'),
        description: t('spc.messages.alertResolved'),
      })
      onOpenChange(false)
      resetForm()
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('common.error'),
        variant: 'destructive',
      })
    },
  })

  const resetForm = () => {
    setStatus('acknowledged')
    setResolutionNote('')
    setRootCause('')
    setCorrectiveAction('')
  }

  const handleSubmit = () => {
    if (!alert) return

    updateMutation.mutate({
      id: alert.id,
      resolution: {
        status,
        resolution_note: resolutionNote || undefined,
        root_cause: rootCause || undefined,
        corrective_action: correctiveAction || undefined,
      },
    })
  }

  if (!alert) return null

  const getSeverityIcon = () => {
    switch (alert.severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getAlertTypeIcon = () => {
    switch (alert.alert_type) {
      case 'ucl_exceeded':
      case 'trend_up':
      case 'run_above':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'lcl_exceeded':
      case 'trend_down':
      case 'run_below':
        return <TrendingDown className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4" />
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getSeverityIcon()}
            {t('spc.alertDetail')}
          </DialogTitle>
          <DialogDescription>
            {t('spc.alertDetailDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Alert Info */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getAlertTypeIcon()}
                <span className="font-medium">
                  {getAlertTypeLabel(alert.alert_type)}
                </span>
              </div>
              <Badge
                variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
              >
                {t(`spc.alerts.${alert.severity}`)}
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">{t('dashboard.model')}:</span>
                <span className="ml-2 font-medium">{alert.model_name || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('spc.chart.date')}:</span>
                <span className="ml-2">{formatDate(alert.created_at)}</span>
              </div>
              {alert.measured_value !== undefined && (
                <div>
                  <span className="text-muted-foreground">{t('spc.measuredValue')}:</span>
                  <span className="ml-2 font-medium">{alert.measured_value.toFixed(4)}</span>
                </div>
              )}
              {alert.control_limit_value !== undefined && (
                <div>
                  <span className="text-muted-foreground">{t('spc.limitValue')}:</span>
                  <span className="ml-2">{alert.control_limit_value.toFixed(4)}</span>
                </div>
              )}
            </div>

            {alert.rule_description && (
              <>
                <Separator />
                <div className="text-sm">
                  <span className="text-muted-foreground">{t('spc.ruleDescription')}:</span>
                  <p className="mt-1">{alert.rule_description}</p>
                </div>
              </>
            )}
          </div>

          {/* Action Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">{t('dashboard.status')}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as SPCAlertStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acknowledged">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t('spc.alertStatus.acknowledged')}
                    </div>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {t('spc.alertStatus.inProgress')}
                    </div>
                  </SelectItem>
                  <SelectItem value="resolved">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {t('spc.alertStatus.resolved')}
                    </div>
                  </SelectItem>
                  <SelectItem value="ignored">
                    {t('spc.alertStatus.ignored')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status === 'resolved' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rootCause">{t('spc.rootCause')}</Label>
                  <Textarea
                    id="rootCause"
                    placeholder={t('spc.rootCausePlaceholder')}
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="correctiveAction">{t('spc.correctiveAction')}</Label>
                  <Textarea
                    id="correctiveAction"
                    placeholder={t('spc.correctiveActionPlaceholder')}
                    value={correctiveAction}
                    onChange={(e) => setCorrectiveAction(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="resolutionNote">{t('spc.resolutionNote')}</Label>
              <Textarea
                id="resolutionNote"
                placeholder={t('spc.resolutionNotePlaceholder')}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? t('common.loading') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
