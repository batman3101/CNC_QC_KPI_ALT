import type { Database } from '@/types/database'

type ProductModel = Database['public']['Tables']['product_models']['Row']
type InspectionItem = Database['public']['Tables']['inspection_items']['Row']

// Mock Product Models
export const mockProductModels: ProductModel[] = [
  {
    id: 'pm-001',
    name: 'CNC-A1000',
    code: 'A1000',
    created_at: '2024-01-15T09:00:00Z',
  },
  {
    id: 'pm-002',
    name: 'CNC-B2000',
    code: 'B2000',
    created_at: '2024-02-01T10:30:00Z',
  },
  {
    id: 'pm-003',
    name: 'CNC-C3000',
    code: 'C3000',
    created_at: '2024-02-20T14:15:00Z',
  },
  {
    id: 'pm-004',
    name: 'CNC-D4000',
    code: 'D4000',
    created_at: '2024-03-10T11:00:00Z',
  },
  {
    id: 'pm-005',
    name: 'CNC-E5000',
    code: 'E5000',
    created_at: '2024-04-05T08:45:00Z',
  },
]

// Mock Inspection Items
export const mockInspectionItems: InspectionItem[] = [
  // Items for CNC-A1000
  {
    id: 'item-001',
    model_id: 'pm-001',
    name: '외경',
    standard_value: 50.0,
    tolerance_min: 49.95,
    tolerance_max: 50.05,
    unit: 'mm',
    data_type: 'numeric',
    created_at: '2024-01-15T09:30:00Z',
  },
  {
    id: 'item-002',
    model_id: 'pm-001',
    name: '내경',
    standard_value: 30.0,
    tolerance_min: 29.98,
    tolerance_max: 30.02,
    unit: 'mm',
    data_type: 'numeric',
    created_at: '2024-01-15T09:35:00Z',
  },
  {
    id: 'item-003',
    model_id: 'pm-001',
    name: '높이',
    standard_value: 100.0,
    tolerance_min: 99.9,
    tolerance_max: 100.1,
    unit: 'mm',
    data_type: 'numeric',
    created_at: '2024-01-15T09:40:00Z',
  },
  {
    id: 'item-004',
    model_id: 'pm-001',
    name: '표면 거칠기',
    standard_value: 0,
    tolerance_min: 0,
    tolerance_max: 0,
    unit: '',
    data_type: 'ok_ng',
    created_at: '2024-01-15T09:45:00Z',
  },

  // Items for CNC-B2000
  {
    id: 'item-005',
    model_id: 'pm-002',
    name: '외경',
    standard_value: 80.0,
    tolerance_min: 79.92,
    tolerance_max: 80.08,
    unit: 'mm',
    data_type: 'numeric',
    created_at: '2024-02-01T11:00:00Z',
  },
  {
    id: 'item-006',
    model_id: 'pm-002',
    name: '길이',
    standard_value: 200.0,
    tolerance_min: 199.8,
    tolerance_max: 200.2,
    unit: 'mm',
    data_type: 'numeric',
    created_at: '2024-02-01T11:05:00Z',
  },
  {
    id: 'item-007',
    model_id: 'pm-002',
    name: '나사산 피치',
    standard_value: 2.0,
    tolerance_min: 1.98,
    tolerance_max: 2.02,
    unit: 'mm',
    data_type: 'numeric',
    created_at: '2024-02-01T11:10:00Z',
  },

  // Items for CNC-C3000
  {
    id: 'item-008',
    model_id: 'pm-003',
    name: '두께',
    standard_value: 15.0,
    tolerance_min: 14.95,
    tolerance_max: 15.05,
    unit: 'mm',
    data_type: 'numeric',
    created_at: '2024-02-20T14:30:00Z',
  },
  {
    id: 'item-009',
    model_id: 'pm-003',
    name: '폭',
    standard_value: 120.0,
    tolerance_min: 119.85,
    tolerance_max: 120.15,
    unit: 'mm',
    data_type: 'numeric',
    created_at: '2024-02-20T14:35:00Z',
  },
  {
    id: 'item-010',
    model_id: 'pm-003',
    name: '평면도',
    standard_value: 0,
    tolerance_min: 0,
    tolerance_max: 0,
    unit: '',
    data_type: 'ok_ng',
    created_at: '2024-02-20T14:40:00Z',
  },

  // Items for CNC-D4000
  {
    id: 'item-011',
    model_id: 'pm-004',
    name: '직경',
    standard_value: 25.0,
    tolerance_min: 24.97,
    tolerance_max: 25.03,
    unit: 'mm',
    data_type: 'numeric',
    created_at: '2024-03-10T11:15:00Z',
  },
  {
    id: 'item-012',
    model_id: 'pm-004',
    name: '홀 깊이',
    standard_value: 50.0,
    tolerance_min: 49.9,
    tolerance_max: 50.1,
    unit: 'mm',
    data_type: 'numeric',
    created_at: '2024-03-10T11:20:00Z',
  },

  // Items for CNC-E5000
  {
    id: 'item-013',
    model_id: 'pm-005',
    name: '외경',
    standard_value: 60.0,
    tolerance_min: 59.94,
    tolerance_max: 60.06,
    unit: 'mm',
    data_type: 'numeric',
    created_at: '2024-04-05T09:00:00Z',
  },
  {
    id: 'item-014',
    model_id: 'pm-005',
    name: '원통도',
    standard_value: 0,
    tolerance_min: 0,
    tolerance_max: 0,
    unit: '',
    data_type: 'ok_ng',
    created_at: '2024-04-05T09:05:00Z',
  },
]

// Helper function to get items by model ID
export function getItemsByModelId(modelId: string): InspectionItem[] {
  return mockInspectionItems.filter((item) => item.model_id === modelId)
}
