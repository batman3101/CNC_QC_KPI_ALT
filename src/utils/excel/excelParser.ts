/**
 * Excel File Parser for Bulk Import
 */

import ExcelJS from 'exceljs'
import type {
  EntityType,
  ImportLanguage,
  ParseResult,
  ParsedRow,
  ValidationError,
} from '@/types/excel-import'
import {
  COLUMN_MAPPINGS,
  getColumnByHeader,
  validateHeaders,
} from './columnMappings'
import { getSchemaForEntityType, validateRow, findDuplicates, findExistingCodes } from './validators'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

type TranslationFn = (key: string) => string

/**
 * Process pattern regex for auto-separation from model code
 * Matches: -CNC1, -CNC2, -IQC, -PQC, -OQC, etc.
 */
const PROCESS_PATTERN = /^(.+)-([A-Z0-9]+\d*)$/i

/**
 * Known process codes that should be auto-separated
 */
const KNOWN_PROCESS_CODES = ['CNC1', 'CNC2', 'CNC3', 'IQC', 'PQC', 'OQC', 'FQC']

/**
 * Parse model-process combined string into separate model and process codes
 * e.g., "B7 MMW-CNC2" => { model: "B7 MMW", process: "CNC2" }
 * e.g., "M1" => { model: "M1", process: null }
 */
export function parseModelProcessCode(
  combinedCode: string,
  existingProcessCodes: string[] = []
): { model: string; process: string | null } {
  if (!combinedCode) {
    return { model: '', process: null }
  }

  const trimmed = combinedCode.trim()

  // Check for known process code patterns at the end
  const allProcessCodes = [...new Set([...KNOWN_PROCESS_CODES, ...existingProcessCodes.map(c => c.toUpperCase())])]

  for (const processCode of allProcessCodes) {
    const suffix = `-${processCode}`
    if (trimmed.toUpperCase().endsWith(suffix.toUpperCase())) {
      const modelPart = trimmed.slice(0, -suffix.length).trim()
      return { model: modelPart, process: processCode }
    }
  }

  // Fallback: try regex pattern match
  const match = trimmed.match(PROCESS_PATTERN)
  if (match) {
    const potentialProcess = match[2].toUpperCase()
    // Only split if the suffix looks like a process code (contains numbers or is in known list)
    if (/\d/.test(potentialProcess) || allProcessCodes.includes(potentialProcess)) {
      return { model: match[1].trim(), process: potentialProcess }
    }
  }

  // No process code found, return as model only
  return { model: trimmed, process: null }
}

/**
 * Validate file type and size
 */
export function validateFile(
  file: File,
  t: TranslationFn
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: t('bulkImport.fileTooLarge') }
  }

  // Check file type
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ]
  const validExtensions = ['.xlsx', '.xls']

  const hasValidType = validTypes.includes(file.type)
  const hasValidExtension = validExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  )

  if (!hasValidType && !hasValidExtension) {
    return { valid: false, error: t('bulkImport.invalidFileType') }
  }

  return { valid: true }
}

/**
 * Parse cell value based on expected data type
 */
function parseCellValue(
  value: ExcelJS.CellValue,
  dataType: 'string' | 'number' | 'boolean' | 'enum'
): unknown {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return dataType === 'boolean' ? true : undefined
  }

  // Handle ExcelJS rich text
  if (typeof value === 'object' && 'richText' in value) {
    const text = (value as ExcelJS.CellRichTextValue).richText
      .map((rt) => rt.text)
      .join('')
    return parseCellValue(text, dataType)
  }

  // Handle formula results
  if (typeof value === 'object' && 'result' in value) {
    return parseCellValue((value as ExcelJS.CellFormulaValue).result, dataType)
  }

  // Handle objects with text property (e.g., CellHyperlinkValue, etc.)
  if (typeof value === 'object' && value !== null && 'text' in value) {
    return parseCellValue((value as { text: ExcelJS.CellValue }).text, dataType)
  }

  switch (dataType) {
    case 'string':
      return String(value).trim()

    case 'number':
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(',', '.'))
        return isNaN(parsed) ? undefined : parsed
      }
      return undefined

    case 'boolean':
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') {
        const lower = value.toLowerCase().trim()
        if (lower === 'true' || lower === '1' || lower === 'yes' || lower === 'o') return true
        if (lower === 'false' || lower === '0' || lower === 'no' || lower === 'x') return false
      }
      if (typeof value === 'number') return value === 1
      return true // Default to true (active)

    case 'enum':
      return String(value).trim().toLowerCase().replace(/[^a-z0-9_]/g, '')

    default:
      return value
  }
}

/**
 * Parse Excel file and validate data
 */
export async function parseExcelFile<T = Record<string, unknown>>(
  file: File,
  entityType: EntityType,
  t: TranslationFn,
  options?: {
    existingModelCodes?: string[]
    existingProcessCodes?: string[]
    existingCodes?: string[]
  }
): Promise<ParseResult<T>> {
  const workbook = new ExcelJS.Workbook()
  const buffer = await file.arrayBuffer()
  await workbook.xlsx.load(buffer)

  // Get first worksheet
  const worksheet = workbook.worksheets[0]
  if (!worksheet || worksheet.rowCount < 2) {
    return {
      language: 'ko',
      totalRows: 0,
      validRows: [],
      invalidRows: [],
      validCount: 0,
      errorCount: 0,
    }
  }

  // Get headers from first row
  const headerRow = worksheet.getRow(1)
  const headers: string[] = []
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value || '').trim()
  })

  // Validate headers
  const headerValidation = validateHeaders(entityType, headers)
  if (!headerValidation.valid) {
    // Return with header validation error
    const invalidRow: ParsedRow<T> = {
      rowNumber: 1,
      data: {} as T,
      isValid: false,
      errors: [
        {
          row: 1,
          field: 'headers',
          fieldLabel: t('bulkImport.rowNumber'),
          message: `${t('bulkImport.invalidHeaders')}: ${headerValidation.missingRequired.join(', ')}`,
        },
      ],
    }
    return {
      language: headerValidation.language,
      totalRows: 1,
      validRows: [],
      invalidRows: [invalidRow],
      validCount: 0,
      errorCount: 1,
    }
  }

  const language = headerValidation.language
  const mappings = COLUMN_MAPPINGS[entityType]

  // Map header positions
  const headerToColumnIndex = new Map<string, number>()
  headers.forEach((header, index) => {
    const mapping = getColumnByHeader(entityType, header)
    if (mapping) {
      headerToColumnIndex.set(mapping.field, index)
    }
  })

  // Get validation schema
  const schema = getSchemaForEntityType(entityType, t, {
    existingModelCodes: options?.existingModelCodes,
    existingProcessCodes: options?.existingProcessCodes,
  })

  // Parse data rows
  const parsedRows: ParsedRow<T>[] = []
  const allData: Array<Record<string, unknown>> = []

  for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum)

    // Skip empty rows
    let isEmpty = true
    row.eachCell(() => {
      isEmpty = false
    })
    if (isEmpty) continue

    // Parse row data
    const rowData: Record<string, unknown> = {}
    mappings.forEach((mapping) => {
      const colIndex = headerToColumnIndex.get(mapping.field)
      if (colIndex !== undefined) {
        const cell = row.getCell(colIndex + 1)
        const value = parseCellValue(cell.value, mapping.dataType)
        rowData[mapping.field] = value ?? mapping.defaultValue
      } else if (mapping.defaultValue !== undefined) {
        rowData[mapping.field] = mapping.defaultValue
      }
    })

    // Auto-separate model and process codes for inspection items
    // e.g., "B7 MMW-CNC2" => model: "B7 MMW", process: "CNC2"
    if (entityType === 'inspectionItem' && rowData.model_code) {
      const modelCodeValue = String(rowData.model_code)
      // Only auto-parse if process_code is empty/not provided
      if (!rowData.process_code) {
        const parsed = parseModelProcessCode(modelCodeValue, options?.existingProcessCodes || [])
        rowData.model_code = parsed.model
        if (parsed.process) {
          rowData.process_code = parsed.process
        }
      }
    }

    allData.push(rowData)

    // Validate row
    const validation = validateRow<T>(rowData, schema)
    const errors: ValidationError[] = validation.errors.map((err) => {
      const mapping = mappings.find((m) => m.field === err.field)
      const fieldLabel = mapping
        ? language === 'ko'
          ? mapping.koHeader
          : mapping.viHeader
        : err.field

      return {
        row: rowNum,
        field: err.field,
        fieldLabel,
        message: err.message,
      }
    })

    parsedRows.push({
      rowNumber: rowNum,
      data: validation.valid ? (validation.data as T) : (rowData as T),
      isValid: validation.valid,
      errors,
    })
  }

  // Check for duplicates within file
  const codeField = entityType === 'inspectionItem' ? 'model_code' : 'code'
  let autoCodeGenerated = false

  if (entityType === 'defectType') {
    // Defect types: auto-generate unique codes for duplicate category codes
    const codeCount = new Map<string, number>()
    allData.forEach((row) => {
      const code = String(row.code || '')
      if (code) codeCount.set(code, (codeCount.get(code) || 0) + 1)
    })

    const duplicatedCodes = new Set<string>()
    codeCount.forEach((count, code) => {
      if (count > 1) duplicatedCodes.add(code)
    })

    if (duplicatedCodes.size > 0) {
      autoCodeGenerated = true
      // Collect reserved codes: non-duplicate literal codes + DB existing codes
      const reservedCodes = new Set<string>(
        allData
          .filter((row) => !duplicatedCodes.has(String(row.code || '')))
          .map((row) => String(row.code || '').toLowerCase())
      )
      if (options?.existingCodes) {
        options.existingCodes.forEach((c) => reservedCodes.add(c.toLowerCase()))
      }

      const codeSeq = new Map<string, number>()
      allData.forEach((row, index) => {
        const code = String(row.code || '')
        if (duplicatedCodes.has(code)) {
          let seq = (codeSeq.get(code) || 0) + 1
          let newCode: string
          do {
            newCode = `${code}-${String(seq).padStart(3, '0')}`
            if (reservedCodes.has(newCode.toLowerCase())) {
              seq++
            } else {
              break
            }
          } while (true)
          codeSeq.set(code, seq)
          reservedCodes.add(newCode.toLowerCase())

          row.code = newCode
          const parsedRow = parsedRows[index]
          if (parsedRow) {
            (parsedRow.data as Record<string, unknown>).code = newCode
          }
        }
      })
    }

    // DB existing code check for defect types (after auto-generation)
    if (options?.existingCodes) {
      const existingSet = new Set(options.existingCodes.map((c) => c.toLowerCase()))
      allData.forEach((row, index) => {
        const code = String(row.code || '')
        if (existingSet.has(code.toLowerCase())) {
          const parsedRow = parsedRows[index]
          if (parsedRow) {
            parsedRow.isValid = false
            parsedRow.errors.push({
              row: parsedRow.rowNumber,
              field: 'code',
              fieldLabel:
                language === 'ko'
                  ? mappings.find((m) => m.field === 'code')?.koHeader || 'code'
                  : mappings.find((m) => m.field === 'code')?.viHeader || 'code',
              message: `${t('bulkImport.codeExists')}: ${code}`,
            })
          }
        }
      })
    }
  } else if (entityType !== 'inspectionItem') {
    const duplicates = findDuplicates(allData, codeField)
    duplicates.forEach((rows, code) => {
      rows.forEach((rowNum) => {
        const parsedRow = parsedRows.find((r) => r.rowNumber === rowNum)
        if (parsedRow) {
          parsedRow.isValid = false
          parsedRow.errors.push({
            row: rowNum,
            field: codeField,
            fieldLabel:
              language === 'ko'
                ? mappings.find((m) => m.field === codeField)?.koHeader || codeField
                : mappings.find((m) => m.field === codeField)?.viHeader || codeField,
            message: `${t('bulkImport.duplicateCode')}: ${code} (${t('bulkImport.rowNumber')} ${rows.join(', ')})`,
          })
        }
      })
    })
  }

  // Check for existing codes in database (defectType handled above)
  if (options?.existingCodes && entityType !== 'inspectionItem' && entityType !== 'defectType') {
    const newCodes = allData.map((row) => String(row[codeField] || ''))
    const existing = findExistingCodes(newCodes, options.existingCodes)
    existing.forEach((code) => {
      const rowIndex = allData.findIndex(
        (row) => String(row[codeField]).toLowerCase() === code.toLowerCase()
      )
      if (rowIndex !== -1) {
        const parsedRow = parsedRows[rowIndex]
        if (parsedRow) {
          parsedRow.isValid = false
          parsedRow.errors.push({
            row: parsedRow.rowNumber,
            field: codeField,
            fieldLabel:
              language === 'ko'
                ? mappings.find((m) => m.field === codeField)?.koHeader || codeField
                : mappings.find((m) => m.field === codeField)?.viHeader || codeField,
            message: `${t('bulkImport.codeExists')}: ${code}`,
          })
        }
      }
    })
  }

  // Split into valid and invalid rows
  const validRows = parsedRows.filter((r) => r.isValid)
  const invalidRows = parsedRows.filter((r) => !r.isValid)

  return {
    language,
    totalRows: parsedRows.length,
    validRows,
    invalidRows,
    validCount: validRows.length,
    errorCount: invalidRows.length,
    autoCodeGenerated,
  }
}

/**
 * Get column label for field (for UI display)
 */
export function getFieldLabel(
  entityType: EntityType,
  field: string,
  language: ImportLanguage
): string {
  const mapping = COLUMN_MAPPINGS[entityType].find((m) => m.field === field)
  if (!mapping) return field
  return language === 'ko' ? mapping.koHeader : mapping.viHeader
}
