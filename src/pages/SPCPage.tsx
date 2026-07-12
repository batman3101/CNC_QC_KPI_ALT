/**
 * SPC Page - 통계적 공정 관리 페이지
 * Statistical Process Control Dashboard
 */

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Tabs, Tab, Grid, useTheme, useMediaQuery } from '@mui/material'
import { getRecentBusinessDays } from '@/lib/dateUtils'
import type { DateRange } from 'react-day-picker'

// SPC Components
import {
  PControlChart,
  SPCKPICards,
  SPCAlertsList,
  SPCFilters,
  SPCAlertDialog,
  SPCGuide,
} from '@/components/spc'
import { DefectPointParetoChart } from '@/components/spc/DefectPointParetoChart'
import { ModelDefectRateTable } from '@/components/spc/ModelDefectRateTable'

import type { SPCAlert } from '@/types/spc'

// SPC Services
import {
  getPChartData,
  getModelDefectRates,
  generateAndUpsertAlerts,
  getSPCAlerts,
  getDefectPointPareto,
  getProductModels,
  getInspectionProcesses,
  getInspectionItems,
} from '@/services/spcService'

// Factory Store
import { useFactoryStore } from '@/stores/factoryStore'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`spc-tabpanel-${index}`}
      aria-labelledby={`spc-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export function SPCPage() {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { activeFactoryId } = useFactoryStore()

  const [tabValue, setTabValue] = useState(0)
  const defaultDateRange = getRecentBusinessDays(30)

  // Filter states
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>()
  const [selectedProcessId, setSelectedProcessId] = useState<string | undefined>()
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: defaultDateRange.from,
    to: defaultDateRange.to,
  })

  // Alert Dialog state
  const [selectedAlert, setSelectedAlert] = useState<SPCAlert | null>(null)
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleResetFilters = () => {
    setSelectedModelId(undefined)
    setSelectedProcessId(undefined)
    setSelectedItemId(undefined)
    setDateRange({
      from: defaultDateRange.from,
      to: defaultDateRange.to,
    })
  }

  // Fetch Product Models
  const { data: productModels = [] } = useQuery({
    queryKey: ['spc-product-models'],
    queryFn: getProductModels,
  })

  // Fetch Inspection Processes
  const { data: inspectionProcesses = [] } = useQuery({
    queryKey: ['spc-inspection-processes'],
    queryFn: getInspectionProcesses,
  })

  // Fetch Inspection Items (for selected model)
  const { data: inspectionItems = [] } = useQuery({
    queryKey: ['spc-inspection-items', selectedModelId],
    queryFn: () => getInspectionItems(selectedModelId),
    enabled: !!selectedModelId,
  })

  // The DB stores the process CODE string in inspections.inspection_process,
  // but SPCFilters emits the process id. Translate id -> code for queries.
  const selectedProcessCode = useMemo(
    () => inspectionProcesses.find((p) => p.id === selectedProcessId)?.code,
    [inspectionProcesses, selectedProcessId],
  )

  // Fetch model-level defect rates (inspections 집계 기반)
  const { data: modelDefectRates = [] } = useQuery({
    queryKey: ['spc-model-defect-rates', selectedProcessCode, dateRange, activeFactoryId, productModels],
    queryFn: () =>
      getModelDefectRates(
        {
          process_id: selectedProcessCode,
          date_from: dateRange?.from || defaultDateRange.from,
          date_to: dateRange?.to || defaultDateRange.to,
        },
        productModels.map((m) => ({ id: m.id, name: m.name, code: m.code })),
        activeFactoryId || undefined,
      ),
    enabled: productModels.length > 0,
  })

  // Fetch P-Chart Data
  const { data: pChartData } = useQuery({
    queryKey: ['spc-pchart', selectedModelId, selectedProcessCode, dateRange, activeFactoryId],
    queryFn: () =>
      getPChartData(
        {
          model_id: selectedModelId,
          process_id: selectedProcessCode,
          date_from: dateRange?.from || defaultDateRange.from,
          date_to: dateRange?.to || defaultDateRange.to,
        },
        activeFactoryId || undefined
      ),
  })

  // 알림 생성: p-chart 위반을 감지하여 spc_alerts 테이블에 저장
  const { isSuccess: alertsGenerated } = useQuery({
    queryKey: ['spc-generate-alerts', activeFactoryId],
    queryFn: () => generateAndUpsertAlerts(activeFactoryId || undefined),
    staleTime: 5 * 60 * 1000, // 5분마다 재생성
    refetchOnWindowFocus: false,
  })

  // Fetch SPC Alerts (알림 생성 완료 후 실행)
  const { data: alerts = [] } = useQuery({
    queryKey: ['spc-alerts', selectedModelId, activeFactoryId],
    queryFn: () =>
      getSPCAlerts(
        selectedModelId ? { model_id: selectedModelId } : undefined,
        activeFactoryId || undefined
      ),
    enabled: alertsGenerated,
  })

  // 전체 알림 (필터 없이) - KPI/Model 카운트용
  const { data: allAlerts = [] } = useQuery({
    queryKey: ['spc-alerts-all', activeFactoryId],
    queryFn: () => getSPCAlerts(undefined, activeFactoryId || undefined),
    enabled: alertsGenerated,
  })

  // Fetch Defect Point Pareto data
  const { data: defectPareto = [] } = useQuery({
    queryKey: ['spc-defect-pareto', selectedModelId, selectedProcessCode, dateRange, activeFactoryId],
    queryFn: () =>
      getDefectPointPareto(
        {
          model_id: selectedModelId,
          process_id: selectedProcessCode,
          date_from: dateRange?.from || defaultDateRange.from,
          date_to: dateRange?.to || defaultDateRange.to,
        },
        activeFactoryId || undefined,
      ),
  })

  // Derive defect-centric KPI metrics from p-chart stats + pareto + alerts
  const defectKpi = useMemo(() => {
    const inspected = pChartData?.statistics.totalInspections ?? 0
    const defects = pChartData?.statistics.totalDefects ?? 0
    const rate = inspected > 0 ? (defects / inspected) * 100 : 0
    const top = defectPareto[0]
    return {
      inspectedQty: inspected,
      defectRate: rate,
      openAlerts: allAlerts.filter((a) => a.status === 'open').length,
      topDefectPoint: top ? `${top.item_name} (${top.defect_count})` : '-',
    }
  }, [pChartData, defectPareto, allAlerts])

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, md: 4 } }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" fontWeight={700} gutterBottom>
          {t('spc.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          {t('spc.description')}
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <SPCFilters
          models={productModels}
          processes={inspectionProcesses}
          inspectionItems={inspectionItems}
          selectedModelId={selectedModelId}
          selectedProcessId={selectedProcessId}
          selectedItemId={selectedItemId}
          dateRange={dateRange}
          onModelChange={setSelectedModelId}
          onProcessChange={setSelectedProcessId}
          onItemChange={setSelectedItemId}
          onDateRangeChange={setDateRange}
          onReset={handleResetFilters}
          showItemFilter={false}
        />
      </Box>

      {/* KPI Cards */}
      <Box sx={{ mb: 3 }}>
        <SPCKPICards defect={defectKpi} />
      </Box>

      {/* Tabs */}
      <Box>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label={t('spc.dashboard')} />
          <Tab label={t('spc.controlChart')} />
          <Tab label={t('spc.defectAnalysis.tabTitle')} />
          <Tab label={t('spc.alertsTitle')} />
        </Tabs>

        {/* Dashboard Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* SPC Guide */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <SPCGuide />
            </Grid>

            {/* Model Defect Rate Table */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <ModelDefectRateTable
                data={modelDefectRates}
                onRowClick={(modelId) => {
                  setSelectedModelId(modelId)
                  setTabValue(1) // Switch to control chart tab
                }}
              />
            </Grid>

            {/* Recent Alerts */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <SPCAlertsList
                alerts={alerts}
                maxItems={5}
                showActions={false}
                onViewAll={() => setTabValue(3)}
              />
            </Grid>

            {/* P-Chart Preview */}
            <Grid size={{ xs: 12, lg: 6 }}>
              {pChartData && pChartData.points.length > 0 && (
                <PControlChart
                  data={pChartData.points}
                  limits={pChartData.limits}
                  showLegend={false}
                />
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Control Chart Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              {pChartData && pChartData.points.length > 0 ? (
                <PControlChart
                  data={pChartData.points}
                  limits={pChartData.limits}
                  title={selectedModelId
                    ? `${t('spc.pChart')} - ${productModels.find(m => m.id === selectedModelId)?.name || ''}`
                    : t('spc.pChart')
                  }
                />
              ) : (
                <Box
                  sx={{
                    p: 8,
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Typography color="text.secondary">
                    {t('spc.noData')}
                  </Typography>
                </Box>
              )}
            </Grid>

            {/* Statistics Summary */}
            {pChartData && pChartData.statistics.count > 0 && (
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    p: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('spc.statistics.count')}
                    </Typography>
                    <Typography variant="h6">{pChartData.statistics.count}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('spc.chart.defectRate')} (%)
                    </Typography>
                    <Typography variant="h6">
                      {pChartData.statistics.avgDefectRate.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('spc.chart.defectCount')}
                    </Typography>
                    <Typography variant="h6">
                      {pChartData.statistics.totalDefects.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('spc.chart.sampleSize')}
                    </Typography>
                    <Typography variant="h6">
                      {pChartData.statistics.totalInspections.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Defect Point Pareto Tab */}
        <TabPanel value={tabValue} index={2}>
          <DefectPointParetoChart data={defectPareto} />
        </TabPanel>

        {/* Alerts Tab */}
        <TabPanel value={tabValue} index={3}>
          <SPCAlertsList
            alerts={alerts}
            onViewDetail={(alert) => {
              setSelectedAlert(alert)
              setAlertDialogOpen(true)
            }}
            onAcknowledge={(alertId) => {
              const alert = alerts.find(a => a.id === alertId)
              if (alert) {
                setSelectedAlert(alert)
                setAlertDialogOpen(true)
              }
            }}
          />
        </TabPanel>
      </Box>

      {/* Alert Detail Dialog */}
      <SPCAlertDialog
        alert={selectedAlert}
        open={alertDialogOpen}
        onOpenChange={setAlertDialogOpen}
      />
    </Box>
  )
}
