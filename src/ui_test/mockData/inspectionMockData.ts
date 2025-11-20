import type { Database } from '@/types/database'
import { mockProductModels } from './modelMockData'

type Machine = Database['public']['Tables']['machines']['Row']
type Inspection = Database['public']['Tables']['inspections']['Row']
type InspectionResult =
  Database['public']['Tables']['inspection_results']['Row']

// Export models
export { mockProductModels }

// Mock Machines (설비는 다른 앱에서 관리하지만 선택을 위해 목록 제공)
export const mockMachines: Machine[] = [
  {
    id: 'machine-001',
    name: 'CNC 밀링 #1',
    model: 'DMU-50',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'machine-002',
    name: 'CNC 밀링 #2',
    model: 'DMU-50',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'machine-003',
    name: 'CNC 선반 #1',
    model: 'CTX-310',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'machine-004',
    name: 'CNC 선반 #2',
    model: 'CTX-310',
    status: 'maintenance',
    created_at: '2024-01-01T00:00:00Z',
  },
]

// Mock Inspections (for history)
export const mockInspections: Inspection[] = [
  {
    id: 'insp-001',
    user_id: 'user-001',
    machine_id: 'machine-001',
    model_id: 'model-BHB-002',
    status: 'pass',
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10분 전
  },
  {
    id: 'insp-002',
    user_id: 'user-002',
    machine_id: 'machine-002',
    model_id: 'model-SHA-001',
    status: 'fail',
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25분 전
  },
  {
    id: 'insp-003',
    user_id: 'user-001',
    machine_id: 'machine-003',
    model_id: 'model-FLC-003',
    status: 'pass',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45분 전
  },
  {
    id: 'insp-004',
    user_id: 'user-003',
    machine_id: 'machine-001',
    model_id: 'model-GAD-004',
    status: 'pass',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1시간 전
  },
  {
    id: 'insp-005',
    user_id: 'user-002',
    machine_id: 'machine-002',
    model_id: 'model-CNE-005',
    status: 'pass',
    created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(), // 1시간 15분 전
  },
  {
    id: 'insp-006',
    user_id: 'user-001',
    machine_id: 'machine-003',
    model_id: 'model-BHB-002',
    status: 'fail',
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1시간 30분 전
  },
  {
    id: 'insp-007',
    user_id: 'user-003',
    machine_id: 'machine-001',
    model_id: 'model-SHA-001',
    status: 'pass',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2시간 전
  },
  {
    id: 'insp-008',
    user_id: 'user-002',
    machine_id: 'machine-002',
    model_id: 'model-FLC-003',
    status: 'pass',
    created_at: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
  },
  {
    id: 'insp-009',
    user_id: 'user-001',
    machine_id: 'machine-003',
    model_id: 'model-GAD-004',
    status: 'pass',
    created_at: new Date(Date.now() - 1000 * 60 * 160).toISOString(),
  },
  {
    id: 'insp-010',
    user_id: 'user-003',
    machine_id: 'machine-001',
    model_id: 'model-CNE-005',
    status: 'fail',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3시간 전
  },
  {
    id: 'insp-011',
    user_id: 'user-002',
    machine_id: 'machine-002',
    model_id: 'model-BHB-002',
    status: 'pass',
    created_at: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
  },
  {
    id: 'insp-012',
    user_id: 'user-001',
    machine_id: 'machine-003',
    model_id: 'model-SHA-001',
    status: 'pass',
    created_at: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
  },
  {
    id: 'insp-013',
    user_id: 'user-003',
    machine_id: 'machine-001',
    model_id: 'model-FLC-003',
    status: 'pass',
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4시간 전
  },
  {
    id: 'insp-014',
    user_id: 'user-002',
    machine_id: 'machine-002',
    model_id: 'model-GAD-004',
    status: 'pass',
    created_at: new Date(Date.now() - 1000 * 60 * 260).toISOString(),
  },
  {
    id: 'insp-015',
    user_id: 'user-001',
    machine_id: 'machine-003',
    model_id: 'model-CNE-005',
    status: 'fail',
    created_at: new Date(Date.now() - 1000 * 60 * 280).toISOString(),
  },
]

// Mock Inspection Results
export const mockInspectionResults: InspectionResult[] = []
