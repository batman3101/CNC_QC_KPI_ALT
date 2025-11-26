/**
 * 검사 실적 입력 관련 타입 정의
 */

// 검사 공정 타입
export type InspectionProcess =
  | 'IQC'      // 입고 검사
  | 'PQC'      // 공정 검사
  | 'OQC'      // 출하 검사
  | 'H/G'      // 홀/그라인딩
  | 'MMS'      // MMS
  | 'CNC-OQC'  // CNC 출하 검사
  | 'POSITION' // 포지션
  | '외관'      // 외관 검사
  | 'TRI'      // TRI

// 검사 공정 목록
export const INSPECTION_PROCESSES: readonly InspectionProcess[] = [
  'IQC',
  'PQC',
  'OQC',
  'H/G',
  'MMS',
  'CNC-OQC',
  'POSITION',
  '외관',
  'TRI',
] as const

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
  inspection_process: InspectionProcess
  defect_type_id: string | null
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
  inspection_process: InspectionProcess
  defect_type_name: string | null
  inspector_name: string
  inspection_quantity: number
  defect_quantity: number
  defect_rate: number
  pass_quantity: number
}
