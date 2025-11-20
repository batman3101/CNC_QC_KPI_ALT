import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ModelDefectDistribution } from '@/types/analytics'

interface ModelDefectChartProps {
  data: ModelDefectDistribution[]
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export function ModelDefectChart({ data }: ModelDefectChartProps) {
  const { t } = useTranslation()
  // Sort by defect count
  const sortedData = [...data].sort((a, b) => b.defectCount - a.defectCount)

  return (
    <Card 
      className="shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg"
    >
      <CardHeader>
        <CardTitle>{t('charts.modelDefectDistribution')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="modelCode"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              label={{ 
                value: t('charts.defectCount'), 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))' }
              }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              label={{ 
                value: t('charts.defectRate') + ' (%)', 
                angle: 90, 
                position: 'insideRight',
                style: { fill: 'hsl(var(--muted-foreground))' }
              }}
              stroke="hsl(var(--border))"
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))'
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {t('dashboard.model')}
                        </span>
                        <span className="font-bold">
                          {data.modelName} ({data.modelCode})
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {t('charts.inspectionCount')}
                        </span>
                        <span className="font-bold">
                          {data.totalInspections}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {t('charts.defectCount')}
                        </span>
                        <span className="font-bold text-destructive">
                          {data.defectCount}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {t('charts.defectRate')}
                        </span>
                        <span className="font-bold text-destructive">
                          {data.defectRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
            <Legend 
              wrapperStyle={{ 
                color: 'hsl(var(--foreground))',
                fontSize: '14px'
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="defectCount"
              name={t('charts.defectCount')}
              radius={[8, 8, 0, 0]}
            >
              {sortedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
            <Bar
              yAxisId="right"
              dataKey="defectRate"
              name={t('charts.defectRate') + ' (%)'}
              fill="hsl(var(--destructive))"
              opacity={0.3}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
