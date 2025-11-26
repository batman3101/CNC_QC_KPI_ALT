/**
 * Mock Data Generator
 *
 * 대량의 테스트 데이터를 생성하는 유틸리티 함수들
 */

import { subDays, addHours } from 'date-fns'
import type { Database } from '@/types/database'

type Inspection = Database['public']['Tables']['inspections']['Row']
type Defect = Database['public']['Tables']['defects']['Row']

// 설비 목록 (10개)
export const MACHINES = [
  { id: 'machine-001', name: 'CNC 밀링 #1', model: 'Haas VF-2' },
  { id: 'machine-002', name: 'CNC 밀링 #2', model: 'DMG Mori NLX 2500' },
  { id: 'machine-003', name: 'CNC 선반 #1', model: 'Mazak Integrex i-200' },
  { id: 'machine-004', name: 'CNC 선반 #2', model: 'Okuma LB3000' },
  { id: 'machine-005', name: 'CNC 복합기 #1', model: 'DMG Mori NTX 1000' },
  { id: 'machine-006', name: '머시닝센터 #1', model: 'Brother S1000' },
  { id: 'machine-007', name: '머시닝센터 #2', model: 'Doosan DNM 400' },
  { id: 'machine-008', name: '연삭기 #1', model: 'Studer S31' },
  { id: 'machine-009', name: '연삭기 #2', model: 'Okamoto ACC-52' },
  { id: 'machine-010', name: 'EDM 방전기 #1', model: 'Sodick AQ360L' },
]

// 제품 모델 목록 (15개)
export const PRODUCT_MODELS = [
  { id: 'model-001', code: 'BHB-002', name: '베어링 하우징 B형' },
  { id: 'model-002', code: 'SHA-001', name: '샤프트 A형' },
  { id: 'model-003', code: 'FLC-003', name: '플랜지 C형' },
  { id: 'model-004', code: 'GAD-004', name: '기어 조립체 D형' },
  { id: 'model-005', code: 'CNE-005', name: '커넥터 E형' },
  { id: 'model-006', code: 'PST-006', name: '피스톤 F형' },
  { id: 'model-007', code: 'CYL-007', name: '실린더 G형' },
  { id: 'model-008', code: 'VAL-008', name: '밸브 H형' },
  { id: 'model-009', code: 'SPR-009', name: '스프링 I형' },
  { id: 'model-010', code: 'BLT-010', name: '볼트 J형' },
  { id: 'model-011', code: 'NUT-011', name: '너트 K형' },
  { id: 'model-012', code: 'WSH-012', name: '와셔 L형' },
  { id: 'model-013', code: 'PIN-013', name: '핀 M형' },
  { id: 'model-014', code: 'BRK-014', name: '브래킷 N형' },
  { id: 'model-015', code: 'PLT-015', name: '플레이트 O형' },
]

// 검사자 목록 (10명)
export const INSPECTORS = [
  { id: 'user-001', name: '김철수', email: 'kim@test.com' },
  { id: 'user-002', name: '이영희', email: 'lee@test.com' },
  { id: 'user-003', name: '박민수', email: 'park@test.com' },
  { id: 'user-004', name: '정수연', email: 'jung@test.com' },
  { id: 'user-005', name: '최동욱', email: 'choi@test.com' },
  { id: 'user-006', name: '강미영', email: 'kang@test.com' },
  { id: 'user-007', name: '윤성호', email: 'yoon@test.com' },
  { id: 'user-008', name: '임지은', email: 'lim@test.com' },
  { id: 'user-009', name: '한상우', email: 'han@test.com' },
  { id: 'user-010', name: '송민지', email: 'song@test.com' },
]

// 불량 유형 목록
export const DEFECT_TYPES = [
  { type: '치수 불량', weight: 40, severity: 'high' },
  { type: '표면 불량', weight: 25, severity: 'medium' },
  { type: '형상 불량', weight: 15, severity: 'high' },
  { type: '재질 불량', weight: 10, severity: 'high' },
  { type: '조립 불량', weight: 5, severity: 'medium' },
  { type: '도장 불량', weight: 3, severity: 'low' },
  { type: '기타', weight: 2, severity: 'low' },
]

// 불량 설명 템플릿
const DEFECT_DESCRIPTIONS = {
  '치수 불량': [
    '측정값이 공차 범위를 벗어남',
    '직경이 기준값보다 큼',
    '길이가 기준값보다 작음',
    '두께가 불균일함',
  ],
  '표면 불량': [
    '표면에 긁힘 발견',
    '표면 거칠기 초과',
    '녹 발생',
    '도장 벗겨짐',
  ],
  '형상 불량': [
    '각도 불량',
    '평면도 불량',
    '동심도 불량',
    '직각도 불량',
  ],
  '재질 불량': [
    '재질 경도 불량',
    '금속 성분 불량',
    '열처리 불량',
  ],
  '조립 불량': [
    '부품 조립 누락',
    '조립 순서 오류',
    '체결 불량',
  ],
  '도장 불량': [
    '도장 두께 불량',
    '도장 색상 불량',
    '도장 벗겨짐',
  ],
  '기타': [
    '기타 불량',
    '복합 불량',
  ],
}

// 가중치 기반 랜덤 선택
function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight

  for (const item of items) {
    if (random < item.weight) {
      return item
    }
    random -= item.weight
  }

  return items[items.length - 1]
}

// 시간대별 검사 건수 패턴 (근무 시간 반영)
function getInspectionCountByHour(hour: number): number {
  if (hour < 7 || hour > 18) return 0 // 야간 작업 없음
  if (hour === 7) return Math.floor(Math.random() * 3) // 출근 시간
  if (hour === 12) return Math.floor(Math.random() * 5) // 점심 시간
  if (hour === 18) return Math.floor(Math.random() * 3) // 퇴근 시간

  // 주요 작업 시간 (8-11시, 13-17시)
  return Math.floor(Math.random() * 8) + 3 // 3-10건
}

// 요일별 패턴 (월요일은 적고, 수요일이 가장 많음)
function getWeekdayMultiplier(date: Date): number {
  const day = date.getDay() // 0: 일요일, 6: 토요일

  if (day === 0 || day === 6) return 0.2 // 주말은 20%
  if (day === 1) return 0.8 // 월요일 80%
  if (day === 3) return 1.2 // 수요일 120%
  if (day === 5) return 0.9 // 금요일 90%

  return 1.0 // 화, 목요일 100%
}

// 설비별 불량률 (일부 설비는 불량률이 높음)
const MACHINE_DEFECT_RATES = {
  'machine-001': 0.04, // 4%
  'machine-002': 0.03, // 3%
  'machine-003': 0.02, // 2% - 가장 좋음
  'machine-004': 0.035, // 3.5%
  'machine-005': 0.045, // 4.5%
  'machine-006': 0.05, // 5% - 노후 설비
  'machine-007': 0.04, // 4%
  'machine-008': 0.03, // 3%
  'machine-009': 0.055, // 5.5% - 가장 나쁨
  'machine-010': 0.025, // 2.5%
}

// 검사 데이터 생성
export function generateInspections(count: number, daysBack: number = 90): Inspection[] {
  const inspections: Inspection[] = []
  const now = new Date()
  const startDate = subDays(now, daysBack)

  let inspectionCounter = 1

  // 날짜별로 생성
  for (let day = 0; day < daysBack; day++) {
    const currentDate = addHours(startDate, day * 24)
    const weekdayMultiplier = getWeekdayMultiplier(currentDate)

    // 근무 시간대별로 생성
    for (let hour = 7; hour <= 18; hour++) {
      const baseCount = getInspectionCountByHour(hour)
      const adjustedCount = Math.floor(baseCount * weekdayMultiplier)

      for (let i = 0; i < adjustedCount; i++) {
        if (inspectionCounter > count) break

        const machine = MACHINES[Math.floor(Math.random() * MACHINES.length)]
        const model = PRODUCT_MODELS[Math.floor(Math.random() * PRODUCT_MODELS.length)]
        const inspector = INSPECTORS[Math.floor(Math.random() * INSPECTORS.length)]

        // 설비별 불량률 적용
        const machineDefectRate = MACHINE_DEFECT_RATES[machine.id as keyof typeof MACHINE_DEFECT_RATES] || 0.04
        const isFail = Math.random() < machineDefectRate

        // 시간 랜덤화 (해당 시간대 내에서)
        const randomMinutes = Math.floor(Math.random() * 60)
        const inspectionTime = addHours(currentDate, hour - day * 24)
        inspectionTime.setMinutes(randomMinutes)

        const inspectionProcesses: Array<'IQC' | 'PQC' | 'OQC' | 'H/G' | 'MMS' | 'CNC-OQC' | 'POSITION' | '외관' | 'TRI'> = [
          'IQC', 'PQC', 'OQC', 'H/G', 'MMS', 'CNC-OQC', 'POSITION', '외관', 'TRI'
        ]
        const randomProcess = inspectionProcesses[Math.floor(Math.random() * inspectionProcesses.length)]
        const inspectionQty = Math.floor(Math.random() * 50) + 10 // 10-59개
        const defectQty = isFail ? Math.floor(Math.random() * 5) + 1 : 0 // 불량 시 1-5개

        inspections.push({
          id: `inspection-${String(inspectionCounter).padStart(6, '0')}`,
          user_id: inspector.id,
          machine_id: machine.id,
          model_id: model.id,
          inspection_process: randomProcess,
          defect_type: isFail ? weightedRandom(DEFECT_TYPES).type : null,
          inspection_quantity: inspectionQty,
          defect_quantity: defectQty,
          photo_url: null,
          status: isFail ? 'fail' : 'pass',
          created_at: inspectionTime.toISOString(),
        })

        inspectionCounter++
      }

      if (inspectionCounter > count) break
    }

    if (inspectionCounter > count) break
  }

  return inspections.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

// 불량 데이터 생성 (검사 데이터 기반)
export function generateDefects(inspections: Inspection[]): Defect[] {
  const defects: Defect[] = []
  const failedInspections = inspections.filter(i => i.status === 'fail')

  failedInspections.forEach((inspection, index) => {
    const defectType = weightedRandom(DEFECT_TYPES)
    const descriptions = DEFECT_DESCRIPTIONS[defectType.type as keyof typeof DEFECT_DESCRIPTIONS]
    const description = descriptions[Math.floor(Math.random() * descriptions.length)]

    // 상태 결정 (최근 것일수록 pending 확률 높음)
    const daysSinceInspection = Math.floor(
      (Date.now() - new Date(inspection.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    let status: 'pending' | 'in_progress' | 'resolved'
    if (daysSinceInspection < 3) {
      status = Math.random() < 0.7 ? 'pending' : 'in_progress'
    } else if (daysSinceInspection < 7) {
      const rand = Math.random()
      status = rand < 0.3 ? 'pending' : rand < 0.6 ? 'in_progress' : 'resolved'
    } else {
      status = Math.random() < 0.8 ? 'resolved' : 'in_progress'
    }

    defects.push({
      id: `defect-${String(index + 1).padStart(6, '0')}`,
      inspection_id: inspection.id,
      defect_type: defectType.type,
      description,
      photo_url: null,
      status,
      created_at: inspection.created_at,
    })
  })

  return defects
}

// 일별 통계 계산
export function calculateDailyStats(inspections: Inspection[], days: number = 90) {
  const stats: Record<string, { total: number; failed: number }> = {}
  const startDate = subDays(new Date(), days)

  inspections.forEach(inspection => {
    const date = new Date(inspection.created_at)
    if (date < startDate) return

    const dateKey = date.toISOString().split('T')[0]

    if (!stats[dateKey]) {
      stats[dateKey] = { total: 0, failed: 0 }
    }

    stats[dateKey].total++
    if (inspection.status === 'fail') {
      stats[dateKey].failed++
    }
  })

  return Object.entries(stats)
    .map(([date, data]) => ({
      date,
      totalInspections: data.total,
      defectCount: data.failed,
      defectRate: data.total > 0 ? (data.failed / data.total) * 100 : 0,
      passRate: data.total > 0 ? ((data.total - data.failed) / data.total) * 100 : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// Edge Cases 생성
export function generateEdgeCases(): Inspection[] {
  const edgeCases: Inspection[] = []
  const now = new Date()

  // 1. 연속 불량 케이스 (같은 설비에서 연속으로 불량 발생)
  for (let i = 0; i < 5; i++) {
    edgeCases.push({
      id: `edge-consecutive-${i}`,
      user_id: INSPECTORS[0].id,
      machine_id: 'machine-006', // 노후 설비
      model_id: PRODUCT_MODELS[0].id,
      inspection_process: 'CNC-OQC',
      defect_type: weightedRandom(DEFECT_TYPES).type,
      inspection_quantity: 20,
      defect_quantity: 3,
      photo_url: null,
      status: 'fail',
      created_at: subDays(now, 1).toISOString(),
    })
  }

  // 2. 심야 검사 케이스 (특이 케이스)
  edgeCases.push({
    id: 'edge-midnight',
    user_id: INSPECTORS[0].id,
    machine_id: MACHINES[0].id,
    model_id: PRODUCT_MODELS[0].id,
    inspection_process: 'H/G',
    defect_type: null,
    inspection_quantity: 15,
    defect_quantity: 0,
    photo_url: null,
    status: 'pass',
    created_at: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 2, 30).toISOString(),
  })

  // 3. 100% 합격 설비 케이스
  for (let i = 0; i < 50; i++) {
    edgeCases.push({
      id: `edge-perfect-${i}`,
      user_id: INSPECTORS[2].id,
      machine_id: 'machine-003', // 최고 성능 설비
      model_id: PRODUCT_MODELS[2].id,
      inspection_process: 'PQC',
      defect_type: null,
      inspection_quantity: Math.floor(Math.random() * 30) + 20, // 20-49개
      defect_quantity: 0,
      photo_url: null,
      status: 'pass',
      created_at: subDays(now, Math.floor(Math.random() * 30)).toISOString(),
    })
  }

  return edgeCases
}
