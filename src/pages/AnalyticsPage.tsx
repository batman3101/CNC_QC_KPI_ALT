import { useState } from 'react'
import { subDays } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

export function AnalyticsPage() {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<Filters>({
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
  })

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('analytics.title')}</h1>
        <p className="text-muted-foreground">
          {t('analytics.description')}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Filters Sidebar */}
        <aside>
          <AnalyticsFilters
            filters={filters}
            onChange={setFilters}
            machines={mockMachines}
            models={mockProductModels}
          />
        </aside>

        {/* Main Content */}
        <div className="space-y-6">
          {/* KPI Cards */}
          <KPICards data={kpiData} isLoading={kpiLoading} />

          {/* Charts Tabs */}
          <Tabs defaultValue="trends" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="trends">추이 분석</TabsTrigger>
              <TabsTrigger value="distribution">분포 분석</TabsTrigger>
              <TabsTrigger value="performance">성능 분석</TabsTrigger>
              <TabsTrigger value="time">시간 분석</TabsTrigger>
            </TabsList>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <DefectRateTrendChart data={trendData || []} />
            </TabsContent>

            {/* Distribution Tab */}
            <TabsContent value="distribution" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <ModelDefectChart data={modelData || []} />
                <DefectTypeChart data={defectTypeData || []} />
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <MachinePerformanceChart data={machineData || []} />
              <InspectorPerformanceChart data={inspectorData || []} />
            </TabsContent>

            {/* Time Tab */}
            <TabsContent value="time" className="space-y-6">
              <HourlyDistributionChart data={hourlyData || []} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
