/**
 * 검사 실적 입력 관련 타입 정의
 */

// 검사 공정 타입 (관리 페이지에서 관리)
export interface InspectionProcess {
  id: string
  code: string
  name: string
  description?: string | null
  is_active?: boolean
}

// 불량 유형 (관리 페이지에서 수정/추가 가능)
export interface DefectType {
  id: string
  name: string
  description?: string
  created_at: string
}

// 검사 실적 입력 폼 데이터
export interface InspectionRecordInput {
  model_id: string
  inspection_process: InspectionProcess  // 검사 공정 객체
  defect_type_id: string | null
  machine_id: string | null  // 설비 ID (UUID)
  machine_number: string | null  // 설비 번호 (선택사항)
  inspector_id: string
  inspection_quantity: number
  defect_quantity: number
  photo_url?: string | null  // 사진 URL (선택사항, 최대 10MB)
}

// 검사 실적 데이터 (불량률 계산 포함)
export interface InspectionRecord extends InspectionRecordInput {
  id: string
  defect_rate: number  // (불량 수량 / 검사 수량) * 100
  status: 'pass' | 'fail'
  created_at: string
}

// 검사 실적 요약 카드 데이터
export interface InspectionRecordSummary {
  model_name: string
  model_code: string
  inspection_process: InspectionProcess  // 검사 공정 객체
  defect_type_name: string | null
  inspector_name: string
  inspection_quantity: number
  defect_quantity: number
  defect_rate: number
  pass_quantity: number
}
