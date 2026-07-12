/**
 * SPC (Statistical Process Control) 타입 정의
 *
 * 이 앱의 SPC는 p-chart(불량률 관리도)와 그로부터 나온 알림만 다룬다.
 * 관리한계 저장(SPCControlLimit), 공정능력(Cpk), np / X-mR / X-bar R 관련
 * 타입도 한때 있었으나 어느 코드도 참조하지 않아 제거했다.
 */

// ============================================
// 1. 기본 타입
// ============================================

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

// ============================================
// 2. SPC 알림 (Alerts)
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

/** 관리도 위반 */
export interface SPCViolation {
  index: number
  point_value: number
  type: SPCAlertType
  severity: SPCAlertSeverity
  description: string
  rule_code?: string
}

// ============================================
// 3. 필터
// ============================================

/** SPC 필터 */
export interface SPCFilters {
  model_id?: string
  item_id?: string
  process_id?: string
  date_from: Date
  date_to: Date
  factory_id?: string
}

// ============================================
// 4. p-chart
// ============================================

/**
 * p-chart 데이터 포인트
 *
 * 관리한계는 점마다 다르다. p-chart의 시그마는 표본 크기의 함수이기 때문이다
 * (sigma_i = sqrt(p_bar * (1 - p_bar) / n_i)). 일별 검사 수량이 일정하지 않으므로
 * 검사량이 많은 날은 한계가 좁아지고 적은 날은 넓어진다.
 */
export interface PChartDataPoint {
  index: number
  date: string
  defect_rate: number       // 불량률 (0~1)
  defect_count: number      // 불량 수
  sample_size: number       // 검사 수 (= n_i)

  ucl: number               // 이 점의 상한
  lcl: number               // 이 점의 하한 (음수면 0)
  sigma: number             // 이 점의 시그마
  /**
   * 표준화 값 z_i = (p_i - p_bar) / sigma_i.
   * Nelson 규칙은 "시그마 몇 배"로 서술되어 시그마가 일정하다고 가정한다.
   * 표본 크기가 변하면 원래 값에는 그대로 적용할 수 없고, 이 표준화 계열
   * 위에서만 성립한다.
   */
  z: number

  is_violation: boolean
  violation_type?: SPCAlertType
}

/**
 * p-chart 중심선 + 관리한계 밴드의 범위
 *
 * 표본 크기가 변하므로 단일 UCL/LCL은 존재하지 않는다. 점별 한계는
 * PChartDataPoint에 있고, 여기 있는 min/max는 축 스케일과 요약 표시용이다.
 */
export interface PChartLimits {
  p_bar: number             // 평균 불량률 (= 중심선)
  centerLine: number        // 중심선 (= p_bar)
  ucl_min: number           // 밴드 내 가장 좁은 상한
  ucl_max: number           // 밴드 내 가장 넓은 상한
  lcl_min: number
  lcl_max: number
}

// ============================================
// 5. 불량 포인트 입력 (Exception Defect-Point Logger)
// ============================================

/** 입력 중인 불량 포인트 1건 */
export interface DefectPointEntry {
  item_id: string
  item_name: string
  measured_value: number | null
}

/** 한 부품 = 불량 포인트 묶음 */
export type DefectPart = DefectPointEntry[]

/** 포인트별 Pareto 1행 */
export interface DefectPointParetoRow {
  item_id: string
  item_name: string
  defect_count: number
}
