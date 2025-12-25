import type { Database } from '@/types/database'
import type { InspectionRecordInput } from '@/types/inspection'
import {
  mockMachines,
  mockInspections,
  mockInspectionResults,
} from '../mockData/inspectionMockData'
import { mockDefects as initialMockDefects } from '../mockData/defectsMockData'

type Machine = Database['public']['Tables']['machines']['Row']
type Inspection = Database['public']['Tables']['inspections']['Row']
type InspectionInsert = Database['public']['Tables']['inspections']['Insert']
type InspectionResult =
  Database['public']['Tables']['inspection_results']['Row']
type InspectionResultInsert =
  Database['public']['Tables']['inspection_results']['Insert']
type Defect = Database['public']['Tables']['defects']['Row']
type DefectInsert = Database['public']['Tables']['defects']['Insert']

// In-memory storage
const inspectionsData = [...mockInspections]
const inspectionResultsData = [...mockInspectionResults]
const defectsData: Defect[] = [...initialMockDefects]

// Helper function to simulate async delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ============= Machines (Read-only from other app) =============

export async function getMachines(): Promise<Machine[]> {
  await delay(200)
  return mockMachines.filter((m) => m.status === 'active')
}

export async function getMachineById(id: string): Promise<Machine | null> {
  await delay(100)
  return mockMachines.find((m) => m.id === id) || null
}

// ============= Inspections CRUD =============

export async function getInspections(userId?: string): Promise<Inspection[]> {
  await delay(300)
  let data = [...inspectionsData] // 새 배열로 복사

  if (userId) {
    data = data.filter((inspection) => inspection.user_id === userId)
  }

  // 새 배열과 새 객체로 반환하여 React Query가 변경을 감지하도록 함
  return data
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .map((inspection) => ({ ...inspection }))
}

export async function getInspectionById(
  id: string
): Promise<Inspection | null> {
  await delay(200)
  return inspectionsData.find((inspection) => inspection.id === id) || null
}

export async function createInspection(
  data: InspectionInsert
): Promise<Inspection> {
  await delay(400)

  const newInspection: Inspection = {
    id: `inspection-${Date.now()}`,
    user_id: data.user_id,
    machine_id: data.machine_id ?? null,
    model_id: data.model_id,
    inspection_process: data.inspection_process,
    defect_type: data.defect_type ?? null,
    inspection_quantity: data.inspection_quantity,
    defect_quantity: data.defect_quantity,
    photo_url: data.photo_url ?? null,
    status: data.status || 'pending',
    created_at: new Date().toISOString(),
  }

  inspectionsData.push(newInspection)
  return newInspection
}

export async function updateInspectionStatus(
  id: string,
  status: 'pass' | 'fail' | 'pending'
): Promise<Inspection> {
  await delay(300)

  const index = inspectionsData.findIndex((inspection) => inspection.id === id)
  if (index === -1) {
    throw new Error('Inspection not found')
  }

  inspectionsData[index] = {
    ...inspectionsData[index],
    status,
  }

  return inspectionsData[index]
}

// ============= Inspection Results CRUD =============

export async function getInspectionResults(
  inspectionId: string
): Promise<InspectionResult[]> {
  await delay(200)
  return inspectionResultsData.filter(
    (result) => result.inspection_id === inspectionId
  )
}

export async function createInspectionResult(
  data: InspectionResultInsert
): Promise<InspectionResult> {
  await delay(300)

  const newResult: InspectionResult = {
    id: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    inspection_id: data.inspection_id,
    item_id: data.item_id,
    measured_value: data.measured_value,
    result: data.result,
    created_at: new Date().toISOString(),
  }

  inspectionResultsData.push(newResult)
  return newResult
}

export async function batchCreateInspectionResults(
  results: InspectionResultInsert[]
): Promise<InspectionResult[]> {
  await delay(500)

  const newResults: InspectionResult[] = results.map((data, index) => ({
    id: `result-${Date.now()}-${index}`,
    inspection_id: data.inspection_id,
    item_id: data.item_id,
    measured_value: data.measured_value,
    result: data.result,
    created_at: new Date().toISOString(),
  }))

  inspectionResultsData.push(...newResults)
  return newResults
}

// ============= Defects CRUD =============

export async function getDefects(inspectionId?: string): Promise<Defect[]> {
  await delay(300)

  if (inspectionId) {
    return defectsData
      .filter((defect) => defect.inspection_id === inspectionId)
      .map((defect) => ({ ...defect })) // 새 객체로 복사
  }

  // 새 배열과 새 객체로 반환하여 React Query가 변경을 감지하도록 함
  return [...defectsData]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .map((defect) => ({ ...defect })) // 새 객체로 복사
}

export async function createDefect(data: DefectInsert): Promise<Defect> {
  await delay(400)

  const newDefect: Defect = {
    id: `defect-${Date.now()}`,
    inspection_id: data.inspection_id,
    model_id: data.model_id,
    defect_type: data.defect_type,
    description: data.description,
    photo_url: data.photo_url || null,
    status: data.status || 'pending',
    created_at: new Date().toISOString(),
  }

  defectsData.push(newDefect)
  return newDefect
}

export async function updateDefectStatus(
  id: string,
  status: 'pending' | 'in_progress' | 'resolved'
): Promise<Defect> {
  await delay(300)

  const index = defectsData.findIndex((defect) => defect.id === id)

  if (index === -1) {
    throw new Error('Defect not found')
  }

  defectsData[index] = {
    ...defectsData[index],
    status,
  }

  return { ...defectsData[index] }
}

// ============= Utility Functions =============

export interface InspectionWithResults {
  inspection: Inspection
  results: InspectionResult[]
  defects: Defect[]
}

export async function getInspectionWithResults(
  id: string
): Promise<InspectionWithResults | null> {
  await delay(400)

  const inspection = inspectionsData.find((i) => i.id === id)
  if (!inspection) return null

  const results = inspectionResultsData.filter(
    (r) => r.inspection_id === id
  )
  const defects = defectsData.filter((d) => d.inspection_id === id)

  return { inspection, results, defects }
}

// Helper function to determine overall inspection status
export function determineInspectionStatus(
  results: (InspectionResult | InspectionResultInsert)[]
): 'pass' | 'fail' | 'pending' {
  if (results.length === 0) return 'pending'

  const hasFailure = results.some((result) => result.result === 'fail')
  return hasFailure ? 'fail' : 'pass'
}

// ============= Inspection Record (New simplified flow) =============

// Helper function to get Ho Chi Minh timezone timestamp
function getHoChiMinhTimestamp(): string {
  // Ho Chi Minh is UTC+7
  const now = new Date()
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000
  const hcmTime = new Date(utcTime + 7 * 60 * 60000)
  return hcmTime.toISOString()
}

export async function createInspectionRecord(
  data: InspectionRecordInput
): Promise<Inspection> {
  await delay(500)

  // Calculate status based on defect quantity
  const status: 'pass' | 'fail' =
    data.defect_quantity > 0 ? 'fail' : 'pass'

  const timestamp = getHoChiMinhTimestamp()

  // 검사 공정 정보 추출 (객체 또는 문자열)
  const processCode = typeof data.inspection_process === 'string'
    ? data.inspection_process
    : data.inspection_process.code

  const newInspection: Inspection = {
    id: `inspection-${Date.now()}`,
    user_id: data.inspector_id,
    machine_id: null, // No machine in new flow
    model_id: data.model_id,
    inspection_process: processCode,
    defect_type: data.defect_type_id,
    inspection_quantity: data.inspection_quantity,
    defect_quantity: data.defect_quantity,
    photo_url: data.photo_url || null,
    status,
    created_at: timestamp,
  }

  inspectionsData.unshift(newInspection)

  // If there are defects, create a defect record
  if (data.defect_quantity > 0 && data.defect_type_id) {
    const defect: Defect = {
      id: `defect-${Date.now()}`,
      inspection_id: newInspection.id,
      model_id: data.model_id,  // 모델 ID 포함
      defect_type: data.defect_type_id,
      description: `검사 공정 ${processCode}에서 ${data.defect_quantity}개 불량 발생`,
      photo_url: data.photo_url || null,
      status: 'pending',
      created_at: timestamp,
    }
    defectsData.unshift(defect)
  }

  return newInspection
}
