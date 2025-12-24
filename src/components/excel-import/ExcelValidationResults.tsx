/**
 * Excel Validation Results Component
 */

import { useTranslation } from 'react-i18next'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ParseResult, ValidationError } from '@/types/excel-import'

interface ExcelValidationResultsProps {
  result: ParseResult
}

export function ExcelValidationResults({ result }: ExcelValidationResultsProps) {
  const { t } = useTranslation()

  // Collect all errors
  const allErrors: Array<ValidationError & { row: number }> = []
  result.invalidRows.forEach((row) => {
    row.errors.forEach((error) => {
      allErrors.push({ ...error, row: row.rowNumber })
    })
  })

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">{t('bulkImport.validationResults')}</h4>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="gap-1">
          {t('bulkImport.totalCount')}: {result.totalRows}
        </Badge>
        <Badge
          variant={result.validCount > 0 ? 'default' : 'secondary'}
          className="gap-1"
        >
          <CheckCircle2 className="h-3 w-3" />
          {t('bulkImport.validCount')}: {result.validCount}
        </Badge>
        <Badge
          variant={result.errorCount > 0 ? 'destructive' : 'secondary'}
          className="gap-1"
        >
          <XCircle className="h-3 w-3" />
          {t('bulkImport.errorCount')}: {result.errorCount}
        </Badge>
      </div>

      {/* Status message */}
      {result.errorCount === 0 && result.validCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm">{t('bulkImport.allValid')}</span>
        </div>
      )}

      {result.errorCount > 0 && result.validCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">
            {t('bulkImport.partialValid', {
              valid: result.validCount,
              error: result.errorCount,
            })}
          </span>
        </div>
      )}

      {result.validCount === 0 && result.totalRows > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
          <XCircle className="h-5 w-5" />
          <span className="text-sm">{t('bulkImport.noValidData')}</span>
        </div>
      )}

      {/* Error table */}
      {allErrors.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-muted-foreground">
            {t('bulkImport.errorList')}
          </h5>
          <ScrollArea className="h-[200px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">{t('bulkImport.rowNumber')}</TableHead>
                  <TableHead className="w-[120px]">{t('bulkImport.fieldName')}</TableHead>
                  <TableHead>{t('bulkImport.errorMessage')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allErrors.map((error, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">
                      {error.row}
                    </TableCell>
                    <TableCell className="text-sm">
                      {error.fieldLabel}
                    </TableCell>
                    <TableCell className="text-sm text-destructive">
                      {error.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
