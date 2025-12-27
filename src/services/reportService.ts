/**
 * Report Service - Supabase 전용
 *
 * Reports are generated on-the-fly from inspection data.
 * No separate 'reports' table is required.
 */

import { supabase } from '@/lib/supabase'
import { getBusinessDateRangeFilter } from '@/lib/dateUtils'
import type { Report, ReportFilters, ReportSummary } from '@/types/report'

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
export async function getReportSummary(filters: ReportFilters): Promise<ReportSummary> {
  // Use business day range (08:00 ~ next day 07:59)
  const dateFilter = getBusinessDateRangeFilter(filters.dateRange.from, filters.dateRange.to)

  // Fetch inspections for the date range
  let query = supabase
    .from('inspections')
    .select('*')
    .gte('created_at', dateFilter.gte)
    .lte('created_at', dateFilter.lte)

  if (filters.modelId) {
    query = query.eq('model_id', filters.modelId)
  }

  const { data: inspections, error } = await query

  if (error) {
    console.error('Error fetching inspections for summary:', error)
  }

  const inspectionData = inspections || []

  // Fetch defects for the date range (using business day range)
  const { data: defects } = await supabase
    .from('defects')
    .select('*')
    .gte('created_at', dateFilter.gte)
    .lte('created_at', dateFilter.lte)

  const defectData = defects || []

  // Calculate statistics
  const total_inspections = inspectionData.length
  const passed_inspections = inspectionData.filter(i => i.status === 'pass').length
  const failed_inspections = inspectionData.filter(i => i.status === 'fail').length
  const pass_rate = total_inspections > 0 ? (passed_inspections / total_inspections) * 100 : 0

  // Defects by type
  const defectsByType: Record<string, number> = {}
  defectData.forEach(defect => {
    const type = defect.defect_type || '기타'
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

  const inspections_by_model = Object.entries(inspectionsByModel).map(([model_id, stats]) => ({
    model_id,
    model_name: model_id, // Will need to fetch actual name from models table
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
  const dateFrom = filters.dateRange.from.toLocaleDateString('ko-KR')
  const dateTo = filters.dateRange.to.toLocaleDateString('ko-KR')

  const typeLabels: Record<string, string> = {
    daily: '일일',
    weekly: '주간',
    monthly: '월간',
    custom: '맞춤',
  }

  const title = `${typeLabels[filters.reportType] || '맞춤'} 품질 리포트 - ${dateFrom} ~ ${dateTo}`

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

  // For now, generate a simple JSON blob as placeholder
  // TODO: Implement actual PDF/Excel generation using jspdf and xlsx libraries
  const reportData = {
    title: report.title,
    format: report.format,
    generatedAt: new Date().toISOString(),
    summary,
    filters,
  }

  const blob = new Blob([JSON.stringify(reportData, null, 2)], {
    type: report.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  return blob
}
