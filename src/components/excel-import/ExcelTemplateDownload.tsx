/**
 * Excel Template Download Component
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EntityType, ImportLanguage } from '@/types/excel-import'
import { generateTemplate, downloadTemplate } from '@/utils/excel/templateGenerator'

interface ExcelTemplateDownloadProps {
  entityType: EntityType
}

export function ExcelTemplateDownload({ entityType }: ExcelTemplateDownloadProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState<ImportLanguage | null>(null)

  const handleDownload = async (language: ImportLanguage) => {
    setLoading(language)
    try {
      const blob = await generateTemplate(entityType, language)
      downloadTemplate(blob, entityType, language)
    } catch (error) {
      console.error('Failed to generate template:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">{t('bulkImport.templateDownload')}</h4>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDownload('ko')}
          disabled={loading !== null}
        >
          {loading === 'ko' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {t('bulkImport.templateKo')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDownload('vi')}
          disabled={loading !== null}
        >
          {loading === 'vi' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {t('bulkImport.templateVi')}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {t('bulkImport.templateHint')}
      </p>
    </div>
  )
}
