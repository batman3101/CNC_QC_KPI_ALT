import {
  LineChart,
  Line,
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
import type { DefectRateTrend } from '@/types/analytics'

interface DefectRateTrendChartProps {
  data: DefectRateTrend[]
}

export function DefectRateTrendChart({ data }: DefectRateTrendChartProps) {
<<<<<<< HEAD
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('charts.defectRateTrend')}</CardTitle>
=======
  return (
    <Card>
      <CardHeader>
        <CardTitle>불량률 추이</CardTitle>
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
<<<<<<< HEAD
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
=======
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getMonth() + 1}/${date.getDate()}`
              }}
<<<<<<< HEAD
              stroke="hsl(var(--border))"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              label={{ 
                value: t('charts.defectRate') + ' (%)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))' }
              }}
              stroke="hsl(var(--border))"
=======
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              label={{ value: '불량률 (%)', angle: -90, position: 'insideLeft' }}
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
            />
            <YAxis
              yAxisId="right"
              orientation="right"
<<<<<<< HEAD
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              label={{ 
                value: t('charts.inspectionCount'), 
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
              label={{ value: '검사 건수', angle: 90, position: 'insideRight' }}
            />
            <Tooltip
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
<<<<<<< HEAD
                          {t('charts.date')}
=======
                          날짜
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {data.date}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
<<<<<<< HEAD
                          {t('charts.inspectionCount')}
                        </span>
                        <span className="font-bold">
                          {data.totalInspections}
=======
                          검사 건수
                        </span>
                        <span className="font-bold">
                          {data.totalInspections}건
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
<<<<<<< HEAD
                          {t('charts.defectRate')}
                        </span>
                        <span className="font-bold" style={{ color: 'hsl(var(--chart-2))' }}>
=======
                          불량률
                        </span>
                        <span className="font-bold text-destructive">
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
                          {data.defectRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
<<<<<<< HEAD
                          {t('charts.passRate')}
                        </span>
                        <span className="font-bold" style={{ color: 'hsl(var(--chart-1))' }}>
=======
                          합격률
                        </span>
                        <span className="font-bold text-green-600">
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
                          {data.passRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="defectRate"
<<<<<<< HEAD
              stroke="hsl(var(--chart-2))"
              name={t('charts.defectRate') + ' (%)'}
              strokeWidth={2}
              dot={{ r: 4, fill: 'hsl(var(--chart-2))' }}
=======
              stroke="hsl(var(--destructive))"
              name="불량률 (%)"
              strokeWidth={2}
              dot={{ r: 4 }}
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="passRate"
<<<<<<< HEAD
              stroke="hsl(var(--chart-1))"
              name={t('charts.passRate') + ' (%)'}
              strokeWidth={2}
              dot={{ r: 4, fill: 'hsl(var(--chart-1))' }}
=======
              stroke="hsl(142.1 76.2% 36.3%)"
              name="합격률 (%)"
              strokeWidth={2}
              dot={{ r: 4 }}
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="totalInspections"
<<<<<<< HEAD
              stroke="hsl(var(--chart-3))"
              name={t('charts.inspectionCount')}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: 'hsl(var(--chart-3))' }}
=======
              stroke="hsl(var(--primary))"
              name="검사 건수"
              strokeWidth={2}
              strokeDasharray="5 5"
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
