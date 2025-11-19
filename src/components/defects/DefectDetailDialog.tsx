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

const statusConfig = {
  pending: {
    label: '조치 대기',
    icon: Clock,
    variant: 'destructive' as const,
    nextStatus: 'in_progress' as const,
    nextLabel: '조치 시작',
  },
  in_progress: {
    label: '조치 중',
    icon: PlayCircle,
    variant: 'default' as const,
    nextStatus: 'resolved' as const,
    nextLabel: '조치 완료',
  },
  resolved: {
    label: '조치 완료',
    icon: CheckCircle2,
    variant: 'secondary' as const,
    nextStatus: null,
    nextLabel: null,
  },
}

export function DefectDetailDialog({
  defect,
  open,
  onOpenChange,
  onStatusChange,
}: DefectDetailDialogProps) {
  if (!defect) return null

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
            불량 상세 정보
          </DialogTitle>
          <DialogDescription>
            불량 발생 정보 및 조치 상태를 확인하세요
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
                불량 유형
              </h4>
              <p className="text-base font-medium">{defect.defect_type}</p>
            </div>

            <div>
              <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                설명
              </h4>
              <p className="text-base">{defect.description}</p>
            </div>

            <div>
              <h4 className="mb-1 text-sm font-medium text-muted-foreground">
                등록일시
              </h4>
              <p className="text-base">
                {new Date(defect.created_at).toLocaleString('ko-KR')}
              </p>
            </div>

            {defect.photo_url && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  불량 사진
                </h4>
                <div className="overflow-hidden rounded-lg border">
                  <img
                    src={defect.photo_url}
                    alt="불량 사진"
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>
            )}

            {!defect.photo_url && (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  등록된 사진이 없습니다
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {config.nextStatus && (
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                닫기
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
