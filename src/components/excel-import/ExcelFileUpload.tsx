/**
 * Excel File Upload Component with Drag & Drop
 */

import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileSpreadsheet, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ExcelFileUploadProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  onClear: () => void
  disabled?: boolean
  error?: string | null
}

export function ExcelFileUpload({
  onFileSelect,
  selectedFile,
  onClear,
  disabled = false,
  error,
}: ExcelFileUploadProps) {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const files = e.dataTransfer.files
      if (files.length > 0) {
        onFileSelect(files[0])
      }
    },
    [disabled, onFileSelect]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        onFileSelect(files[0])
      }
    },
    [onFileSelect]
  )

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }, [disabled])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (selectedFile) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">{t('bulkImport.selectedFile')}</h4>
        <div
          className={cn(
            'flex items-center justify-between p-3 rounded-lg border',
            error ? 'border-destructive bg-destructive/5' : 'border-border bg-muted/50'
          )}
        >
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium truncate max-w-[200px]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{t('bulkImport.fileUpload')}</h4>
      <div
        className={cn(
          'relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        <Upload className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground text-center">
          {t('bulkImport.dragDropHint')}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          {t('bulkImport.fileTypeHint')}
        </p>
      </div>
    </div>
  )
}
