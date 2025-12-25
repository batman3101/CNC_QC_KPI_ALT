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
  Chip,
  Paper,
  Autocomplete,
  TextField,
} from '@mui/material'
import { Assignment } from '@mui/icons-material'

// Supabase 서비스
import * as managementService from '@/services/managementService'
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
            {/* Product Model Selection - 모델 코드 기준 */}
            <Controller
              name="modelId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={models}
                  getOptionLabel={(option) => `${option.code} - ${option.name}`}
                  value={models.find((m) => m.id === field.value) || null}
                  onChange={(_, newValue) => {
                    field.onChange(newValue?.id || '')
                  }}
                  disabled={isLoading}
                  filterOptions={(options, { inputValue }) => {
                    const filterValue = inputValue.toLowerCase()
                    return options.filter(
                      (option) =>
                        option.code.toLowerCase().includes(filterValue) ||
                        option.name.toLowerCase().includes(filterValue)
                    )
                  }}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={option.code} size="small" color="primary" variant="outlined" />
                        <span>{option.name}</span>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={`${t('inspection.selectModel')} *`}
                      error={!!errors.modelId}
                      helperText={errors.modelId?.message}
                    />
                  )}
                  noOptionsText={t('common.noData')}
                />
              )}
            />

            {/* Inspection Process Selection - 공정 코드 기준 */}
            <Controller
              name="inspectionProcess"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={processes}
                  getOptionLabel={(option) => `${option.code} - ${option.name}`}
                  value={processes.find((p) => p.id === field.value) || null}
                  onChange={(_, newValue) => {
                    field.onChange(newValue?.id || '')
                  }}
                  disabled={isLoading}
                  filterOptions={(options, { inputValue }) => {
                    const filterValue = inputValue.toLowerCase()
                    return options.filter(
                      (option) =>
                        option.code.toLowerCase().includes(filterValue) ||
                        option.name.toLowerCase().includes(filterValue)
                    )
                  }}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={option.code} size="small" color="secondary" variant="outlined" />
                        <span>{option.name}</span>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={`${t('inspection.selectProcess')} *`}
                      error={!!errors.inspectionProcess}
                      helperText={errors.inspectionProcess?.message}
                    />
                  )}
                  noOptionsText={t('common.noData')}
                />
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
                      {selectedModel.code} - {selectedModel.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('inspection.process')}:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedProcess.code} - {selectedProcess.name}
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
