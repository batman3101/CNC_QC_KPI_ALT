import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { DefectPointParetoRow } from '@/types/spc'

interface DefectPointParetoChartProps {
  data: DefectPointParetoRow[]
  maxBars?: number
}

const BAR_COLORS = ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d']

export function DefectPointParetoChart({ data, maxBars = 15 }: DefectPointParetoChartProps) {
  const { t } = useTranslation()
  const rows = data.slice(0, maxBars)

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">{t('spc.defectAnalysis.paretoTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t('spc.defectAnalysis.noData')}
          </p>
        ) : (
          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer>
              <BarChart data={rows} layout="vertical" margin={{ left: 24, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="item_name"
                  width={140}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value) => [value as number, t('spc.defectAnalysis.defectCount')]} />
                <Bar dataKey="defect_count" name={t('spc.defectAnalysis.defectCount')}>
                  {rows.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[Math.min(i, BAR_COLORS.length - 1)]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
