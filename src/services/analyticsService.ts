/**
 * Analytics Service
 *
 * Every figure on the analytics screens is a GROUP BY over inspections or
 * defects, so the grouping runs in Postgres (see the get_analytics_* RPCs) and
 * only the grouped rows cross the wire. These functions previously paged the
 * entire matching row set - up to ~17k inspections - into the browser and
 * reduced it in JavaScript.
 *
 * The RPCs are SECURITY INVOKER, so RLS still decides which rows a caller may
 * aggregate. Inspector names are resolved through getUserDirectory() rather
 * than joined in SQL: users_select hides other users from an inspector, so a
 * SQL join would blank out every name but their own.
 */

import { supabase } from '@/lib/supabase'
import { getUserDirectory } from '@/services/userDirectoryService'
import { getBusinessDateRangeFilter } from '@/lib/dateUtils'
import type {
  AnalyticsFilters,
  DefectRateTrend,
  ModelDefectDistribution,
  MachinePerformance,
  DefectTypeDistribution,
  KPISummary,
  HourlyDistribution,
  InspectorPerformance,
  InspectorDetailedKPI,
  InspectorDailyTrend,
  InspectorModelPerformance,
  InspectorProcessPerformance,
} from '@/types/analytics'

/** Arguments shared by every analytics RPC. */
interface AnalyticsRpcArgs {
  p_from: string
  p_to: string
  p_process: string | null
  p_model: string | null
  p_factory: string | null
}

// Business day logic (08:00 ~ next day 07:59, Vietnam) lives in both places:
// here for the range bounds, and in public.business_date() for the grouping.
function buildRpcArgs(filters: AnalyticsFilters, factoryId?: string): AnalyticsRpcArgs {
  const range = getBusinessDateRangeFilter(filters.dateRange.from, filters.dateRange.to)
  return {
    p_from: range.gte,
    p_to: range.lte,
    p_process: filters.processId ?? null,
    p_model: filters.modelId ?? null,
    p_factory: factoryId ?? null,
  }
}

function rate(defectQty: number, inspectionQty: number): number {
  return inspectionQty > 0 ? (defectQty / inspectionQty) * 100 : 0
}

interface InspectorTotalsRow {
  inspector_id: string
  inspection_qty: number
  defect_qty: number
}

async function fetchInspectorTotals(args: AnalyticsRpcArgs): Promise<InspectorTotalsRow[]> {
  const { data, error } = await supabase.rpc('get_analytics_inspector_totals', args)
  if (error) throw error
  return (data ?? []) as InspectorTotalsRow[]
}

async function buildInspectorNameMap(): Promise<Map<string, string>> {
  const directory = await getUserDirectory()
  return new Map(directory.map((user) => [user.id, user.name]))
}

// 1. KPI Summary
export async function getKPISummary(
  filters: AnalyticsFilters,
  factoryId?: string
): Promise<KPISummary> {
  const args = buildRpcArgs(filters, factoryId)

  const [summaryResult, inspectorTotals, nameMap] = await Promise.all([
    supabase.rpc('get_analytics_kpi_summary', args),
    fetchInspectorTotals(args),
    buildInspectorNameMap(),
  ])

  if (summaryResult.error) throw summaryResult.error

  const summary = (summaryResult.data ?? [])[0] as
    | {
        total_inspections: number
        inspection_qty: number
        defect_qty: number
        active_inspectors: number
      }
    | undefined

  const totalInspections = summary?.total_inspections ?? 0
  const totalInspectionQty = summary?.inspection_qty ?? 0
  const totalDefectQty = summary?.defect_qty ?? 0
  const defectRate = rate(totalDefectQty, totalInspectionQty)

  const topInspectors = [...inspectorTotals]
    .sort((a, b) => b.defect_qty - a.defect_qty)
    .slice(0, 3)
    .map((row, index) => ({
      rank: index + 1,
      name: nameMap.get(row.inspector_id) || row.inspector_id,
      inspectionCount: row.inspection_qty,
      defectCount: row.defect_qty,
    }))

  return {
    totalInspections,
    totalDefects: totalDefectQty,
    overallDefectRate: defectRate,
    fpy: 100 - defectRate,
    // TODO: Add actual inspection duration tracking
    avgInspectionTime: 4.2,
    // TODO: Add actual defect resolution time tracking
    avgResolutionTime: 2.5,
    activeInspectors: summary?.active_inspectors ?? 0,
    topInspectors,
  }
}

// 2. Defect Rate Trend (by business day)
export async function getDefectRateTrend(
  filters: AnalyticsFilters,
  factoryId?: string
): Promise<DefectRateTrend[]> {
  const { data, error } = await supabase.rpc(
    'get_analytics_defect_rate_trend',
    buildRpcArgs(filters, factoryId)
  )
  if (error) throw error

  const rows = (data ?? []) as Array<{
    business_day: string
    inspection_qty: number
    defect_qty: number
  }>

  return rows.map((row) => {
    const defectRate = rate(row.defect_qty, row.inspection_qty)
    return {
      date: row.business_day,
      totalInspections: row.inspection_qty,
      defectCount: row.defect_qty,
      defectRate,
      passRate: 100 - defectRate,
    }
  })
}

// 3. Model Defect Distribution
export async function getModelDefectDistribution(
  filters: AnalyticsFilters,
  factoryId?: string
): Promise<ModelDefectDistribution[]> {
  const { data, error } = await supabase.rpc(
    'get_analytics_model_distribution',
    buildRpcArgs(filters, factoryId)
  )
  if (error) throw error

  const rows = (data ?? []) as Array<{
    model_name: string
    model_code: string
    inspection_qty: number
    defect_qty: number
  }>

  return rows.map((row) => ({
    modelName: row.model_name,
    modelCode: row.model_code,
    totalInspections: row.inspection_qty,
    defectCount: row.defect_qty,
    defectRate: rate(row.defect_qty, row.inspection_qty),
  }))
}

// 4. Machine Performance (ordered by defect count, Pareto)
export async function getMachinePerformance(
  filters: AnalyticsFilters,
  factoryId?: string
): Promise<MachinePerformance[]> {
  const { data, error } = await supabase.rpc(
    'get_analytics_machine_performance',
    buildRpcArgs(filters, factoryId)
  )
  if (error) throw error

  const rows = (data ?? []) as Array<{
    machine_name: string
    machine_model: string
    inspection_qty: number
    defect_qty: number
  }>

  return rows.map((row) => ({
    machineName: row.machine_name,
    machineModel: row.machine_model,
    totalInspections: row.inspection_qty,
    defectCount: row.defect_qty,
    defectRate: rate(row.defect_qty, row.inspection_qty),
    avgInspectionTime: 4.2, // Mock data
  }))
}

// 5. Defect Type Distribution
export async function getDefectTypeDistribution(
  filters: AnalyticsFilters,
  factoryId?: string
): Promise<DefectTypeDistribution[]> {
  const { data, error } = await supabase.rpc(
    'get_analytics_defect_type_distribution',
    buildRpcArgs(filters, factoryId)
  )
  if (error) throw error

  const rows = (data ?? []) as Array<{ defect_type_name: string; defect_count: number }>
  const total = rows.reduce((sum, row) => sum + row.defect_count, 0)
  if (total === 0) return []

  return rows
    .map((row) => ({
      defectType: row.defect_type_name,
      count: row.defect_count,
      percentage: (row.defect_count / total) * 100,
    }))
    .sort(
      (a, b) =>
        b.percentage - a.percentage ||
        b.count - a.count ||
        a.defectType.localeCompare(b.defectType)
    )
}

// 6. Hourly Distribution
export async function getHourlyDistribution(
  filters: AnalyticsFilters,
  factoryId?: string
): Promise<HourlyDistribution[]> {
  const { data, error } = await supabase.rpc(
    'get_analytics_hourly_distribution',
    buildRpcArgs(filters, factoryId)
  )
  if (error) throw error

  const rows = (data ?? []) as Array<{
    hour_of_day: number
    inspection_qty: number
    defect_qty: number
  }>
  if (rows.length === 0) return []

  const byHour = new Map(rows.map((row) => [row.hour_of_day, row]))

  // Hours with no inspections are absent from the grouping; the chart expects
  // all 24 slots.
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    inspectionCount: byHour.get(hour)?.inspection_qty ?? 0,
    defectCount: byHour.get(hour)?.defect_qty ?? 0,
  }))
}

// 7. Inspector Performance
export async function getInspectorPerformance(
  filters: AnalyticsFilters,
  factoryId?: string
): Promise<InspectorPerformance[]> {
  const args = buildRpcArgs(filters, factoryId)
  const [totals, nameMap] = await Promise.all([
    fetchInspectorTotals(args),
    buildInspectorNameMap(),
  ])

  return totals.map((row) => ({
    inspectorName: nameMap.get(row.inspector_id) || 'Unknown',
    totalInspections: row.inspection_qty,
    defectCount: row.defect_qty,
    defectRate: rate(row.defect_qty, row.inspection_qty),
    avgInspectionTime: 4.2, // Mock data
  }))
}

// 7b. AI insights snapshot
//
// One round trip for everything the AI page derives from raw inspections:
// today's totals (business day), the last 7 Vietnam calendar days, and the
// all-time per-model defect rates.
export interface AIInsightsSnapshot {
  today: { inspection_qty: number; defect_qty: number }
  weekly_trend: Array<{
    date: string
    inspection_qty: number
    defect_qty: number
    records: number
  }>
  model_defect_rates: Array<{
    model_id: string | null
    model_code: string
    inspection_qty: number
    defect_qty: number
  }>
}

export async function getAIInsightsSnapshot(
  factoryId?: string
): Promise<AIInsightsSnapshot> {
  const { data, error } = await supabase.rpc('get_ai_insights_snapshot', {
    p_factory: factoryId ?? null,
  })
  if (error) throw error
  return data as unknown as AIInsightsSnapshot
}

// 8. Get Inspector List
export async function getInspectorList(): Promise<{ id: string; name: string }[]> {
  const rows = await getUserDirectory()
  return rows
    .filter((user) => user.role === 'inspector')
    .map((user) => ({ id: user.id, name: user.name }))
}

// 9. Get Inspector Detailed KPI
export async function getInspectorDetailedKPI(
  inspectorId: string,
  filters: AnalyticsFilters,
  factoryId?: string
): Promise<InspectorDetailedKPI | null> {
  const args = buildRpcArgs(filters, factoryId)
  const inspectorArgs = { p_inspector: inspectorId, ...args }

  const directory = await getUserDirectory()
  const inspector = directory.find((user) => user.id === inspectorId)
  if (!inspector) return null

  const [dailyResult, modelResult, processResult, teamTotals, activeDaysResult] =
    await Promise.all([
      supabase.rpc('get_inspector_daily_trend', inspectorArgs),
      supabase.rpc('get_inspector_model_performance', inspectorArgs),
      supabase.rpc('get_inspector_process_performance', inspectorArgs),
      fetchInspectorTotals(args),
      supabase.rpc('get_analytics_active_days', args),
    ])

  if (dailyResult.error) throw dailyResult.error
  if (modelResult.error) throw modelResult.error
  if (processResult.error) throw processResult.error
  if (activeDaysResult.error) throw activeDaysResult.error

  const dailyRows = (dailyResult.data ?? []) as Array<{
    business_day: string
    inspection_qty: number
    defect_qty: number
  }>
  const modelRows = (modelResult.data ?? []) as Array<{
    model_name: string
    model_code: string
    inspection_qty: number
    defect_qty: number
  }>
  const processRows = (processResult.data ?? []) as Array<{
    process_code: string
    process_name: string
    inspection_qty: number
    defect_qty: number
  }>

  const mine = teamTotals.find((row) => row.inspector_id === inspectorId)
  const totalInspectionQty = mine?.inspection_qty ?? 0
  const totalDefectQty = mine?.defect_qty ?? 0
  const defectRate = rate(totalDefectQty, totalInspectionQty)

  // Ranking: lowest defect rate first.
  const rankings = teamTotals
    .map((row) => ({
      inspectorId: row.inspector_id,
      defectRate: rate(row.defect_qty, row.inspection_qty),
    }))
    .sort((a, b) => a.defectRate - b.defectRate)

  const rank = rankings.findIndex((r) => r.inspectorId === inspectorId) + 1
  const totalInspectors = rankings.length

  const dailyTrend: InspectorDailyTrend[] = dailyRows.map((row) => ({
    date: row.business_day,
    inspectionCount: row.inspection_qty,
    defectCount: row.defect_qty,
    defectRate: rate(row.defect_qty, row.inspection_qty),
  }))

  const modelPerformance: InspectorModelPerformance[] = modelRows.map((row) => ({
    modelName: row.model_name,
    modelCode: row.model_code,
    inspectionCount: row.inspection_qty,
    defectCount: row.defect_qty,
    defectRate: rate(row.defect_qty, row.inspection_qty),
  }))

  const processPerformance: InspectorProcessPerformance[] = processRows.map((row) => ({
    processName: row.process_name,
    processCode: row.process_code,
    inspectionCount: row.inspection_qty,
    defectCount: row.defect_qty,
    defectRate: rate(row.defect_qty, row.inspection_qty),
  }))

  const teamTotalQty = teamTotals.reduce((sum, row) => sum + row.inspection_qty, 0)
  const teamDefectQty = teamTotals.reduce((sum, row) => sum + row.defect_qty, 0)
  const avgDefectRate = rate(teamDefectQty, teamTotalQty)

  const activeDays = (activeDaysResult.data as number | null) || 1
  const avgDailyInspections = teamTotalQty / activeDays / (totalInspectors || 1)
  const myDailyInspections = totalInspectionQty / activeDays

  return {
    inspectorId,
    inspectorName: inspector.name,
    totalInspections: totalInspectionQty,
    defectCount: totalDefectQty,
    defectRate,
    passRate: 100 - defectRate,
    avgInspectionTime: 4.2, // TODO: 실제 검사 시간 추적 추가
    rank,
    totalInspectors,
    dailyTrend,
    modelPerformance,
    processPerformance,
    teamComparison: {
      avgDefectRate,
      avgInspectionTime: 4.2,
      avgDailyInspections,
      defectRateDiff: defectRate - avgDefectRate,
      inspectionTimeDiff: 0,
      dailyInspectionsDiff: myDailyInspections - avgDailyInspections,
    },
  }
}
