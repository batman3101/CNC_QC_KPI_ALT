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
  Skeleton,
} from '@mui/material'
import {
  CheckCircle,
  Schedule,
  PlayArrow,
  Image as ImageIcon,
} from '@mui/icons-material'
import type { Database } from '@/types/database'
import { getProductModels, getDefectTypes, getUsers, getMachines } from '@/services/managementService'
import { getInspectionById } from '@/services/inspectionService'

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

  // Fetch defect types for name display
  const { data: defectTypes = [] } = useQuery({
    queryKey: ['defect-types'],
    queryFn: getDefectTypes,
  })

  // Fetch users for inspector name
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  // Fetch machines for machine name
  const { data: machines = [] } = useQuery({
    queryKey: ['machines'],
    queryFn: getMachines,
  })

  // Fetch related inspection data
  const { data: inspection, isLoading: inspectionLoading } = useQuery({
    queryKey: ['inspection', defect?.inspection_id],
    queryFn: () => getInspectionById(defect!.inspection_id),
    enabled: !!defect?.inspection_id,
  })

  // Helper function to get model info
  const getModelInfo = (modelId: string): { code: string; name: string } => {
    const model = productModels.find((m) => m.id === modelId)
    return model ? { code: model.code, name: model.name } : { code: '-', name: '-' }
  }

  // Helper function to get defect type name
  const getDefectTypeName = (defectTypeId: string): string => {
    const defectType = defectTypes.find((dt) => dt.id === defectTypeId)
    return defectType ? defectType.name : defectTypeId
  }

  // Helper function to get user name
  const getUserName = (userId: string): string => {
    const user = users.find((u) => u.id === userId)
    return user ? user.name : '-'
  }

  // Helper function to get machine name
  const getMachineName = (machineId: string | null): string => {
    if (!machineId) return '-'
    const machine = machines.find((m) => m.id === machineId)
    return machine ? machine.name : '-'
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
            {/* 등록일시 */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                {t('defects.registeredDate')}
              </Typography>
              <Typography variant="body1">
                {new Date(defect.created_at).toLocaleString('ko-KR')}
              </Typography>
            </Box>

            {/* 모델 코드 */}
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

            {/* 불량 유형 */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                {t('defects.defectType')}
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {getDefectTypeName(defect.defect_type)}
              </Typography>
            </Box>

            {/* 검사 정보 (inspections 테이블에서 가져옴) */}
            {inspectionLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Skeleton variant="rectangular" height={60} />
                <Skeleton variant="rectangular" height={60} />
              </Box>
            ) : inspection ? (
              <>
                {/* 검사 수량 / 불량 수량 / 불량률 */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{
                    flex: 1,
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    textAlign: 'center',
                    border: 1,
                    borderColor: 'divider',
                  }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      {t('inspection.inspectionQuantity')}
                    </Typography>
                    <Typography variant="h5" fontWeight={600} color="text.primary">
                      {inspection.inspection_quantity.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{
                    flex: 1,
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    textAlign: 'center',
                    border: 1,
                    borderColor: 'error.main',
                  }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      {t('inspection.defectQuantity')}
                    </Typography>
                    <Typography variant="h5" fontWeight={600} color="error.main">
                      {inspection.defect_quantity.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{
                    flex: 1,
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    textAlign: 'center',
                    border: 1,
                    borderColor: 'warning.main',
                  }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      {t('inspection.defectRate')}
                    </Typography>
                    <Typography variant="h5" fontWeight={600} color="warning.main">
                      {inspection.inspection_quantity > 0
                        ? ((inspection.defect_quantity / inspection.inspection_quantity) * 100).toFixed(2)
                        : 0}%
                    </Typography>
                  </Box>
                </Box>

                {/* 검사 공정 */}
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                    {t('inspection.process')}
                  </Typography>
                  <Chip
                    label={inspection.inspection_process}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                {/* 설비 번호 */}
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                    {t('inspection.machineNumber')}
                  </Typography>
                  <Typography variant="body1">
                    {getMachineName(inspection.machine_id)}
                  </Typography>
                </Box>

                {/* 검사자 */}
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                    {t('inspection.inspector')}
                  </Typography>
                  <Typography variant="body1">
                    {getUserName(inspection.user_id)}
                  </Typography>
                </Box>
              </>
            ) : null}

            {/* 사진 */}
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
