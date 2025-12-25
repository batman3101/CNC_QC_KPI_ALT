import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  Button,
  Divider,
} from '@mui/material'
import {
  CheckCircle,
  Schedule,
  PlayArrow,
  Image as ImageIcon,
} from '@mui/icons-material'
import type { Database } from '@/types/database'
import { getProductModels } from '@/services/managementService'

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

  // Fetch product models for model code display
  const { data: productModels = [] } = useQuery({
    queryKey: ['product-models'],
    queryFn: getProductModels,
  })

  // Helper function to get model info
  const getModelInfo = (modelId: string): { code: string; name: string } => {
    const model = productModels.find((m) => m.id === modelId)
    return model ? { code: model.code, name: model.name } : { code: '-', name: '-' }
  }

  if (!defect) return null

  const modelInfo = getModelInfo(defect.model_id)

  const statusConfig = {
    pending: {
      label: t('defects.statusPending'),
      icon: Schedule,
      color: 'error' as const,
      nextStatus: 'in_progress' as const,
      nextLabel: t('defects.startAction'),
    },
    in_progress: {
      label: t('defects.statusInProgress'),
      icon: PlayArrow,
      color: 'primary' as const,
      nextStatus: 'resolved' as const,
      nextLabel: t('defects.completeAction'),
    },
    resolved: {
      label: t('defects.statusResolved'),
      icon: CheckCircle,
      color: 'success' as const,
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
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {t('defects.detailTitle')}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('defects.detailDescription')}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Status Badge */}
          <Box>
            <Chip
              icon={<Icon />}
              label={config.label}
              color={config.color}
            />
          </Box>

          <Divider />

          {/* Defect Information */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                {t('defects.registeredDate')}
              </Typography>
              <Typography variant="body1">
                {new Date(defect.created_at).toLocaleString('ko-KR')}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                {t('management.modelCode')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={modelInfo.code} size="small" color="primary" variant="outlined" />
                <Typography variant="body2" color="text.secondary">
                  {modelInfo.name}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                {t('defects.defectType')}
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {defect.defect_type}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                {t('defects.description')}
              </Typography>
              <Typography variant="body1">
                {defect.description}
              </Typography>
            </Box>

            {defect.photo_url ? (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                  {t('defects.photo')}
                </Typography>
                <Box
                  component="img"
                  src={defect.photo_url}
                  alt={t('defects.photo')}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider',
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  border: 1,
                  borderStyle: 'dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 4,
                  textAlign: 'center',
                }}
              >
                <ImageIcon sx={{ fontSize: 48, color: 'text.disabled', mx: 'auto', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {t('defects.noPhoto')}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      {/* Action Buttons */}
      <DialogActions>
        <Button onClick={() => onOpenChange(false)}>
          {config.nextStatus ? t('common.cancel') : t('common.close')}
        </Button>
        {config.nextStatus && (
          <Button variant="contained" onClick={handleStatusChange}>
            {config.nextLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
