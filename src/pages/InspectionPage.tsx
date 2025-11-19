import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('inspection.title')}</h1>
        <p className="text-muted-foreground">
          {t('inspection.description')}
        </p>
      </div>

      {!inspectionState.isActive ? (
        <InspectionSetup onStart={handleStart} />
      ) : (
        <InspectionForm
          machineId={inspectionState.machineId!}
          modelId={inspectionState.modelId!}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
