import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  Image as ImageIcon,
} from 'lucide-react'
import type { Database } from '@/types/database'

type Defect = Database['public']['Tables']['defects']['Row']

interface DefectDetailDialogProps {
  defect: Defect | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (defectId: string, newStatus: Defect['status']) => void
}

export function DefectDetailDialog({
  defect,
  open,
  onOpenChange,
  onStatusChange,
}: DefectDetailDialogProps) {
  const { t } = useTranslation()

  if (!defect) return null

  const statusConfig = {
    pending: {
      label: t('defects.statusPending'),
      icon: Clock,
      variant: 'destructive' as const,
      nextStatus: 'in_progress' as const,
      nextLabel: t('defects.startAction'),
    },
    in_progress: {
      label: t('defects.statusInProgress'),
      icon: PlayCircle,
      variant: 'default' as const,
      nextStatus: 'resolved' as const,
      nextLabel: t('defects.completeAction'),
    },
    resolved: {
      label: t('defects.statusResolved'),
      icon: CheckCircle2,
      variant: 'secondary' as const,
      nextStatus: null,
      nextLabel: null,
    },
  }

  const config = statusConfig[defect.status]
  const Icon = config.icon

  const handleStatusChange = () => {
    if (config.nextStatus) {
      onStatusChange(defect.id, config.nextStatus)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('defects.detailTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('defects.detailDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div>
            <Badge variant={config.variant} className="text-sm">
              <Icon className="mr-1.5 h-4 w-4" />
              {config.label}
            </Badge>
          </div>

          {/* Defect Information */}
          <div className="space-y-4">
            <div>
              <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                {t('defects.defectType')}
              </h4>
              <p className="text-base font-medium">{defect.defect_type}</p>
            </div>

            <div>
              <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                {t('defects.description')}
              </h4>
              <p className="text-base">{defect.description}</p>
            </div>

            <div>
              <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                {t('defects.registeredDate')}
              </h4>
              <p className="text-base">
                {new Date(defect.created_at).toLocaleString('ko-KR')}
              </p>
            </div>

            {defect.photo_url && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  {t('defects.photo')}
                </h4>
                <div className="overflow-hidden rounded-lg border">
                  <img
                    src={defect.photo_url}
                    alt={t('defects.photo')}
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>
            )}

            {!defect.photo_url && (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('defects.noPhoto')}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {config.nextStatus && (
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.close')}
              </Button>
              <Button onClick={handleStatusChange}>
                {config.nextLabel}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
