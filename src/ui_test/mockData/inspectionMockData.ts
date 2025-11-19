import type { Database } from '@/types/database'

type Machine = Database['public']['Tables']['machines']['Row']
type Inspection = Database['public']['Tables']['inspections']['Row']
type InspectionResult =
  Database['public']['Tables']['inspection_results']['Row']

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
export const mockInspections: Inspection[] = []

// Mock Inspection Results
export const mockInspectionResults: InspectionResult[] = []
