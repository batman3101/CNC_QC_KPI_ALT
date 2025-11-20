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
import * as inspectionService from '@/ui_test/mockServices/mockInspectionService'
import * as managementService from '@/ui_test/mockServices/mockManagementService'

interface InspectionSetupProps {
  onStart: (data: { machineId: string; modelId: string }) => void
}

type FormValues = z.infer<ReturnType<typeof createFormSchema>>

function createFormSchema(t: (key: string) => string) {
  return z.object({
    machineId: z.string().min(1, t('validation.selectMachine')),
    modelId: z.string().min(1, t('validation.selectModel')),
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
      machineId: '',
      modelId: '',
    },
  })

  // Fetch machines
  const { data: machines = [], isLoading: machinesLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: inspectionService.getMachines,
  })

  // Fetch product models
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['product-models'],
    queryFn: managementService.getProductModels,
  })

  const selectedMachineId = watch('machineId')
  const selectedModelId = watch('modelId')

  const selectedMachine = machines.find((m) => m.id === selectedMachineId)
  const selectedModel = models.find((m) => m.id === selectedModelId)

  const onSubmit = (values: FormValues) => {
    onStart({
      machineId: values.machineId,
      modelId: values.modelId,
    })
  }

  const isLoading = machinesLoading || modelsLoading

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
            {/* Machine Selection */}
            <Controller
              name="machineId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.machineId} disabled={isLoading}>
                  <InputLabel>{t('inspection.selectMachine')} *</InputLabel>
                  <Select
                    {...field}
                    label={`${t('inspection.selectMachine')} *`}
                  >
                    {machines.map((machine) => (
                      <MenuItem key={machine.id} value={machine.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{machine.name}</span>
                          <Chip label={machine.model} size="small" variant="outlined" />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.machineId && (
                    <FormHelperText>{errors.machineId.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

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

            {/* Summary */}
            {selectedMachine && selectedModel && (
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  검사 정보 확인
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.machine')}:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedMachine.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('dashboard.model')}:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedModel.name}
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
              disabled={!selectedMachine || !selectedModel}
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
