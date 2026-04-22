import { supabase } from '@/lib/supabase'
import { paginatedFetch } from '@/lib/supabasePagination'
import {
  getBusinessDateRangeFilter,
  parseBusinessDate,
  getVietnamHour,
} from '@/lib/dateUtils'
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

// Helper function to build date filter using business day logic (08:00 ~ next day 07:59)
function buildDateFilter(filters: AnalyticsFilters) {
  return getBusinessDateRangeFilter(filters.dateRange.from, filters.dateRange.to)
}

// 1. KPI Summary
export async function getKPISummary(
  filters: AnalyticsFilters,
  factoryId?: string
): Promise<KPISummary> {
  const dateFilter = buildDateFilter(filters)

  // Get total inspections
  const inspections = await paginatedFetch<{
    id: string; status: string; created_at: string;
    user_id: string; inspection_quantity: number; defect_quantity: number
  }>((from, to) => {
    let q = supabase
      .from('inspections')
      .select('id, status, created_at, user_id, inspection_quantity, defect_quantity')
      .gte('created_at', dateFilter.gte)
      .lte('created_at', dateFilter.lte)
      .range(from, to)
    if (filters.processId) q = q.eq('inspection_process', filters.processId)
    if (filters.modelId) q = q.eq('model_id', filters.modelId)
    if (factoryId) q = q.eq('factory_id', factoryId)
    return q
  })
  const totalInspections = inspections.length

  // Calculate defect rate based on quantities (검사수량 대비 불량수량)
  const totalInspectionQty = inspections?.reduce(
    (sum: number, i: { inspection_quantity: number }) => sum + (i.inspection_quantity || 0), 0
  ) || 0
  const totalDefectQty = inspections?.reduce(
    (sum: number, i: { defect_quantity: number }) => sum + (i.defect_quantity || 0), 0
  ) || 0
  // Get unique inspectors from already fetched inspections
  const uniqueInspectors = new Set(
    inspections?.map((i: { user_id: string }) => i.user_id).filter(Boolean)
  ).size

  // Calculate average inspection time (mock data for now)
  // TODO: Add actual inspection duration tracking
  const avgInspectionTime = 4.2

  const totalCount = totalInspections || 0
  // Defect rate = SUM(defect_quantity) / SUM(inspection_quantity) * 100
  const defectRate = totalInspectionQty > 0 ? (totalDefectQty / totalInspectionQty) * 100 : 0
  const fpy = 100 - defectRate

  // Calculate average resolution time (mock data for now)
  // TODO: Add actual defect resolution time tracking
  const avgResolutionTime = 2.5

  // Get top 3 inspectors by defect quantity found
  const inspectorDefects: Record<string, { name: string; inspectionQty: number; defectQty: number }> = {}
  if (inspections) {
    const userIds = [...new Set(inspections.map((i: { user_id: string }) => i.user_id).filter(Boolean))]
    const { data: userProfiles } = await supabase
      .from('users')
      .select('id, name')
      .in('id', userIds)
    const userNameMap = new Map(userProfiles?.map((u: { id: string; name: string }) => [u.id, u.name]) || [])

    for (const inspection of inspections as Array<{ user_id: string; inspection_quantity: number; defect_quantity: number }>) {
      if (inspection.user_id) {
        if (!inspectorDefects[inspection.user_id]) {
          inspectorDefects[inspection.user_id] = {
            name: userNameMap.get(inspection.user_id) || inspection.user_id,
            inspectionQty: 0,
            defectQty: 0,
          }
        }
        inspectorDefects[inspection.user_id].inspectionQty += (inspection.inspection_quantity || 0)
        inspectorDefects[inspection.user_id].defectQty += (inspection.defect_quantity || 0)
      }
    }
  }

  const topInspectors = Object.entries(inspectorDefects)
    .sort((a, b) => b[1].defectQty - a[1].defectQty)
    .slice(0, 3)
    .map(([, stats], index) => ({
      rank: index + 1,
      name: stats.name,
      inspectionCount: stats.inspectionQty,
      defectCount: stats.defectQty,
    }))

  return {
    totalInspections: totalCount,
    totalDefects: totalDefectQty,
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
  filters: AnalyticsFilters,
  factoryId?: string
): Promise<DefectRateTrend[]> {
  const dateFilter = buildDateFilter(filters)

  const inspections = await paginatedFetch<{
    created_at: string; status: string; inspection_quantity: number; defect_quantity: number
  }>((from, to) => {
    let q = supabase
      .from('inspections')
      .select('created_at, status, inspection_quantity, defect_quantity')
      .gte('created_at', dateFilter.gte)
      .lte('created_at', dateFilter.lte)
      .order('created_at', { ascending: true })
      .range(from, to)
    if (filters.processId) q = q.eq('inspection_process', filters.processId)
    if (filters.modelId) q = q.eq('model_id', filters.modelId)
    if (factoryId) q = q.eq('factory_id', factoryId)
    return q
  })

  if (inspections.length === 0) return []

  // Group by business date (08:00 ~ next day 07:59), using quantities
  const groupedByDate = inspections.reduce((acc, inspection: { created_at: string; status: string; inspection_quantity: number; defect_quantity: number }) => {
    const date = parseBusinessDate(inspection.created_at)
    if (!acc[date]) {
      acc[date] = { totalQty: 0, defectQty: 0 }
    }
    acc[date].totalQty += (inspection.inspection_quantity || 0)
    acc[date].defectQty += (inspection.defect_quantity || 0)
    return acc
  }, {} as Record<string, { totalQty: number; defectQty: number }>)

  return Object.entries(groupedByDate).map(([date, stats]) => {
    const defectRate = stats.totalQty > 0 ? (stats.defectQty / stats.totalQty) * 100 : 0
    return {
      date,
      totalInspections: stats.totalQty,
      defectCount: stats.defectQty,
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
  const dateFilter = buildDateFilter(filters)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inspections = await paginatedFetch<any>((from, to) => {
    let q = supabase
      .from('inspections')
      .select(`
        status,
        model_id,
        inspection_quantity,
        defect_quantity,
        product_models (
          name,
          code
        )
      `)
      .gte('created_at', dateFilter.gte)
      .lte('created_at', dateFilter.lte)
      .range(from, to)
    if (filters.processId) q = q.eq('inspection_process', filters.processId)
    if (filters.modelId) q = q.eq('model_id', filters.modelId)
    if (factoryId) q = q.eq('factory_id', factoryId)
    return q
  })

  if (inspections.length === 0) return []

  // Group by model using quantities
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupedByModel = inspections.reduce((acc, inspection: any) => {
    const modelId = inspection.model_id
    const modelName = inspection.product_models?.name || 'Unknown'
    const modelCode = inspection.product_models?.code || 'N/A'

    if (!acc[modelId]) {
      acc[modelId] = {
        modelName,
        modelCode,
        totalQty: 0,
        defectQty: 0,
      }
    }
    acc[modelId].totalQty += (inspection.inspection_quantity || 0)
    acc[modelId].defectQty += (inspection.defect_quantity || 0)
    return acc
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as Record<string, any>)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.values(groupedByModel).map((stats: any) => ({
    modelName: stats.modelName,
    modelCode: stats.modelCode,
    totalInspections: stats.totalQty,
    defectCount: stats.defectQty,
    defectRate: stats.totalQty > 0 ? (stats.defectQty / stats.totalQty) * 100 : 0,
  }))
}

// 4. Machine Performance
export async function getMachinePerformance(
  filters: AnalyticsFilters,
  factoryId?: string
): Promise<MachinePerformance[]> {
  const dateFilter = buildDateFilter(filters)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inspections = await paginatedFetch<any>((from, to) => {
    let q = supabase
      .from('inspections')
      .select(`
        status,
        machine_id,
        inspection_quantity,
        defect_quantity,
        machines (
          name,
          model
        )
      `)
      .gte('created_at', dateFilter.gte)
      .lte('created_at', dateFilter.lte)
      .range(from, to)
    if (filters.processId) q = q.eq('inspection_process', filters.processId)
    if (filters.modelId) q = q.eq('model_id', filters.modelId)
    if (factoryId) q = q.eq('factory_id', factoryId)
    return q
  })

  if (inspections.length === 0) return []

  // Group by machine using quantities
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupedByMachine = inspections.reduce((acc, inspection: any) => {
    const machineId = inspection.machine_id
    const machineName = inspection.machines?.name || 'Unknown'
    const machineModel = inspection.machines?.model || 'N/A'

    if (!acc[machineId]) {
      acc[machineId] = {
        machineName,
        machineModel,
        totalQty: 0,
        defectQty: 0,
      }
    }
    acc[machineId].totalQty += (inspection.inspection_quantity || 0)
    acc[machineId].defectQty += (inspection.defect_quantity || 0)
    return acc
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as Record<string, any>)

  return Object.values(groupedByMachine)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((stats: any) => ({
      machineName: stats.machineName,
      machineModel: stats.machineModel,
      totalInspections: stats.totalQty,
      defectCount: stats.defectQty,
      defectRate: stats.totalQty > 0 ? (stats.defectQty / stats.totalQty) * 100 : 0,
      avgInspectionTime: 4.2, // Mock data
    }))
    .sort((a, b) => b.defectCount - a.defectCount) // Sort by defect count (Pareto)
}

// 5. Defect Type Distribution
export async function getDefectTypeDistribution(
  filters: AnalyticsFilters,
  factoryId?: string
): Promise<DefectTypeDistribution[]> {
  const dateFilter = buildDateFilter(filters)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defects = await paginatedFetch<any>((from, to) => {
    let q = supabase
      .from('defects')
      .select(`
        defect_type,
        inspections!inner (
          created_at
        )
      `)
      .gte('inspections.created_at', dateFilter.gte)
      .lte('inspections.created_at', dateFilter.lte)
      .range(from, to)
    if (filters.processId) q = q.eq('inspections.inspection_process', filters.processId)
    if (filters.modelId) q = q.eq('inspections.model_id', filters.modelId)
    if (factoryId) q = q.eq('factory_id', factoryId)
    return q
  })

  if (defects.length === 0) return []

  // Fetch defect types for name mapping (paginated to bypass 1000-row cap)
  const defectTypesData = await paginatedFetch<{ id: string; name: string }>((from, to) =>
    supabase.from('defect_types').select('id, name').range(from, to)
  )
  const defectTypeMap = new Map<string, string>(defectTypesData.map(dt => [dt.id, dt.name]))

  // Group by defect type (using name from defect_types table)
  const groupedByType: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defects.forEach((defect: any) => {
    const typeName = defectTypeMap.get(defect.defect_type) || defect.defect_type
    groupedByType[typeName] = (groupedByType[typeName] || 0) + 1
  })

  const total = Object.values(groupedByType).reduce((sum, count) => sum + count, 0)

  return Object.entries(groupedByType).map(([type, count]) => ({
    defectType: type,
    count,
    percentage: (count / total) * 100,
  }))
}

// 6. Hourly Distribution
export async function getHourlyDistribution(
  filters: AnalyticsFilters,
  factoryId?: string
): Promise<HourlyDistribution[]> {
  const dateFilter = buildDateFilter(filters)

  const inspections = await paginatedFetch<{
    created_at: string; status: string; inspection_quantity: number; defect_quantity: number
  }>((from, to) => {
    let q = supabase
      .from('inspections')
      .select('created_at, status, inspection_quantity, defect_quantity')
      .gte('created_at', dateFilter.gte)
      .lte('created_at', dateFilter.lte)
      .range(from, to)
    if (filters.processId) q = q.eq('inspection_process', filters.processId)
    if (filters.modelId) q = q.eq('model_id', filters.modelId)
    if (factoryId) q = q.eq('factory_id', factoryId)
    return q
  })

  if (inspections.length === 0) return []

  // Group by hour (Vietnam timezone) using quantities
  const groupedByHour = inspections.reduce((acc, inspection: { created_at: string; status: string; inspection_quantity: number; defect_quantity: number }) => {
    const hour = getVietnamHour(inspection.created_at)
    if (!acc[hour]) {
      acc[hour] = { inspectionQty: 0, defectQty: 0 }
    }
    acc[hour].inspectionQty += (inspection.inspection_quantity || 0)
    acc[hour].defectQty += (inspection.defect_quantity || 0)
    return acc
  }, {} as Record<number, { inspectionQty: number; defectQty: number }>)

  // Fill in missing hours with 0
  const result: HourlyDistribution[] = []
  for (let hour = 0; hour < 24; hour++) {
    result.push({
      hour,
      inspectionCount: groupedByHour[hour]?.inspectionQty || 0,
      defectCount: groupedByHour[hour]?.defectQty || 0,
    })
  }

  return result
}

// 7. Inspector Performance
export async function getInspectorPerformance(
  filters: AnalyticsFilters,
  factoryId?: string
): Promise<InspectorPerformance[]> {
  const dateFilter = buildDateFilter(filters)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inspections = await paginatedFetch<any>((from, to) => {
    let q = supabase
      .from('inspections')
      .select(`
        status,
        user_id,
        inspection_quantity,
        defect_quantity,
        users (
          name
        )
      `)
      .gte('created_at', dateFilter.gte)
      .lte('created_at', dateFilter.lte)
      .range(from, to)
    if (filters.processId) q = q.eq('inspection_process', filters.processId)
    if (filters.modelId) q = q.eq('model_id', filters.modelId)
    if (factoryId) q = q.eq('factory_id', factoryId)
    return q
  })

  if (inspections.length === 0) return []

  // Group by inspector using quantities
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupedByInspector = inspections.reduce((acc, inspection: any) => {
    const userId = inspection.user_id
    const userName = inspection.users?.name || 'Unknown'

    if (!acc[userId]) {
      acc[userId] = {
        userName,
        totalQty: 0,
        defectQty: 0,
      }
    }
    acc[userId].totalQty += (inspection.inspection_quantity || 0)
    acc[userId].defectQty += (inspection.defect_quantity || 0)
    return acc
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as Record<string, any>)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.values(groupedByInspector).map((stats: any) => ({
    inspectorName: stats.userName,
    totalInspections: stats.totalQty,
    defectCount: stats.defectQty,
    defectRate: stats.totalQty > 0 ? (stats.defectQty / stats.totalQty) * 100 : 0,
    avgInspectionTime: 4.2, // Mock data
  }))
}

// 8. Get Inspector List
export async function getInspectorList(): Promise<{ id: string; name: string }[]> {
  const rows = await paginatedFetch<{ id: string; name: string; role: string }>((from, to) =>
    supabase
      .from('users')
      .select('id, name, role')
      .eq('role', 'inspector')
      .order('name')
      .range(from, to)
  )
  return rows.map(user => ({ id: user.id, name: user.name }))
}

// 9. Get Inspector Detailed KPI
export async function getInspectorDetailedKPI(
  inspectorId: string,
  filters: AnalyticsFilters,
  factoryId?: string
): Promise<InspectorDetailedKPI | null> {
  const dateFilter = buildDateFilter(filters)

  // Get inspector info
  const { data: inspector, error: inspectorError } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', inspectorId)
    .single()

  if (inspectorError || !inspector) return null

  // Fetch process code-to-name mapping (paginated to bypass 1000-row cap)
  const processesData = await paginatedFetch<{ code: string; name: string }>((from, to) =>
    supabase.from('inspection_processes').select('code, name').range(from, to)
  )
  const processNameMap = new Map<string, string>(processesData.map(p => [p.code, p.name]))

  // Get all inspections for this inspector in the date range
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myInspections = await paginatedFetch<any>((from, to) => {
    let q = supabase
      .from('inspections')
      .select(`
        id, status, created_at, model_id, inspection_process, inspection_quantity, defect_quantity,
        product_models (name, code)
      `)
      .eq('user_id', inspectorId)
      .gte('created_at', dateFilter.gte)
      .lte('created_at', dateFilter.lte)
      .range(from, to)
    if (filters.processId) q = q.eq('inspection_process', filters.processId)
    if (filters.modelId) q = q.eq('model_id', filters.modelId)
    if (factoryId) q = q.eq('factory_id', factoryId)
    return q
  })

  // Get all team inspections for comparison
  const allTeamInspections = await paginatedFetch<{
    user_id: string; status: string; created_at: string;
    inspection_quantity: number; defect_quantity: number
  }>((from, to) => {
    let q = supabase
      .from('inspections')
      .select('user_id, status, created_at, inspection_quantity, defect_quantity')
      .gte('created_at', dateFilter.gte)
      .lte('created_at', dateFilter.lte)
      .range(from, to)
    if (filters.processId) q = q.eq('inspection_process', filters.processId)
    if (filters.modelId) q = q.eq('model_id', filters.modelId)
    if (factoryId) q = q.eq('factory_id', factoryId)
    return q
  })

  // Calculate basic stats using quantities
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalInspectionQty = myInspections.reduce((sum: number, i: any) => sum + (i.inspection_quantity || 0), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalDefectQty = myInspections.reduce((sum: number, i: any) => sum + (i.defect_quantity || 0), 0)
  const totalInspections = totalInspectionQty
  const defectCount = totalDefectQty
  const defectRate = totalInspectionQty > 0 ? (totalDefectQty / totalInspectionQty) * 100 : 0
  const passRate = 100 - defectRate

  // Calculate ranking using quantities
  const inspectorStats = new Map<string, { totalQty: number; defectQty: number }>()
  allTeamInspections.forEach((insp: { user_id: string; status: string; inspection_quantity: number; defect_quantity: number }) => {
    const stats = inspectorStats.get(insp.user_id) || { totalQty: 0, defectQty: 0 }
    stats.totalQty += (insp.inspection_quantity || 0)
    stats.defectQty += (insp.defect_quantity || 0)
    inspectorStats.set(insp.user_id, stats)
  })

  const rankings = Array.from(inspectorStats.entries())
    .map(([userId, stats]) => ({
      userId,
      defectRate: stats.totalQty > 0 ? (stats.defectQty / stats.totalQty) * 100 : 0,
    }))
    .sort((a, b) => a.defectRate - b.defectRate)

  const rank = rankings.findIndex(r => r.userId === inspectorId) + 1
  const totalInspectors = rankings.length

  // Daily trend (business day based) using quantities
  const dailyMap = new Map<string, { totalQty: number; defectQty: number }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  myInspections.forEach((insp: any) => {
    const date = parseBusinessDate(insp.created_at)
    const stats = dailyMap.get(date) || { totalQty: 0, defectQty: 0 }
    stats.totalQty += (insp.inspection_quantity || 0)
    stats.defectQty += (insp.defect_quantity || 0)
    dailyMap.set(date, stats)
  })

  const dailyTrend: InspectorDailyTrend[] = Array.from(dailyMap.entries())
    .map(([date, stats]) => ({
      date,
      inspectionCount: stats.totalQty,
      defectCount: stats.defectQty,
      defectRate: stats.totalQty > 0 ? (stats.defectQty / stats.totalQty) * 100 : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Model performance using quantities
  const modelMap = new Map<string, { name: string; code: string; totalQty: number; defectQty: number }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  myInspections.forEach((insp: any) => {
    const modelId = insp.model_id
    const modelName = insp.product_models?.name || 'Unknown'
    const modelCode = insp.product_models?.code || 'N/A'
    const stats = modelMap.get(modelId) || { name: modelName, code: modelCode, totalQty: 0, defectQty: 0 }
    stats.totalQty += (insp.inspection_quantity || 0)
    stats.defectQty += (insp.defect_quantity || 0)
    modelMap.set(modelId, stats)
  })

  const modelPerformance: InspectorModelPerformance[] = Array.from(modelMap.values()).map(stats => ({
    modelName: stats.name,
    modelCode: stats.code,
    inspectionCount: stats.totalQty,
    defectCount: stats.defectQty,
    defectRate: stats.totalQty > 0 ? (stats.defectQty / stats.totalQty) * 100 : 0,
  }))

  // Process performance using quantities
  const processMap = new Map<string, { name: string; code: string; totalQty: number; defectQty: number }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  myInspections.forEach((insp: any) => {
    const processCode = insp.inspection_process
    const processName = processNameMap.get(processCode) || processCode
    const stats = processMap.get(processCode) || { name: processName, code: processCode, totalQty: 0, defectQty: 0 }
    stats.totalQty += (insp.inspection_quantity || 0)
    stats.defectQty += (insp.defect_quantity || 0)
    processMap.set(processCode, stats)
  })

  const processPerformance: InspectorProcessPerformance[] = Array.from(processMap.values()).map(stats => ({
    processName: stats.name,
    processCode: stats.code,
    inspectionCount: stats.totalQty,
    defectCount: stats.defectQty,
    defectRate: stats.totalQty > 0 ? (stats.defectQty / stats.totalQty) * 100 : 0,
  }))

  // Team comparison using quantities
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamTotalQty = allTeamInspections.reduce((sum: number, i: any) => sum + (i.inspection_quantity || 0), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamDefectQty = allTeamInspections.reduce((sum: number, i: any) => sum + (i.defect_quantity || 0), 0)
  const avgDefectRate = teamTotalQty > 0 ? (teamDefectQty / teamTotalQty) * 100 : 0

  // Calculate number of active days for average daily inspections (business day based)
  const uniqueDates = new Set(allTeamInspections.map((i: { created_at: string }) =>
    parseBusinessDate(i.created_at)
  ))
  const activeDays = uniqueDates.size || 1
  const avgDailyInspections = teamTotalQty / activeDays / (totalInspectors || 1)

  const myDailyInspections = totalInspections / activeDays

  return {
    inspectorId,
    inspectorName: inspector.name,
    totalInspections,
    defectCount,
    defectRate,
    passRate,
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
