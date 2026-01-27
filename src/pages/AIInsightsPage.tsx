import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
} from '@mui/material'
import { Refresh } from '@mui/icons-material'

import { InsightCard, AIChatbot } from '@/components/ai-insights'
import type { InsightType, AnalyticsDataForAI } from '@/types/ai-insights'
import { generateAllInsights } from '@/services/geminiService'

// Supabase 서비스
import * as analyticsService from '@/services/analyticsService'
import * as inspectionService from '@/services/inspectionService'
import { getProductModels, getDefectTypes } from '@/services/managementService'

// 날짜 유틸리티
import { getTodayBusinessDate, getBusinessDate, formatDateString } from '@/lib/dateUtils'

export function AIInsightsPage() {
  const { t, i18n } = useTranslation()
  const language = i18n.language === 'vi' ? 'vi' : 'ko'

  const [insights, setInsights] = useState<Record<InsightType, string>>({
    'daily-summary': '',
    'key-issues': '',
    'performance': '',
    'risk-alerts': '',
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // 기본 필터
  const filters = useMemo(() => {
    const today = new Date()
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return {
      dateRange: {
        from: weekAgo,
        to: today,
      },
    }
  }, [])

  // 데이터 조회
  const { data: inspections = [] } = useQuery({
    queryKey: ['ai-inspections'],
    queryFn: () => inspectionService.getInspections(),
  })

  const { data: defects = [] } = useQuery({
    queryKey: ['ai-defects'],
    queryFn: () => inspectionService.getDefects(),
  })

  const { data: models = [] } = useQuery({
    queryKey: ['ai-models'],
    queryFn: getProductModels,
  })

  // Fetch defect types for name mapping
  const { data: defectTypesData = [] } = useQuery({
    queryKey: ['ai-defect-types-list'],
    queryFn: getDefectTypes,
  })

  const { data: defectTypeDistribution = [] } = useQuery({
    queryKey: ['ai-defect-types', filters],
    queryFn: () => analyticsService.getDefectTypeDistribution(filters),
  })

  const { data: machinePerformance = [] } = useQuery({
    queryKey: ['ai-machine-performance', filters],
    queryFn: () => analyticsService.getMachinePerformance(filters),
  })

  // AI용 분석 데이터 구성
  const analyticsData = useMemo<AnalyticsDataForAI | null>(() => {
    if (!inspections.length) return null

    const todayBusinessDate = getTodayBusinessDate()

    // 오늘 검사 필터링
    const todayInspections = inspections.filter((inspection) => {
      const inspectionBusinessDate = getBusinessDate(new Date(inspection.created_at))
      return inspectionBusinessDate === todayBusinessDate
    })

    const todayPassed = todayInspections.filter(i => i.status === 'pass').length
    const todayFailed = todayInspections.filter(i => i.status === 'fail').length
    const todayTotal = todayInspections.length
    const todayPassRate = todayTotal > 0 ? (todayPassed / todayTotal) * 100 : 0

    // 주간 트렌드
    const weeklyMap = new Map<string, { total: number; passed: number; failed: number }>()
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = formatDateString(date)
      weeklyMap.set(dateStr, { total: 0, passed: 0, failed: 0 })
    }

    inspections.forEach(inspection => {
      const dateStr = formatDateString(new Date(inspection.created_at))
      const existing = weeklyMap.get(dateStr)
      if (existing) {
        existing.total++
        if (inspection.status === 'pass') existing.passed++
        else existing.failed++
      }
    })

    const weeklyTrend = Array.from(weeklyMap.entries()).map(([date, stats]) => ({
      date,
      total: stats.total,
      passed: stats.passed,
      failed: stats.failed,
      passRate: stats.total > 0 ? (stats.passed / stats.total) * 100 : 0,
    }))

    // 불량 유형 분포
    const totalDefects = defectTypeDistribution.reduce((sum, d) => sum + d.count, 0)
    const defectTypeDist = defectTypeDistribution.map(d => ({
      type: d.defectType,
      count: d.count,
      percentage: totalDefects > 0 ? (d.count / totalDefects) * 100 : 0,
    }))

    // 설비별 성과
    const machinePerf = machinePerformance.map(m => ({
      machineId: m.machineName,
      machineName: m.machineName,
      total: m.totalInspections,
      passRate: 100 - m.defectRate,
    }))

    // 모델별 불량률
    const modelMap = new Map<string, { total: number; failed: number }>()
    inspections.forEach(inspection => {
      const existing = modelMap.get(inspection.model_id) || { total: 0, failed: 0 }
      existing.total++
      if (inspection.status === 'fail') existing.failed++
      modelMap.set(inspection.model_id, existing)
    })

    const modelDefectRates = Array.from(modelMap.entries()).map(([modelId, stats]) => {
      const model = models.find(m => m.id === modelId)
      return {
        modelId,
        modelCode: model?.code || modelId,
        total: stats.total,
        defectRate: stats.total > 0 ? (stats.failed / stats.total) * 100 : 0,
      }
    })

    // 미해결 불량 (불량 유형 이름으로 변환)
    const defectTypeMap = new Map<string, string>()
    defectTypesData.forEach(dt => {
      defectTypeMap.set(dt.id, dt.name)
    })

    const pendingDefects = defects
      .filter(d => d.status === 'pending' || d.status === 'in_progress')
      .map(d => ({
        id: d.id,
        type: defectTypeMap.get(d.defect_type) || d.defect_type,
        status: d.status,
        createdAt: d.created_at,
      }))

    return {
      todayInspections: {
        total: todayTotal,
        passed: todayPassed,
        failed: todayFailed,
        passRate: todayPassRate,
      },
      weeklyTrend,
      defectTypeDistribution: defectTypeDist,
      machinePerformance: machinePerf,
      modelDefectRates,
      pendingDefects,
    }
  }, [inspections, defects, models, defectTypeDistribution, machinePerformance, defectTypesData])

  // 인사이트 생성
  const handleGenerateInsights = useCallback(async () => {
    if (!analyticsData) return

    setIsGenerating(true)
    try {
      const results = await generateAllInsights(analyticsData, language)
      setInsights(results)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Failed to generate insights:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [analyticsData, language])

  const insightTypes: { type: InsightType; titleKey: string }[] = [
    { type: 'daily-summary', titleKey: 'aiInsights.dailySummary' },
    { type: 'key-issues', titleKey: 'aiInsights.keyIssues' },
    { type: 'performance', titleKey: 'aiInsights.performanceAnalysis' },
    { type: 'risk-alerts', titleKey: 'aiInsights.riskAlerts' },
  ]

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'nowrap' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
            {t('aiInsights.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {t('aiInsights.description')}
          </Typography>
          {lastUpdated && (
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }} noWrap>
              {t('aiInsights.lastUpdated')}: {lastUpdated}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={isGenerating ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
          onClick={handleGenerateInsights}
          disabled={isGenerating || !analyticsData}
          size="small"
          sx={{ whiteSpace: 'nowrap', flexShrink: 0, minWidth: 'auto', px: 2 }}
        >
          {isGenerating ? t('aiInsights.refreshing') : t('aiInsights.refresh')}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Insight Cards - 2x2 Grid */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Grid container spacing={2}>
            {insightTypes.map(({ type, titleKey }) => (
              <Grid size={{ xs: 12, md: 6 }} key={type}>
                <InsightCard
                  type={type}
                  title={t(titleKey)}
                  content={insights[type]}
                  isLoading={isGenerating}
                />
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* AI Chatbot */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ height: { xs: 400, lg: '100%' }, minHeight: 400 }}>
            <AIChatbot analyticsData={analyticsData} />
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
