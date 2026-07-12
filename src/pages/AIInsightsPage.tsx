import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { Refresh } from '@mui/icons-material'

import { InsightCard, AIChatbot } from '@/components/ai-insights'
import type { InsightType, AnalyticsDataForAI } from '@/types/ai-insights'
import { generateAllInsights } from '@/services/geminiService'

// Supabase 서비스
import * as analyticsService from '@/services/analyticsService'
import * as inspectionService from '@/services/inspectionService'
import { getDefectTypes } from '@/services/managementService'

// Factory Store
import { useFactoryStore } from '@/stores/factoryStore'

const EMPTY_INSIGHTS: Record<InsightType, string> = {
  'daily-summary': '',
  'key-issues': '',
  'performance': '',
  'risk-alerts': '',
}

interface CachedInsights {
  insights: Record<InsightType, string>
  lastUpdated: string | null
}

const AI_INSIGHTS_CACHE_PREFIX = 'cnc-qc-kpi:ai-insights'

function getInsightStorageKey(factoryId: string | null, language: 'ko' | 'vi') {
  return `${AI_INSIGHTS_CACHE_PREFIX}:${factoryId || 'all'}:${language}`
}

function readStoredInsights(storageKey: string): CachedInsights | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) as CachedInsights : null
  } catch {
    return null
  }
}

function writeStoredInsights(storageKey: string, cachedInsights: CachedInsights) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(storageKey, JSON.stringify(cachedInsights))
}

export function AIInsightsPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const language = i18n.language === 'vi' ? 'vi' : 'ko'
  const { activeFactoryId } = useFactoryStore()
  const insightCacheKey = useMemo(
    () => ['ai-insights-generated', activeFactoryId || 'all', language],
    [activeFactoryId, language]
  )
  const insightStorageKey = useMemo(
    () => getInsightStorageKey(activeFactoryId, language),
    [activeFactoryId, language]
  )

  const cachedInsights =
    queryClient.getQueryData<CachedInsights>(insightCacheKey) ||
    readStoredInsights(insightStorageKey)

  const [insights, setInsights] = useState<Record<InsightType, string>>(
    cachedInsights?.insights || EMPTY_INSIGHTS
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(cachedInsights?.lastUpdated || null)
  const [errorMessage, setErrorMessage] = useState('')

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
  //
  // Today's totals, the weekly trend and the per-model defect rates are all
  // aggregates, so Postgres computes them (get_ai_insights_snapshot). This page
  // used to fetch every inspection row (~17k) and reduce them here.
  const { data: snapshot } = useQuery({
    queryKey: ['ai-snapshot', activeFactoryId],
    queryFn: () => analyticsService.getAIInsightsSnapshot(activeFactoryId || undefined),
  })

  // Only unresolved defects are ever shown, so only those are fetched.
  const { data: unresolvedDefects = [] } = useQuery({
    queryKey: ['ai-unresolved-defects', activeFactoryId],
    queryFn: () =>
      inspectionService.getUnresolvedDefects(activeFactoryId || undefined),
  })

  // Fetch defect types for name mapping
  const { data: defectTypesData = [] } = useQuery({
    queryKey: ['ai-defect-types-list'],
    queryFn: getDefectTypes,
  })

  const { data: defectTypeDistribution = [] } = useQuery({
    queryKey: ['ai-defect-types', filters, activeFactoryId],
    queryFn: () => analyticsService.getDefectTypeDistribution(filters, activeFactoryId || undefined),
  })

  const { data: machinePerformance = [] } = useQuery({
    queryKey: ['ai-machine-performance', filters, activeFactoryId],
    queryFn: () => analyticsService.getMachinePerformance(filters, activeFactoryId || undefined),
  })

  // AI용 분석 데이터 구성
  //
  // Everything below is now assembled from pre-aggregated data: the snapshot
  // (today / weekly / per-model), the two analytics RPCs, and the unresolved
  // defect list. No raw inspection rows reach this component.
  const analyticsData = useMemo<AnalyticsDataForAI | null>(() => {
    if (!snapshot) return null

    const todayInspectionQty = snapshot.today.inspection_qty
    const todayDefectQty = snapshot.today.defect_qty
    const todayPassQty = todayInspectionQty - todayDefectQty

    const weeklyTrend = snapshot.weekly_trend.map((day) => ({
      date: day.date,
      total: day.inspection_qty,
      passed: day.inspection_qty - day.defect_qty,
      failed: day.defect_qty,
      passRate:
        day.inspection_qty > 0
          ? ((day.inspection_qty - day.defect_qty) / day.inspection_qty) * 100
          : 0,
    }))

    // 불량 유형 분포
    const totalDefects = defectTypeDistribution.reduce((sum, d) => sum + d.count, 0)
    const defectTypeDist = defectTypeDistribution.map((d) => ({
      type: d.defectType,
      count: d.count,
      percentage: totalDefects > 0 ? (d.count / totalDefects) * 100 : 0,
    }))

    // 설비별 성과
    const machinePerf = machinePerformance.map((m) => ({
      machineId: m.machineName,
      machineName: m.machineName,
      total: m.totalInspections,
      passRate: 100 - m.defectRate,
    }))

    // 모델별 불량률 (수량 기반)
    const modelDefectRates = snapshot.model_defect_rates.map((m) => ({
      modelId: m.model_id ?? m.model_code,
      modelCode: m.model_code,
      total: m.inspection_qty,
      defectRate:
        m.inspection_qty > 0 ? (m.defect_qty / m.inspection_qty) * 100 : 0,
    }))

    // 미해결 불량 (불량 유형 이름으로 변환)
    const defectTypeMap = new Map<string, string>()
    defectTypesData.forEach((dt) => {
      defectTypeMap.set(dt.id, dt.name)
    })

    const pendingDefects = unresolvedDefects.map((d) => ({
      id: d.id,
      type: defectTypeMap.get(d.defect_type) || d.defect_type,
      status: d.status,
      createdAt: d.created_at,
    }))

    return {
      todayInspections: {
        total: todayInspectionQty,
        passed: todayPassQty,
        failed: todayDefectQty,
        passRate:
          todayInspectionQty > 0 ? (todayPassQty / todayInspectionQty) * 100 : 0,
      },
      weeklyTrend,
      defectTypeDistribution: defectTypeDist,
      machinePerformance: machinePerf,
      modelDefectRates,
      pendingDefects,
    }
  }, [
    snapshot,
    unresolvedDefects,
    defectTypeDistribution,
    machinePerformance,
    defectTypesData,
  ])

  // 인사이트 생성
  const handleGenerateInsights = useCallback(async () => {
    if (!analyticsData) return

    setIsGenerating(true)
    setErrorMessage('')
    try {
      const results = await generateAllInsights(analyticsData, language)
      const generatedAt = new Date().toLocaleTimeString()
      const cachedResult = {
        insights: results,
        lastUpdated: generatedAt,
      }
      setInsights(results)
      setLastUpdated(generatedAt)
      queryClient.setQueryData<CachedInsights>(insightCacheKey, cachedResult)
      writeStoredInsights(insightStorageKey, cachedResult)
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      console.error('Failed to generate insights:', errMsg)
      setErrorMessage(`${t('aiInsights.generateError')} (${errMsg})`)
    } finally {
      setIsGenerating(false)
    }
  }, [analyticsData, insightCacheKey, insightStorageKey, language, queryClient, t])

  // Restore the last generated output for this factory/language without calling the LLM.
  useEffect(() => {
    const cached =
      queryClient.getQueryData<CachedInsights>(insightCacheKey) ||
      readStoredInsights(insightStorageKey)
    setInsights(cached?.insights || EMPTY_INSIGHTS)
    setLastUpdated(cached?.lastUpdated || null)
    setErrorMessage('')
  }, [insightCacheKey, insightStorageKey, queryClient])

  const hasGeneratedInsights = useMemo(
    () => Object.values(insights).some((content) => content.trim().length > 0),
    [insights]
  )

  const insightTypes: { type: InsightType; titleKey: string }[] = [
    { type: 'daily-summary', titleKey: 'aiInsights.dailySummary' },
    { type: 'key-issues', titleKey: 'aiInsights.keyIssues' },
    { type: 'performance', titleKey: 'aiInsights.performanceAnalysis' },
    { type: 'risk-alerts', titleKey: 'aiInsights.riskAlerts' },
  ]

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, md: 4 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'nowrap' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700} sx={{ mb: 0.5 }}>
            {t('aiInsights.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>
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

      {/* Error / No Data Messages */}
      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}
      {!analyticsData && !isGenerating && !errorMessage && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('aiInsights.noData')}
        </Alert>
      )}
      {analyticsData && !hasGeneratedInsights && !isGenerating && !errorMessage && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('aiInsights.manualRefreshHint')}
        </Alert>
      )}

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
                  isLoading={isGenerating && !hasGeneratedInsights}
                />
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* AI Chatbot */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ minHeight: 500 }}>
            <AIChatbot
              analyticsData={analyticsData}
              cacheScope={activeFactoryId || 'all'}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
