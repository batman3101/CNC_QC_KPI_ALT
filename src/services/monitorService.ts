import { supabase } from '@/lib/supabase'

/**
 * Public TV monitor data, measured in rejected pieces.
 *
 * Every quantity here is `sum(inspections.defect_quantity)` - the same unit
 * as the analytics KPI card - and never a count of `defects` rows. The board
 * used to count records, so a day that scrapped 996 pieces read 272 on the
 * TV while the app said 996. The server also never joins `defects`: a rejected
 * inspection that has no defect record still counts, and one with two records
 * counts once.
 *
 * `machines` and `models` are truncated on the server (top 5 / top 8). Divide
 * by `total_defect_qty`, never by the sum of a truncated list.
 */
export interface PublicMonitorDailyDefect {
  /** Business day, YYYY-MM-DD (08:00 -> 07:59 next day, Vietnam time). */
  business_day: string
  defect_qty: number
}

export interface PublicMonitorMachineDefect {
  machine_id: string | null
  machine_name: string | null
  defect_qty: number
  /** Defect type of the machine's latest rejected inspection; 'UNCLASSIFIED' if untyped. */
  recent_defect_type_name: string
}

export interface PublicMonitorDefectTypeShare {
  /** Defect type name, or the 'UNCLASSIFIED' sentinel the client translates. */
  defect_type_name: string
  defect_qty: number
}

export interface PublicMonitorModelDefect {
  model_id: string | null
  model_code: string | null
  defect_qty: number
}

export interface PublicMonitorRecentDefect {
  id: string
  created_at: string
  machine_name: string | null
  model_code: string | null
  defect_type_name: string
  defect_qty: number
}

export interface PublicMonitorSummary {
  total_defect_qty: number
  daily: PublicMonitorDailyDefect[]
  machines: PublicMonitorMachineDefect[]
  defect_types: PublicMonitorDefectTypeShare[]
  models: PublicMonitorModelDefect[]
  recent: PublicMonitorRecentDefect[]
}

export const EMPTY_PUBLIC_MONITOR_SUMMARY: PublicMonitorSummary = {
  total_defect_qty: 0,
  daily: [],
  machines: [],
  defect_types: [],
  models: [],
  recent: [],
}

type ArrayKey = Exclude<keyof PublicMonitorSummary, 'total_defect_qty'>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireArray(value: Record<string, unknown>, key: ArrayKey): unknown[] {
  const candidate = value[key]
  if (!Array.isArray(candidate)) {
    throw new Error(`Invalid public monitor response: ${key} must be an array`)
  }
  return candidate
}

function requireNumber(value: Record<string, unknown>, key: 'total_defect_qty'): number {
  const candidate = value[key]
  if (typeof candidate !== 'number' || !Number.isFinite(candidate)) {
    throw new Error(`Invalid public monitor response: ${key} must be a number`)
  }
  return candidate
}

function parsePublicMonitorSummary(value: unknown): PublicMonitorSummary {
  if (!isRecord(value)) {
    throw new Error('Invalid public monitor response')
  }

  return {
    total_defect_qty: requireNumber(value, 'total_defect_qty'),
    daily: requireArray(value, 'daily') as PublicMonitorDailyDefect[],
    machines: requireArray(value, 'machines') as PublicMonitorMachineDefect[],
    defect_types: requireArray(value, 'defect_types') as PublicMonitorDefectTypeShare[],
    models: requireArray(value, 'models') as PublicMonitorModelDefect[],
    recent: requireArray(value, 'recent') as PublicMonitorRecentDefect[],
  }
}

export async function getPublicMonitorSummary(
  factoryId: string | null,
  startAt: string,
  endAt: string
): Promise<PublicMonitorSummary> {
  if (!factoryId) return EMPTY_PUBLIC_MONITOR_SUMMARY

  const { data, error } = await supabase.rpc('get_public_monitor_summary', {
    p_factory_id: factoryId,
    p_start_at: startAt,
    p_end_at: endAt,
  })

  if (error) throw new Error(error.message)
  return parsePublicMonitorSummary(data)
}
