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
import {
  saveInspectionOffline,
  syncPendingInspections,
  getQueuedInspectionStatus,
  compressImageToBase64,
  isOnline,
} from '@/services/offlineSyncService'
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
    //
    // Both steps below run entirely on the device, so a failure here never
    // reaches the server and leaves no trace in its logs. They used to throw
    // into a try/finally with no catch: the spinner stopped, nothing was saved
    // and nothing was said. Stop and say so instead - returning (not throwing)
    // keeps the form open with everything the inspector typed. Saving without
    // the photo is not an option: they would walk off believing it was attached.
    let photoBase64: string | null = null
    if (photoFile) {
      try {
        photoBase64 = await compressImageToBase64(photoFile)
      } catch (e) {
        console.error('[Inspection] photo compression failed:', photoFile.type, photoFile.size, e)
        enqueueSnackbar(t('inspection.photoProcessError'), { variant: 'error' })
        return
      }
    }
    const failedPoints = defectParts.flat()

    // 항상 로컬 큐에 즉시 저장 (네트워크 대기 없음)
    let queued: Awaited<ReturnType<typeof saveInspectionOffline>>
    try {
      queued = await saveInspectionOffline({
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
    } catch (e) {
      // IndexedDB refused the row - in practice a full or blocked device store.
      console.error('[Inspection] local save failed:', e)
      enqueueSnackbar(t('inspection.saveFailed'), { variant: 'error' })
      return
    }

    // 미동기화 배지 즉시 갱신
    window.dispatchEvent(new Event('offline-queue-updated'))

    // Online: upload now and only then report the outcome. This used to fire
    // the sync in the background and show "registered" straight away, so the
    // inspector walked off while the upload was still running - and a tablet
    // that slept between the inspection insert and the defect insert left a
    // rejected inspection with no defect record (78 of them in 32 days). The
    // form keeps its spinner up while this awaits, which is the point.
    //
    // Success is judged from THIS entry's queue row, not from the aggregate
    // result: the sync may have been running already when the row was queued
    // (it now drains the queue, but the row's status is the fact), and an
    // older row failing must not turn this entry's success into a warning.
    let outcome: 'synced' | 'queued' | 'offline' = 'offline'
    if (isOnline()) {
      try {
        const result = await syncPendingInspections()
        if (result.failed > 0) {
          console.error('[Inspection] sync left items queued:', result.errors)
        }
      } catch (e) {
        console.error('[Inspection] sync failed:', e)
      }
      const status = await getQueuedInspectionStatus(queued.id)
      outcome = status === 'synced' ? 'synced' : 'queued'

      // Everything an inspection (and its defect) feeds. Missing a key here
      // leaves that screen showing pre-submission numbers for its whole
      // staleTime - the dashboard's "today" cards were doing exactly that.
      for (const key of [
        'dashboard-today-stats',
        'dashboard-inspections',
        'dashboard-defects',
        'defects',
        'defect-stats',
        'defect-pending-count',
        'public-monitor-data',
        'spc-pchart',
        'spc-defect-pareto',
        'spc-model-defect-rates',
        'kpi-summary',
        'defect-trend',
        'model-distribution',
        'machine-performance',
        'hourly-distribution',
        'inspector-performance',
        'defect-types-analytics',
        'ai-snapshot',
        'ai-unresolved-defects',
        'report-summary',
      ]) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
      window.dispatchEvent(new Event('offline-queue-updated'))
    }

    if (outcome === 'synced') {
      enqueueSnackbar(t('inspection.submitSuccess'), { variant: 'success' })
    } else if (outcome === 'queued') {
      enqueueSnackbar(t('inspection.queuedForRetry'), { variant: 'warning' })
    } else {
      enqueueSnackbar(t('inspection.savedOffline'), { variant: 'success' })
    }
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
