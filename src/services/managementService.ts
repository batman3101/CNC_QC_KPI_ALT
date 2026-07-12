/**
 * Management Service - Supabase 전용
 * 제품 모델, 검사 항목, 검사 공정, 불량 유형 관리
 */

import { supabase } from '@/lib/supabase'
import { paginatedFetch } from '@/lib/supabasePagination'
import type { Database } from '@/types/database'
import { getUserDirectory, type DirectoryUser } from '@/services/userDirectoryService'
import { isOnline } from '@/lib/network'
import {
  cachedProductModels,
  cachedInspectionProcesses,
  cachedInspectionItems,
  cachedDefectTypes,
  cachedUsers,
  cachedMachines,
} from '@/lib/offlineReferenceCache'

/**
 * Read a reference list, falling back to the offline cache when there is no
 * network.
 *
 * Only the *reads the inspection form depends on* go through here. Writes and
 * the admin screens still require a connection, which is correct: you cannot
 * edit master data on a device that cannot see the master copy.
 *
 * When online this is a plain network read - a failed request still throws, so
 * a real error (an RLS denial, say) surfaces instead of being papered over with
 * a stale cached answer.
 */
async function readOfflineFirst<T>(
  label: string,
  fromNetwork: () => Promise<T>,
  fromCache: () => Promise<T | null>
): Promise<T> {
  if (isOnline()) return fromNetwork()

  const cached = await fromCache()
  if (cached === null) {
    // An empty cache offline does not mean "there are none". It means this
    // device has never been online since the cache was introduced. Say that,
    // instead of returning [] and rendering an empty dropdown that reads as a
    // configuration problem.
    throw new Error(`${label}: offline and no cached copy on this device`)
  }

  console.info(`[Offline] ${label}: served from cache`)
  return cached
}

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

// ============= Product Models CRUD =============

export async function getProductModels(): Promise<ProductModel[]> {
  return readOfflineFirst(
    'Product models',
    () =>
      paginatedFetch<ProductModel>((from, to) =>
        supabase
          .from('product_models')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to)
      ),
    cachedProductModels
  )
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
  return readOfflineFirst(
    'Inspection items',
    () =>
      paginatedFetch<InspectionItem>((from, to) => {
        let query = supabase
          .from('inspection_items')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to)
        if (modelId) {
          query = query.eq('model_id', modelId)
        }
        return query
      }),
    () => cachedInspectionItems(modelId)
  )
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
  return readOfflineFirst(
    'Inspection processes',
    () =>
      paginatedFetch<InspectionProcess>((from, to) =>
        supabase
          .from('inspection_processes')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to)
      ),
    cachedInspectionProcesses
  )
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
  return readOfflineFirst(
    'Defect types',
    () =>
      paginatedFetch<DefectTypeRow>((from, to) =>
        supabase
          .from('defect_types')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to)
      ),
    cachedDefectTypes
  )
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
    code: row.code,
    name: row.name,
    description: row.description || '',
    created_at: row.created_at,
  }))
}

// ============= Machines =============

export async function getMachines(factoryId?: string): Promise<Machine[]> {
  // Paginated to bypass Supabase's 1000-row default; without this, factories
  // with >1000 active machines silently truncate and UI lookups fall back to '-'.
  return paginatedFetch<Machine>((from, to) => {
    let query = supabase
      .from('machines')
      .select('*')
      .eq('status', 'active')
      .order('name', { ascending: true })
      .range(from, to)
    if (factoryId) {
      query = query.eq('factory_id', factoryId)
    }
    return query
  })
}

const MACHINE_SEARCH_LIMIT = 50

/**
 * 숫자만 입력된 경우 스마트 정렬: 정확히 일치하는 번호 우선
 * (예: "12" 입력 시 CNC-012가 CNC-112보다 먼저)
 *
 * Applied to both the online and the cached result, so an inspector sees the
 * same order either way.
 */
function sortMachinesForQuery(machines: Machine[], query: string): Machine[] {
  const isNumericOnly = /^\d+$/.test(query)
  if (!isNumericOnly || !query || machines.length === 0) return machines

  const paddedQuery = query.padStart(3, '0') // "12" → "012"

  return [...machines].sort((a, b) => {
    const aName = a.name || ''
    const bName = b.name || ''

    // CNC-XXX 형식에서 숫자 부분 추출
    const aMatch = aName.match(/CNC-(\d+)/i)
    const bMatch = bName.match(/CNC-(\d+)/i)

    if (aMatch && bMatch) {
      const aNum = aMatch[1]
      const bNum = bMatch[1]

      const aExact = aNum === paddedQuery
      const bExact = bNum === paddedQuery

      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1

      return parseInt(aNum, 10) - parseInt(bNum, 10)
    }

    return aName.localeCompare(bName)
  })
}

async function searchMachinesOnline(query: string, factoryId?: string): Promise<Machine[]> {
  let dbQuery = supabase
    .from('machines')
    .select('*')
    .eq('status', 'active')
    .order('name', { ascending: true })
    .limit(MACHINE_SEARCH_LIMIT)

  if (query) {
    dbQuery = dbQuery.ilike('name', `%${query}%`)
  }
  if (factoryId) {
    dbQuery = dbQuery.eq('factory_id', factoryId)
  }

  const { data, error } = await dbQuery
  if (error) throw error

  return data || []
}

/** The cached equivalent of the ilike + limit above. */
async function searchMachinesCached(query: string, factoryId?: string): Promise<Machine[] | null> {
  const machines = await cachedMachines(factoryId)
  if (machines === null) return null

  const needle = query.toLowerCase()
  const matches = needle
    ? machines.filter((m) => (m.name ?? '').toLowerCase().includes(needle))
    : machines

  return matches.slice(0, MACHINE_SEARCH_LIMIT)
}

export async function searchMachines(query: string, factoryId?: string): Promise<Machine[]> {
  const results = await readOfflineFirst(
    'Machines',
    () => searchMachinesOnline(query, factoryId),
    () => searchMachinesCached(query, factoryId)
  )

  return sortMachinesForQuery(results, query)
}

// ============= Users =============

export async function getUsers(): Promise<DirectoryUser[]> {
  return readOfflineFirst('User directory', getUserDirectory, cachedUsers)
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
    machining_process?: string | null
    process_code?: string | null
    name: string
    data_type: 'numeric' | 'ok_ng'
    standard_value?: number
    /** Upper tolerance offset (USL = standard_value + tolerance_plus) */
    tolerance_plus?: number
    /** Lower tolerance offset magnitude (LSL = standard_value - tolerance_minus) */
    tolerance_minus?: number
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

      const isNumeric = item.data_type === 'numeric'
      const standardValue = item.standard_value ?? 0
      // Convert ± offsets into absolute spec limits (LSL/USL) stored in the DB.
      const tolMin = isNumeric ? standardValue - (item.tolerance_minus ?? 0) : 0
      const tolMax = isNumeric ? standardValue + (item.tolerance_plus ?? 0) : 0

      await createInspectionItem({
        model_id: modelId,
        machining_process: item.machining_process || null,
        process_id: processId,
        name: item.name,
        data_type: item.data_type,
        standard_value: isNumeric ? standardValue : 0,
        tolerance_min: tolMin,
        tolerance_max: tolMax,
        unit: isNumeric ? item.unit ?? 'mm' : '',
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
