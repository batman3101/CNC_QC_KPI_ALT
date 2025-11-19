import { useState } from 'react'
import { subDays } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Tabs, Tab } from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { KPICards } from '@/components/analytics/KPICards'
import { AnalyticsFilters } from '@/components/analytics/AnalyticsFilters'
import { DefectRateTrendChart } from '@/components/analytics/DefectRateTrendChart'
import { ModelDefectChart } from '@/components/analytics/ModelDefectChart'
import { MachinePerformanceChart } from '@/components/analytics/MachinePerformanceChart'
import { DefectTypeChart } from '@/components/analytics/DefectTypeChart'
import { HourlyDistributionChart } from '@/components/analytics/HourlyDistributionChart'
import { InspectorPerformanceChart } from '@/components/analytics/InspectorPerformanceChart'
import type { AnalyticsFilters as Filters } from '@/types/analytics'

// UI 테스트용 Mock 서비스 (나중에 실제 서비스로 교체)
import * as analyticsService from '@/ui_test/mockServices/mockAnalyticsService'
import { mockMachines, mockProductModels } from '@/ui_test/mockData/analyticsMockData'

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export function AnalyticsPage() {
  const { t } = useTranslation()
  const [tabValue, setTabValue] = useState(0)
  const [filters, setFilters] = useState<Filters>({
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
  })

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  // Fetch KPI Summary
  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ['kpi-summary', filters],
    queryFn: () => analyticsService.getKPISummary(filters),
  })

  // Fetch Defect Rate Trend
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['defect-trend', filters],
    queryFn: () => analyticsService.getDefectRateTrend(filters),
  })

  // Fetch Model Distribution
  const { data: modelData, isLoading: modelLoading } = useQuery({
    queryKey: ['model-distribution', filters],
    queryFn: () => analyticsService.getModelDefectDistribution(filters),
  })

  // Fetch Machine Performance
  const { data: machineData, isLoading: machineLoading } = useQuery({
    queryKey: ['machine-performance', filters],
    queryFn: () => analyticsService.getMachinePerformance(filters),
  })

  // Fetch Defect Types
  const { data: defectTypeData, isLoading: defectTypeLoading } = useQuery({
    queryKey: ['defect-types', filters],
    queryFn: () => analyticsService.getDefectTypeDistribution(filters),
  })

  // Fetch Hourly Distribution
  const { data: hourlyData, isLoading: hourlyLoading } = useQuery({
    queryKey: ['hourly-distribution', filters],
    queryFn: () => analyticsService.getHourlyDistribution(filters),
  })

  // Fetch Inspector Performance
  const { data: inspectorData, isLoading: inspectorLoading } = useQuery({
    queryKey: ['inspector-performance', filters],
    queryFn: () => analyticsService.getInspectorPerformance(filters),
  })

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          {t('analytics.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('analytics.description')}
        </Typography>
      </Box>

      <Grid2 container spacing={3}>
        {/* Filters Sidebar */}
        <Grid2 xs={12} lg={3}>
          <AnalyticsFilters
            filters={filters}
            onChange={setFilters}
            machines={mockMachines}
            models={mockProductModels}
          />
        </Grid2>

        {/* Main Content */}
        <Grid2 xs={12} lg={9}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* KPI Cards */}
            <KPICards data={kpiData} isLoading={kpiLoading} />

            {/* Charts Tabs */}
            <Box>
              <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
                <Tab label="추이 분석" />
                <Tab label="분포 분석" />
                <Tab label="성능 분석" />
                <Tab label="시간 분석" />
              </Tabs>

              {/* Trends Tab */}
              <TabPanel value={tabValue} index={0}>
                <DefectRateTrendChart data={trendData || []} />
              </TabPanel>

              {/* Distribution Tab */}
              <TabPanel value={tabValue} index={1}>
                <Grid2 container spacing={3}>
                  <Grid2 xs={12} lg={6}>
                    <ModelDefectChart data={modelData || []} />
                  </Grid2>
                  <Grid2 xs={12} lg={6}>
                    <DefectTypeChart data={defectTypeData || []} />
                  </Grid2>
                </Grid2>
              </TabPanel>

              {/* Performance Tab */}
              <TabPanel value={tabValue} index={2}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <MachinePerformanceChart data={machineData || []} />
                  <InspectorPerformanceChart data={inspectorData || []} />
                </Box>
              </TabPanel>

              {/* Time Tab */}
              <TabPanel value={tabValue} index={3}>
                <HourlyDistributionChart data={hourlyData || []} />
              </TabPanel>
            </Box>
          </Box>
        </Grid2>
      </Grid2>
    </Box>
  )
}
