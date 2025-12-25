import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'
import type { ReportSummary, ReportFilters } from '@/types/report'
import { formatVietnamDate, formatVietnamDateTime } from '@/lib/dateUtils'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable
  }
}

// Add Korean font support (fallback to sans-serif for Korean characters)
const addKoreanFont = (doc: jsPDF) => {
  // For Korean text, we'll use a web font or system font
  // In production, you'd want to embed a proper Korean font
  doc.setFont('helvetica')
  return doc
}

export const generatePDFReport = async (
  summary: ReportSummary,
  filters: ReportFilters,
  reportTitle: string
): Promise<Blob> => {
  const doc = new jsPDF()
  addKoreanFont(doc)

  // Title
  doc.setFontSize(20)
  doc.text(reportTitle, 14, 20)

  // Date Range
  doc.setFontSize(10)
  const dateFrom = formatVietnamDate(filters.dateRange.from)
  const dateTo = formatVietnamDate(filters.dateRange.to)
  doc.text(`Period: ${dateFrom} ~ ${dateTo}`, 14, 30)

  // Summary Statistics
  doc.setFontSize(14)
  doc.text('Summary Statistics', 14, 45)

  const summaryData = [
    ['Total Inspections', summary.total_inspections.toString()],
    ['Passed Inspections', summary.passed_inspections.toString()],
    ['Failed Inspections', summary.failed_inspections.toString()],
    ['Pass Rate', `${summary.pass_rate.toFixed(1)}%`],
    ['Total Defects', summary.total_defects.toString()],
  ]

  autoTable(doc, {
    startY: 50,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
  })

  // Defects by Type
  let finalY = (doc as any).lastAutoTable.finalY || 100
  doc.setFontSize(14)
  doc.text('Defects by Type', 14, finalY + 10)

  const defectsData = summary.defects_by_type.map((defect) => [
    defect.type,
    defect.count.toString(),
    `${((defect.count / summary.total_defects) * 100).toFixed(1)}%`,
  ])

  autoTable(doc, {
    startY: finalY + 15,
    head: [['Defect Type', 'Count', 'Percentage']],
    body: defectsData,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
  })

  // Process Performance
  finalY = (doc as any).lastAutoTable.finalY || 150
  doc.setFontSize(14)
  doc.text('Process Performance', 14, finalY + 10)

  const processData = summary.inspections_by_process.map((process) => [
    process.process_name,
    process.count.toString(),
    `${process.pass_rate.toFixed(1)}%`,
    process.pass_rate >= 95 ? 'Excellent' : process.pass_rate >= 90 ? 'Good' : 'Needs Improvement',
  ])

  autoTable(doc, {
    startY: finalY + 15,
    head: [['Process', 'Inspections', 'Pass Rate', 'Grade']],
    body: processData,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
  })

  // Model Performance - Add new page if needed
  finalY = (doc as any).lastAutoTable.finalY || 200
  if (finalY > 250) {
    doc.addPage()
    finalY = 20
  }

  doc.setFontSize(14)
  doc.text('Model Performance', 14, finalY + 10)

  const modelData = summary.inspections_by_model.map((model) => [
    model.model_name,
    model.count.toString(),
    `${model.pass_rate.toFixed(1)}%`,
    model.pass_rate >= 95 ? 'Excellent' : model.pass_rate >= 90 ? 'Good' : 'Needs Improvement',
  ])

  autoTable(doc, {
    startY: finalY + 15,
    head: [['Model', 'Inspections', 'Pass Rate', 'Grade']],
    body: modelData,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Generated on ${formatVietnamDateTime(new Date())}`,
      14,
      doc.internal.pageSize.height - 10
    )
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    )
  }

  return doc.output('blob')
}

export const generateExcelReport = async (
  summary: ReportSummary,
  filters: ReportFilters,
  reportTitle: string
): Promise<Blob> => {
  const workbook = new ExcelJS.Workbook()

  // Set workbook properties
  workbook.creator = 'CNC QC KPI System'
  workbook.created = new Date()

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary')

  summarySheet.addRow([reportTitle])
  summarySheet.addRow([])
  summarySheet.addRow(['Period', `${formatVietnamDate(filters.dateRange.from)} ~ ${formatVietnamDate(filters.dateRange.to)}`])
  summarySheet.addRow([])
  summarySheet.addRow(['Summary Statistics'])
  summarySheet.addRow(['Metric', 'Value'])
  summarySheet.addRow(['Total Inspections', summary.total_inspections])
  summarySheet.addRow(['Passed Inspections', summary.passed_inspections])
  summarySheet.addRow(['Failed Inspections', summary.failed_inspections])
  summarySheet.addRow(['Pass Rate', `${summary.pass_rate.toFixed(1)}%`])
  summarySheet.addRow(['Total Defects', summary.total_defects])

  // Set column widths
  summarySheet.getColumn(1).width = 20
  summarySheet.getColumn(2).width = 20

  // Style the title
  summarySheet.getRow(1).font = { bold: true, size: 14 }
  summarySheet.getRow(6).font = { bold: true }

  // Defects by Type Sheet
  const defectsSheet = workbook.addWorksheet('Defects by Type')

  defectsSheet.addRow(['Defects by Type'])
  defectsSheet.addRow([])
  defectsSheet.addRow(['Defect Type', 'Count', 'Percentage'])

  summary.defects_by_type.forEach((defect) => {
    defectsSheet.addRow([
      defect.type,
      defect.count,
      `${((defect.count / summary.total_defects) * 100).toFixed(1)}%`,
    ])
  })

  // Set column widths
  defectsSheet.getColumn(1).width = 20
  defectsSheet.getColumn(2).width = 10
  defectsSheet.getColumn(3).width = 15

  // Style the header
  defectsSheet.getRow(1).font = { bold: true, size: 14 }
  defectsSheet.getRow(3).font = { bold: true }

  // Process Performance Sheet
  const processSheet = workbook.addWorksheet('Process Performance')

  processSheet.addRow(['Process Performance'])
  processSheet.addRow([])
  processSheet.addRow(['Process', 'Inspections', 'Pass Rate', 'Grade'])

  summary.inspections_by_process.forEach((process) => {
    processSheet.addRow([
      process.process_name,
      process.count,
      `${process.pass_rate.toFixed(1)}%`,
      process.pass_rate >= 95 ? 'Excellent' : process.pass_rate >= 90 ? 'Good' : 'Needs Improvement',
    ])
  })

  // Set column widths
  processSheet.getColumn(1).width = 20
  processSheet.getColumn(2).width = 15
  processSheet.getColumn(3).width = 15
  processSheet.getColumn(4).width = 20

  // Style the header
  processSheet.getRow(1).font = { bold: true, size: 14 }
  processSheet.getRow(3).font = { bold: true }

  // Model Performance Sheet
  const modelSheet = workbook.addWorksheet('Model Performance')

  modelSheet.addRow(['Model Performance'])
  modelSheet.addRow([])
  modelSheet.addRow(['Model', 'Inspections', 'Pass Rate', 'Grade'])

  summary.inspections_by_model.forEach((model) => {
    modelSheet.addRow([
      model.model_name,
      model.count,
      `${model.pass_rate.toFixed(1)}%`,
      model.pass_rate >= 95 ? 'Excellent' : model.pass_rate >= 90 ? 'Good' : 'Needs Improvement',
    ])
  })

  // Set column widths
  modelSheet.getColumn(1).width = 20
  modelSheet.getColumn(2).width = 15
  modelSheet.getColumn(3).width = 15
  modelSheet.getColumn(4).width = 20

  // Style the header
  modelSheet.getRow(1).font = { bold: true, size: 14 }
  modelSheet.getRow(3).font = { bold: true }

  // Generate Excel file
  const excelBuffer = await workbook.xlsx.writeBuffer()
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
