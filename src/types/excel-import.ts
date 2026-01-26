/**
 * Excel Bulk Import Types
 */

// Entity types for management tabs
export type EntityType =
  | 'productModel'
  | 'inspectionItem'
  | 'inspectionProcess'
  | 'defectType'

// Language for template/parsing
export type ImportLanguage = 'ko' | 'vi'

// Column mapping definition
export interface ColumnMapping {
  field: string
  koHeader: string
  viHeader: string
  required: boolean
  dataType: 'string' | 'number' | 'boolean' | 'enum'
  enumValues?: string[]
  defaultValue?: string | number | boolean
  description?: {
    ko: string
    vi: string
  }
}

// Validation error for a single row
export interface ValidationError {
  row: number
  field: string
  fieldLabel: string
  message: string
}

// Parse result for a single row
export interface ParsedRow<T = Record<string, unknown>> {
  rowNumber: number
  data: T
  isValid: boolean
  errors: ValidationError[]
}

// Overall parse result
export interface ParseResult<T = Record<string, unknown>> {
  language: ImportLanguage
  totalRows: number
  validRows: ParsedRow<T>[]
  invalidRows: ParsedRow<T>[]
  validCount: number
  errorCount: number
}

// Import state for UI
export type ImportState =
  | 'idle'
  | 'uploading'
  | 'validating'
  | 'validated'
  | 'saving'
  | 'success'
  | 'error'

// Import progress
export interface ImportProgress {
  current: number
  total: number
  percentage: number
}

// Bulk save result
export interface BulkSaveResult {
  success: number
  failed: number
  errors: string[]
}

// Props for ExcelBulkImportDialog
export interface ExcelBulkImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: EntityType
  onSuccess?: () => void
  // For inspection items - need to pass existing models
  existingModels?: Array<{ id: string; code: string; name: string }>
  // For inspection items - need to pass existing processes
  existingProcesses?: Array<{ id: string; code: string; name: string }>
}

// Data types for each entity
export interface ProductModelImportData {
  code: string
  name: string
}

export interface InspectionItemImportData {
  model_code: string
  process_code?: string
  name: string
  data_type: 'numeric' | 'ok_ng'
  standard_value?: number
  tolerance_min?: number
  tolerance_max?: number
  unit?: string
}

export interface InspectionProcessImportData {
  code: string
  name: string
  description?: string
  is_active?: boolean
}

export interface DefectTypeImportData {
  code: string
  name: string
  description?: string
  severity: 'low' | 'medium' | 'high'
  is_active?: boolean
}

// Union type for all import data
export type ImportData =
  | ProductModelImportData
  | InspectionItemImportData
  | InspectionProcessImportData
  | DefectTypeImportData
