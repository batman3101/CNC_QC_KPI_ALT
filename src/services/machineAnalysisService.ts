import { supabase } from '@/lib/supabase'
import { getBusinessDateRangeFilter } from '@/lib/dateUtils'
import type {
  MachineAnalysis,
  MachineAnalysisSummary,
  MachineDefectTypeQuantity,
  DefectRateTrend,
} from '@/types/analytics'

// A `type`, deliberately, not an `interface`. supabase-js resolves an RPC's
// return type by matching the argument type against Record<string, unknown>,
// and an interface has no implicit index signature, so it fails that match and
// every `data` collapses to `never`. A type alias satisfies it. This is why the
// older analytics services pass an interface and then have to cast each result
// with `as` - the cast was papering over exactly this.
type MachineRpcArgs = {
  p_machine: string
  p_from: string
  p_to: string
  p_factory: string | null
}

function rate(defectQty: number, inspectionQty: number): number {
  return inspectionQty > 0 ? (defectQty / inspectionQty) * 100 : 0
}

// The same business day the rest of the app counts on: 08:00 to 07:59 the next
// morning, Vietnam. The bounds are built here and the grouping is done by
// public.business_date(), so a shift running past midnight stays on one day.
function buildArgs(
  machineId: string,
  from: Date,
  to: Date,
  factoryId?: string
): MachineRpcArgs {
  const range = getBusinessDateRangeFilter(from, to)
  return {
    p_machine: machineId,
    p_from: range.gte,
    p_to: range.lte,
    p_factory: factoryId ?? null,
  }
}

// Each call is awaited inside its own async function rather than handed to
// Promise.all as a bare supabase.rpc(...). rpc() returns a PostgrestFilterBuilder,
// not a Promise; putting several differently-typed builders in one Promise.all
// collapses their generics and every `data` comes back as `never`. Awaiting
// first turns each into an ordinary typed Promise, so the three still run
// concurrently and the row types survive - no `as` casts needed.
async function fetchSummary(args: MachineRpcArgs) {
  const { data, error } = await supabase.rpc('get_machine_analysis_summary', args)
  if (error) throw error
  return (data ?? [])[0]
}

async function fetchTrend(args: MachineRpcArgs) {
  const { data, error } = await supabase.rpc('get_machine_defect_trend', args)
  if (error) throw error
  return data ?? []
}

async function fetchDefectTypes(args: MachineRpcArgs) {
  const { data, error } = await supabase.rpc('get_machine_defect_types', args)
  if (error) throw error
  return data ?? []
}

export async function getMachineAnalysis(
  machineId: string,
  from: Date,
  to: Date,
  factoryId?: string
): Promise<MachineAnalysis> {
  const args = buildArgs(machineId, from, to, factoryId)

  const [summaryRow, trendRows, typeRows] = await Promise.all([
    fetchSummary(args),
    fetchTrend(args),
    fetchDefectTypes(args),
  ])

  const inspectionQty = summaryRow?.inspection_qty ?? 0
  const defectQty = summaryRow?.defect_qty ?? 0

  const summary: MachineAnalysisSummary = {
    inspectionCount: summaryRow?.inspection_count ?? 0,
    inspectionQty,
    defectQty,
    defectRate: rate(defectQty, inspectionQty),
  }

  const trend: DefectRateTrend[] = trendRows.map((row) => {
    const dayRate = rate(row.defect_qty, row.inspection_qty)
    return {
      date: row.business_day,
      totalInspections: row.inspection_qty,
      defectCount: row.defect_qty,
      defectRate: dayRate,
      passRate: 100 - dayRate,
    }
  })

  // Percentages are taken against the machine's own defect total, which the RPC
  // guarantees these rows add up to - untyped defects included. Deriving the
  // total from the rows instead would also work, but tying it to the headline
  // number is what lets a reader check the chart against the card above it.
  const defectTypes: MachineDefectTypeQuantity[] = typeRows.map((row) => ({
    defectType: row.defect_type_name,
    qty: row.defect_qty,
    percentage: defectQty > 0 ? (row.defect_qty / defectQty) * 100 : 0,
  }))

  return { summary, trend, defectTypes }
}
