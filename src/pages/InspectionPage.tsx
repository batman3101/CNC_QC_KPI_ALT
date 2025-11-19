import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { InspectionSetup } from '@/components/inspection/InspectionSetup'
import { InspectionForm } from '@/components/inspection/InspectionForm'

interface InspectionState {
  isActive: boolean
  machineId: string | null
  modelId: string | null
}

export function InspectionPage() {
  const { t } = useTranslation()
  const [inspectionState, setInspectionState] = useState<InspectionState>({
    isActive: false,
    machineId: null,
    modelId: null,
  })

  const handleStart = (data: { machineId: string; modelId: string }) => {
    setInspectionState({
      isActive: true,
      machineId: data.machineId,
      modelId: data.modelId,
    })
  }

  const handleComplete = () => {
    setInspectionState({
      isActive: false,
      machineId: null,
      modelId: null,
    })
  }

  const handleCancel = () => {
    setInspectionState({
      isActive: false,
      machineId: null,
      modelId: null,
    })
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          {t('inspection.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('inspection.description')}
        </Typography>
      </Box>

      {!inspectionState.isActive ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <Box sx={{ maxWidth: 600, width: '100%' }}>
            <InspectionSetup onStart={handleStart} />
          </Box>
        </Box>
      ) : (
        <InspectionForm
          machineId={inspectionState.machineId!}
          modelId={inspectionState.modelId!}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      )}
    </Box>
  )
}
