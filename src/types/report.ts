export type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom'
export type ReportStatus = 'generating' | 'completed' | 'failed'
export type ReportFormat = 'pdf' | 'excel'

export interface Report {
  id: string
  title: string
  type: ReportType
  format: ReportFormat
  status: ReportStatus
  date_from: string
  date_to: string
  model_id?: string
  process_id?: string
  file_url?: string
  created_at: string
  created_by: string
}

export interface ReportFilters {
  dateRange: {
    from: Date
    to: Date
  }
  modelId?: string
  processId?: string
  reportType: ReportType
}

export interface ReportSummary {
  total_inspections: number
  passed_inspections: number
  failed_inspections: number
  pass_rate: number
  total_defects: number
  defects_by_type: {
    type: string
    count: number
  }[]
  inspections_by_process: {
    process_id: string
    process_name: string
    count: number
    pass_rate: number
  }[]
  inspections_by_model: {
    model_id: string
    model_name: string
    count: number
    pass_rate: number
  }[]
}
