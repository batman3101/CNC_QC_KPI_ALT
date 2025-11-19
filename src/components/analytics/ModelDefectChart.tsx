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
<<<<<<< HEAD
import { useTranslation } from 'react-i18next'
=======
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ModelDefectDistribution } from '@/types/analytics'

interface ModelDefectChartProps {
  data: ModelDefectDistribution[]
}

const COLORS = [
<<<<<<< HEAD
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export function ModelDefectChart({ data }: ModelDefectChartProps) {
  const { t } = useTranslation()
=======
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(221.2 83.2% 53.3%)',
  'hsl(142.1 76.2% 36.3%)',
  'hsl(47.9 95.8% 53.1%)',
]

export function ModelDefectChart({ data }: ModelDefectChartProps) {
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
  // Sort by defect count
  const sortedData = [...data].sort((a, b) => b.defectCount - a.defectCount)

  return (
    <Card>
      <CardHeader>
<<<<<<< HEAD
        <CardTitle>{t('charts.modelDefectDistribution')}</CardTitle>
=======
        <CardTitle>모델별 불량 분포</CardTitle>
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={sortedData}>
<<<<<<< HEAD
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
=======
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="modelCode"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              label={{ value: '불량 건수', angle: -90, position: 'insideLeft' }}
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
            />
            <YAxis
              yAxisId="right"
              orientation="right"
<<<<<<< HEAD
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
=======
              tick={{ fontSize: 12 }}
              label={{ value: '불량률 (%)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
<<<<<<< HEAD
                          {t('dashboard.model')}
=======
                          모델
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
                        </span>
                        <span className="font-bold">
                          {data.modelName} ({data.modelCode})
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
<<<<<<< HEAD
                          {t('charts.inspectionCount')}
                        </span>
                        <span className="font-bold">
                          {data.totalInspections}
=======
                          총 검사
                        </span>
                        <span className="font-bold">
                          {data.totalInspections}건
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
<<<<<<< HEAD
                          {t('charts.defectCount')}
                        </span>
                        <span className="font-bold text-destructive">
                          {data.defectCount}
=======
                          불량 건수
                        </span>
                        <span className="font-bold text-destructive">
                          {data.defectCount}건
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
<<<<<<< HEAD
                          {t('charts.defectRate')}
=======
                          불량률
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
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
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="defectCount"
<<<<<<< HEAD
              name={t('charts.defectCount')}
=======
              name="불량 건수"
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
              radius={[8, 8, 0, 0]}
            >
              {sortedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
            <Bar
              yAxisId="right"
              dataKey="defectRate"
<<<<<<< HEAD
              name={t('charts.defectRate') + ' (%)'}
=======
              name="불량률 (%)"
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
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
