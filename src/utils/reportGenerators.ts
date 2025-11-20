import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { ReportSummary, ReportFilters } from '@/types/report'

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
  const dateFrom = filters.dateRange.from.toLocaleDateString('ko-KR')
  const dateTo = filters.dateRange.to.toLocaleDateString('ko-KR')
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

  // Machine Performance
  finalY = (doc as any).lastAutoTable.finalY || 150
  doc.setFontSize(14)
  doc.text('Machine Performance', 14, finalY + 10)

  const machineData = summary.inspections_by_machine.map((machine) => [
    machine.machine_name,
    machine.count.toString(),
    `${machine.pass_rate.toFixed(1)}%`,
    machine.pass_rate >= 95 ? 'Excellent' : machine.pass_rate >= 90 ? 'Good' : 'Needs Improvement',
  ])

  autoTable(doc, {
    startY: finalY + 15,
    head: [['Machine', 'Inspections', 'Pass Rate', 'Grade']],
    body: machineData,
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
      `Generated on ${new Date().toLocaleString('ko-KR')}`,
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
  const workbook = XLSX.utils.book_new()

  // Summary Sheet
  const summaryData = [
    [reportTitle],
    [],
    ['Period', `${filters.dateRange.from.toLocaleDateString('ko-KR')} ~ ${filters.dateRange.to.toLocaleDateString('ko-KR')}`],
    [],
    ['Summary Statistics'],
    ['Metric', 'Value'],
    ['Total Inspections', summary.total_inspections],
    ['Passed Inspections', summary.passed_inspections],
    ['Failed Inspections', summary.failed_inspections],
    ['Pass Rate', `${summary.pass_rate.toFixed(1)}%`],
    ['Total Defects', summary.total_defects],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)

  // Set column widths
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 20 }]

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  // Defects by Type Sheet
  const defectsData = [
    ['Defects by Type'],
    [],
    ['Defect Type', 'Count', 'Percentage'],
    ...summary.defects_by_type.map((defect) => [
      defect.type,
      defect.count,
      `${((defect.count / summary.total_defects) * 100).toFixed(1)}%`,
    ]),
  ]

  const defectsSheet = XLSX.utils.aoa_to_sheet(defectsData)
  defectsSheet['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(workbook, defectsSheet, 'Defects by Type')

  // Machine Performance Sheet
  const machineData = [
    ['Machine Performance'],
    [],
    ['Machine', 'Inspections', 'Pass Rate', 'Grade'],
    ...summary.inspections_by_machine.map((machine) => [
      machine.machine_name,
      machine.count,
      `${machine.pass_rate.toFixed(1)}%`,
      machine.pass_rate >= 95 ? 'Excellent' : machine.pass_rate >= 90 ? 'Good' : 'Needs Improvement',
    ]),
  ]

  const machineSheet = XLSX.utils.aoa_to_sheet(machineData)
  machineSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(workbook, machineSheet, 'Machine Performance')

  // Model Performance Sheet
  const modelData = [
    ['Model Performance'],
    [],
    ['Model', 'Inspections', 'Pass Rate', 'Grade'],
    ...summary.inspections_by_model.map((model) => [
      model.model_name,
      model.count,
      `${model.pass_rate.toFixed(1)}%`,
      model.pass_rate >= 95 ? 'Excellent' : model.pass_rate >= 90 ? 'Good' : 'Needs Improvement',
    ]),
  ]

  const modelSheet = XLSX.utils.aoa_to_sheet(modelData)
  modelSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(workbook, modelSheet, 'Model Performance')

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
