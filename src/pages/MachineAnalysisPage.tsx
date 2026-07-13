import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Autocomplete,
  Box,
  ButtonGroup,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material'
import { PrecisionManufacturing, Cancel, Inventory, Assignment } from '@mui/icons-material'

import { DefectRateTrendChart } from '@/components/analytics/DefectRateTrendChart'
import { DefectTypeChart } from '@/components/analytics/DefectTypeChart'
import * as managementService from '@/services/managementService'
import { getMachineAnalysis } from '@/services/machineAnalysisService'
import { getRecentBusinessDays } from '@/lib/dateUtils'
import { useFactoryStore } from '@/stores/factoryStore'
import type { Database } from '@/types/database'
import type { DefectTypeDistribution } from '@/types/analytics'

type Machine = Database['public']['Tables']['machines']['Row']

/**
 * Below this many inspections a machine's defect rate is not worth acting on.
 * Half the machines in a 30-day window sit under it, and one bad lot out of two
 * is a 50% defect rate that means nothing - the page says so rather than letting
 * someone stop a machine over it.
 */
const LOW_SAMPLE_INSPECTIONS = 5

// 90 days by default, not the 30 the analytics page uses. A single machine sees
// a median of five inspections a month, so a shorter window mostly produces
// noise.
const DEFAULT_PERIOD_DAYS = 90

export function MachineAnalysisPage() {
  const { t } = useTranslation()
  const { activeFactoryId } = useFactoryStore()

  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [machineInput, setMachineInput] = useState('')
  const [periodDays, setPeriodDays] = useState(DEFAULT_PERIOD_DAYS)

  const range = useMemo(() => getRecentBusinessDays(periodDays), [periodDays])

  // Server-side search: the factory has 800+ machines, far too many to put in a
  // dropdown. searchMachines already ranks exact-prefix matches first and falls
  // back to the offline cache.
  const { data: machines = [], isLoading: machinesLoading } = useQuery({
    queryKey: ['machines-search', machineInput, activeFactoryId],
    queryFn: () =>
      managementService.searchMachines(machineInput, activeFactoryId || undefined),
    staleTime: 1000 * 60,
  })

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['machine-analysis', selectedMachine?.id, periodDays, activeFactoryId],
    queryFn: () =>
      getMachineAnalysis(
        selectedMachine!.id,
        range.from,
        range.to,
        activeFactoryId || undefined
      ),
    enabled: Boolean(selectedMachine),
  })

  // Both pages measure defect types in pieces, so the shared chart takes this
  // as-is. It also resolves the untyped-defect sentinel into words, which is
  // why nothing is translated here.
  const defectTypeData: DefectTypeDistribution[] = useMemo(
    () =>
      (analysis?.defectTypes ?? []).map((row) => ({
        defectType: row.defectType,
        count: row.qty,
        percentage: row.percentage,
      })),
    [analysis?.defectTypes]
  )

  const summary = analysis?.summary
  const lowSample =
    summary !== undefined &&
    summary.inspectionCount > 0 &&
    summary.inspectionCount < LOW_SAMPLE_INSPECTIONS

  const stats = summary
    ? [
        {
          title: t('machineAnalysis.defectRate'),
          value: `${summary.defectRate.toFixed(2)}%`,
          icon: Cancel,
          color: 'error.main',
        },
        {
          title: t('machineAnalysis.inspectionQty'),
          value: summary.inspectionQty.toLocaleString(),
          icon: Inventory,
          color: 'text.secondary',
        },
        {
          title: t('machineAnalysis.defectQty'),
          value: summary.defectQty.toLocaleString(),
          icon: Cancel,
          color: 'error.main',
        },
        {
          title: t('machineAnalysis.inspectionCount'),
          value: summary.inspectionCount.toLocaleString(),
          icon: Assignment,
          color: 'text.secondary',
        },
      ]
    : []

  return (
    <Box>
      <Box sx={{ mb: { xs: 2, md: 4 } }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {t('machineAnalysis.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('machineAnalysis.description')}
        </Typography>
      </Box>

      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={machines}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={selectedMachine}
                onChange={(_event, newValue) => setSelectedMachine(newValue)}
                inputValue={machineInput}
                onInputChange={(_event, newInput) => setMachineInput(newInput)}
                loading={machinesLoading}
                noOptionsText={t('machineAnalysis.noMachineFound')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('machineAnalysis.selectMachine')}
                    placeholder={t('machineAnalysis.machinePlaceholder')}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {machinesLoading ? <CircularProgress size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <ButtonGroup variant="outlined" size="small" fullWidth>
                {[7, 30, 90].map((days) => (
                  <Button
                    key={days}
                    variant={periodDays === days ? 'contained' : 'outlined'}
                    onClick={() => setPeriodDays(days)}
                  >
                    {t('machineAnalysis.lastDays', { count: days })}
                  </Button>
                ))}
              </ButtonGroup>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {!selectedMachine ? (
        <Card elevation={3}>
          <CardContent sx={{ py: 8, textAlign: 'center' }}>
            <PrecisionManufacturing sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              {t('machineAnalysis.selectPrompt')}
            </Typography>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Grid container spacing={3}>
          {[...Array(4)].map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))}
        </Grid>
      ) : summary && summary.inspectionCount === 0 ? (
        <Alert severity="info">
          {t('machineAnalysis.noDataForPeriod', { machine: selectedMachine.name })}
        </Alert>
      ) : (
        <>
          {lowSample && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {t('machineAnalysis.lowSampleWarning', {
                count: summary?.inspectionCount ?? 0,
              })}
            </Alert>
          )}

          <Grid container spacing={3} sx={{ mb: 3 }}>
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.title}>
                  <Card elevation={3}>
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          {stat.title}
                        </Typography>
                        <Icon sx={{ color: stat.color, fontSize: 20 }} />
                      </Box>
                      <Typography variant="h4" fontWeight={700} gutterBottom>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedMachine.name}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <DefectRateTrendChart data={analysis?.trend ?? []} />
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <DefectTypeChart data={defectTypeData} />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}
