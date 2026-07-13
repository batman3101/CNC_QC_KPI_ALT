// Analytics Types

export interface DateRange {
  from: Date
  to: Date
}

export interface AnalyticsFilters {
  dateRange: DateRange
  modelId?: string
  processId?: string
}

export interface DefectRateTrend {
  date: string
  totalInspections: number
  defectCount: number
  defectRate: number
  passRate: number
}

export interface ModelDefectDistribution {
  modelName: string
  modelCode: string
  totalInspections: number
  defectCount: number
  defectRate: number
}

export interface MachinePerformance {
  machineName: string
  machineModel: string
  totalInspections: number
  defectCount: number
  defectRate: number
  avgInspectionTime: number
}

export interface DefectTypeDistribution {
  defectType: string
  count: number
  percentage: number
}

/**
 * One machine's quality over a period.
 *
 * inspectionCount (records) is carried next to inspectionQty (pieces) on
 * purpose. A single machine is a thin slice of the data - half of them see
 * fewer than five inspections in a month - so a defect rate shown without the
 * sample behind it invites someone to stop a machine over one bad lot.
 */
export interface MachineAnalysisSummary {
  inspectionCount: number
  inspectionQty: number
  defectQty: number
  defectRate: number
}

/**
 * Rejected pieces of one defect type, so the slices sum to the machine's total
 * defect quantity.
 *
 * Pieces logged with no type at all - an inspector entered a quantity and
 * skipped the type - arrive under the UNCLASSIFIED_DEFECT_TYPE sentinel, which
 * is turned into words at display time so each reader sees it in their own
 * language.
 */
export interface MachineDefectTypeQuantity {
  defectType: string
  qty: number
  percentage: number
}

export interface MachineAnalysis {
  summary: MachineAnalysisSummary
  trend: DefectRateTrend[]
  defectTypes: MachineDefectTypeQuantity[]
}

export interface InspectionTimeTrend {
  date: string
  avgTime: number
  minTime: number
  maxTime: number
}

export interface TopInspector {
  rank: number
  name: string
  inspectionCount: number
  defectCount: number // 불량 발견 건수
}

export interface KPISummary {
  /** Inspection records. The rates below are not computed from this. */
  totalInspections: number
  /**
   * Pieces inspected - the denominator of overallDefectRate and fpy.
   *
   * It was being computed and thrown away, so the analytics page showed a
   * defect rate with its denominator nowhere on screen: 4,165 records next to
   * a 1.27% rate that was really 7,908 pieces out of ~623,000. Nothing on the
   * page added up, because the two numbers were not in the same unit.
   */
  totalInspectionQty: number
  /** Rejected pieces, not defect records. */
  totalDefects: number
  overallDefectRate: number
  fpy: number // First Pass Yield
  avgInspectionTime: number
  avgResolutionTime: number // 불량 조치 완료 시간 (시간 단위)
  activeInspectors: number
  topInspectors: TopInspector[]
}

export interface HourlyDistribution {
  hour: number
  inspectionCount: number
  defectCount: number
}

export interface InspectorPerformance {
  inspectorName: string
  totalInspections: number
  defectCount: number
  defectRate: number
  avgInspectionTime: number
}

// Detailed Inspector KPI Types
export interface InspectorDetailedKPI {
  inspectorId: string
  inspectorName: string
  // Summary KPIs
  totalInspections: number
  defectCount: number
  defectRate: number
  passRate: number
  avgInspectionTime: number
  // Ranking
  rank: number
  totalInspectors: number
  // Trend data (daily for last 30 days)
  dailyTrend: InspectorDailyTrend[]
  // Performance by model
  modelPerformance: InspectorModelPerformance[]
  // Performance by process
  processPerformance: InspectorProcessPerformance[]
  // Comparison with team average
  teamComparison: TeamComparison
}

export interface InspectorDailyTrend {
  date: string
  inspectionCount: number
  defectCount: number
  defectRate: number
}

export interface InspectorModelPerformance {
  modelName: string
  modelCode: string
  inspectionCount: number
  defectCount: number
  defectRate: number
}

export interface InspectorProcessPerformance {
  processName: string
  processCode: string
  inspectionCount: number
  defectCount: number
  defectRate: number
}

export interface TeamComparison {
  avgDefectRate: number
  avgInspectionTime: number
  avgDailyInspections: number
  defectRateDiff: number // positive = worse than avg, negative = better
  inspectionTimeDiff: number
  dailyInspectionsDiff: number
}
