import type { Database } from '@/types/database'
import { mockInspections } from './inspectionMockData'
import { generateDefects } from './mockDataGenerator'

type Defect = Database['public']['Tables']['defects']['Row']

// 불량 검사 데이터를 기반으로 불량 데이터 생성
export const mockDefects: Defect[] = generateDefects(mockInspections)

// 콘솔에 데이터 생성 정보 출력
if (import.meta.env.DEV) {
  console.log('🔴 Mock Defects Data Generated:')
  console.log(`  - Total Defects: ${mockDefects.length}`)
  console.log(
    `  - Pending: ${mockDefects.filter((d) => d.status === 'pending').length}`
  )
  console.log(
    `  - In Progress: ${
      mockDefects.filter((d) => d.status === 'in_progress').length
    }`
  )
  console.log(
    `  - Resolved: ${mockDefects.filter((d) => d.status === 'resolved').length}`
  )
}
