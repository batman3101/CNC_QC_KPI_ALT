/**
 * Zod Validation Schemas for Excel Import
 */

import { z } from 'zod'
import type { EntityType } from '@/types/excel-import'

type TranslationFn = (key: string) => string

/**
 * Product Model Schema
 */
export function createProductModelSchema(t: TranslationFn) {
  return z.object({
    code: z.string().min(1, t('validation.required')).max(50),
    name: z.string().min(1, t('validation.required')).max(100),
  })
}

/**
 * Inspection Item Schema
 */
export function createInspectionItemSchema(
  t: TranslationFn,
  existingModelCodes: string[] = []
) {
  return z
    .object({
      model_code: z
        .string()
        .min(1, t('validation.required'))
        .refine(
          (code) => existingModelCodes.length === 0 || existingModelCodes.includes(code),
          t('bulkImport.modelNotFound')
        ),
      name: z.string().min(1, t('validation.required')).max(100),
      data_type: z.enum(['numeric', 'ok_ng'], {
        errorMap: () => ({ message: t('bulkImport.invalidDataType') }),
      }),
      standard_value: z.number().optional().nullable(),
      tolerance_min: z.number().optional().nullable(),
      tolerance_max: z.number().optional().nullable(),
      unit: z.string().max(20).optional().default('mm'),
    })
    .refine(
      (data) => {
        if (data.data_type === 'numeric') {
          return (
            data.standard_value !== null &&
            data.standard_value !== undefined &&
            data.tolerance_min !== null &&
            data.tolerance_min !== undefined &&
            data.tolerance_max !== null &&
            data.tolerance_max !== undefined
          )
        }
        return true
      },
      { message: t('validation.numericFieldsRequired') }
    )
}

/**
 * Inspection Process Schema
 */
export function createInspectionProcessSchema(t: TranslationFn) {
  return z.object({
    code: z.string().min(1, t('validation.required')).max(50),
    name: z.string().min(1, t('validation.required')).max(100),
    description: z.string().max(500).optional().nullable(),
    is_active: z.boolean().default(true),
  })
}

/**
 * Defect Type Schema
 */
export function createDefectTypeSchema(t: TranslationFn) {
  return z.object({
    code: z.string().min(1, t('validation.required')).max(50),
    name: z.string().min(1, t('validation.required')).max(100),
    description: z.string().max(500).optional().nullable(),
    severity: z.enum(['low', 'medium', 'high'], {
      errorMap: () => ({ message: t('bulkImport.invalidSeverity') }),
    }),
    is_active: z.boolean().default(true),
  })
}

/**
 * Get schema for entity type
 */
export function getSchemaForEntityType(
  entityType: EntityType,
  t: TranslationFn,
  options?: { existingModelCodes?: string[] }
): z.ZodTypeAny {
  switch (entityType) {
    case 'productModel':
      return createProductModelSchema(t)
    case 'inspectionItem':
      return createInspectionItemSchema(t, options?.existingModelCodes)
    case 'inspectionProcess':
      return createInspectionProcessSchema(t)
    case 'defectType':
      return createDefectTypeSchema(t)
    default:
      throw new Error(`Unknown entity type: ${entityType}`)
  }
}

/**
 * Validate a single row of data
 */
export function validateRow<T>(
  data: unknown,
  schema: z.ZodTypeAny
): { valid: boolean; data: T | null; errors: Array<{ field: string; message: string }> } {
  const result = schema.safeParse(data)

  if (result.success) {
    return {
      valid: true,
      data: result.data as T,
      errors: [],
    }
  }

  const errors = result.error.errors.map((err) => ({
    field: err.path.join('.') || 'unknown',
    message: err.message,
  }))

  return {
    valid: false,
    data: null,
    errors,
  }
}

/**
 * Check for duplicate codes in the data
 */
export function findDuplicates(
  data: Array<{ code?: string }>,
  codeField = 'code'
): Map<string, number[]> {
  const codeOccurrences = new Map<string, number[]>()

  data.forEach((row, index) => {
    const code = (row as Record<string, unknown>)[codeField] as string
    if (code) {
      const existing = codeOccurrences.get(code) || []
      existing.push(index + 2) // +2 because row 1 is header, and we're 0-indexed
      codeOccurrences.set(code, existing)
    }
  })

  // Return only duplicates
  const duplicates = new Map<string, number[]>()
  codeOccurrences.forEach((rows, code) => {
    if (rows.length > 1) {
      duplicates.set(code, rows)
    }
  })

  return duplicates
}

/**
 * Check for codes that already exist in the database
 */
export function findExistingCodes(
  newCodes: string[],
  existingCodes: string[]
): string[] {
  const existingSet = new Set(existingCodes.map((c) => c.toLowerCase()))
  return newCodes.filter((code) => existingSet.has(code.toLowerCase()))
}
