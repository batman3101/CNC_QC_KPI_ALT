import type { Database } from '@/types/database'
import type { DefectType } from '@/types/inspection'
import {
  mockProductModels,
  mockInspectionItems,
  getItemsByModelId,
} from '../mockData/managementMockData'
import { MOCK_USERS } from './mockAuthService'

type ProductModel = Database['public']['Tables']['product_models']['Row']
type ProductModelInsert =
  Database['public']['Tables']['product_models']['Insert']
type ProductModelUpdate =
  Database['public']['Tables']['product_models']['Update']

type InspectionItem = Database['public']['Tables']['inspection_items']['Row']
type InspectionItemInsert =
  Database['public']['Tables']['inspection_items']['Insert']
type InspectionItemUpdate =
  Database['public']['Tables']['inspection_items']['Update']

type User = Database['public']['Tables']['users']['Row']

// Mock 불량 유형 데이터
const mockDefectTypes: DefectType[] = [
  {
    id: 'defect-type-001',
    name: '치수 불량',
    description: '측정값이 공차 범위를 벗어남',
    created_at: new Date().toISOString(),
  },
  {
    id: 'defect-type-002',
    name: '표면 불량',
    description: '표면에 긁힘, 녹, 거칠기 초과 등',
    created_at: new Date().toISOString(),
  },
  {
    id: 'defect-type-003',
    name: '형상 불량',
    description: '각도, 평면도, 동심도, 직각도 불량',
    created_at: new Date().toISOString(),
  },
  {
    id: 'defect-type-004',
    name: '재질 불량',
    description: '재질 경도, 금속 성분, 열처리 불량',
    created_at: new Date().toISOString(),
  },
  {
    id: 'defect-type-005',
    name: '조립 불량',
    description: '부품 조립 누락, 순서 오류, 체결 불량',
    created_at: new Date().toISOString(),
  },
  {
    id: 'defect-type-006',
    name: '도장 불량',
    description: '도장 두께, 색상, 벗겨짐 불량',
    created_at: new Date().toISOString(),
  },
  {
    id: 'defect-type-007',
    name: '기타',
    description: '기타 불량',
    created_at: new Date().toISOString(),
  },
]

// In-memory storage (simulates database)
let productModelsData = [...mockProductModels]
let inspectionItemsData = [...mockInspectionItems]
let defectTypesData = [...mockDefectTypes]

// Helper function to simulate async delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ============= Product Models CRUD =============

export async function getProductModels(): Promise<ProductModel[]> {
  await delay(300)
  return productModelsData.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function getProductModelById(id: string): Promise<ProductModel | null> {
  await delay(200)
  return productModelsData.find((model) => model.id === id) || null
}

export async function createProductModel(
  data: ProductModelInsert
): Promise<ProductModel> {
  await delay(400)

  const newModel: ProductModel = {
    id: `pm-${Date.now()}`,
    name: data.name,
    code: data.code,
    created_at: new Date().toISOString(),
  }

  productModelsData.push(newModel)
  return newModel
}

export async function updateProductModel(
  id: string,
  data: ProductModelUpdate
): Promise<ProductModel> {
  await delay(400)

  const index = productModelsData.findIndex((model) => model.id === id)
  if (index === -1) {
    throw new Error('Product model not found')
  }

  productModelsData[index] = {
    ...productModelsData[index],
    ...data,
  }

  return productModelsData[index]
}

export async function deleteProductModel(id: string): Promise<void> {
  await delay(300)

  // Check if there are inspection items linked to this model
  const linkedItems = inspectionItemsData.filter((item) => item.model_id === id)
  if (linkedItems.length > 0) {
    throw new Error(
      `이 모델에 연결된 ${linkedItems.length}개의 검사 항목이 있습니다. 먼저 검사 항목을 삭제해주세요.`
    )
  }

  productModelsData = productModelsData.filter((model) => model.id !== id)
}

// ============= Inspection Items CRUD =============

export async function getInspectionItems(
  modelId?: string
): Promise<InspectionItem[]> {
  await delay(300)

  let items = inspectionItemsData

  if (modelId) {
    items = items.filter((item) => item.model_id === modelId)
  }

  return items.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function getInspectionItemById(
  id: string
): Promise<InspectionItem | null> {
  await delay(200)
  return inspectionItemsData.find((item) => item.id === id) || null
}

export async function createInspectionItem(
  data: InspectionItemInsert
): Promise<InspectionItem> {
  await delay(400)

  const newItem: InspectionItem = {
    id: `item-${Date.now()}`,
    model_id: data.model_id,
    name: data.name,
    standard_value: data.standard_value,
    tolerance_min: data.tolerance_min,
    tolerance_max: data.tolerance_max,
    unit: data.unit,
    data_type: data.data_type || 'numeric',
    created_at: new Date().toISOString(),
  }

  inspectionItemsData.push(newItem)
  return newItem
}

export async function updateInspectionItem(
  id: string,
  data: InspectionItemUpdate
): Promise<InspectionItem> {
  await delay(400)

  const index = inspectionItemsData.findIndex((item) => item.id === id)
  if (index === -1) {
    throw new Error('Inspection item not found')
  }

  inspectionItemsData[index] = {
    ...inspectionItemsData[index],
    ...data,
  }

  return inspectionItemsData[index]
}

export async function deleteInspectionItem(id: string): Promise<void> {
  await delay(300)
  inspectionItemsData = inspectionItemsData.filter((item) => item.id !== id)
}

// ============= Utility Functions =============

export async function getInspectionItemsByModelId(
  modelId: string
): Promise<InspectionItem[]> {
  await delay(200)
  return getItemsByModelId(modelId)
}

// ============= Defect Types =============

export async function getDefectTypes(): Promise<DefectType[]> {
  await delay(200)
  return defectTypesData.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

// ============= Users =============

export async function getUsers(): Promise<User[]> {
  await delay(200)
  return MOCK_USERS.map(user => ({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    created_at: user.created_at,
  }))
}
