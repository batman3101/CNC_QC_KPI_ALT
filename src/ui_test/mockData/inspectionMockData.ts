import type { Database } from '@/types/database'
import { mockProductModels } from './modelMockData'
import {
  generateInspections,
  generateEdgeCases,
  MACHINES as GENERATED_MACHINES,
  PRODUCT_MODELS,
  INSPECTORS,
  DEFECT_TYPES,
} from './mockDataGenerator'
import { getNowInVietnam, BUSINESS_DAY_START_HOUR } from '@/lib/dateUtils'

type Machine = Database['public']['Tables']['machines']['Row']
type Inspection = Database['public']['Tables']['inspections']['Row']
type InspectionResult =
  Database['public']['Tables']['inspection_results']['Row']

// Export models
export { mockProductModels }

// Mock Machines (10개 설비)
export const mockMachines: Machine[] = GENERATED_MACHINES.map((machine) => ({
  id: machine.id,
  name: machine.name,
  model: machine.model,
  status: 'active' as const,
  created_at: '2024-01-01T00:00:00Z',
}))

// 대량의 검사 데이터 생성 (600건 - 최근 90일)
// 500건의 일반 검사 + 100건의 Edge Case
const regularInspections = generateInspections(500, 90)
const edgeCases = generateEdgeCases()

// Generate today's business day inspections (08:00 ~ current time)
function generateTodayInspections(): Inspection[] {
  const todayInspections: Inspection[] = []
  const now = getNowInVietnam()
  const currentHour = now.getHours()

  // Only generate if current time is after business day start (08:00)
  if (currentHour < BUSINESS_DAY_START_HOUR) {
    return todayInspections
  }

  const inspectionProcesses = ['IQC', 'PQC', 'OQC', 'H/G', 'MMS', 'CNC-OQC', 'POSITION', '외관', 'TRI']

  // Generate inspections from 08:00 to current hour
  for (let hour = BUSINESS_DAY_START_HOUR; hour <= currentHour; hour++) {
    // Generate 2-5 inspections per hour
    const inspectionsPerHour = Math.floor(Math.random() * 4) + 2

    for (let i = 0; i < inspectionsPerHour; i++) {
      const machine = GENERATED_MACHINES[Math.floor(Math.random() * Math.min(12, GENERATED_MACHINES.length))]
      const model = PRODUCT_MODELS[Math.floor(Math.random() * PRODUCT_MODELS.length)]
      const inspector = INSPECTORS[Math.floor(Math.random() * INSPECTORS.length)]
      const isFail = Math.random() < 0.035 // 3.5% defect rate

      // Create timestamp for this inspection
      const inspectionDate = new Date(now)
      inspectionDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0)

      // Don't generate future timestamps
      if (inspectionDate > now) continue

      const randomProcess = inspectionProcesses[Math.floor(Math.random() * inspectionProcesses.length)]
      const inspectionQty = Math.floor(Math.random() * 50) + 10
      const defectQty = isFail ? Math.floor(Math.random() * 5) + 1 : 0

      todayInspections.push({
        id: `inspection-today-${hour}-${i}`,
        user_id: inspector.id,
        machine_id: machine.id,
        model_id: model.id,
        inspection_process: randomProcess,
        defect_type: isFail ? DEFECT_TYPES[Math.floor(Math.random() * DEFECT_TYPES.length)].type : null,
        inspection_quantity: inspectionQty,
        defect_quantity: defectQty,
        photo_url: null,
        status: isFail ? 'fail' : 'pass',
        created_at: inspectionDate.toISOString(),
      })
    }
  }

  return todayInspections
}

const todayInspections = generateTodayInspections()

// Mock Inspections (600건 + 오늘 검사)
export const mockInspections: Inspection[] = [
  ...todayInspections,
  ...regularInspections,
  ...edgeCases,
].sort(
  (a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
)

// Mock Inspection Results
export const mockInspectionResults: InspectionResult[] = []

// 콘솔에 데이터 생성 정보 출력
if (import.meta.env.DEV) {
  console.log('📊 Mock Inspection Data Generated:')
  console.log(`  - Total Inspections: ${mockInspections.length}`)
  console.log(`  - Today's Inspections: ${todayInspections.length}`)
  console.log(`  - Regular: ${regularInspections.length}`)
  console.log(`  - Edge Cases: ${edgeCases.length}`)
  console.log(`  - Total Machines: ${mockMachines.length}`)
  console.log(
    `  - Failed Inspections: ${
      mockInspections.filter((i) => i.status === 'fail').length
    }`
  )
  console.log(
    `  - Pass Rate: ${(
      (mockInspections.filter((i) => i.status === 'pass').length /
        mockInspections.length) *
      100
    ).toFixed(1)}%`
  )
}
