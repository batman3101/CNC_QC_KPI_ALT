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

export interface InspectionTimeTrend {
  date: string
  avgTime: number
  minTime: number
  maxTime: number
}

export interface KPISummary {
  totalInspections: number
  totalDefects: number
  overallDefectRate: number
  fpy: number // First Pass Yield
  avgInspectionTime: number
  activeInspectors: number
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
