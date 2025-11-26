import type { Report, ReportFilters, ReportSummary } from '@/types/report'
import { generatePDFReport, generateExcelReport } from '@/utils/reportGenerators'

// Mock reports data
export const mockReports: Report[] = [
  {
    id: 'report-001',
    title: '일일 품질 리포트 - 2025-01-19',
    type: 'daily',
    format: 'pdf',
    status: 'completed',
    date_from: '2025-01-19T00:00:00Z',
    date_to: '2025-01-19T23:59:59Z',
    created_at: '2025-01-19T23:59:00Z',
    created_by: 'user-001',
    file_url: '/reports/daily-2025-01-19.pdf',
  },
  {
    id: 'report-002',
    title: '주간 품질 리포트 - 2025년 3주차',
    type: 'weekly',
    format: 'pdf',
    status: 'completed',
    date_from: '2025-01-13T00:00:00Z',
    date_to: '2025-01-19T23:59:59Z',
    created_at: '2025-01-19T18:00:00Z',
    created_by: 'user-001',
    file_url: '/reports/weekly-2025-w03.pdf',
  },
  {
    id: 'report-003',
    title: '월간 품질 리포트 - 2024년 12월',
    type: 'monthly',
    format: 'excel',
    status: 'completed',
    date_from: '2024-12-01T00:00:00Z',
    date_to: '2024-12-31T23:59:59Z',
    created_at: '2025-01-01T00:00:00Z',
    created_by: 'user-002',
    file_url: '/reports/monthly-2024-12.xlsx',
  },
  {
    id: 'report-004',
    title: '맞춤 리포트 - IQC 공정 분석',
    type: 'custom',
    format: 'pdf',
    status: 'completed',
    date_from: '2025-01-01T00:00:00Z',
    date_to: '2025-01-19T23:59:59Z',
    process_id: 'process-1',
    created_at: '2025-01-19T14:30:00Z',
    created_by: 'user-001',
    file_url: '/reports/custom-process-iqc.pdf',
  },
  {
    id: 'report-005',
    title: '생성 중인 리포트',
    type: 'daily',
    format: 'pdf',
    status: 'generating',
    date_from: '2025-01-20T00:00:00Z',
    date_to: '2025-01-20T23:59:59Z',
    created_at: '2025-01-20T10:00:00Z',
    created_by: 'user-001',
  },
]

// Generate mock report summary
const generateMockSummary = (_filters: ReportFilters): ReportSummary => {
  return {
    total_inspections: 245,
    passed_inspections: 231,
    failed_inspections: 14,
    pass_rate: 94.3,
    total_defects: 18,
    defects_by_type: [
      { type: '치수 불량', count: 8 },
      { type: '표면 불량', count: 5 },
      { type: '형상 불량', count: 3 },
      { type: '기타', count: 2 },
    ],
    inspections_by_process: [
      {
        process_id: 'process-1',
        process_name: 'IQC',
        count: 102,
        pass_rate: 95.1,
      },
      {
        process_id: 'process-2',
        process_name: 'PQC',
        count: 89,
        pass_rate: 93.3,
      },
      {
        process_id: 'process-3',
        process_name: 'OQC',
        count: 54,
        pass_rate: 94.4,
      },
    ],
    inspections_by_model: [
      {
        model_id: 'model-001',
        model_name: 'BHB-002',
        count: 78,
        pass_rate: 96.2,
      },
      {
        model_id: 'model-002',
        model_name: 'SHA-001',
        count: 65,
        pass_rate: 92.3,
      },
      {
        model_id: 'model-003',
        model_name: 'FLC-003',
        count: 54,
        pass_rate: 94.4,
      },
      {
        model_id: 'model-004',
        model_name: 'GAD-004',
        count: 48,
        pass_rate: 93.8,
      },
    ],
  }
}

// Mock API functions
export const getReports = async (): Promise<Report[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return mockReports
}

export const getReportById = async (id: string): Promise<Report | undefined> => {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return mockReports.find((report) => report.id === id)
}

export const generateReport = async (
  filters: ReportFilters,
  format: 'pdf' | 'excel'
): Promise<Report> => {
  // Simulate report generation delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const dateFrom = new Date(filters.dateRange.from).toLocaleDateString('ko-KR')
  const dateTo = new Date(filters.dateRange.to).toLocaleDateString('ko-KR')

  const newReport: Report = {
    id: `report-${Date.now()}`,
    title: `${
      filters.reportType === 'daily'
        ? '일일'
        : filters.reportType === 'weekly'
        ? '주간'
        : filters.reportType === 'monthly'
        ? '월간'
        : '맞춤'
    } 품질 리포트 - ${dateFrom} ~ ${dateTo}`,
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

  // Add the new report to the mock reports array
  mockReports.unshift(newReport)

  return newReport
}

export const getReportSummary = async (
  filters: ReportFilters
): Promise<ReportSummary> => {
  await new Promise((resolve) => setTimeout(resolve, 800))
  return generateMockSummary(filters)
}

export const deleteReport = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const index = mockReports.findIndex((report) => report.id === id)
  if (index !== -1) {
    mockReports.splice(index, 1)
  }
}

export const downloadReport = async (id: string): Promise<Blob> => {
  await new Promise((resolve) => setTimeout(resolve, 500))

  const report = mockReports.find((r) => r.id === id)
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

  // Generate actual PDF or Excel file
  if (report.format === 'pdf') {
    return await generatePDFReport(summary, filters, report.title)
  } else {
    return await generateExcelReport(summary, filters, report.title)
  }
}
