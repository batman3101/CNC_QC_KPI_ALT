import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Box,
  Grid,
  Typography,
  Skeleton,
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Target,
  Clock,
  CheckCircle,
} from 'lucide-react'
import type { AnalyticsFilters } from '@/types/analytics'
import * as analyticsService from '@/ui_test/mockServices/mockAnalyticsService'

interface InspectorDetailedKPIProps {
  filters: AnalyticsFilters
}

export function InspectorDetailedKPI({ filters }: InspectorDetailedKPIProps) {
  const { t } = useTranslation()
  const [selectedInspectorId, setSelectedInspectorId] = useState<string>('')

  // Fetch inspector list
  const { data: inspectorList, isLoading: isLoadingList } = useQuery({
    queryKey: ['inspector-list'],
    queryFn: () => analyticsService.getInspectorList(),
  })

  // Fetch detailed KPI for selected inspector
  const { data: inspectorKPI, isLoading: isLoadingKPI } = useQuery({
    queryKey: ['inspector-detailed-kpi', selectedInspectorId, filters],
    queryFn: () => analyticsService.getInspectorDetailedKPI(selectedInspectorId, filters),
    enabled: !!selectedInspectorId,
  })

  const renderTrendIcon = (diff: number) => {
    if (diff < -0.1) return <TrendingDown className="h-4 w-4 text-green-500" />
    if (diff > 0.1) return <TrendingUp className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const renderComparisonBadge = (diff: number, inverse: boolean = false) => {
    const isGood = inverse ? diff > 0 : diff < 0
    return (
      <Badge variant={isGood ? 'default' : 'destructive'} className="ml-2">
        {diff > 0 ? '+' : ''}{diff.toFixed(2)}
      </Badge>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Inspector Selector */}
      <Card>
        <CardHeader>
          <CardTitle>{t('inspectorKPI.selectInspector')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedInspectorId}
            onValueChange={setSelectedInspectorId}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder={t('inspectorKPI.selectInspectorPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {isLoadingList ? (
                <SelectItem value="loading" disabled>
                  {t('common.loading')}
                </SelectItem>
              ) : (
                inspectorList?.map((inspector) => (
                  <SelectItem key={inspector.id} value={inspector.id}>
                    {inspector.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Show content only when inspector is selected */}
      {selectedInspectorId && (
        <>
          {isLoadingKPI ? (
            <Grid container spacing={3}>
              {[1, 2, 3, 4].map((i) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                  <Skeleton variant="rounded" height={120} />
                </Grid>
              ))}
            </Grid>
          ) : inspectorKPI ? (
            <>
              {/* KPI Summary Cards */}
              <Grid container spacing={3}>
                {/* Ranking */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card className="shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {t('inspectorKPI.ranking')}
                          </p>
                          <p className="text-3xl font-bold">
                            {inspectorKPI.rank}
                            <span className="text-lg text-muted-foreground">
                              /{inspectorKPI.totalInspectors}
                            </span>
                          </p>
                        </div>
                        <Trophy className="h-8 w-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Total Inspections */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card className="shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {t('inspectorKPI.totalInspections')}
                          </p>
                          <p className="text-3xl font-bold">
                            {inspectorKPI.totalInspections}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('inspectorKPI.vsTeamAvg')}
                            {renderComparisonBadge(inspectorKPI.teamComparison.dailyInspectionsDiff, true)}
                          </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Defect Rate */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card className="shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {t('inspectorKPI.defectRate')}
                          </p>
                          <p className="text-3xl font-bold">
                            {inspectorKPI.defectRate.toFixed(2)}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            {t('inspectorKPI.vsTeamAvg')}
                            {renderComparisonBadge(inspectorKPI.teamComparison.defectRateDiff)}
                            {renderTrendIcon(inspectorKPI.teamComparison.defectRateDiff)}
                          </p>
                        </div>
                        <Target className="h-8 w-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Avg Inspection Time */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card className="shadow-md">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {t('inspectorKPI.avgInspectionTime')}
                          </p>
                          <p className="text-3xl font-bold">
                            {inspectorKPI.avgInspectionTime.toFixed(1)}
                            <span className="text-lg text-muted-foreground">{t('inspectorKPI.minutes')}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            {t('inspectorKPI.vsTeamAvg')}
                            {renderComparisonBadge(inspectorKPI.teamComparison.inspectionTimeDiff)}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Daily Trend Chart */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>{t('inspectorKPI.dailyTrend')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={inspectorKPI.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => value.slice(5)}
                        stroke="hsl(var(--border))"
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        stroke="hsl(var(--border))"
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        domain={[0, 20]}
                        stroke="hsl(var(--border))"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          color: 'hsl(var(--foreground))',
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="inspectionCount"
                        name={t('charts.inspectionCount')}
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="defectRate"
                        name={t('charts.defectRate') + ' (%)'}
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance by Model & Process */}
              <Grid container spacing={3}>
                {/* By Model */}
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle>{t('inspectorKPI.performanceByModel')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={inspectorKPI.modelPerformance} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            stroke="hsl(var(--border))"
                          />
                          <YAxis
                            type="category"
                            dataKey="modelCode"
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                            width={70}
                            stroke="hsl(var(--border))"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              borderColor: 'hsl(var(--border))',
                              color: 'hsl(var(--foreground))',
                            }}
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null
                              const data = payload[0].payload
                              return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                  <p className="font-bold">{data.modelName}</p>
                                  <p className="text-sm">
                                    {t('charts.inspectionCount')}: {data.inspectionCount}
                                  </p>
                                  <p className="text-sm text-destructive">
                                    {t('charts.defectRate')}: {data.defectRate.toFixed(2)}%
                                  </p>
                                </div>
                              )
                            }}
                          />
                          <Bar
                            dataKey="inspectionCount"
                            name={t('charts.inspectionCount')}
                            fill="hsl(var(--chart-1))"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* By Process */}
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle>{t('inspectorKPI.performanceByProcess')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={inspectorKPI.processPerformance}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="processCode"
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            stroke="hsl(var(--border))"
                          />
                          <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            stroke="hsl(var(--border))"
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                            domain={[0, 10]}
                            stroke="hsl(var(--border))"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              borderColor: 'hsl(var(--border))',
                              color: 'hsl(var(--foreground))',
                            }}
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null
                              const data = payload[0].payload
                              return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                  <p className="font-bold">{data.processName}</p>
                                  <p className="text-sm">
                                    {t('charts.inspectionCount')}: {data.inspectionCount}
                                  </p>
                                  <p className="text-sm text-destructive">
                                    {t('charts.defectRate')}: {data.defectRate.toFixed(2)}%
                                  </p>
                                </div>
                              )
                            }}
                          />
                          <Legend />
                          <Bar
                            yAxisId="left"
                            dataKey="inspectionCount"
                            name={t('charts.inspectionCount')}
                            fill="hsl(var(--chart-1))"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="defectRate"
                            name={t('charts.defectRate') + ' (%)'}
                            fill="hsl(var(--chart-2))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Team Comparison Summary */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>{t('inspectorKPI.teamComparison')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <Typography variant="body2" color="text.secondary">
                          {t('inspectorKPI.teamAvgDefectRate')}
                        </Typography>
                        <Typography variant="h5" fontWeight={600}>
                          {inspectorKPI.teamComparison.avgDefectRate.toFixed(2)}%
                        </Typography>
                        <div className="flex items-center justify-center mt-2">
                          {renderTrendIcon(inspectorKPI.teamComparison.defectRateDiff)}
                          <span className={`ml-1 text-sm ${
                            inspectorKPI.teamComparison.defectRateDiff < 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {inspectorKPI.teamComparison.defectRateDiff > 0 ? '+' : ''}
                            {inspectorKPI.teamComparison.defectRateDiff.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <Typography variant="body2" color="text.secondary">
                          {t('inspectorKPI.teamAvgInspectionTime')}
                        </Typography>
                        <Typography variant="h5" fontWeight={600}>
                          {inspectorKPI.teamComparison.avgInspectionTime.toFixed(1)}{t('inspectorKPI.minutes')}
                        </Typography>
                        <div className="flex items-center justify-center mt-2">
                          {renderTrendIcon(inspectorKPI.teamComparison.inspectionTimeDiff)}
                          <span className={`ml-1 text-sm ${
                            inspectorKPI.teamComparison.inspectionTimeDiff < 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {inspectorKPI.teamComparison.inspectionTimeDiff > 0 ? '+' : ''}
                            {inspectorKPI.teamComparison.inspectionTimeDiff.toFixed(2)}{t('inspectorKPI.minutes')}
                          </span>
                        </div>
                      </div>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <Typography variant="body2" color="text.secondary">
                          {t('inspectorKPI.teamAvgDailyInspections')}
                        </Typography>
                        <Typography variant="h5" fontWeight={600}>
                          {inspectorKPI.teamComparison.avgDailyInspections.toFixed(1)}{t('inspectorKPI.perDay')}
                        </Typography>
                        <div className="flex items-center justify-center mt-2">
                          {renderTrendIcon(-inspectorKPI.teamComparison.dailyInspectionsDiff)}
                          <span className={`ml-1 text-sm ${
                            inspectorKPI.teamComparison.dailyInspectionsDiff > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {inspectorKPI.teamComparison.dailyInspectionsDiff > 0 ? '+' : ''}
                            {inspectorKPI.teamComparison.dailyInspectionsDiff.toFixed(2)}{t('inspectorKPI.perDay')}
                          </span>
                        </div>
                      </div>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8">
                <Typography align="center" color="text.secondary">
                  {t('inspectorKPI.noData')}
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Prompt to select inspector */}
      {!selectedInspectorId && (
        <Card>
          <CardContent className="py-12">
            <Typography align="center" color="text.secondary">
              {t('inspectorKPI.pleaseSelectInspector')}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
