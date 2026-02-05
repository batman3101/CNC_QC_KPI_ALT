/**
 * SPC Service - API 함수
 * Statistical Process Control service layer
 */

import { supabase } from '@/lib/supabase'
import {
  getBusinessDateRangeFilter,
  parseBusinessDate,
} from '@/lib/dateUtils'
import {
  calculatePChartLimits,
  calculateProcessCapability,
  calculateSPCStatistics,
  calculateHistogramBins,
  mean,
  getCapabilityRating,
} from '@/lib/spc-calculations'
import type {
  SPCAlert,
  SPCAlertFilters,
  SPCAlertResolution,
  SPCKPISummary,
  ModelSPCSummary,
  PChartDataPoint,
  PChartLimits,
  SPCFilters,
  CapabilityRating,
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

  let query = supabase
    .from('inspections')
    .select('id, created_at, inspection_quantity, defect_quantity, status')
    .gte('created_at', dateFilter.gte)
    .lte('created_at', dateFilter.lte)
    .order('created_at', { ascending: true })

  if (filters.model_id) {
    query = query.eq('model_id', filters.model_id)
  }
  if (filters.process_id) {
    query = query.eq('inspection_process', filters.process_id)
  }
  if (factoryId) {
    query = query.eq('factory_id', factoryId)
  }

  const { data: inspections, error } = await query

  if (error) throw error
  if (!inspections || inspections.length === 0) {
    return {
      points: [],
      limits: { p_bar: 0, ucl: 0, lcl: 0, centerLine: 0 },
      statistics: { count: 0, avgDefectRate: 0, totalDefects: 0, totalInspections: 0 },
    }
  }

  // 날짜별로 그룹핑
  const dailyData = inspections.reduce((acc, insp) => {
    const date = parseBusinessDate(insp.created_at)
    if (!acc[date]) {
      acc[date] = { defect_count: 0, sample_size: 0 }
    }
    acc[date].defect_count += insp.defect_quantity || 0
    acc[date].sample_size += insp.inspection_quantity || 1
    return acc
  }, {} as Record<string, { defect_count: number; sample_size: number }>)

  // 관리한계 계산
  const dataForLimits = Object.values(dailyData)
  const limits = calculatePChartLimits(dataForLimits)

  // 데이터 포인트 생성
  const sortedDates = Object.keys(dailyData).sort()
  const points: PChartDataPoint[] = sortedDates.map((date, index) => {
    const { defect_count, sample_size } = dailyData[date]
    const defect_rate = sample_size > 0 ? defect_count / sample_size : 0

    // 위반 확인
    const is_violation = defect_rate > limits.ucl || defect_rate < limits.lcl
    let violation_type: PChartDataPoint['violation_type'] = undefined
    if (defect_rate > limits.ucl) violation_type = 'ucl_exceeded'
    else if (defect_rate < limits.lcl) violation_type = 'lcl_exceeded'

    return {
      index,
      date,
      defect_rate,
      defect_count,
      sample_size,
      is_violation,
      violation_type,
    }
  })

  // 통계
  const totalDefects = dataForLimits.reduce((sum, d) => sum + d.defect_count, 0)
  const totalInspections = dataForLimits.reduce((sum, d) => sum + d.sample_size, 0)
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
// 2. SPC 대시보드
// ============================================

/**
 * SPC KPI 요약 조회
 */
export async function getSPCKPISummary(factoryId?: string): Promise<SPCKPISummary> {
  // 현재는 p-chart 기반 Mock 데이터 반환
  // 실제 구현 시 spc_control_limits 테이블에서 조회

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const filters: SPCFilters = {
    date_from: thirtyDaysAgo,
    date_to: new Date(),
  }

  try {
    const { statistics } = await getPChartData(filters, factoryId)

    // Mock Cpk 데이터 (실제 구현 시 inspection_results에서 계산)
    const mockCpkValues = [1.45, 1.32, 1.58, 1.21, 1.67, 0.98, 1.12, 1.78]
    const avgCpk = mean(mockCpkValues)

    const excellent_count = mockCpkValues.filter(c => c >= 1.67).length
    const good_count = mockCpkValues.filter(c => c >= 1.33 && c < 1.67).length
    const adequate_count = mockCpkValues.filter(c => c >= 1.0 && c < 1.33).length
    const poor_count = mockCpkValues.filter(c => c < 1.0).length

    return {
      total_monitored_items: mockCpkValues.length,
      avg_cpk: avgCpk,
      excellent_count,
      good_count,
      adequate_count,
      poor_count,
      open_alerts: Math.floor(statistics.avgDefectRate / 2),
      critical_alerts: Math.floor(statistics.avgDefectRate / 5),
      trend: statistics.avgDefectRate < 3 ? 'improving' : statistics.avgDefectRate < 5 ? 'stable' : 'declining',
    }
  } catch (error) {
    console.error('Failed to get SPC KPI summary:', error)
    return {
      total_monitored_items: 0,
      avg_cpk: 0,
      excellent_count: 0,
      good_count: 0,
      adequate_count: 0,
      poor_count: 0,
      open_alerts: 0,
      critical_alerts: 0,
      trend: 'stable',
    }
  }
}

/**
 * 모델별 SPC 요약 조회
 */
export async function getModelSPCSummary(_factoryId?: string): Promise<ModelSPCSummary[]> {
  // TODO: _factoryId를 활용한 공장별 필터링 추가 예정
  void _factoryId
  // 제품 모델 목록 조회
  const { data: models, error } = await supabase
    .from('product_models')
    .select('id, name, code')
    .order('name')

  if (error) throw error
  if (!models) return []

  // 각 모델별 요약 생성 (Mock)
  return models.map((model) => {
    // Mock Cpk 값 (실제 구현 시 계산)
    const mockCpk = 1.2 + Math.random() * 0.6
    const { rating } = getCapabilityRating(mockCpk)

    return {
      model_id: model.id,
      model_name: model.name,
      model_code: model.code,
      items_count: 3 + Math.floor(Math.random() * 5),
      avg_cpk: mockCpk,
      min_cpk: mockCpk - 0.2,
      max_cpk: mockCpk + 0.3,
      overall_rating: rating,
      open_alerts_count: Math.floor(Math.random() * 3),
      critical_alerts_count: Math.floor(Math.random() * 2),
    }
  })
}

// ============================================
// 3. SPC 알림
// ============================================

/**
 * SPC 알림 목록 조회 (Mock)
 */
export async function getSPCAlerts(
  filters?: SPCAlertFilters,
  factoryId?: string
): Promise<SPCAlert[]> {
  // Mock 알림 데이터
  const mockAlerts: SPCAlert[] = [
    {
      id: '1',
      model_id: 'model-1',
      alert_type: 'ucl_exceeded',
      rule_code: 'R1',
      rule_description: 'Point exceeds Upper Control Limit',
      measured_value: 0.058,
      control_limit_value: 0.045,
      severity: 'critical',
      status: 'open',
      factory_id: factoryId,
      created_at: new Date().toISOString(),
      model_name: 'Model A',
    },
    {
      id: '2',
      model_id: 'model-2',
      alert_type: 'run_above',
      rule_code: 'R2',
      rule_description: '7 consecutive points above center line',
      severity: 'warning',
      status: 'open',
      factory_id: factoryId,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      model_name: 'Model B',
    },
    {
      id: '3',
      model_id: 'model-1',
      alert_type: 'trend_up',
      rule_code: 'R3',
      rule_description: '6 consecutive points increasing',
      severity: 'warning',
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
      factory_id: factoryId,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      model_name: 'Model A',
    },
  ]

  // 필터 적용
  let filteredAlerts = mockAlerts

  if (filters?.status && filters.status.length > 0) {
    filteredAlerts = filteredAlerts.filter(a => filters.status!.includes(a.status))
  }
  if (filters?.severity && filters.severity.length > 0) {
    filteredAlerts = filteredAlerts.filter(a => filters.severity!.includes(a.severity))
  }
  if (filters?.model_id) {
    filteredAlerts = filteredAlerts.filter(a => a.model_id === filters.model_id)
  }

  return filteredAlerts
}

/**
 * 미조치 알림 수 조회
 */
export async function getOpenAlertsCount(
  factoryId?: string
): Promise<{ total: number; critical: number }> {
  const alerts = await getSPCAlerts({ status: ['open'] }, factoryId)
  return {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
  }
}

/**
 * 최근 SPC 알림 조회
 */
export async function getRecentSPCAlerts(
  limit: number = 5,
  factoryId?: string
): Promise<SPCAlert[]> {
  const alerts = await getSPCAlerts(undefined, factoryId)
  return alerts.slice(0, limit)
}

/**
 * 알림 상태 업데이트 (Mock)
 */
export async function updateSPCAlertStatus(
  id: string,
  resolution: SPCAlertResolution
): Promise<SPCAlert> {
  // Mock 업데이트
  return {
    id,
    model_id: 'model-1',
    alert_type: 'ucl_exceeded',
    severity: 'critical',
    status: resolution.status,
    resolution_note: resolution.resolution_note,
    root_cause: resolution.root_cause,
    corrective_action: resolution.corrective_action,
    resolved_at: resolution.status === 'resolved' ? new Date().toISOString() : undefined,
    created_at: new Date().toISOString(),
  }
}

// ============================================
// 4. 검사 항목 및 모델 조회
// ============================================

/**
 * 검사 항목 목록 조회
 */
export async function getInspectionItems(modelId?: string) {
  let query = supabase
    .from('inspection_items')
    .select('id, name, model_id, standard_value, tolerance_min, tolerance_max, unit, data_type')
    .order('name')

  if (modelId) {
    query = query.eq('model_id', modelId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

/**
 * 제품 모델 목록 조회
 */
export async function getProductModels() {
  const { data, error } = await supabase
    .from('product_models')
    .select('id, name, code')
    .order('name')

  if (error) throw error
  return data || []
}

/**
 * 검사 공정 목록 조회
 */
export async function getInspectionProcesses() {
  const { data, error } = await supabase
    .from('inspection_processes')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data || []
}

// ============================================
// 5. 공정능력 분석
// ============================================

/**
 * 공정능력 분석 데이터 조회
 */
export async function getProcessCapabilityData(
  itemId: string,
  _modelId: string,
  dateRange?: { from: Date; to: Date },
  factoryId?: string
): Promise<{
  values: number[]
  usl: number
  lsl: number
  target: number
  histogram: { bin: number; count: number; binStart: number; binEnd: number }[]
  capability: {
    cp: number
    cpk: number
    cpl: number
    cpu: number
    rating: CapabilityRating
    ppm: number
  }
  statistics: {
    count: number
    mean: number
    std_dev: number
    min: number
    max: number
  }
}> {
  // 검사 항목 정보 조회
  const { data: item, error: itemError } = await supabase
    .from('inspection_items')
    .select('standard_value, tolerance_min, tolerance_max')
    .eq('id', itemId)
    .single()

  if (itemError) throw itemError

  const usl = item.standard_value + item.tolerance_max
  const lsl = item.standard_value + item.tolerance_min
  const target = item.standard_value

  // 측정값 조회
  const dateFilter = dateRange
    ? getBusinessDateRangeFilter(dateRange.from, dateRange.to)
    : getBusinessDateRangeFilter(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date()
      )

  let query = supabase
    .from('inspection_results')
    .select(`
      measured_value,
      inspections!inner (
        model_id,
        factory_id,
        created_at
      )
    `)
    .eq('item_id', itemId)
    .gte('inspections.created_at', dateFilter.gte)
    .lte('inspections.created_at', dateFilter.lte)

  if (factoryId) {
    query = query.eq('inspections.factory_id', factoryId)
  }

  const { data: results, error: resultsError } = await query

  if (resultsError) throw resultsError

  const values = (results || []).map(r => r.measured_value)

  if (values.length === 0) {
    return {
      values: [],
      usl,
      lsl,
      target,
      histogram: [],
      capability: { cp: 0, cpk: 0, cpl: 0, cpu: 0, rating: 'inadequate', ppm: 1000000 },
      statistics: { count: 0, mean: 0, std_dev: 0, min: 0, max: 0 },
    }
  }

  // 공정능력 계산
  const capability = calculateProcessCapability(values, usl, lsl)

  // 히스토그램
  const histogram = calculateHistogramBins(values)

  // 통계
  const stats = calculateSPCStatistics(values, usl, lsl)

  return {
    values,
    usl,
    lsl,
    target,
    histogram,
    capability: {
      cp: capability.cp,
      cpk: capability.cpk,
      cpl: capability.cpl,
      cpu: capability.cpu,
      rating: capability.rating,
      ppm: capability.expected_defect_ppm || 0,
    },
    statistics: {
      count: stats.count,
      mean: stats.mean,
      std_dev: stats.std_dev,
      min: stats.min,
      max: stats.max,
    },
  }
}
