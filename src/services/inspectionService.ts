/**
 * Inspection Service - Supabase 전용
 * 검사 실행, 검사 결과, 불량 관리
 */

import { supabase } from '@/lib/supabase'
import { paginatedFetch } from '@/lib/supabasePagination'
import type { Database } from '@/types/database'
import imageCompression from 'browser-image-compression'

type Inspection = Database['public']['Tables']['inspections']['Row']
type InspectionInsert = Database['public']['Tables']['inspections']['Insert']
type InspectionUpdate = Database['public']['Tables']['inspections']['Update']

type InspectionResult = Database['public']['Tables']['inspection_results']['Row']
type InspectionResultInsert = Database['public']['Tables']['inspection_results']['Insert']

type Defect = Database['public']['Tables']['defects']['Row']
type DefectInsert = Database['public']['Tables']['defects']['Insert']
type DefectUpdate = Database['public']['Tables']['defects']['Update']

// Note: Extended relation types removed since Supabase requires foreign keys for joins
// Fetch related data separately when needed

// ============= Inspections CRUD =============

export async function getInspectionById(id: string): Promise<Inspection | null> {
  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createInspection(data: InspectionInsert): Promise<Inspection> {
  const { data: newInspection, error } = await supabase
    .from('inspections')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return newInspection
}

export async function updateInspection(id: string, data: InspectionUpdate): Promise<Inspection> {
  const { data: updatedInspection, error } = await supabase
    .from('inspections')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return updatedInspection
}

export async function deleteInspection(id: string): Promise<void> {
  const { error } = await supabase
    .from('inspections')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============= Inspection Results =============

export async function getInspectionResults(inspectionId: string): Promise<InspectionResult[]> {
  const { data, error } = await supabase
    .from('inspection_results')
    .select('*')
    .eq('inspection_id', inspectionId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createInspectionResult(data: InspectionResultInsert): Promise<InspectionResult> {
  const { data: newResult, error } = await supabase
    .from('inspection_results')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return newResult
}

export async function createInspectionResults(data: InspectionResultInsert[]): Promise<InspectionResult[]> {
  const { data: newResults, error } = await supabase
    .from('inspection_results')
    .insert(data)
    .select()

  if (error) throw error
  return newResults || []
}

// ============= Defects CRUD =============

/**
 * Columns the defect list is allowed to sort by. The sort key reaches
 * PostgREST's `order` clause, so it is matched against this list rather than
 * passed through from the UI.
 */
const DEFECT_SORT_COLUMNS = [
  'created_at',
  'model_id',
  'defect_type',
  'description',
  'status',
] as const

export type DefectSortColumn = (typeof DEFECT_SORT_COLUMNS)[number]

export interface DefectsPageParams {
  /** Zero-based page index. */
  page: number
  pageSize: number
  status?: string
  defectType?: string
  modelId?: string
  startDate?: string
  endDate?: string
  factoryId?: string
  sort?: { key: string; direction: 'asc' | 'desc' } | null
}

/**
 * A defect row plus the inspection quantity behind it.
 *
 * Auto-created defects carry no description: a machine-written sentence would
 * have to be written in one language and would then be wrong for every user who
 * does not read it. The quantity lives on the inspection, so the UI joins it and
 * renders the sentence at display time in the reader's own language.
 */
export interface DefectListRow extends Defect {
  inspection_defect_quantity: number | null
}

export interface DefectsPage {
  rows: DefectListRow[]
  /** Rows matching the filters across the whole table, not just this page. */
  totalCount: number
}

/**
 * Fetch a single page of defects, filtered and sorted by the database.
 *
 * The list previously called `getDefects()`, which walked every 1000-row page
 * until the table was exhausted — ~15k rows over 16 round trips to render 20.
 * That cost grows with the table, so paging is done server-side here.
 */
export async function getDefectsPage(params: DefectsPageParams): Promise<DefectsPage> {
  const from = params.page * params.pageSize
  const to = from + params.pageSize - 1

  const sortKey = DEFECT_SORT_COLUMNS.includes(params.sort?.key as DefectSortColumn)
    ? (params.sort!.key as DefectSortColumn)
    : 'created_at'
  const ascending = params.sort ? params.sort.direction === 'asc' : false

  let query = supabase
    .from('defects')
    // The inspection quantity is joined so the UI can render a translated
    // sentence for auto-created defects instead of the DB storing one.
    .select('*, inspections(defect_quantity)', { count: 'exact' })
    .order(sortKey, { ascending })
    .range(from, to)

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status as 'pending' | 'in_progress' | 'resolved')
  }
  if (params.defectType && params.defectType !== 'all') {
    query = query.eq('defect_type', params.defectType)
  }
  if (params.modelId) query = query.eq('model_id', params.modelId)
  if (params.startDate) query = query.gte('created_at', params.startDate)
  if (params.endDate) query = query.lte('created_at', params.endDate)
  if (params.factoryId) query = query.eq('factory_id', params.factoryId)

  const { data, error, count } = await query
  if (error) throw error

  const rows: DefectListRow[] = (data ?? []).map((row) => {
    const { inspections, ...defect } = row as typeof row & {
      inspections: { defect_quantity: number } | null
    }
    return {
      ...(defect as unknown as Defect),
      inspection_defect_quantity: inspections?.defect_quantity ?? null,
    }
  })

  return { rows, totalCount: count ?? 0 }
}

export async function getDefectById(id: string): Promise<Defect | null> {
  const { data, error } = await supabase
    .from('defects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createDefect(data: DefectInsert): Promise<Defect> {
  const { data: newDefect, error } = await supabase
    .from('defects')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return newDefect
}

export async function updateDefect(id: string, data: DefectUpdate): Promise<Defect> {
  const { data: updatedDefect, error } = await supabase
    .from('defects')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return updatedDefect
}

export async function deleteDefect(id: string): Promise<void> {
  const { error } = await supabase
    .from('defects')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============= Combined Operations =============

/**
 * Everything one inspection entry produces, saved in a single transaction.
 *
 * This used to be three requests in a row (inspections, inspection_results,
 * defects). A client that stopped after the first left a rejected inspection
 * with no defect record, and the queue's retry then inserted the inspection a
 * second time. `clientRef` is the queue row's id: the server keeps it unique,
 * so replaying the same item returns the row it already created.
 */
export interface InspectionSubmitData {
  /** Idempotency key: the device queue id (offline_<ms>_<rand>). */
  clientRef: string
  userId: string
  machineId?: string | null
  modelId: string
  inspectionProcess: string
  inspectionQuantity: number
  defectQuantity: number
  results?: Array<{
    itemId: string
    measuredValue: number
    result: 'pass' | 'fail'
  }>
  defectType?: string | null
  defectDescription?: string | null
  photoUrl?: string | null
  factoryId?: string | null
}

/** Returns the inspection id - the existing one if this clientRef was already saved. */
export async function submitInspectionRecord(data: InspectionSubmitData): Promise<string> {
  const { data: inspectionId, error } = await supabase.rpc('submit_inspection_record', {
    p_client_ref: data.clientRef,
    p_user_id: data.userId,
    p_model_id: data.modelId,
    p_inspection_process: data.inspectionProcess,
    p_inspection_quantity: data.inspectionQuantity,
    p_defect_quantity: data.defectQuantity,
    p_factory_id: data.factoryId || null,
    p_machine_id: data.machineId || null,
    p_defect_type: data.defectType || null,
    p_photo_url: data.photoUrl || null,
    // Only what the inspector actually typed. The old fallback wrote a Korean
    // sentence into the DB, which no component-level i18n can undo - it is a
    // persisted value, so every Vietnamese user read it in Korean forever.
    p_defect_description: data.defectDescription?.trim() || null,
    p_results: (data.results ?? []).map(r => ({
      item_id: r.itemId,
      measured_value: r.measuredValue,
      result: r.result,
    })),
  })

  if (error) throw error
  if (typeof inspectionId !== 'string') {
    throw new Error('submit_inspection_record returned no inspection id')
  }
  return inspectionId
}

// ============= Statistics =============

// ============= Dashboard =============

export interface DashboardTodayStats {
  inspectionCount: number
  inspectionQty: number
  defectQty: number
  failedCount: number
}

/** Today's KPI cards, counted in Postgres over the current business day. */
export async function getDashboardTodayStats(
  factoryId?: string
): Promise<DashboardTodayStats> {
  const { data, error } = await supabase.rpc('get_dashboard_today_stats', {
    p_factory: factoryId ?? null,
  })
  if (error) throw error

  const row = (data ?? [])[0]
  return {
    inspectionCount: row?.inspection_count ?? 0,
    inspectionQty: row?.inspection_qty ?? 0,
    defectQty: row?.defect_qty ?? 0,
    failedCount: row?.failed_count ?? 0,
  }
}

export interface RecentInspection {
  id: string
  created_at: string
  machine_id: string | null
  model_id: string | null
  status: string
  /**
   * Position of this inspection within its own calendar day, computed by the
   * database. The dashboard renders it as INS-MMDD-XXX. Deriving it in the
   * browser would mean holding every inspection of that day in memory, which
   * is why the dashboard used to fetch the entire table.
   */
  day_seq: number
}

export async function getRecentInspections(
  factoryId?: string,
  limit = 10
): Promise<RecentInspection[]> {
  const { data, error } = await supabase.rpc('get_dashboard_recent_inspections', {
    p_factory: factoryId ?? null,
    p_limit: limit,
  })
  if (error) throw error
  return (data ?? []) as RecentInspection[]
}

/**
 * Defects that still need action (pending or in progress).
 *
 * The AI insights screen only ever showed unresolved defects, but reached them
 * by pulling the whole defects table and filtering client-side. Filtering here
 * turns ~15k rows into ~150.
 */
export async function getUnresolvedDefects(factoryId?: string): Promise<Defect[]> {
  // Paged: a plain select stops at PostgREST's 1000-row cap, so a backlog past
  // 1000 would be silently truncated and the AI prompt would report exactly
  // "1000 unresolved defects" no matter the real number.
  return paginatedFetch<Defect>((from, to) => {
    let query = supabase
      .from('defects')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .range(from, to)

    if (factoryId) query = query.eq('factory_id', factoryId)

    return query
  })
}

/**
 * Number of unresolved defects, for the header badge and the alert banner.
 *
 * Both callers previously paged the entire defects table into the browser and
 * ran `.filter(d => d.status === 'pending').length` on it — every 30 seconds,
 * on every screen, because the header is always mounted. This counts in
 * Postgres and transfers no rows.
 */
export async function getPendingDefectCount(factoryId?: string): Promise<number> {
  let query = supabase
    .from('defects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (factoryId) query = query.eq('factory_id', factoryId)

  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

/**
 * Defect counts by status.
 *
 * Uses head-only `count: 'exact'` queries: Postgres does the counting and no
 * rows cross the wire. The previous implementation paged every defect row into
 * the browser just to tally four numbers.
 */
export async function getDefectStats(factoryId?: string): Promise<{
  total: number
  pending: number
  inProgress: number
  resolved: number
}> {
  const countDefects = async (
    status?: 'pending' | 'in_progress' | 'resolved'
  ): Promise<number> => {
    let query = supabase.from('defects').select('*', { count: 'exact', head: true })
    if (factoryId) query = query.eq('factory_id', factoryId)
    if (status) query = query.eq('status', status)

    const { count, error } = await query
    if (error) throw error
    return count ?? 0
  }

  const [total, pending, inProgress, resolved] = await Promise.all([
    countDefects(),
    countDefects('pending'),
    countDefects('in_progress'),
    countDefects('resolved'),
  ])

  return { total, pending, inProgress, resolved }
}

// ============= Inspection Record (for InspectionPage) =============

export interface InspectionRecordInput {
  model_id: string
  inspection_process: { code: string; name: string }
  defect_type_id: string | null
  machine_id: string | null
  machine_number: string | null
  inspector_id: string
  inspection_quantity: number
  defect_quantity: number
  photo_url?: string | null
  factory_id?: string
}

/**
 * Count-based entry (no per-item measurements). Same atomic path as
 * submitInspectionRecord; kept as a named shape for the queue.
 */
export async function createInspectionRecord(
  clientRef: string,
  data: InspectionRecordInput
): Promise<string> {
  return submitInspectionRecord({
    clientRef,
    userId: data.inspector_id,
    machineId: data.machine_id,
    modelId: data.model_id,
    inspectionProcess: data.inspection_process.code,
    inspectionQuantity: data.inspection_quantity,
    defectQuantity: data.defect_quantity,
    defectType: data.defect_type_id,
    photoUrl: data.photo_url,
    factoryId: data.factory_id,
  })
}

export async function compressAndUploadPhoto(file: File): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
  })
  const contextId = crypto.randomUUID()
  return uploadDefectPhoto(compressed, contextId)
}

// ============= Photo Upload =============

export async function uploadDefectPhoto(file: File, inspectionId: string): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${inspectionId}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('defect-photos')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('defect-photos')
    .getPublicUrl(fileName)

  return data.publicUrl
}
