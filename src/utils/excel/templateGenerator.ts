/**
 * Excel Template Generator for Bulk Import
 */

import ExcelJS from 'exceljs'
import type { EntityType, ImportLanguage } from '@/types/excel-import'
import { COLUMN_MAPPINGS, ENTITY_TYPE_NAMES, SAMPLE_DATA } from './columnMappings'

// Style constants
const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF4F81BD' },
}

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11,
}

const REQUIRED_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFF0000' },
  size: 10,
}

const SAMPLE_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFF2CC' },
}

/**
 * Generate Excel template for a specific entity type and language
 */
export async function generateTemplate(
  entityType: EntityType,
  language: ImportLanguage
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'CNC QC KPI System'
  workbook.created = new Date()

  const entityName = ENTITY_TYPE_NAMES[entityType][language]
  const mappings = COLUMN_MAPPINGS[entityType]

  // Create data sheet
  const dataSheet = workbook.addWorksheet(
    language === 'ko' ? '데이터' : 'Du lieu'
  )

  // Add headers
  const headers = mappings.map((m) =>
    language === 'ko' ? m.koHeader : m.viHeader
  )
  const headerRow = dataSheet.addRow(headers)

  // Style headers
  headerRow.eachCell((cell, colNumber) => {
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    }

    // Add comments with descriptions
    const mapping = mappings[colNumber - 1]
    if (mapping.description) {
      const description = language === 'ko' ? mapping.description.ko : mapping.description.vi
      const requiredText = mapping.required
        ? language === 'ko'
          ? '[필수] '
          : '[Bat buoc] '
        : language === 'ko'
        ? '[선택] '
        : '[Tuy chon] '

      cell.note = {
        texts: [
          { text: requiredText + description, font: { size: 10 } },
        ],
        margins: {
          insetmode: 'custom',
          inset: [0.25, 0.25, 0.25, 0.25],
        },
      }
    }
  })

  // Set column widths
  mappings.forEach((mapping, index) => {
    const column = dataSheet.getColumn(index + 1)
    column.width = Math.max(
      (language === 'ko' ? mapping.koHeader : mapping.viHeader).length * 2,
      15
    )
  })

  // Add sample data
  const samples = SAMPLE_DATA[entityType]
  samples.forEach((sample) => {
    const rowData = mappings.map((mapping) => {
      const value = sample[mapping.field]
      if (mapping.dataType === 'boolean') {
        return value === true || value === 'TRUE' || value === true ? 'TRUE' : 'FALSE'
      }
      return value ?? ''
    })
    const row = dataSheet.addRow(rowData)

    // Style sample rows
    row.eachCell((cell) => {
      cell.fill = SAMPLE_FILL
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      }
    })
  })

  // Add instruction sheet
  const instructionSheet = workbook.addWorksheet(
    language === 'ko' ? '안내' : 'Huong dan'
  )

  // Title
  instructionSheet.addRow([
    language === 'ko'
      ? `${entityName} 일괄 등록 템플릿`
      : `Mau nhap hang loat ${entityName}`,
  ])
  instructionSheet.getRow(1).font = { bold: true, size: 14 }
  instructionSheet.addRow([])

  // Instructions
  const instructions =
    language === 'ko'
      ? [
          '1. 첫 번째 시트(데이터)에 데이터를 입력하세요.',
          '2. 노란색 행은 예시 데이터입니다. 삭제하고 실제 데이터를 입력하세요.',
          '3. 빨간색 * 표시가 있는 열은 필수 입력 항목입니다.',
          '4. 각 셀에 마우스를 올리면 입력 안내를 확인할 수 있습니다.',
          '5. 작성이 완료되면 파일을 저장하고 시스템에 업로드하세요.',
          '',
          '컬럼 설명:',
        ]
      : [
          '1. Nhap du lieu vao sheet dau tien (Du lieu).',
          '2. Hang mau vang la du lieu vi du. Xoa va nhap du lieu thuc.',
          '3. Cot co dau * la truong bat buoc.',
          '4. Di chuot vao o de xem huong dan nhap.',
          '5. Sau khi hoan thanh, luu tep va tai len he thong.',
          '',
          'Mo ta cot:',
        ]

  instructions.forEach((text) => {
    instructionSheet.addRow([text])
  })

  // Column descriptions
  mappings.forEach((mapping) => {
    const header = language === 'ko' ? mapping.koHeader : mapping.viHeader
    const required = mapping.required
      ? language === 'ko'
        ? ' (필수)'
        : ' (Bat buoc)'
      : language === 'ko'
      ? ' (선택)'
      : ' (Tuy chon)'
    const description = mapping.description
      ? language === 'ko'
        ? mapping.description.ko
        : mapping.description.vi
      : ''

    const row = instructionSheet.addRow([`• ${header}${required}: ${description}`])
    if (mapping.required) {
      row.getCell(1).font = REQUIRED_FONT
    }
  })

  instructionSheet.getColumn(1).width = 80

  // Generate blob
  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/**
 * Download template file
 */
export function downloadTemplate(blob: Blob, entityType: EntityType, language: ImportLanguage) {
  const entityName = ENTITY_TYPE_NAMES[entityType][language]
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `${entityName}_template_${language}_${timestamp}.xlsx`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
