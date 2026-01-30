import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material'
import { useSnackbar } from 'notistack'
import { InspectionSetup } from '@/components/inspection/InspectionSetup'
import { InspectionRecordForm } from '@/components/inspection/InspectionRecordForm'
import type { InspectionProcess, InspectionRecordInput } from '@/types/inspection'
import * as managementService from '@/services/managementService'
import * as inspectionService from '@/services/inspectionService'
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

  const handleSubmit = async (data: InspectionRecordInput) => {
    // Submit inspection record with factory_id
    await inspectionService.createInspectionRecord({
      ...data,
      factory_id: activeFactoryId || undefined,
    })

    // Invalidate queries to refresh data immediately
    await queryClient.invalidateQueries({ queryKey: ['defects'] })
    await queryClient.invalidateQueries({ queryKey: ['inspections'] })
    await queryClient.invalidateQueries({ queryKey: ['dashboard-defects'] })

    // Show success message
    enqueueSnackbar(t('inspection.submitSuccess'), { variant: 'success' })

    // Reset state
    setInspectionState({
      isActive: false,
      modelId: null,
      inspectionProcess: null,
    })
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
