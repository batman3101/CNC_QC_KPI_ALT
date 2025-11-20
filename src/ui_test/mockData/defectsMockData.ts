import type { Database } from '@/types/database'

type Defect = Database['public']['Tables']['defects']['Row']

// Mock Defects
export const mockDefects: Defect[] = [
  {
    id: 'defect-001',
    inspection_id: 'insp-002',
    defect_type: '스크래치',
    description: '제품 표면에 3cm 길이의 스크래치 발견',
    photo_url: null,
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'defect-002',
    inspection_id: 'insp-006',
    defect_type: '이물질',
    description: '제품 내부에 금속 이물질 발견',
    photo_url: null,
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'defect-003',
    inspection_id: 'insp-010',
    defect_type: '균열',
    description: '제품 모서리 부분에 미세 균열 확인',
    photo_url: null,
    status: 'in_progress',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'defect-004',
    inspection_id: 'insp-015',
    defect_type: '변형',
    description: '제품 중심부 변형 발견, 규격 초과',
    photo_url: null,
    status: 'pending',
    created_at: new Date(Date.now() - 1000 * 60 * 280).toISOString(),
  },
  {
    id: 'defect-005',
    inspection_id: 'insp-002',
    defect_type: '치수 불량',
    description: '직경이 설계 사양보다 0.5mm 초과',
    photo_url: null,
    status: 'resolved',
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
  {
    id: 'defect-006',
    inspection_id: 'insp-006',
    defect_type: '표면 거칠기',
    description: '표면 거칠기가 허용 범위 초과',
    photo_url: null,
    status: 'in_progress',
    created_at: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
  },
]

