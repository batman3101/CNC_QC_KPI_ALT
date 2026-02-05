/**
 * SPC (Statistical Process Control) 타입 정의
 */

// ============================================
// 1. 기본 타입
// ============================================

/** 관리도 유형 */
export type ControlChartType = 'p-chart' | 'np-chart' | 'x-mr' | 'x-bar-r'

/** 알림 유형 */
export type SPCAlertType =
  | 'ucl_exceeded'      // UCL 초과
  | 'lcl_exceeded'      // LCL 미달
  | 'uwl_exceeded'      // 경고한계 초과
  | 'run_above'         // 연속 7점 중심선 위
  | 'run_below'         // 연속 7점 중심선 아래
  | 'trend_up'          // 연속 7점 상승
  | 'trend_down'        // 연속 7점 하강
  | 'two_thirds'        // 3점 중 2점이 경고구역
  | 'stratification'    // 15점 연속 1시그마 내
  | 'mixture'           // 8점 연속 중심선 통과 없음

/** 알림 심각도 */
export type SPCAlertSeverity = 'info' | 'warning' | 'critical'

/** 알림 상태 */
export type SPCAlertStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'ignored'

/** 공정능력 등급 */
export type CapabilityRating = 'excellent' | 'good' | 'adequate' | 'poor' | 'inadequate'

// ============================================
// 2. 관리한계 (Control Limits)
// ============================================

/** 관리한계 설정 */
export interface SPCControlLimit {
  id: string
  item_id: string
  model_id: string
  process_id?: string | null

  // 관리한계
  ucl: number           // Upper Control Limit
  cl: number            // Center Line
  lcl: number           // Lower Control Limit
  uwl?: number          // Upper Warning Limit
  lwl?: number          // Lower Warning Limit

  // 규격한계
  usl?: number          // Upper Specification Limit
  lsl?: number          // Lower Specification Limit
  target?: number       // Target Value

  // 공정능력지수
  cp?: number
  cpk?: number
  cpl?: number
  cpu?: number
  pp?: number
  ppk?: number

  // 통계 정보
  mean?: number
  std_dev?: number
  sample_size: number

  // 차트 설정
  chart_type: ControlChartType
  subgroup_size: number

  // 계산 기준
  data_from?: string
  data_to?: string
  calculated_at?: string

  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

/** 관리한계 생성 입력 */
export interface SPCControlLimitInput {
  item_id: string
  model_id: string
  process_id?: string
  chart_type: ControlChartType
  subgroup_size?: number
  // 수동 설정 시
  manual_ucl?: number
  manual_cl?: number
  manual_lcl?: number
  usl?: number
  lsl?: number
  target?: number
  // 자동 계산 시
  data_from?: Date
  data_to?: Date
}

/** 관리한계 업데이트 */
export interface SPCControlLimitUpdate {
  ucl?: number
  cl?: number
  lcl?: number
  uwl?: number
  lwl?: number
  usl?: number
  lsl?: number
  target?: number
  is_active?: boolean
  change_reason?: string
}

// ============================================
// 3. SPC 알림 (Alerts)
// ============================================

/** SPC 알림 */
export interface SPCAlert {
  id: string
  inspection_id?: string
  inspection_result_id?: string
  item_id?: string
  model_id: string
  control_limit_id?: string

  alert_type: SPCAlertType
  rule_code?: string
  rule_description?: string

  measured_value?: number
  control_limit_value?: number
  deviation?: number
  sigma_distance?: number

  consecutive_points?: number
  point_indices?: number[]

  severity: SPCAlertSeverity
  status: SPCAlertStatus

  acknowledged_by?: string
  acknowledged_at?: string
  resolved_by?: string
  resolved_at?: string
  resolution_note?: string
  root_cause?: string
  corrective_action?: string

  factory_id?: string
  created_at: string

  // 조인 데이터 (optional)
  item_name?: string
  model_name?: string
  acknowledged_by_name?: string
  resolved_by_name?: string
}

/** 알림 조치 입력 */
export interface SPCAlertResolution {
  status: SPCAlertStatus
  resolution_note?: string
  root_cause?: string
  corrective_action?: string
}

/** 알림 필터 */
export interface SPCAlertFilters {
  status?: SPCAlertStatus[]
  severity?: SPCAlertSeverity[]
  alert_type?: SPCAlertType[]
  model_id?: string
  item_id?: string
  date_from?: Date
  date_to?: Date
}

// ============================================
// 4. 관리도 데이터 (Chart Data)
// ============================================

/** 관리도 데이터 포인트 */
export interface SPCDataPoint {
  index: number
  value: number
  timestamp: string
  inspection_id?: string

  // 위반 정보
  is_violation: boolean
  violation_type?: SPCAlertType
  violation_severity?: SPCAlertSeverity

  // 서브그룹 정보 (X-bar R)
  subgroup_values?: number[]
  range?: number

  // 불량률 관리도 정보 (p-chart)
  sample_size?: number
  defect_count?: number
}

/** 관리도 위반 */
export interface SPCViolation {
  index: number
  point_value: number
  type: SPCAlertType
  severity: SPCAlertSeverity
  description: string
  rule_code?: string
}

/** 관리도 차트 데이터 */
export interface SPCChartData {
  chart_type: ControlChartType
  item_name: string
  model_name: string
  unit: string

  // 데이터 포인트
  points: SPCDataPoint[]

  // 관리한계
  control_limits: {
    ucl: number
    cl: number
    lcl: number
    uwl?: number
    lwl?: number
    usl?: number
    lsl?: number
  }

  // 위반 목록
  violations: SPCViolation[]

  // 공정능력
  process_capability: ProcessCapability

  // 통계 요약
  statistics: SPCStatistics
}

/** R 차트 데이터 (X-bar R용) */
export interface RChartData {
  points: Array<{
    index: number
    range: number
    timestamp: string
  }>
  control_limits: {
    ucl: number
    cl: number
    lcl: number
  }
}

// ============================================
// 5. 공정능력 (Process Capability)
// ============================================

/** 공정능력 지수 */
export interface ProcessCapability {
  cp: number
  cpk: number
  cpl: number
  cpu: number
  pp?: number
  ppk?: number

  rating: CapabilityRating
  rating_description: string

  // 예상 불량률
  expected_defect_ppm?: number    // PPM
  expected_defect_percent?: number // %
}

/** SPC 통계 요약 */
export interface SPCStatistics {
  count: number
  mean: number
  std_dev: number
  min: number
  max: number
  range: number
  median: number

  // 규격 대비
  within_spec_count: number
  within_spec_percent: number

  // 관리한계 대비
  within_control_count: number
  within_control_percent: number
}

// ============================================
// 6. SPC 대시보드
// ============================================

/** 모델별 SPC 요약 */
export interface ModelSPCSummary {
  model_id: string
  model_name: string
  model_code: string

  items_count: number           // 관리 중인 검사항목 수
  avg_cpk: number               // 평균 Cpk
  min_cpk: number               // 최저 Cpk
  max_cpk: number               // 최고 Cpk

  overall_rating: CapabilityRating

  open_alerts_count: number     // 미조치 알림 수
  critical_alerts_count: number // 심각 알림 수
}

/** SPC KPI 요약 */
export interface SPCKPISummary {
  total_monitored_items: number   // 관리 중인 검사항목 수
  avg_cpk: number                 // 전체 평균 Cpk

  excellent_count: number         // Cpk >= 1.67
  good_count: number              // 1.33 <= Cpk < 1.67
  adequate_count: number          // 1.0 <= Cpk < 1.33
  poor_count: number              // Cpk < 1.0

  open_alerts: number
  critical_alerts: number

  trend: 'improving' | 'stable' | 'declining'
}

// ============================================
// 7. 필터 및 옵션
// ============================================

/** SPC 필터 */
export interface SPCFilters {
  model_id?: string
  item_id?: string
  process_id?: string
  chart_type?: ControlChartType
  date_from: Date
  date_to: Date
  factory_id?: string
}

/** 관리한계 계산 옵션 */
export interface ControlLimitCalculationOptions {
  chart_type: ControlChartType
  subgroup_size?: number
  use_moving_range?: boolean
  sigma_multiplier?: number    // 기본 3
  exclude_outliers?: boolean
  min_data_points?: number     // 최소 데이터 수 (기본 25)
}

// ============================================
// 8. 이력 관리
// ============================================

/** 관리한계 변경 이력 */
export interface SPCControlLimitHistory {
  id: string
  control_limit_id: string

  previous_ucl?: number
  previous_cl?: number
  previous_lcl?: number
  previous_cp?: number
  previous_cpk?: number
  previous_sample_size?: number

  new_ucl?: number
  new_cl?: number
  new_lcl?: number
  new_cp?: number
  new_cpk?: number
  new_sample_size?: number

  change_type: 'recalculated' | 'manual_adjustment' | 'spec_change'
  change_reason?: string
  changed_by?: string
  changed_by_name?: string

  created_at: string
}

// ============================================
// 9. p-chart 특화 타입
// ============================================

/** p-chart 데이터 포인트 */
export interface PChartDataPoint {
  index: number
  date: string
  defect_rate: number       // 불량률 (0~1)
  defect_count: number      // 불량 수
  sample_size: number       // 검사 수
  is_violation: boolean
  violation_type?: SPCAlertType
}

/** p-chart 관리한계 */
export interface PChartLimits {
  p_bar: number             // 평균 불량률
  ucl: number               // 상한
  lcl: number               // 하한 (음수면 0)
  centerLine: number        // 중심선 (= p_bar)
}
