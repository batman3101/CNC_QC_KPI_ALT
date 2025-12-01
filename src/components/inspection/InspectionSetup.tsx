import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Paper,
} from '@mui/material'
import { Assignment } from '@mui/icons-material'

// UI 테스트용 Mock 서비스
import * as managementService from '@/ui_test/mockServices/mockManagementService'
import type { InspectionProcess } from '@/types/inspection'

interface InspectionSetupProps {
  onStart: (data: { modelId: string; inspectionProcess: InspectionProcess }) => void
}

type FormValues = z.infer<ReturnType<typeof createFormSchema>>

function createFormSchema(t: (key: string) => string) {
  return z.object({
    modelId: z.string().min(1, t('validation.selectModel')),
    inspectionProcess: z.string().min(1, t('validation.selectProcess')),
  })
}

export function InspectionSetup({ onStart }: InspectionSetupProps) {
  const { t } = useTranslation()
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(t)),
    defaultValues: {
      modelId: '',
      inspectionProcess: '',
    },
  })

  // Fetch product models
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['product-models'],
    queryFn: managementService.getProductModels,
  })

  // Fetch inspection processes
  const { data: processes = [], isLoading: processesLoading } = useQuery({
    queryKey: ['inspection-processes'],
    queryFn: managementService.getInspectionProcesses,
  })

  const selectedModelId = watch('modelId')
  const selectedProcessId = watch('inspectionProcess')

  const selectedModel = models.find((m) => m.id === selectedModelId)
  const selectedProcess = processes.find((p) => p.id === selectedProcessId)

  const onSubmit = (values: FormValues) => {
    const process = processes.find((p) => p.id === values.inspectionProcess)
    if (process) {
      onStart({
        modelId: values.modelId,
        inspectionProcess: process,
      })
    }
  }

  const isLoading = modelsLoading || processesLoading

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Assignment color="primary" />
          <Typography variant="h6" fontWeight={600}>
            {t('inspection.setupTitle')}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Product Model Selection */}
            <Controller
              name="modelId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.modelId} disabled={isLoading}>
                  <InputLabel>{t('inspection.selectModel')} *</InputLabel>
                  <Select
                    {...field}
                    label={`${t('inspection.selectModel')} *`}
                  >
                    {models.map((model) => (
                      <MenuItem key={model.id} value={model.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{model.name}</span>
                          <Chip label={model.code} size="small" color="primary" variant="outlined" />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.modelId && (
                    <FormHelperText>{errors.modelId.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            {/* Inspection Process Selection */}
            <Controller
              name="inspectionProcess"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.inspectionProcess} disabled={isLoading}>
                  <InputLabel>{t('inspection.selectProcess')} *</InputLabel>
                  <Select
                    {...field}
                    label={`${t('inspection.selectProcess')} *`}
                  >
                    {processes.map((process) => (
                      <MenuItem key={process.id} value={process.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{process.name}</span>
                          <Chip label={process.code} size="small" color="secondary" variant="outlined" />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.inspectionProcess && (
                    <FormHelperText>{errors.inspectionProcess.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            {/* Summary */}
            {selectedModel && selectedProcess && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  검사 정보 확인
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.model')}:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedModel.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('inspection.process')}:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedProcess.name}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* Start Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={!selectedModel || !selectedProcess}
              startIcon={<Assignment />}
            >
              {t('inspection.startInspection')}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  )
}
