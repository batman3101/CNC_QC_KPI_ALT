/**
 * Mobile Inspection Card Component
 * Displays inspection record in card format for mobile devices
 */

import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
} from '@mui/material'
import { Visibility, CheckCircle, Cancel } from '@mui/icons-material'
import { formatVietnamDateTime } from '@/lib/dateUtils'

interface InspectionCardProps {
  inspection: {
    id: string
    created_at: string
    status: string
    model_id?: string
    machine_id?: string | null
    inspection_process?: string
    inspection_quantity?: number
    defect_quantity?: number
  }
  machineName?: string
  modelCode?: string
  onViewDetail?: () => void
}

export function InspectionCard({
  inspection,
  machineName,
  modelCode,
  onViewDetail,
}: InspectionCardProps) {
  const { t } = useTranslation()
  const isPass = inspection.status === 'pass'

  return (
    <Card
      elevation={2}
      sx={{
        mb: 1.5,
        borderLeft: 4,
        borderColor: isPass ? 'success.main' : 'error.main',
        '&:active': { transform: 'scale(0.99)' },
        transition: 'transform 0.1s',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {formatVietnamDateTime(inspection.created_at)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              {modelCode && (
                <Chip
                  label={modelCode}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {inspection.inspection_process && (
                <Typography variant="body2" color="text.secondary">
                  {inspection.inspection_process}
                </Typography>
              )}
            </Box>
          </Box>
          <Chip
            icon={isPass ? <CheckCircle /> : <Cancel />}
            label={isPass ? t('dashboard.pass') : t('dashboard.fail')}
            color={isPass ? 'success' : 'error'}
            size="small"
          />
        </Box>

        {/* Info Grid - 2 columns */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('dashboard.machine')}
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {machineName || '-'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('inspection.quantity')}
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {inspection.inspection_quantity || 0}
              {inspection.defect_quantity ? ` (${t('dashboard.fail')}: ${inspection.defect_quantity})` : ''}
            </Typography>
          </Box>
        </Box>

        {/* Action Row */}
        {onViewDetail && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <IconButton size="small" onClick={onViewDetail} color="primary">
              <Visibility fontSize="small" />
            </IconButton>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
