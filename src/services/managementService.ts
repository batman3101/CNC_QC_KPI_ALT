/**
 * Management Service - Supabase 전용
 * 제품 모델, 검사 항목, 검사 공정, 불량 유형 관리
 */

import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type ProductModel = Database['public']['Tables']['product_models']['Row']
type ProductModelInsert = Database['public']['Tables']['product_models']['Insert']
type ProductModelUpdate = Database['public']['Tables']['product_models']['Update']

type InspectionItem = Database['public']['Tables']['inspection_items']['Row']
type InspectionItemInsert = Database['public']['Tables']['inspection_items']['Insert']
type InspectionItemUpdate = Database['public']['Tables']['inspection_items']['Update']

type InspectionProcess = Database['public']['Tables']['inspection_processes']['Row']
type InspectionProcessInsert = Database['public']['Tables']['inspection_processes']['Insert']
type InspectionProcessUpdate = Database['public']['Tables']['inspection_processes']['Update']

type DefectTypeRow = Database['public']['Tables']['defect_types']['Row']
type DefectTypeInsert = Database['public']['Tables']['defect_types']['Insert']
type DefectTypeUpdate = Database['public']['Tables']['defect_types']['Update']

type Machine = Database['public']['Tables']['machines']['Row']
type User = Database['public']['Tables']['users']['Row']

// ============= Product Models CRUD =============

export async function getProductModels(): Promise<ProductModel[]> {
  const { data, error } = await supabase
    .from('product_models')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getProductModelById(id: string): Promise<ProductModel | null> {
  const { data, error } = await supabase
    .from('product_models')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createProductModel(data: ProductModelInsert): Promise<ProductModel> {
  const { data: newModel, error } = await supabase
    .from('product_models')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return newModel
}

export async function updateProductModel(id: string, data: ProductModelUpdate): Promise<ProductModel> {
  const { data: updatedModel, error } = await supabase
    .from('product_models')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return updatedModel
}

export async function deleteProductModel(id: string): Promise<void> {
  // Check if there are inspection items linked to this model
  const { count } = await supabase
    .from('inspection_items')
    .select('*', { count: 'exact', head: true })
    .eq('model_id', id)

  if (count && count > 0) {
    throw new Error(`이 모델에 연결된 ${count}개의 검사 항목이 있습니다. 먼저 검사 항목을 삭제해주세요.`)
  }

  const { error } = await supabase
    .from('product_models')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============= Inspection Items CRUD =============

export async function getInspectionItems(modelId?: string): Promise<InspectionItem[]> {
  let query = supabase
    .from('inspection_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (modelId) {
    query = query.eq('model_id', modelId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getInspectionItemById(id: string): Promise<InspectionItem | null> {
  const { data, error } = await supabase
    .from('inspection_items')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createInspectionItem(data: InspectionItemInsert): Promise<InspectionItem> {
  const { data: newItem, error } = await supabase
    .from('inspection_items')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return newItem
}

export async function updateInspectionItem(id: string, data: InspectionItemUpdate): Promise<InspectionItem> {
  const { data: updatedItem, error } = await supabase
    .from('inspection_items')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return updatedItem
}

export async function deleteInspectionItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('inspection_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getInspectionItemsByModelId(modelId: string): Promise<InspectionItem[]> {
  return getInspectionItems(modelId)
}

// ============= Inspection Processes CRUD =============

export async function getInspectionProcesses(): Promise<InspectionProcess[]> {
  const { data, error } = await supabase
    .from('inspection_processes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getInspectionProcessById(id: string): Promise<InspectionProcess | null> {
  const { data, error } = await supabase
    .from('inspection_processes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createInspectionProcess(data: InspectionProcessInsert): Promise<InspectionProcess> {
  const { data: newProcess, error } = await supabase
    .from('inspection_processes')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return newProcess
}

export async function updateInspectionProcess(id: string, data: InspectionProcessUpdate): Promise<InspectionProcess> {
  const { data: updatedProcess, error } = await supabase
    .from('inspection_processes')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return updatedProcess
}

export async function deleteInspectionProcess(id: string): Promise<void> {
  const { error } = await supabase
    .from('inspection_processes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============= Defect Types CRUD =============

export async function getDefectTypesRows(): Promise<DefectTypeRow[]> {
  const { data, error } = await supabase
    .from('defect_types')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getDefectTypeRowById(id: string): Promise<DefectTypeRow | null> {
  const { data, error } = await supabase
    .from('defect_types')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createDefectTypeRow(data: DefectTypeInsert): Promise<DefectTypeRow> {
  const { data: newType, error } = await supabase
    .from('defect_types')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return newType
}

export async function updateDefectTypeRow(id: string, data: DefectTypeUpdate): Promise<DefectTypeRow> {
  const { data: updatedType, error } = await supabase
    .from('defect_types')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return updatedType
}

export async function deleteDefectTypeRow(id: string): Promise<void> {
  const { error } = await supabase
    .from('defect_types')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Legacy compatibility
export async function getDefectTypes() {
  const rows = await getDefectTypesRows()
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description || '',
    created_at: row.created_at,
  }))
}

// ============= Machines =============

export async function getMachines(): Promise<Machine[]> {
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .eq('status', 'active')
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function searchMachines(query: string): Promise<Machine[]> {
  let dbQuery = supabase
    .from('machines')
    .select('*')
    .eq('status', 'active')
    .order('name', { ascending: true })
    .limit(50)

  if (query) {
    dbQuery = dbQuery.ilike('name', `%${query}%`)
  }

  const { data, error } = await dbQuery

  if (error) throw error
  return data || []
}

// ============= Users =============

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// ============= Bulk Import Functions =============

export interface BulkSaveResult {
  success: number
  failed: number
  errors: string[]
}

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

export async function bulkCreateInspectionItems(
  data: Array<{
    model_code: string
    process_code?: string | null
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

  const models = await getProductModels()
  const modelCodeToId = new Map(models.map((m) => [m.code.toLowerCase(), m.id]))

  const processes = await getInspectionProcesses()
  const processCodeToId = new Map(processes.map((p) => [p.code.toLowerCase(), p.id]))

  for (let i = 0; i < data.length; i++) {
    try {
      const item = data[i]
      const modelId = modelCodeToId.get(item.model_code.toLowerCase())

      if (!modelId) {
        throw new Error(`Model not found: ${item.model_code}`)
      }

      // Convert process_code to process_id (optional)
      let processId: string | null = null
      if (item.process_code) {
        processId = processCodeToId.get(item.process_code.toLowerCase()) || null
      }

      await createInspectionItem({
        model_id: modelId,
        process_id: processId,
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

export async function getProductModelCodes(): Promise<string[]> {
  const models = await getProductModels()
  return models.map((m) => m.code)
}

export async function getInspectionProcessCodes(): Promise<string[]> {
  const processes = await getInspectionProcesses()
  return processes.map((p) => p.code)
}

export async function getDefectTypeCodes(): Promise<string[]> {
  const types = await getDefectTypesRows()
  return types.map((t) => t.code)
}
