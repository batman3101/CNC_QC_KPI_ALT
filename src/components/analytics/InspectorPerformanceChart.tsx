import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
<<<<<<< HEAD
import { useTranslation } from 'react-i18next'
=======
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { InspectorPerformance } from '@/types/analytics'

interface InspectorPerformanceChartProps {
  data: InspectorPerformance[]
}

export function InspectorPerformanceChart({
  data,
}: InspectorPerformanceChartProps) {
<<<<<<< HEAD
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('charts.inspectorPerformance')}</CardTitle>
=======
  return (
    <Card>
      <CardHeader>
        <CardTitle>검사자별 성능</CardTitle>
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
<<<<<<< HEAD
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="inspectorName" 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
              stroke="hsl(var(--border))"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              label={{ 
                value: t('charts.inspectionCount'), 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))' }
              }}
              stroke="hsl(var(--border))"
=======
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="inspectorName" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              label={{ value: '검사 건수', angle: -90, position: 'insideLeft' }}
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
              domain={[0, 10]}
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
              domain={[0, 10]}
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
                          {t('charts.inspector')}
=======
                          검사자
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
                        </span>
                        <span className="font-bold">{data.inspectorName}</span>
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
                          {data.defectRate.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
<<<<<<< HEAD
                          {t('dashboard.avgInspectionTime')}
                        </span>
                        <span className="font-bold">
                          {data.avgInspectionTime.toFixed(1)}
=======
                          평균 시간
                        </span>
                        <span className="font-bold">
                          {data.avgInspectionTime.toFixed(1)}분
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
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
              dataKey="totalInspections"
<<<<<<< HEAD
              name={t('charts.inspectionCount')}
              fill="hsl(var(--chart-1))"
=======
              name="검사 건수"
              fill="hsl(var(--primary))"
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
              radius={[8, 8, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="defectRate"
<<<<<<< HEAD
              name={t('charts.defectRate') + ' (%)'}
              fill="hsl(var(--chart-2))"
=======
              name="불량률 (%)"
              fill="hsl(var(--destructive))"
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
              opacity={0.7}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
