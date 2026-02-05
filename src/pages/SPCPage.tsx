/**
 * SPC Page - 통계적 공정 관리 페이지
 * Statistical Process Control Dashboard
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Tabs, Tab, Grid, useTheme, useMediaQuery } from '@mui/material'
import { getRecentBusinessDays } from '@/lib/dateUtils'
import type { DateRange } from 'react-day-picker'
import type { ControlChartType } from '@/types/spc'

// SPC Components
import {
  PControlChart,
  SPCKPICards,
  ProcessCapabilityCard,
  SPCAlertsList,
  SPCFilters,
  ModelSPCSummaryTable,
  SPCAlertDialog,
  SPCGuide,
} from '@/components/spc'

import type { SPCAlert } from '@/types/spc'

// SPC Services
import {
  getPChartData,
  getSPCKPISummary,
  getModelSPCSummary,
  getSPCAlerts,
  getProcessCapabilityData,
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
  const [selectedChartType, setSelectedChartType] = useState<ControlChartType>('p-chart')
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
    setSelectedChartType('p-chart')
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

  // Fetch SPC KPI Summary
  const { data: kpiSummary } = useQuery({
    queryKey: ['spc-kpi-summary', activeFactoryId],
    queryFn: () => getSPCKPISummary(activeFactoryId || undefined),
  })

  // Fetch Model SPC Summary
  const { data: modelSummary = [] } = useQuery({
    queryKey: ['spc-model-summary', activeFactoryId],
    queryFn: () => getModelSPCSummary(activeFactoryId || undefined),
  })

  // Fetch P-Chart Data
  const { data: pChartData } = useQuery({
    queryKey: ['spc-pchart', selectedModelId, selectedProcessId, dateRange, activeFactoryId],
    queryFn: () =>
      getPChartData(
        {
          model_id: selectedModelId,
          process_id: selectedProcessId,
          date_from: dateRange?.from || defaultDateRange.from,
          date_to: dateRange?.to || defaultDateRange.to,
        },
        activeFactoryId || undefined
      ),
  })

  // Fetch SPC Alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ['spc-alerts', selectedModelId, activeFactoryId],
    queryFn: () =>
      getSPCAlerts(
        selectedModelId ? { model_id: selectedModelId } : undefined,
        activeFactoryId || undefined
      ),
  })

  // Fetch Process Capability (when item is selected)
  const { data: capabilityData } = useQuery({
    queryKey: ['spc-capability', selectedItemId, selectedModelId, dateRange, activeFactoryId],
    queryFn: () =>
      getProcessCapabilityData(
        selectedItemId!,
        selectedModelId!,
        dateRange?.from && dateRange?.to
          ? { from: dateRange.from, to: dateRange.to }
          : undefined,
        activeFactoryId || undefined
      ),
    enabled: !!selectedItemId && !!selectedModelId,
  })

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
          selectedChartType={selectedChartType}
          dateRange={dateRange}
          onModelChange={setSelectedModelId}
          onProcessChange={setSelectedProcessId}
          onItemChange={setSelectedItemId}
          onChartTypeChange={setSelectedChartType}
          onDateRangeChange={setDateRange}
          onReset={handleResetFilters}
          showChartTypeFilter={tabValue === 1}
          showItemFilter={tabValue === 2}
        />
      </Box>

      {/* KPI Cards */}
      {kpiSummary && (
        <Box sx={{ mb: 3 }}>
          <SPCKPICards data={kpiSummary} />
        </Box>
      )}

      {/* Tabs */}
      <Box>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label={t('spc.dashboard')} />
          <Tab label={t('spc.controlChart')} />
          <Tab label={t('spc.processCapability')} />
          <Tab label={t('spc.alertsTitle')} />
        </Tabs>

        {/* Dashboard Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* SPC Guide */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <SPCGuide />
            </Grid>

            {/* Model Summary Table */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <ModelSPCSummaryTable
                data={modelSummary}
                onRowClick={(modelId) => {
                  setSelectedModelId(modelId)
                  setTabValue(1) // Switch to control chart tab
                }}
              />
            </Grid>

            {/* Recent Alerts */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <SPCAlertsList alerts={alerts} maxItems={5} showActions={false} />
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

        {/* Process Capability Tab */}
        <TabPanel value={tabValue} index={2}>
          {!selectedModelId ? (
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
                {t('spc.selectModel')}
              </Typography>
            </Box>
          ) : !selectedItemId ? (
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
                {t('spc.selectItem')}
              </Typography>
            </Box>
          ) : capabilityData && capabilityData.values.length > 0 ? (
            <ProcessCapabilityCard
              capability={capabilityData.capability}
              statistics={capabilityData.statistics}
              histogram={capabilityData.histogram}
              usl={capabilityData.usl}
              lsl={capabilityData.lsl}
              target={capabilityData.target}
              itemName={inspectionItems.find(i => i.id === selectedItemId)?.name}
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
                {t('spc.insufficientData')}
              </Typography>
            </Box>
          )}
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
