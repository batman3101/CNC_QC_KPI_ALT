import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, Percent, AlertTriangle, Crosshair, CheckCircle2 } from 'lucide-react'

export interface DefectKpi {
  inspectedQty: number
  defectRate: number
  openAlerts: number
  topDefectPoint: string
}

interface SPCKPICardsProps {
  defect: DefectKpi
}

export function SPCKPICards({ defect }: SPCKPICardsProps) {
  const { t } = useTranslation()
  const rateColor =
    defect.defectRate <= 1 ? 'text-green-600' : defect.defectRate <= 3 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('spc.kpi2.inspectedQty')}</CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{defect.inspectedQty.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card className="shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('spc.kpi2.defectRate')}</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${rateColor}`}>{defect.defectRate.toFixed(2)}%</div>
        </CardContent>
      </Card>

      <Card className="shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('spc.kpi.openAlerts')}</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${defect.openAlerts > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{defect.openAlerts}</div>
          {defect.openAlerts === 0 && (
            <p className="mt-2 text-xs text-green-600">
              <CheckCircle2 className="mr-1 inline h-3 w-3" />
              {t('spc.chart.noViolation')}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('spc.kpi2.topDefectPoint')}</CardTitle>
          <Crosshair className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
            {defect.topDefectPoint}
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
