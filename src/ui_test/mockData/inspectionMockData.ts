import type { Database } from '@/types/database'
import { mockProductModels } from './modelMockData'
import {
  generateInspections,
  generateEdgeCases,
  MACHINES as GENERATED_MACHINES,
} from './mockDataGenerator'

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

// Mock Inspections (600건)
export const mockInspections: Inspection[] = [
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
