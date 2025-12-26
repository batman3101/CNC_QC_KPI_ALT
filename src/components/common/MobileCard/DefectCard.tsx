/**
 * Mobile Defect Card Component
 * Displays defect record in card format for mobile devices
 */

import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Button,
} from '@mui/material'
import { Schedule, PlayArrow, CheckCircle, Visibility } from '@mui/icons-material'
import { formatVietnamDateTime } from '@/lib/dateUtils'

type DefectStatus = 'pending' | 'in_progress' | 'resolved'

interface DefectCardProps {
  defect: {
    id: string
    created_at: string
    defect_type: string
    description?: string | null
    status: DefectStatus
    quantity?: number
  }
  modelCode?: string
  onViewDetail?: () => void
  onStatusChange?: (status: DefectStatus) => void
}

export function DefectCard({
  defect,
  modelCode,
  onViewDetail,
  onStatusChange,
}: DefectCardProps) {
  const { t } = useTranslation()

  const statusConfig: Record<DefectStatus, { label: string; icon: React.ElementType; color: 'error' | 'primary' | 'success' }> = {
    pending: { label: t('defects.statusPending'), icon: Schedule, color: 'error' },
    in_progress: { label: t('defects.statusInProgress'), icon: PlayArrow, color: 'primary' },
    resolved: { label: t('defects.statusResolved'), icon: CheckCircle, color: 'success' },
  }

  const config = statusConfig[defect.status]
  const StatusIcon = config.icon

  return (
    <Card
      elevation={2}
      sx={{
        mb: 1.5,
        borderLeft: 4,
        borderColor: `${config.color}.main`,
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {formatVietnamDateTime(defect.created_at)}
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 0.5 }}>
              {defect.defect_type}
            </Typography>
          </Box>
          <Chip
            icon={<StatusIcon />}
            label={config.label}
            color={config.color}
            size="small"
          />
        </Box>

        {/* Model Code & Quantity */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
          {modelCode && (
            <Chip label={modelCode} size="small" variant="outlined" />
          )}
          {defect.quantity && defect.quantity > 1 && (
            <Typography variant="body2" color="text.secondary">
              x{defect.quantity}
            </Typography>
          )}
        </Box>

        {/* Description */}
        {defect.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              mb: 1,
            }}
          >
            {defect.description}
          </Typography>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {onViewDetail && (
            <Button
              size="small"
              startIcon={<Visibility />}
              onClick={onViewDetail}
            >
              {t('defects.viewDetails')}
            </Button>
          )}
          {defect.status === 'pending' && onStatusChange && (
            <Button
              size="small"
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => onStatusChange('in_progress')}
            >
              {t('defects.startAction')}
            </Button>
          )}
          {defect.status === 'in_progress' && onStatusChange && (
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => onStatusChange('resolved')}
            >
              {t('defects.completeAction')}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
