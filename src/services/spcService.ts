/**
 * SPC Service - API 함수
 * Statistical Process Control service layer
 */

import { supabase } from '@/lib/supabase'
import { paginatedFetch } from '@/lib/supabasePagination'
import { getBusinessDateRangeFilter } from '@/lib/dateUtils'
import {
  calculatePBar,
  calculatePChartPointLimits,
  standardizePChartValue,
  summarizePChartLimits,
  detectPChartViolations,
} from '@/lib/spc-calculations'
import type {
  SPCAlert,
  SPCAlertFilters,
  SPCAlertResolution,
  PChartDataPoint,
  PChartLimits,
  SPCFilters,
  DefectPointParetoRow,
} from '@/types/spc'

// ============================================
// 1. p-chart 데이터 (불량률 관리도)
// ============================================

/**
 * p-chart용 데이터 조회 (inspections 테이블 기반)
 */
export async function getPChartData(
  filters: SPCFilters,
  factoryId?: string
): Promise<{
  points: PChartDataPoint[]
  limits: PChartLimits
  statistics: { count: number; avgDefectRate: number; totalDefects: number; totalInspections: number }
}> {
  const dateFilter = getBusinessDateRangeFilter(filters.date_from, filters.date_to)

  // Grouped by business day in Postgres. The previous version selected the raw
  // inspection rows with no range() and no limit, so PostgREST silently capped
  // it at 1000 rows - a 30-day window on ALT is ~4,200 - and the control chart
  // was drawn from a truncated sample.
  const { data, error } = await supabase.rpc('get_analytics_defect_rate_trend', {
    p_from: dateFilter.gte,
    p_to: dateFilter.lte,
    p_process: filters.process_id ?? null,
    p_model: filters.model_id ?? null,
    p_factory: factoryId ?? null,
  })

  if (error) throw error

  const rows = (data ?? []) as Array<{
    business_day: string
    inspection_qty: number
    defect_qty: number
  }>

  if (rows.length === 0) {
    return {
      points: [],
      limits: { p_bar: 0, centerLine: 0, ucl_min: 0, ucl_max: 0, lcl_min: 0, lcl_max: 0 },
      statistics: { count: 0, avgDefectRate: 0, totalDefects: 0, totalInspections: 0 },
    }
  }

  const dailyData: Record<string, { defect_count: number; sample_size: number }> = {}
  for (const row of rows) {
    dailyData[row.business_day] = {
      defect_count: row.defect_qty,
      sample_size: row.inspection_qty,
    }
  }

  const samples = Object.values(dailyData)
  const pBar = calculatePBar(samples)

  // 관리한계는 점마다 다르다. 일별 검사 수량이 일정하지 않고, p-chart의 시그마는
  // 표본 크기의 함수이기 때문이다. 예전에는 평균 표본 크기로 한계를 한 번만
  // 계산해 모든 날에 같은 밴드를 씌웠다.
  const sortedDates = Object.keys(dailyData).sort()
  const points: PChartDataPoint[] = sortedDates.map((date, index) => {
    const { defect_count, sample_size } = dailyData[date]
    const defect_rate = sample_size > 0 ? defect_count / sample_size : 0

    const { ucl, lcl, sigma } = calculatePChartPointLimits(pBar, sample_size)
    const z = standardizePChartValue(defect_rate, pBar, sigma)

    const is_violation = defect_rate > ucl || defect_rate < lcl
    let violation_type: PChartDataPoint['violation_type'] = undefined
    if (defect_rate > ucl) violation_type = 'ucl_exceeded'
    else if (defect_rate < lcl) violation_type = 'lcl_exceeded'

    return {
      index,
      date,
      defect_rate,
      defect_count,
      sample_size,
      ucl,
      lcl,
      sigma,
      z,
      is_violation,
      violation_type,
    }
  })

  const limits = summarizePChartLimits(
    pBar,
    points.map(p => ({ ucl: p.ucl, lcl: p.lcl, sigma: p.sigma }))
  )

  // 통계
  const totalDefects = samples.reduce((sum, d) => sum + d.defect_count, 0)
  const totalInspections = samples.reduce((sum, d) => sum + d.sample_size, 0)
  const avgDefectRate = totalInspections > 0 ? (totalDefects / totalInspections) * 100 : 0

  return {
    points,
    limits,
    statistics: {
      count: points.length,
      avgDefectRate,
      totalDefects,
      totalInspections,
    },
  }
}

// ============================================
// 3. SPC 알림
// ============================================

/**
 * p-chart 위반을 감지하고 spc_alerts 테이블에 upsert
 * 모델별로 p-chart 분석 → Nelson Rule 위반 감지 → DB 저장
 *
 * @returns the number of alerts written. SPCPage drives this through TanStack
 *   Query, whose queryFn may never resolve to undefined - the cache cannot tell
 *   "resolved with nothing" apart from "not loaded yet" - so every exit path
 *   below returns a count rather than falling out as void.
 */
export async function generateAndUpsertAlerts(factoryId?: string): Promise<number> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // 전체 모델 목록 조회
  const { data: models } = await supabase
    .from('product_models')
    .select('id, name')

  if (!models || models.length === 0) return 0

  // 모델별 p-chart 분석 및 위반 감지 (병렬 실행)
  type AlertRow = {
    model_id: string
    alert_type: string
    rule_code: string
    rule_description: string
    measured_value: number | null
    control_limit_value: number | null
    severity: string
    factory_id: string | null
    created_at: string
  }

  const perModelResults = await Promise.all(
    models.map(async (model): Promise<AlertRow[]> => {
      try {
        const { points, limits } = await getPChartData(
          { model_id: model.id, date_from: thirtyDaysAgo, date_to: new Date() },
          factoryId
        )

        if (points.length < 7) return []

        // 각 점은 자기 표본 크기에서 나온 한계를 가지고 있다. 예전에는 평균
        // 표본 크기로 만든 단일 한계를 모든 점에 씌워, 검사량이 많은 날의 진짜
        // 이상은 놓치고 적은 날에는 없는 이상을 만들어냈다.
        const violations = detectPChartViolations(points)

        return violations.map(v => {
          const point = points[v.index]
          return {
            model_id: model.id,
            alert_type: v.type,
            rule_code: v.rule_code || 'R1',
            rule_description: v.description,
            measured_value: v.point_value,
            control_limit_value: v.type === 'ucl_exceeded' ? (point?.ucl ?? limits.ucl_max)
              : v.type === 'lcl_exceeded' ? (point?.lcl ?? limits.lcl_min) : limits.p_bar,
            severity: v.severity,
            factory_id: factoryId || null,
            created_at: point?.date
              ? new Date(point.date).toISOString()
              : new Date().toISOString(),
          }
        })
      } catch {
        return []
      }
    })
  )

  const newAlerts = perModelResults.flat()
  if (newAlerts.length === 0) return 0

  // 기존 open 알림 정리 후 새 알림 삽입 (트랜잭션 보호)
  try {
    // Scope the delete to the factory this run regenerates. Without it an admin
    // - who can see every factory - wiped every other factory's open alerts and
    // replaced them with only this factory's, and the others were never rebuilt.
    let deleteQuery = supabase
      .from('spc_alerts')
      .delete()
      .eq('status', 'open')
      .gte('created_at', thirtyDaysAgo.toISOString())

    deleteQuery = factoryId
      ? deleteQuery.eq('factory_id', factoryId)
      : deleteQuery.is('factory_id', null)

    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      console.error('[SPC] Failed to delete old alerts:', deleteError)
      return 0
    }

    const { error: insertError } = await supabase
      .from('spc_alerts')
      .insert(newAlerts)

    if (insertError) {
      console.error('[SPC] Failed to insert new alerts:', insertError)
      return 0
    }

    return newAlerts.length
  } catch (err) {
    console.error('[SPC] Alert generation failed:', err)
    return 0
  }
}

/**
 * SPC 알림 목록 조회 (Supabase)
 */
export async function getSPCAlerts(
  filters?: SPCAlertFilters,
  factoryId?: string
): Promise<SPCAlert[]> {
  // Paged: the plain select had no range() and PostgREST caps at 1000 rows, so
  // past that point the list and the counts derived from it were silently short.
  const data = await paginatedFetch<Record<string, unknown>>((from, to) => {
    let query = supabase
      .from('spc_alerts')
      .select(`
        *,
        product_models!inner (name)
      `)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (factoryId) {
      query = query.eq('factory_id', factoryId)
    }
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }
    if (filters?.severity && filters.severity.length > 0) {
      query = query.in('severity', filters.severity)
    }
    if (filters?.model_id) {
      query = query.eq('model_id', filters.model_id)
    }

    return query
  }).catch((error: unknown) => {
    console.error('[SPC] Failed to fetch alerts:', error)
    return [] as Record<string, unknown>[]
  })

  return data.map((row: Record<string, unknown>) => {
    const models = row.product_models as { name: string } | null
    return {
      ...row,
      model_name: models?.name,
      product_models: undefined,
    } as unknown as SPCAlert
  })
}

/**
 * 미조치 알림 수 조회 (Supabase)
 */
export async function getOpenAlertsCount(
  factoryId?: string
): Promise<{ total: number; critical: number }> {
  // Counted in Postgres. This used to fetch the rows and read data.length, which
  // stops at PostgREST's 1000-row cap: past that the badge froze at 1000 and a
  // critical alert beyond row 1000 was invisible.
  const countOpen = async (critical: boolean): Promise<number> => {
    let query = supabase
      .from('spc_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')

    if (factoryId) query = query.eq('factory_id', factoryId)
    if (critical) query = query.eq('severity', 'critical')

    const { count, error } = await query
    if (error) {
      console.error('[SPC] Failed to count open alerts:', error)
      return 0
    }
    return count ?? 0
  }

  const [total, critical] = await Promise.all([countOpen(false), countOpen(true)])
  return { total, critical }
}

/**
 * 알림 상태 업데이트 (Supabase)
 */
export async function updateSPCAlertStatus(
  id: string,
  resolution: SPCAlertResolution
): Promise<SPCAlert> {
  const updateData: Record<string, unknown> = {
    status: resolution.status,
    resolution_note: resolution.resolution_note,
    root_cause: resolution.root_cause,
    corrective_action: resolution.corrective_action,
  }

  if (resolution.status === 'resolved') {
    updateData.resolved_at = new Date().toISOString()
  }
  if (resolution.status === 'acknowledged') {
    updateData.acknowledged_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('spc_alerts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as unknown as SPCAlert
}

// ============================================
// 4. 검사 항목 및 모델 조회
// ============================================

/**
 * 검사 항목 목록 조회
 */
// SPC-specific list helpers — thin wrappers over managementService so pagination,
// caching, and filters live in one place. Kept as re-exports for backward
// compatibility with existing SPCPage imports.
export { getInspectionItems, getProductModels } from './managementService'

import { getInspectionProcesses as _getInspectionProcesses } from './managementService'

/**
 * 검사 공정 목록 조회 (active only) — SPC는 활성 공정만 다루므로 필터링.
 */
export async function getInspectionProcesses() {
  const all = await _getInspectionProcesses()
  return all.filter(p => p.is_active)
}

// ============================================
// 불량 포인트 Pareto (불량 발생 포인트 집계)
// ============================================

/**
 * inspection_results(result='fail')를 item_id별로 집계 → 포인트별 불량 Pareto
 */
export async function getDefectPointPareto(
  filters: { model_id?: string; process_id?: string; date_from: Date; date_to: Date },
  factoryId?: string
): Promise<DefectPointParetoRow[]> {
  const dateFilter = getBusinessDateRangeFilter(filters.date_from, filters.date_to)

  // Counted per item in Postgres. The previous version selected raw failing rows
  // with no ORDER BY and no range(), so PostgREST returned an arbitrary 1000 of
  // them: the top defect point changed between refreshes and was wrong whenever
  // more than 1000 failing results existed in the window.
  const { data, error } = await supabase.rpc('get_defect_point_pareto', {
    p_from: dateFilter.gte,
    p_to: dateFilter.lte,
    p_model: filters.model_id ?? null,
    p_process: filters.process_id ?? null,
    p_factory: factoryId ?? null,
  })

  if (error) {
    console.error('[SPC] Failed to fetch defect-point pareto:', error)
    return []
  }

  const rows = (data ?? []) as Array<{
    item_id: string
    item_name: string
    defect_count: number
  }>

  return rows.map((row) => ({
    item_id: row.item_id,
    item_name: row.item_name,
    defect_count: row.defect_count,
  }))
}

// ============================================
// 8. 모델별 불량률 (inspections 집계, 조인 미사용)
// ============================================

export interface ModelDefectRate {
  model_id: string
  model_name: string
  model_code: string
  inspected: number
  defects: number
  defect_rate: number
}

export async function getModelDefectRates(
  filters: { process_id?: string; date_from: Date; date_to: Date },
  models: { id: string; name: string; code: string }[],
  factoryId?: string,
): Promise<ModelDefectRate[]> {
  const dateFilter = getBusinessDateRangeFilter(filters.date_from, filters.date_to)

  // Grouped by model in Postgres. Same truncation trap as the p-chart above:
  // the raw select had no limit and was capped at 1000 rows.
  const { data, error } = await supabase.rpc('get_analytics_model_distribution', {
    p_from: dateFilter.gte,
    p_to: dateFilter.lte,
    p_process: filters.process_id ?? null,
    p_model: null,
    p_factory: factoryId ?? null,
  })

  if (error) {
    console.error('[SPC] Failed to fetch model defect rates:', error)
    return []
  }

  const rows = (data ?? []) as Array<{
    model_id: string | null
    inspection_qty: number
    defect_qty: number
  }>

  const agg = new Map<string, { inspected: number; defects: number }>()
  for (const row of rows) {
    if (!row.model_id) continue
    agg.set(row.model_id, {
      inspected: row.inspection_qty,
      defects: row.defect_qty,
    })
  }

  return models
    .map((m) => {
      const a = agg.get(m.id) ?? { inspected: 0, defects: 0 }
      return {
        model_id: m.id,
        model_name: m.name,
        model_code: m.code,
        inspected: a.inspected,
        defects: a.defects,
        defect_rate: a.inspected > 0 ? (a.defects / a.inspected) * 100 : 0,
      }
    })
    .filter((m) => m.inspected > 0)
    .sort((a, b) => b.defect_rate - a.defect_rate)
}
