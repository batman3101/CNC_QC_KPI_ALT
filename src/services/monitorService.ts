import { supabase } from '@/lib/supabase'

export interface PublicMonitorDefect {
  id: string
  created_at: string
  inspection_id: string
  model_id: string | null
  defect_type: string | null
}

export interface PublicMonitorInspection {
  id: string
  machine_id: string | null
}

export interface PublicMonitorMachine {
  id: string
  name: string
}

export interface PublicMonitorProductModel {
  id: string
  code: string
}

export interface PublicMonitorDefectType {
  id: string
  code: string
  name: string
}

export interface PublicMonitorData {
  defects: PublicMonitorDefect[]
  inspections: PublicMonitorInspection[]
  machines: PublicMonitorMachine[]
  product_models: PublicMonitorProductModel[]
  defect_types: PublicMonitorDefectType[]
}

export const EMPTY_PUBLIC_MONITOR_DATA: PublicMonitorData = {
  defects: [],
  inspections: [],
  machines: [],
  product_models: [],
  defect_types: [],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireArray(value: Record<string, unknown>, key: keyof PublicMonitorData): unknown[] {
  const candidate = value[key]
  if (!Array.isArray(candidate)) {
    throw new Error(`Invalid public monitor response: ${key} must be an array`)
  }
  return candidate
}

function parsePublicMonitorData(value: unknown): PublicMonitorData {
  if (!isRecord(value)) {
    throw new Error('Invalid public monitor response')
  }

  return {
    defects: requireArray(value, 'defects') as PublicMonitorDefect[],
    inspections: requireArray(value, 'inspections') as PublicMonitorInspection[],
    machines: requireArray(value, 'machines') as PublicMonitorMachine[],
    product_models: requireArray(value, 'product_models') as PublicMonitorProductModel[],
    defect_types: requireArray(value, 'defect_types') as PublicMonitorDefectType[],
  }
}

export async function getPublicMonitorData(
  factoryId: string | null,
  startAt: string,
  endAt: string
): Promise<PublicMonitorData> {
  if (!factoryId) return EMPTY_PUBLIC_MONITOR_DATA

  const { data, error } = await supabase.rpc('get_public_monitor_data', {
    p_factory_id: factoryId,
    p_start_at: startAt,
    p_end_at: endAt,
  })

  if (error) throw new Error(error.message)
  return parsePublicMonitorData(data)
}
