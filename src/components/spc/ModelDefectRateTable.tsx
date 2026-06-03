import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TrendingUp } from 'lucide-react'
import type { ModelDefectRate } from '@/services/spcService'

interface ModelDefectRateTableProps {
  data: ModelDefectRate[]
  onRowClick?: (modelId: string) => void
}

export function ModelDefectRateTable({ data, onRowClick }: ModelDefectRateTableProps) {
  const { t } = useTranslation()
  const rateColor = (r: number) => (r <= 1 ? 'text-green-600' : r <= 3 ? 'text-yellow-600' : 'text-red-600')

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('spc.kpi2.modelDefectRate')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground">{t('spc.noData')}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dashboard.model')}</TableHead>
                  <TableHead className="text-center">{t('spc.kpi2.inspectedQty')}</TableHead>
                  <TableHead className="text-center">{t('spc.chart.defectCount')}</TableHead>
                  <TableHead className="text-center">{t('spc.kpi2.defectRate')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((m) => (
                  <TableRow
                    key={m.model_id}
                    className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                    onClick={() => onRowClick?.(m.model_id)}
                  >
                    <TableCell>
                      <div className="font-medium">{m.model_name}</div>
                      <div className="text-xs text-muted-foreground">{m.model_code}</div>
                    </TableCell>
                    <TableCell className="text-center">{m.inspected.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{m.defects.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={rateColor(m.defect_rate)}>
                        {m.defect_rate.toFixed(2)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
