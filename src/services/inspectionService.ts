/**
 * Inspection Service - Supabase 전용
 * 검사 실행, 검사 결과, 불량 관리
 */

import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

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

export async function getInspections(filters?: {
  startDate?: string
  endDate?: string
  status?: string
  modelId?: string
  machineId?: string
  userId?: string
}): Promise<Inspection[]> {
  let query = supabase
    .from('inspections')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate)
  }
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status as 'pending' | 'pass' | 'fail')
  }
  if (filters?.modelId) {
    query = query.eq('model_id', filters.modelId)
  }
  if (filters?.machineId) {
    query = query.eq('machine_id', filters.machineId)
  }
  if (filters?.userId) {
    query = query.eq('user_id', filters.userId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

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

export async function getDefects(filters?: {
  status?: string
  modelId?: string
  startDate?: string
  endDate?: string
}): Promise<Defect[]> {
  let query = supabase
    .from('defects')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status as 'pending' | 'in_progress' | 'resolved')
  }
  if (filters?.modelId) {
    query = query.eq('model_id', filters.modelId)
  }
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate)
  }
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
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

export interface InspectionSubmitData {
  userId: string
  machineId?: string
  modelId: string
  inspectionProcess: string
  inspectionQuantity: number
  defectQuantity: number
  results: Array<{
    itemId: string
    measuredValue: number
    result: 'pass' | 'fail'
  }>
  defectType?: string
  defectDescription?: string
  photoUrl?: string
}

export async function submitInspection(data: InspectionSubmitData): Promise<{
  inspection: Inspection
  results: InspectionResult[]
  defect?: Defect
}> {
  // Determine overall status
  const hasFailedResults = data.results.some(r => r.result === 'fail')
  const status = hasFailedResults || data.defectQuantity > 0 ? 'fail' : 'pass'

  // Create inspection
  const inspection = await createInspection({
    user_id: data.userId,
    machine_id: data.machineId || null,
    model_id: data.modelId,
    inspection_process: data.inspectionProcess,
    inspection_quantity: data.inspectionQuantity,
    defect_quantity: data.defectQuantity,
    defect_type: data.defectType || null,
    photo_url: data.photoUrl || null,
    status,
  })

  // Create inspection results
  const results = await createInspectionResults(
    data.results.map(r => ({
      inspection_id: inspection.id,
      item_id: r.itemId,
      measured_value: r.measuredValue,
      result: r.result,
    }))
  )

  // Create defect if failed
  let defect: Defect | undefined
  if (status === 'fail' && data.defectType) {
    defect = await createDefect({
      inspection_id: inspection.id,
      model_id: data.modelId,
      defect_type: data.defectType,
      description: data.defectDescription || '검사 불합격',
      photo_url: data.photoUrl || null,
      status: 'pending',
    })
  }

  return { inspection, results, defect }
}

// ============= Statistics =============

export async function getDefectStats(): Promise<{
  total: number
  pending: number
  inProgress: number
  resolved: number
}> {
  const { data, error } = await supabase
    .from('defects')
    .select('status')

  if (error) throw error

  const stats = {
    total: data?.length || 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  }

  data?.forEach(d => {
    if (d.status === 'pending') stats.pending++
    else if (d.status === 'in_progress') stats.inProgress++
    else if (d.status === 'resolved') stats.resolved++
  })

  return stats
}

// ============= Inspection Record (for InspectionPage) =============

export interface InspectionRecordInput {
  model_id: string
  inspection_process: { code: string; name: string }
  defect_type_id: string | null
  machine_number: string | null
  inspector_id: string
  inspection_quantity: number
  defect_quantity: number
  photo_url?: string | null
}

export async function createInspectionRecord(data: InspectionRecordInput): Promise<Inspection> {
  const status = data.defect_quantity > 0 ? 'fail' : 'pass'

  const inspection = await createInspection({
    user_id: data.inspector_id,
    machine_id: data.machine_number || null,
    model_id: data.model_id,
    inspection_process: data.inspection_process.code,
    inspection_quantity: data.inspection_quantity,
    defect_quantity: data.defect_quantity,
    defect_type: data.defect_type_id || null,
    photo_url: data.photo_url || null,
    status,
  })

  // Create defect record if there are defects
  if (data.defect_quantity > 0 && data.defect_type_id) {
    await createDefect({
      inspection_id: inspection.id,
      model_id: data.model_id,
      defect_type: data.defect_type_id,
      description: `검사 불합격 - 불량 수량: ${data.defect_quantity}`,
      photo_url: data.photo_url || null,
      status: 'pending',
    })
  }

  return inspection
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
