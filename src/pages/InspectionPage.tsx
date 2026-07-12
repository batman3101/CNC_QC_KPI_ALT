import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material'
import { useSnackbar } from 'notistack'
import { InspectionSetup } from '@/components/inspection/InspectionSetup'
import { InspectionRecordForm } from '@/components/inspection/InspectionRecordForm'
import type { InspectionProcess, InspectionRecordInput } from '@/types/inspection'
import type { DefectPart } from '@/types/spc'
import * as managementService from '@/services/managementService'
import { saveInspectionOffline, syncPendingInspections, compressImageToBase64, isOnline } from '@/services/offlineSyncService'
import { useFactoryStore } from '@/stores/factoryStore'

interface InspectionState {
  isActive: boolean
  modelId: string | null
  inspectionProcess: InspectionProcess | null
}

export function InspectionPage() {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const { activeFactoryId } = useFactoryStore()
  const [inspectionState, setInspectionState] = useState<InspectionState>({
    isActive: false,
    modelId: null,
    inspectionProcess: null,
  })

  // Fetch product models for display
  const { data: models = [] } = useQuery({
    queryKey: ['product-models'],
    queryFn: managementService.getProductModels,
  })

  const selectedModel = models.find((m) => m.id === inspectionState.modelId)

  const handleStart = (data: { modelId: string; inspectionProcess: InspectionProcess }) => {
    setInspectionState({
      isActive: true,
      modelId: data.modelId,
      inspectionProcess: data.inspectionProcess,
    })
  }

  const handleSubmit = async (
    data: InspectionRecordInput,
    photoFile: File | null,
    defectParts: DefectPart[],
    meta: { defectTypeName: string | null; inspectorName: string },
  ) => {
    // 사진은 네트워크 업로드 대신 로컬에서 Base64로 압축 저장 (동기화 시 업로드됨)
    const photoBase64 = photoFile ? await compressImageToBase64(photoFile) : null
    const failedPoints = defectParts.flat()

    // 항상 로컬 큐에 즉시 저장 (네트워크 대기 없음)
    await saveInspectionOffline({
      model_id: data.model_id,
      model_code: selectedModel?.code ?? '',
      inspection_process_code: data.inspection_process.code,
      inspection_process_name: data.inspection_process.name,
      defect_type_id: data.defect_type_id,
      defect_type_name: meta.defectTypeName,
      machine_id: data.machine_id,
      machine_name: data.machine_number,
      inspector_id: data.inspector_id,
      inspector_name: meta.inspectorName,
      inspection_quantity: data.inspection_quantity,
      defect_quantity: data.defect_quantity,
      photo_data: photoBase64,
      notes: null,
      factory_id: activeFactoryId ?? '',
      defect_points: failedPoints.length > 0 ? failedPoints : null,
    })

    // 미동기화 배지 즉시 갱신
    window.dispatchEvent(new Event('offline-queue-updated'))

    // 온라인이면 백그라운드로 즉시 동기화 시도 (UI를 막지 않음)
    if (isOnline()) {
      syncPendingInspections()
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['inspections'] })
          queryClient.invalidateQueries({ queryKey: ['defects'] })
          // Defect counts are their own queries now, so they need their own
          // invalidation - refetching the list alone would leave the header
          // badge and the summary cards showing pre-submission numbers.
          queryClient.invalidateQueries({ queryKey: ['defect-stats'] })
          queryClient.invalidateQueries({ queryKey: ['defect-pending-count'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard-defects'] })
          queryClient.invalidateQueries({ queryKey: ['spc-pchart'] })
          queryClient.invalidateQueries({ queryKey: ['spc-defect-pareto'] })
          window.dispatchEvent(new Event('offline-queue-updated'))
        })
        .catch((e) => console.error('[Inspection] background sync failed:', e))
    }

    enqueueSnackbar(t(isOnline() ? 'inspection.submitSuccess' : 'inspection.savedOffline'), {
      variant: 'success',
    })
    setInspectionState({ isActive: false, modelId: null, inspectionProcess: null })
  }

  const handleCancel = () => {
    setInspectionState({
      isActive: false,
      modelId: null,
      inspectionProcess: null,
    })
  }

  return (
    <Box>
      <Box sx={{ mb: { xs: 2, md: 4 } }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" fontWeight={700} gutterBottom>
          {t('inspection.recordInputTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          {t('inspection.recordInputDescription')}
        </Typography>
      </Box>

      {!inspectionState.isActive ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <Box sx={{ maxWidth: 600, width: '100%' }}>
            <InspectionSetup onStart={handleStart} />
          </Box>
        </Box>
      ) : (
        selectedModel && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Box sx={{ maxWidth: 800, width: '100%' }}>
              <InspectionRecordForm
                modelId={inspectionState.modelId!}
                modelName={selectedModel.name}
                modelCode={selectedModel.code}
                inspectionProcess={inspectionState.inspectionProcess!}
                factoryId={activeFactoryId}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            </Box>
          </Box>
        )
      )}
    </Box>
  )
}
