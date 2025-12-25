import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import {
  Card,
  CardContent,
  Button,
  Box,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Paper,
  Chip,
  Alert,
  Grid,
} from '@mui/material'
import {
  CheckCircle,
  Cancel,
  Save,
  Error as ErrorIcon,
  ArrowBack,
} from '@mui/icons-material'
import { useAuthStore } from '@/stores/authStore'
import type { Database } from '@/types/database'

// Supabase 서비스
import * as managementService from '@/services/managementService'
import * as inspectionService from '@/services/inspectionService'

type InspectionItem = Database['public']['Tables']['inspection_items']['Row']
type InspectionResultInsert =
  Database['public']['Tables']['inspection_results']['Insert']

interface InspectionFormProps {
  machineId: string
  modelId: string
  onComplete: () => void
  onCancel: () => void
}

interface ItemResult {
  itemId: string
  measuredValue: number
  result: 'pass' | 'fail'
  isOkNg: boolean
  okNgValue?: boolean
}

export function InspectionForm({
  machineId,
  modelId,
  onComplete,
  onCancel,
}: InspectionFormProps) {
  const { t } = useTranslation()
  const [itemResults, setItemResults] = useState<Record<string, ItemResult>>({})
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const { user } = useAuthStore()

  // Fetch inspection items for the selected model
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['inspection-items', modelId],
    queryFn: () => managementService.getInspectionItems(modelId),
  })

  // Check if value is within tolerance
  const checkTolerance = (
    value: number,
    item: InspectionItem
  ): 'pass' | 'fail' => {
    if (item.data_type === 'ok_ng') return 'pass'

    if (value < item.tolerance_min || value > item.tolerance_max) {
      return 'fail'
    }
    return 'pass'
  }

  // Handle value change for numeric items
  const handleNumericChange = (itemId: string, value: string) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      // Remove result if value is invalid
      const newResults = { ...itemResults }
      delete newResults[itemId]
      setItemResults(newResults)
      return
    }

    const result = checkTolerance(numValue, item)
    setItemResults({
      ...itemResults,
      [itemId]: {
        itemId,
        measuredValue: numValue,
        result,
        isOkNg: false,
      },
    })
  }

  // Handle OK/NG checkbox
  const handleOkNgChange = (itemId: string, checked: boolean) => {
    setItemResults({
      ...itemResults,
      [itemId]: {
        itemId,
        measuredValue: checked ? 1 : 0,
        result: checked ? 'pass' : 'fail',
        isOkNg: true,
        okNgValue: checked,
      },
    })
  }

  // Save inspection mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated')

      // 1. Create inspection
      const inspection = await inspectionService.createInspection({
        user_id: user.id,
        machine_id: machineId,
        model_id: modelId,
        inspection_process: 'CNC-OQC',
        inspection_quantity: items.length,
        defect_quantity: 0,
        status: 'pending',
      })

      // 2. Create inspection results
      const results: InspectionResultInsert[] = Object.values(itemResults).map(
        (result) => ({
          inspection_id: inspection.id,
          item_id: result.itemId,
          measured_value: result.measuredValue,
          result: result.result,
        })
      )

      await inspectionService.createInspectionResults(results)

      // 3. Determine overall status
      const hasFailures = results.some((r) => r.result === 'fail')
      const overallStatus = hasFailures ? 'fail' : 'pass'

      // 4. Update inspection status
      await inspectionService.updateInspection(inspection.id, {
        status: overallStatus,
      })

      return { inspection, overallStatus }
    },
    onSuccess: ({ overallStatus }) => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] })
      queryClient.invalidateQueries({ queryKey: ['kpi-summary'] })

      enqueueSnackbar(
        `${t('inspection.inspectionSaved')} - ${t('inspection.inspectionResult')}: ${overallStatus === 'pass' ? t('dashboard.pass') : t('dashboard.fail')}`,
        { variant: overallStatus === 'pass' ? 'success' : 'error' }
      )

      onComplete()
    },
    onError: (error: Error) => {
      enqueueSnackbar(
        `${t('inspection.inspectionSaveError')}: ${error.message}`,
        { variant: 'error' }
      )
    },
  })

  const handleSave = () => {
    // Check if all items have results
    const missingItems = items.filter((item) => !itemResults[item.id])

    if (missingItems.length > 0) {
      enqueueSnackbar(
        `${t('inspection.allItemsRequired')} - ${missingItems.length}개 항목이 입력되지 않았습니다.`,
        { variant: 'error' }
      )
      return
    }

    saveMutation.mutate()
  }

  // Calculate completion
  const totalItems = items.length
  const completedItems = Object.keys(itemResults).length
  const failedItems = Object.values(itemResults).filter(
    (r) => r.result === 'fail'
  ).length

  if (itemsLoading) {
    return (
      <Card>
        <CardContent sx={{ py: 8 }}>
          <Typography variant="body1" color="text.secondary" align="center">
            {t('common.loading')}
          </Typography>
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent sx={{ py: 4 }}>
          <Alert severity="info" icon={<ErrorIcon />} sx={{ mb: 3 }}>
            {t('common.noData')}
          </Alert>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={onCancel}>
            {t('inspection.backToSetup')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Progress Card */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              {t('inspection.progress')}
            </Typography>
            <Button variant="outlined" size="small" startIcon={<ArrowBack />} onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('inspection.progress')}
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ my: 1 }}>
                  {totalItems > 0
                    ? Math.round((completedItems / totalItems) * 100)
                    : 0}
                  %
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {completedItems} / {totalItems}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.pass')}
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ my: 1, color: 'success.main' }}>
                  {completedItems - failedItems}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('dashboard.inspections')}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.fail')}
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ my: 1, color: 'error.main' }}>
                  {failedItems}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('dashboard.inspections')}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Inspection Items Card */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {t('inspection.itemName')}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
            {items.map((item, index) => {
              const result = itemResults[item.id]
              const isNumeric = item.data_type === 'numeric'

              return (
                <Paper
                  key={item.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={index + 1} size="small" />
                      <Typography variant="subtitle1" fontWeight={500}>
                        {item.name}
                      </Typography>
                    </Box>
                    {result && (
                      <Chip
                        icon={result.result === 'pass' ? <CheckCircle /> : <Cancel />}
                        label={result.result === 'pass' ? t('dashboard.pass') : t('dashboard.fail')}
                        color={result.result === 'pass' ? 'success' : 'error'}
                        size="small"
                      />
                    )}
                  </Box>

                  {isNumeric ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {t('inspection.standard')}: {item.standard_value.toFixed(2)} {item.unit} (
                        {item.tolerance_min.toFixed(2)} ~{' '}
                        {item.tolerance_max.toFixed(2)} {item.unit})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          type="number"
                          size="small"
                          placeholder={`${t('inspection.measuredValue')} (${item.unit})`}
                          onChange={(e) => handleNumericChange(item.id, e.target.value)}
                          inputProps={{ step: '0.01' }}
                          sx={{ maxWidth: 250 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {item.unit}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <FormControlLabel
                      control={
                        <Checkbox
                          onChange={(e) => handleOkNgChange(item.id, e.target.checked)}
                        />
                      }
                      label={`OK (${t('dashboard.pass')})`}
                    />
                  )}
                </Paper>
              )
            })}
          </Box>

          {/* Save Button */}
          <Box sx={{ mt: 4 }}>
            <Button
              onClick={handleSave}
              variant="contained"
              size="large"
              fullWidth
              disabled={completedItems !== totalItems || saveMutation.isPending}
              startIcon={<Save />}
            >
              {saveMutation.isPending ? t('common.loading') : t('inspection.saveInspection')}
            </Button>

            {completedItems !== totalItems && (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                {t('inspection.allItemsRequired')} ({completedItems}/{totalItems})
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
