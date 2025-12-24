import type { Database } from '@/types/database'
import type { DefectType } from '@/types/inspection'
import { MOCK_USERS } from './mockAuthService'
import { MACHINES } from '../mockData/mockDataGenerator'

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

type InspectionProcess = Database['public']['Tables']['inspection_processes']['Row']
type InspectionProcessInsert = Database['public']['Tables']['inspection_processes']['Insert']
type InspectionProcessUpdate = Database['public']['Tables']['inspection_processes']['Update']

type DefectTypeRow = Database['public']['Tables']['defect_types']['Row']
type DefectTypeInsert = Database['public']['Tables']['defect_types']['Insert']
type DefectTypeUpdate = Database['public']['Tables']['defect_types']['Update']

type User = Database['public']['Tables']['users']['Row']

// ============= localStorage 키 =============
const STORAGE_KEYS = {
  PRODUCT_MODELS: 'cnc_qc_product_models',
  INSPECTION_ITEMS: 'cnc_qc_inspection_items',
  INSPECTION_PROCESSES: 'cnc_qc_inspection_processes',
  DEFECT_TYPES_ROWS: 'cnc_qc_defect_types_rows',
  DEFECT_TYPES: 'cnc_qc_defect_types',
}

// ============= localStorage 유틸리티 =============
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored) as T
    }
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error)
  }
  return defaultValue
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error)
  }
}

// Mock 검사 공정 데이터
const mockInspectionProcesses: InspectionProcess[] = [
  {
    id: 'process-001',
    code: 'IQC',
    name: '입고 검사',
    description: '원자재 및 부품 입고 시 검사',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'process-002',
    code: 'PQC',
    name: '공정 검사',
    description: '생산 공정 중 중간 검사',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'process-003',
    code: 'OQC',
    name: '출고 검사',
    description: '완제품 출고 전 최종 검사',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'process-004',
    code: 'H/G',
    name: 'H/G 검사',
    description: '치수 및 형상 검사',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'process-005',
    code: 'MMS',
    name: 'MMS 검사',
    description: '3차원 측정기 검사',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'process-006',
    code: 'CNC-OQC',
    name: 'CNC 출고 검사',
    description: 'CNC 가공 제품 출고 검사',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'process-007',
    code: 'POSITION',
    name: '위치 검사',
    description: '부품 위치 및 조립 상태 검사',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'process-008',
    code: '외관',
    name: '외관 검사',
    description: '제품 외관 및 표면 상태 검사',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'process-009',
    code: 'TRI',
    name: 'TRI 검사',
    description: '최종 검사 및 출하 승인',
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

// Mock 불량 유형 데이터
const mockDefectTypesRows: DefectTypeRow[] = [
  {
    id: 'defect-type-001',
    code: 'DIM',
    name: '치수 불량',
    description: '측정값이 공차 범위를 벗어남',
    severity: 'high',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'defect-type-002',
    code: 'SUR',
    name: '표면 불량',
    description: '표면에 긁힘, 녹, 거칠기 초과 등',
    severity: 'medium',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'defect-type-003',
    code: 'SHA',
    name: '형상 불량',
    description: '각도, 평면도, 동심도, 직각도 불량',
    severity: 'high',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'defect-type-004',
    code: 'MAT',
    name: '재질 불량',
    description: '재질 경도, 금속 성분, 열처리 불량',
    severity: 'high',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'defect-type-005',
    code: 'ASM',
    name: '조립 불량',
    description: '부품 조립 누락, 순서 오류, 체결 불량',
    severity: 'medium',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'defect-type-006',
    code: 'PAI',
    name: '도장 불량',
    description: '도장 두께, 색상, 벗겨짐 불량',
    severity: 'low',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'defect-type-007',
    code: 'OTH',
    name: '기타',
    description: '기타 불량',
    severity: 'low',
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

// Mock 불량 유형 데이터 (기존 타입 호환)
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

// In-memory storage with localStorage persistence
let productModelsData: ProductModel[] = loadFromStorage(STORAGE_KEYS.PRODUCT_MODELS, [])
let inspectionItemsData: InspectionItem[] = loadFromStorage(STORAGE_KEYS.INSPECTION_ITEMS, [])
let inspectionProcessesData: InspectionProcess[] = loadFromStorage(STORAGE_KEYS.INSPECTION_PROCESSES, mockInspectionProcesses)
let defectTypesRowsData: DefectTypeRow[] = loadFromStorage(STORAGE_KEYS.DEFECT_TYPES_ROWS, mockDefectTypesRows)
let defectTypesData: DefectType[] = loadFromStorage(STORAGE_KEYS.DEFECT_TYPES, mockDefectTypes)

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
  saveToStorage(STORAGE_KEYS.PRODUCT_MODELS, productModelsData)
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

  saveToStorage(STORAGE_KEYS.PRODUCT_MODELS, productModelsData)
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
  saveToStorage(STORAGE_KEYS.PRODUCT_MODELS, productModelsData)
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
  saveToStorage(STORAGE_KEYS.INSPECTION_ITEMS, inspectionItemsData)
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

  saveToStorage(STORAGE_KEYS.INSPECTION_ITEMS, inspectionItemsData)
  return inspectionItemsData[index]
}

export async function deleteInspectionItem(id: string): Promise<void> {
  await delay(300)
  inspectionItemsData = inspectionItemsData.filter((item) => item.id !== id)
  saveToStorage(STORAGE_KEYS.INSPECTION_ITEMS, inspectionItemsData)
}

// ============= Utility Functions =============

export async function getInspectionItemsByModelId(
  modelId: string
): Promise<InspectionItem[]> {
  await delay(200)
  return inspectionItemsData.filter((item) => item.model_id === modelId)
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

// ============= Inspection Processes CRUD =============

export async function getInspectionProcesses(): Promise<InspectionProcess[]> {
  await delay(200)
  return inspectionProcessesData.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function getInspectionProcessById(id: string): Promise<InspectionProcess | null> {
  await delay(200)
  return inspectionProcessesData.find((process) => process.id === id) || null
}

export async function createInspectionProcess(
  data: InspectionProcessInsert
): Promise<InspectionProcess> {
  await delay(400)

  const newProcess: InspectionProcess = {
    id: `process-${Date.now()}`,
    code: data.code,
    name: data.name,
    description: data.description || null,
    is_active: data.is_active ?? true,
    created_at: new Date().toISOString(),
  }

  inspectionProcessesData.push(newProcess)
  saveToStorage(STORAGE_KEYS.INSPECTION_PROCESSES, inspectionProcessesData)
  return newProcess
}

export async function updateInspectionProcess(
  id: string,
  data: InspectionProcessUpdate
): Promise<InspectionProcess> {
  await delay(300)

  const index = inspectionProcessesData.findIndex((process) => process.id === id)
  if (index === -1) {
    throw new Error('Inspection process not found')
  }

  inspectionProcessesData[index] = {
    ...inspectionProcessesData[index],
    ...data,
  }

  saveToStorage(STORAGE_KEYS.INSPECTION_PROCESSES, inspectionProcessesData)
  return inspectionProcessesData[index]
}

export async function deleteInspectionProcess(id: string): Promise<void> {
  await delay(300)
  inspectionProcessesData = inspectionProcessesData.filter(
    (process) => process.id !== id
  )
  saveToStorage(STORAGE_KEYS.INSPECTION_PROCESSES, inspectionProcessesData)
}

// ============= Defect Types CRUD =============

export async function getDefectTypesRows(): Promise<DefectTypeRow[]> {
  await delay(200)
  return defectTypesRowsData.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function getDefectTypeRowById(id: string): Promise<DefectTypeRow | null> {
  await delay(200)
  return defectTypesRowsData.find((type) => type.id === id) || null
}

export async function createDefectTypeRow(
  data: DefectTypeInsert
): Promise<DefectTypeRow> {
  await delay(400)

  const newType: DefectTypeRow = {
    id: `defect-type-${Date.now()}`,
    code: data.code,
    name: data.name,
    description: data.description || null,
    severity: data.severity || 'medium',
    is_active: data.is_active ?? true,
    created_at: new Date().toISOString(),
  }

  defectTypesRowsData.push(newType)

  // Update old defectTypesData for backward compatibility
  defectTypesData.push({
    id: newType.id,
    name: newType.name,
    description: newType.description || '',
    created_at: newType.created_at,
  })

  saveToStorage(STORAGE_KEYS.DEFECT_TYPES_ROWS, defectTypesRowsData)
  saveToStorage(STORAGE_KEYS.DEFECT_TYPES, defectTypesData)
  return newType
}

export async function updateDefectTypeRow(
  id: string,
  data: DefectTypeUpdate
): Promise<DefectTypeRow> {
  await delay(300)

  const index = defectTypesRowsData.findIndex((type) => type.id === id)
  if (index === -1) {
    throw new Error('Defect type not found')
  }

  defectTypesRowsData[index] = {
    ...defectTypesRowsData[index],
    ...data,
  }

  // Update old defectTypesData for backward compatibility
  const oldIndex = defectTypesData.findIndex((type) => type.id === id)
  if (oldIndex !== -1) {
    defectTypesData[oldIndex] = {
      ...defectTypesData[oldIndex],
      name: data.name || defectTypesData[oldIndex].name,
      description: data.description !== undefined ? (data.description || '') : defectTypesData[oldIndex].description,
    }
  }

  saveToStorage(STORAGE_KEYS.DEFECT_TYPES_ROWS, defectTypesRowsData)
  saveToStorage(STORAGE_KEYS.DEFECT_TYPES, defectTypesData)
  return defectTypesRowsData[index]
}

export async function deleteDefectTypeRow(id: string): Promise<void> {
  await delay(300)
  defectTypesRowsData = defectTypesRowsData.filter((type) => type.id !== id)
  defectTypesData = defectTypesData.filter((type) => type.id !== id)
  saveToStorage(STORAGE_KEYS.DEFECT_TYPES_ROWS, defectTypesRowsData)
  saveToStorage(STORAGE_KEYS.DEFECT_TYPES, defectTypesData)
}

// ============= Machines =============

export interface Machine {
  id: string
  name: string
  model: string
}

export async function getMachines(): Promise<Machine[]> {
  await delay(100) // 빠른 응답
  return MACHINES
}

export async function searchMachines(query: string): Promise<Machine[]> {
  await delay(50) // 검색은 더 빠르게
  if (!query) return MACHINES.slice(0, 50) // 빈 검색어면 처음 50개만
  const lowerQuery = query.toLowerCase()
  return MACHINES.filter((m) => m.name.toLowerCase().includes(lowerQuery)).slice(0, 50)
}

// ============= Bulk Import Functions =============

export interface BulkSaveResult {
  success: number
  failed: number
  errors: string[]
}

/**
 * Bulk save product models
 */
export async function bulkCreateProductModels(
  data: Array<{ code: string; name: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<BulkSaveResult> {
  const result: BulkSaveResult = { success: 0, failed: 0, errors: [] }

  for (let i = 0; i < data.length; i++) {
    try {
      await createProductModel(data[i])
      result.success++
    } catch (error) {
      result.failed++
      result.errors.push(`Row ${i + 2}: ${(error as Error).message}`)
    }
    onProgress?.(i + 1, data.length)
  }

  return result
}

/**
 * Bulk save inspection items
 */
export async function bulkCreateInspectionItems(
  data: Array<{
    model_code: string
    name: string
    data_type: 'numeric' | 'ok_ng'
    standard_value?: number
    tolerance_min?: number
    tolerance_max?: number
    unit?: string
  }>,
  onProgress?: (current: number, total: number) => void
): Promise<BulkSaveResult> {
  const result: BulkSaveResult = { success: 0, failed: 0, errors: [] }

  // Get model code to ID mapping
  const models = await getProductModels()
  const modelCodeToId = new Map(models.map((m) => [m.code.toLowerCase(), m.id]))

  for (let i = 0; i < data.length; i++) {
    try {
      const item = data[i]
      const modelId = modelCodeToId.get(item.model_code.toLowerCase())

      if (!modelId) {
        throw new Error(`Model not found: ${item.model_code}`)
      }

      await createInspectionItem({
        model_id: modelId,
        name: item.name,
        data_type: item.data_type,
        standard_value: item.standard_value ?? 0,
        tolerance_min: item.tolerance_min ?? 0,
        tolerance_max: item.tolerance_max ?? 0,
        unit: item.unit ?? 'mm',
      })
      result.success++
    } catch (error) {
      result.failed++
      result.errors.push(`Row ${i + 2}: ${(error as Error).message}`)
    }
    onProgress?.(i + 1, data.length)
  }

  return result
}

/**
 * Bulk save inspection processes
 */
export async function bulkCreateInspectionProcesses(
  data: Array<{
    code: string
    name: string
    description?: string
    is_active?: boolean
  }>,
  onProgress?: (current: number, total: number) => void
): Promise<BulkSaveResult> {
  const result: BulkSaveResult = { success: 0, failed: 0, errors: [] }

  for (let i = 0; i < data.length; i++) {
    try {
      await createInspectionProcess({
        code: data[i].code,
        name: data[i].name,
        description: data[i].description,
        is_active: data[i].is_active ?? true,
      })
      result.success++
    } catch (error) {
      result.failed++
      result.errors.push(`Row ${i + 2}: ${(error as Error).message}`)
    }
    onProgress?.(i + 1, data.length)
  }

  return result
}

/**
 * Bulk save defect types
 */
export async function bulkCreateDefectTypes(
  data: Array<{
    code: string
    name: string
    description?: string
    severity: 'low' | 'medium' | 'high'
    is_active?: boolean
  }>,
  onProgress?: (current: number, total: number) => void
): Promise<BulkSaveResult> {
  const result: BulkSaveResult = { success: 0, failed: 0, errors: [] }

  for (let i = 0; i < data.length; i++) {
    try {
      await createDefectTypeRow({
        code: data[i].code,
        name: data[i].name,
        description: data[i].description,
        severity: data[i].severity,
        is_active: data[i].is_active ?? true,
      })
      result.success++
    } catch (error) {
      result.failed++
      result.errors.push(`Row ${i + 2}: ${(error as Error).message}`)
    }
    onProgress?.(i + 1, data.length)
  }

  return result
}

/**
 * Get all product model codes (for duplicate check)
 */
export async function getProductModelCodes(): Promise<string[]> {
  const models = await getProductModels()
  return models.map((m) => m.code)
}

/**
 * Get all inspection process codes (for duplicate check)
 */
export async function getInspectionProcessCodes(): Promise<string[]> {
  const processes = await getInspectionProcesses()
  return processes.map((p) => p.code)
}

/**
 * Get all defect type codes (for duplicate check)
 */
export async function getDefectTypeCodes(): Promise<string[]> {
  const types = await getDefectTypesRows()
  return types.map((t) => t.code)
}
