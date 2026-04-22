/**
 * Report Service - Supabase 전용
 *
 * Reports are generated on-the-fly from inspection data.
 * No separate 'reports' table is required.
 */

import { supabase } from '@/lib/supabase'
import { paginatedFetch } from '@/lib/supabasePagination'
import { getBusinessDateRangeFilter } from '@/lib/dateUtils'
import { generatePDFReport, generateExcelReport } from '@/utils/reportGenerators'
import type { Report, ReportFilters, ReportSummary } from '@/types/report'
import type { Database } from '@/types/database'

type Inspection = Database['public']['Tables']['inspections']['Row']
type Defect = Database['public']['Tables']['defects']['Row']

// In-memory storage for generated reports (will reset on page refresh)
const generatedReports: Report[] = []

// Fetch all reports (in-memory)
export async function getReports(): Promise<Report[]> {
  return generatedReports
}

// Fetch report by ID (in-memory)
export async function getReportById(id: string): Promise<Report | undefined> {
  return generatedReports.find(r => r.id === id)
}

// Generate report summary from inspection data
export async function getReportSummary(filters: ReportFilters, factoryId?: string): Promise<ReportSummary> {
  // Use business day range (08:00 ~ next day 07:59)
  const dateFilter = getBusinessDateRangeFilter(filters.dateRange.from, filters.dateRange.to)

  // Fetch inspections for the date range (paginated)
  let inspectionData: Inspection[]
  try {
    inspectionData = await paginatedFetch<Inspection>((from, to) => {
      let q = supabase
        .from('inspections')
        .select('*')
        .gte('created_at', dateFilter.gte)
        .lte('created_at', dateFilter.lte)
        .range(from, to)
      if (filters.modelId) q = q.eq('model_id', filters.modelId)
      if (factoryId) q = q.eq('factory_id', factoryId)
      return q
    })
  } catch (error) {
    console.error('Error fetching inspections for summary:', error)
    inspectionData = []
  }

  // Fetch defects for the date range (paginated)
  const defectData = await paginatedFetch<Defect>((from, to) => {
    let q = supabase
      .from('defects')
      .select('*')
      .gte('created_at', dateFilter.gte)
      .lte('created_at', dateFilter.lte)
      .range(from, to)
    if (factoryId) q = q.eq('factory_id', factoryId)
    return q
  })

  // Fetch defect types for name mapping (paginated to bypass 1000-row cap)
  const defectTypesData = await paginatedFetch<{ id: string; name: string }>((from, to) =>
    supabase.from('defect_types').select('id, name').range(from, to)
  )
  const defectTypeMap = new Map<string, string>(defectTypesData.map(dt => [dt.id, dt.name]))

  // Calculate statistics
  const total_inspections = inspectionData.length
  const passed_inspections = inspectionData.filter(i => i.status === 'pass').length
  const failed_inspections = inspectionData.filter(i => i.status === 'fail').length
  const pass_rate = total_inspections > 0 ? (passed_inspections / total_inspections) * 100 : 0

  // Defects by type (using name from defect_types table)
  const defectsByType: Record<string, number> = {}
  defectData.forEach(defect => {
    // Use the name from defect_types map, fallback to defect_type ID or '기타'
    const type = defectTypeMap.get(defect.defect_type) || defect.defect_type || '기타'
    defectsByType[type] = (defectsByType[type] || 0) + 1
  })

  const defects_by_type = Object.entries(defectsByType).map(([type, count]) => ({
    type,
    count,
  }))

  // Inspections by process
  const inspectionsByProcess: Record<string, { count: number; passed: number }> = {}
  inspectionData.forEach(inspection => {
    const process = inspection.inspection_process || 'Unknown'
    if (!inspectionsByProcess[process]) {
      inspectionsByProcess[process] = { count: 0, passed: 0 }
    }
    inspectionsByProcess[process].count++
    if (inspection.status === 'pass') {
      inspectionsByProcess[process].passed++
    }
  })

  const inspections_by_process = Object.entries(inspectionsByProcess).map(([process_name, stats]) => ({
    process_id: process_name,
    process_name,
    count: stats.count,
    pass_rate: stats.count > 0 ? (stats.passed / stats.count) * 100 : 0,
  }))

  // Inspections by model
  const inspectionsByModel: Record<string, { count: number; passed: number }> = {}
  inspectionData.forEach(inspection => {
    const model = inspection.model_id || 'Unknown'
    if (!inspectionsByModel[model]) {
      inspectionsByModel[model] = { count: 0, passed: 0 }
    }
    inspectionsByModel[model].count++
    if (inspection.status === 'pass') {
      inspectionsByModel[model].passed++
    }
  })

  // Fetch model names from product_models table
  const modelIds = Object.keys(inspectionsByModel).filter(id => id !== 'Unknown')
  const { data: modelProfiles } = modelIds.length > 0
    ? await supabase.from('product_models').select('id, code, name').in('id', modelIds)
    : { data: [] }
  const modelNameMap = new Map(modelProfiles?.map((m: { id: string; code: string; name: string }) => [m.id, m.code || m.name]) || [])

  const inspections_by_model = Object.entries(inspectionsByModel).map(([model_id, stats]) => ({
    model_id,
    model_name: modelNameMap.get(model_id) || model_id,
    count: stats.count,
    pass_rate: stats.count > 0 ? (stats.passed / stats.count) * 100 : 0,
  }))

  return {
    total_inspections,
    passed_inspections,
    failed_inspections,
    pass_rate,
    total_defects: defectData.length,
    defects_by_type,
    inspections_by_process,
    inspections_by_model,
  }
}

// Generate a new report (stores in memory)
export async function generateReport(
  filters: ReportFilters,
  format: 'pdf' | 'excel'
): Promise<Report> {
  const typeLabels: Record<string, string> = {
    daily: '일일',
    weekly: '주간',
    monthly: '월간',
    custom: '맞춤',
  }

  const title = `${typeLabels[filters.reportType] || '맞춤'} 품질 리포트`

  const newReport: Report = {
    id: `report-${Date.now()}`,
    title,
    type: filters.reportType,
    format,
    status: 'completed',
    date_from: filters.dateRange.from.toISOString(),
    date_to: filters.dateRange.to.toISOString(),
    model_id: filters.modelId,
    process_id: filters.processId,
    created_at: new Date().toISOString(),
    created_by: 'current-user',
    file_url: `/reports/${filters.reportType}-${Date.now()}.${format}`,
  }

  // Store in memory
  generatedReports.unshift(newReport)

  return newReport
}

// Delete a report (from memory)
export async function deleteReport(id: string): Promise<void> {
  const index = generatedReports.findIndex(r => r.id === id)
  if (index !== -1) {
    generatedReports.splice(index, 1)
  }
}

// Download report (generate file)
export async function downloadReport(id: string): Promise<Blob> {
  // First, get the report details
  const report = await getReportById(id)
  if (!report) {
    throw new Error('Report not found')
  }

  // Get report summary data
  const filters: ReportFilters = {
    dateRange: {
      from: new Date(report.date_from),
      to: new Date(report.date_to),
    },
    reportType: report.type,
    modelId: report.model_id,
    processId: report.process_id,
  }

  const summary = await getReportSummary(filters)

  if (report.format === 'pdf') {
    return generatePDFReport(summary, filters, report.title)
  } else {
    return generateExcelReport(summary, filters, report.title)
  }
}
