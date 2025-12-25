/**
 * Excel Bulk Import Dialog Component
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Upload, Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import type {
  ImportState,
  ParseResult,
  ExcelBulkImportDialogProps,
  ImportProgress,
} from '@/types/excel-import'
import { ENTITY_TYPE_NAMES } from '@/utils/excel/columnMappings'
import { validateFile, parseExcelFile } from '@/utils/excel/excelParser'
import { ExcelTemplateDownload } from './ExcelTemplateDownload'
import { ExcelFileUpload } from './ExcelFileUpload'
import { ExcelValidationResults } from './ExcelValidationResults'

interface ExcelBulkImportDialogPropsExtended extends ExcelBulkImportDialogProps {
  onBulkSave: (
    data: Array<Record<string, unknown>>,
    onProgress: (current: number, total: number) => void
  ) => Promise<{ success: number; failed: number; errors: string[] }>
  existingCodes?: string[]
}

export function ExcelBulkImportDialog({
  open,
  onOpenChange,
  entityType,
  onSuccess,
  onBulkSave,
  existingModels,
  existingCodes,
}: ExcelBulkImportDialogPropsExtended) {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()

  const [state, setState] = useState<ImportState>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [progress, setProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    percentage: 0,
  })

  const entityName =
    ENTITY_TYPE_NAMES[entityType][i18n.language === 'vi' ? 'vi' : 'ko']

  const handleFileSelect = useCallback(
    async (file: File) => {
      setFileError(null)
      setParseResult(null)

      // Validate file
      const fileValidation = validateFile(file, t)
      if (!fileValidation.valid) {
        setFileError(fileValidation.error || null)
        setSelectedFile(file)
        return
      }

      setSelectedFile(file)
      setState('validating')

      try {
        // Parse and validate file content
        const result = await parseExcelFile(file, entityType, t, {
          existingModelCodes: existingModels?.map((m) => m.code),
          existingCodes,
        })
        setParseResult(result)
        setState('validated')
      } catch (error) {
        console.error('Failed to parse file:', error)
        setFileError(t('bulkImport.invalidHeaders'))
        setState('idle')
      }
    },
    [entityType, existingCodes, existingModels, t]
  )

  const handleClearFile = useCallback(() => {
    setSelectedFile(null)
    setFileError(null)
    setParseResult(null)
    setState('idle')
  }, [])

  const handleSave = useCallback(async () => {
    if (!parseResult || parseResult.validCount === 0) return

    setState('saving')
    setProgress({ current: 0, total: parseResult.validCount, percentage: 0 })

    try {
      const validData = parseResult.validRows.map((row) => row.data)
      const result = await onBulkSave(
        validData as Array<Record<string, unknown>>,
        (current, total) => {
          setProgress({
            current,
            total,
            percentage: Math.round((current / total) * 100),
          })
        }
      )

      if (result.success > 0) {
        toast({
          title: t('common.success'),
          description: t('bulkImport.saveSuccess', { count: result.success }),
        })
        setState('success')
        onSuccess?.()
        // Close dialog after short delay
        setTimeout(() => {
          handleClose()
        }, 1500)
      } else {
        toast({
          variant: 'destructive',
          title: t('common.error'),
          description: t('bulkImport.saveError'),
        })
        setState('error')
      }
    } catch (error) {
      console.error('Bulk save failed:', error)
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('bulkImport.saveError'),
      })
      setState('error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parseResult, onBulkSave, onSuccess, t, toast])

  const handleClose = useCallback(() => {
    if (state === 'saving') return // Prevent closing while saving

    setSelectedFile(null)
    setFileError(null)
    setParseResult(null)
    setState('idle')
    setProgress({ current: 0, total: 0, percentage: 0 })
    onOpenChange(false)
  }, [state, onOpenChange])

  const isProcessing = state === 'validating' || state === 'saving'
  const canSave =
    state === 'validated' && parseResult && parseResult.validCount > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('bulkImport.title')} - {entityName}
          </DialogTitle>
          <DialogDescription>
            {t('bulkImport.templateHint')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Template Download */}
          <ExcelTemplateDownload entityType={entityType} />

          <Separator />

          {/* Step 2: File Upload */}
          <ExcelFileUpload
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            onClear={handleClearFile}
            disabled={isProcessing}
            error={fileError}
          />

          {/* Validating indicator */}
          {state === 'validating' && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm text-muted-foreground">
                {t('bulkImport.processing')}...
              </span>
            </div>
          )}

          {/* Step 3: Validation Results */}
          {parseResult && state !== 'validating' && (
            <>
              <Separator />
              <ExcelValidationResults result={parseResult} />
            </>
          )}

          {/* Saving progress */}
          {state === 'saving' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t('bulkImport.saving')}</span>
                <span>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('bulkImport.saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('bulkImport.saveValid', { count: parseResult?.validCount || 0 })}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
