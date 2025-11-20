import type { Database } from '@/types/database'

type ProductModel = Database['public']['Tables']['product_models']['Row']

// Mock Product Models
export const mockProductModels: ProductModel[] = [
  {
    id: 'model-BHB-002',
    code: 'BHB-002',
    name: '베어링 하우징 BHB-002',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'model-SHA-001',
    code: 'SHA-001',
    name: '샤프트 SHA-001',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'model-FLC-003',
    code: 'FLC-003',
    name: '플랜지 커플링 FLC-003',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'model-GAD-004',
    code: 'GAD-004',
    name: '기어 어댑터 GAD-004',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'model-CNE-005',
    code: 'CNE-005',
    name: '커넥터 CNE-005',
    created_at: '2024-01-01T00:00:00Z',
  },
]

