/**
 * Report Service - Supabase 전용
 *
 * Reports are generated on-the-fly from inspection data.
 * No separate 'reports' table is required.
 */

import { supabase } from '@/lib/supabase'
import { getBusinessDateRangeFilter } from '@/lib/dateUtils'
import { generatePDFReport, generateExcelReport } from '@/utils/reportGenerators'
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

/**
 * Generate report summary from inspection data.
 *
 * The counting happens in Postgres (get_report_summary). This used to page
 * every inspection and defect row in the range into the browser and tally them
 * in JavaScript. Note the report counts *records* by status, unlike the
 * analytics charts which sum quantities - that difference is preserved.
 */
export async function getReportSummary(filters: ReportFilters, factoryId?: string): Promise<ReportSummary> {
  // Use business day range (08:00 ~ next day 07:59)
  const dateFilter = getBusinessDateRangeFilter(filters.dateRange.from, filters.dateRange.to)

  const { data, error } = await supabase.rpc('get_report_summary', {
    p_from: dateFilter.gte,
    p_to: dateFilter.lte,
    p_model: filters.modelId ?? null,
    // The Process dropdown used to be collected and then dropped on the floor:
    // picking a process produced totals for every process.
    p_process: filters.processId ?? null,
    p_factory: factoryId ?? null,
  })

  if (error) throw error

  return data as unknown as ReportSummary
}

// Generate a new report (stores in memory)
export async function generateReport(
  filters: ReportFilters,
  format: 'pdf' | 'excel',
  factoryId?: string
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
    factory_id: factoryId,
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

  // Scope the download to the factory the report was generated for. Without it
  // the PDF was built from all-factory totals and disagreed with the summary the
  // user had just been looking at.
  const summary = await getReportSummary(filters, report.factory_id)

  if (report.format === 'pdf') {
    return generatePDFReport(summary, filters, report.title)
  } else {
    return generateExcelReport(summary, filters, report.title)
  }
}
