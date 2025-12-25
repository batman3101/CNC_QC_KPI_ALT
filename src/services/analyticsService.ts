import { supabase } from '@/lib/supabase'
import type {
  AnalyticsFilters,
  DefectRateTrend,
  ModelDefectDistribution,
  MachinePerformance,
  DefectTypeDistribution,
  KPISummary,
  HourlyDistribution,
  InspectorPerformance,
} from '@/types/analytics'

// Helper function to build date filter
function buildDateFilter(filters: AnalyticsFilters) {
  return {
    gte: filters.dateRange.from.toISOString(),
    lte: filters.dateRange.to.toISOString(),
  }
}

// 1. KPI Summary
export async function getKPISummary(
  filters: AnalyticsFilters
): Promise<KPISummary> {
  const dateFilter = buildDateFilter(filters)

  // Get total inspections
  let inspectionsQuery = supabase
    .from('inspections')
    .select('id, status, created_at', { count: 'exact' })
    .gte('created_at', dateFilter.gte)
    .lte('created_at', dateFilter.lte)

  if (filters.processId) {
    inspectionsQuery = inspectionsQuery.eq('process_id', filters.processId)
  }
  if (filters.modelId) {
    inspectionsQuery = inspectionsQuery.eq('model_id', filters.modelId)
  }

  const { data: inspections, count: totalInspections } =
    await inspectionsQuery

  // Count defects
  const defectCount =
    inspections?.filter((i: { status: string }) => i.status === 'fail').length || 0

  // Get unique inspectors
  const { data: inspectors } = await supabase
    .from('inspections')
    .select('user_id')
    .gte('created_at', dateFilter.gte)
    .lte('created_at', dateFilter.lte)

  const uniqueInspectors = new Set(
    inspectors?.map((i: { user_id: string }) => i.user_id).filter(Boolean)
  ).size

  // Calculate average inspection time (mock data for now)
  // TODO: Add actual inspection duration tracking
  const avgInspectionTime = 4.2

  const totalCount = totalInspections || 0
  const defects = defectCount || 0
  const defectRate = totalCount > 0 ? (defects / totalCount) * 100 : 0
  const fpy = 100 - defectRate

  // Calculate average resolution time (mock data for now)
  // TODO: Add actual defect resolution time tracking
  const avgResolutionTime = 2.5

  // Get top 3 inspectors by defect count found
  const inspectorDefects: Record<string, { name: string; count: number; defects: number }> = {}
  if (inspectors) {
    for (const inspector of inspectors as Array<{ user_id: string }>) {
      if (inspector.user_id) {
        if (!inspectorDefects[inspector.user_id]) {
          inspectorDefects[inspector.user_id] = { name: inspector.user_id, count: 0, defects: 0 }
        }
        inspectorDefects[inspector.user_id].count++
      }
    }
  }

  // Get defects by inspector from the filtered inspections
  if (inspections) {
    for (const inspection of inspections as Array<{ status: string; user_id?: string }>) {
      if (inspection.status === 'fail' && inspection.user_id && inspectorDefects[inspection.user_id]) {
        inspectorDefects[inspection.user_id].defects++
      }
    }
  }

  const topInspectors = Object.entries(inspectorDefects)
    .sort((a, b) => b[1].defects - a[1].defects)
    .slice(0, 3)
    .map(([_id, stats], index) => ({
      rank: index + 1,
      name: stats.name,
      inspectionCount: stats.count,
      defectCount: stats.defects,
    }))

  return {
    totalInspections: totalCount,
    totalDefects: defects,
    overallDefectRate: defectRate,
    fpy,
    avgInspectionTime,
    avgResolutionTime,
    activeInspectors: uniqueInspectors,
    topInspectors,
  }
}

// 2. Defect Rate Trend (Daily)
export async function getDefectRateTrend(
  filters: AnalyticsFilters
): Promise<DefectRateTrend[]> {
  const dateFilter = buildDateFilter(filters)

  let query = supabase
    .from('inspections')
    .select('created_at, status')
    .gte('created_at', dateFilter.gte)
    .lte('created_at', dateFilter.lte)
    .order('created_at', { ascending: true })

  if (filters.processId) {
    query = query.eq('process_id', filters.processId)
  }
  if (filters.modelId) {
    query = query.eq('model_id', filters.modelId)
  }

  const { data: inspections } = await query

  if (!inspections) return []

  // Group by date
  const groupedByDate = inspections.reduce((acc, inspection: { created_at: string; status: string }) => {
    const date = new Date(inspection.created_at).toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = { total: 0, defects: 0 }
    }
    acc[date].total++
    if (inspection.status === 'fail') {
      acc[date].defects++
    }
    return acc
  }, {} as Record<string, { total: number; defects: number }>)

  return Object.entries(groupedByDate).map(([date, stats]) => {
    const defectRate = (stats.defects / stats.total) * 100
    return {
      date,
      totalInspections: stats.total,
      defectCount: stats.defects,
      defectRate,
      passRate: 100 - defectRate,
    }
  })
}

// 3. Model Defect Distribution
export async function getModelDefectDistribution(
  filters: AnalyticsFilters
): Promise<ModelDefectDistribution[]> {
  const dateFilter = buildDateFilter(filters)

  const { data: inspections } = await supabase
    .from('inspections')
    .select(
      `
      status,
      model_id,
      product_models (
        name,
        code
      )
    `
    )
    .gte('created_at', dateFilter.gte)
    .lte('created_at', dateFilter.lte)

  if (!inspections) return []

  // Group by model
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupedByModel = inspections.reduce((acc, inspection: any) => {
    const modelId = inspection.model_id
    const modelName = inspection.product_models?.name || 'Unknown'
    const modelCode = inspection.product_models?.code || 'N/A'

    if (!acc[modelId]) {
      acc[modelId] = {
        modelName,
        modelCode,
        total: 0,
        defects: 0,
      }
    }
    acc[modelId].total++
    if (inspection.status === 'fail') {
      acc[modelId].defects++
    }
    return acc
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as Record<string, any>)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.values(groupedByModel).map((stats: any) => ({
    modelName: stats.modelName,
    modelCode: stats.modelCode,
    totalInspections: stats.total,
    defectCount: stats.defects,
    defectRate: (stats.defects / stats.total) * 100,
  }))
}

// 4. Machine Performance
export async function getMachinePerformance(
  filters: AnalyticsFilters
): Promise<MachinePerformance[]> {
  const dateFilter = buildDateFilter(filters)

  const { data: inspections } = await supabase
    .from('inspections')
    .select(
      `
      status,
      machine_id,
      machines (
        name,
        model
      )
    `
    )
    .gte('created_at', dateFilter.gte)
    .lte('created_at', dateFilter.lte)

  if (!inspections) return []

  // Group by machine
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupedByMachine = inspections.reduce((acc, inspection: any) => {
    const machineId = inspection.machine_id
    const machineName = inspection.machines?.name || 'Unknown'
    const machineModel = inspection.machines?.model || 'N/A'

    if (!acc[machineId]) {
      acc[machineId] = {
        machineName,
        machineModel,
        total: 0,
        defects: 0,
      }
    }
    acc[machineId].total++
    if (inspection.status === 'fail') {
      acc[machineId].defects++
    }
    return acc
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as Record<string, any>)

  return Object.values(groupedByMachine)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((stats: any) => ({
      machineName: stats.machineName,
      machineModel: stats.machineModel,
      totalInspections: stats.total,
      defectCount: stats.defects,
      defectRate: (stats.defects / stats.total) * 100,
      avgInspectionTime: 4.2, // Mock data
    }))
    .sort((a, b) => b.defectCount - a.defectCount) // Sort by defect count (Pareto)
}

// 5. Defect Type Distribution
export async function getDefectTypeDistribution(
  filters: AnalyticsFilters
): Promise<DefectTypeDistribution[]> {
  const dateFilter = buildDateFilter(filters)

  const { data: defects } = await supabase
    .from('defects')
    .select(
      `
      defect_type,
      inspections!inner (
        created_at
      )
    `
    )
    .gte('inspections.created_at', dateFilter.gte)
    .lte('inspections.created_at', dateFilter.lte)

  if (!defects) return []

  // Group by defect type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupedByType = defects.reduce((acc, defect: any) => {
    const type = defect.defect_type
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const total = Object.values(groupedByType).reduce((sum, count) => sum + count, 0)

  return Object.entries(groupedByType).map(([type, count]) => ({
    defectType: type,
    count,
    percentage: (count / total) * 100,
  }))
}

// 6. Hourly Distribution
export async function getHourlyDistribution(
  filters: AnalyticsFilters
): Promise<HourlyDistribution[]> {
  const dateFilter = buildDateFilter(filters)

  const { data: inspections } = await supabase
    .from('inspections')
    .select('created_at, status')
    .gte('created_at', dateFilter.gte)
    .lte('created_at', dateFilter.lte)

  if (!inspections) return []

  // Group by hour
  const groupedByHour = inspections.reduce((acc, inspection: { created_at: string; status: string }) => {
    const hour = new Date(inspection.created_at).getHours()
    if (!acc[hour]) {
      acc[hour] = { inspections: 0, defects: 0 }
    }
    acc[hour].inspections++
    if (inspection.status === 'fail') {
      acc[hour].defects++
    }
    return acc
  }, {} as Record<number, { inspections: number; defects: number }>)

  // Fill in missing hours with 0
  const result: HourlyDistribution[] = []
  for (let hour = 0; hour < 24; hour++) {
    result.push({
      hour,
      inspectionCount: groupedByHour[hour]?.inspections || 0,
      defectCount: groupedByHour[hour]?.defects || 0,
    })
  }

  return result
}

// 7. Inspector Performance
export async function getInspectorPerformance(
  filters: AnalyticsFilters
): Promise<InspectorPerformance[]> {
  const dateFilter = buildDateFilter(filters)

  const { data: inspections } = await supabase
    .from('inspections')
    .select(
      `
      status,
      user_id,
      users (
        name
      )
    `
    )
    .gte('created_at', dateFilter.gte)
    .lte('created_at', dateFilter.lte)

  if (!inspections) return []

  // Group by inspector
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupedByInspector = inspections.reduce((acc, inspection: any) => {
    const userId = inspection.user_id
    const userName = inspection.users?.name || 'Unknown'

    if (!acc[userId]) {
      acc[userId] = {
        userName,
        total: 0,
        defects: 0,
      }
    }
    acc[userId].total++
    if (inspection.status === 'fail') {
      acc[userId].defects++
    }
    return acc
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as Record<string, any>)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.values(groupedByInspector).map((stats: any) => ({
    inspectorName: stats.userName,
    totalInspections: stats.total,
    defectCount: stats.defects,
    defectRate: (stats.defects / stats.total) * 100,
    avgInspectionTime: 4.2, // Mock data
  }))
}
