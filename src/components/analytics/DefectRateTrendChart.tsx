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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DefectRateTrend } from '@/types/analytics'

interface DefectRateTrendChartProps {
  data: DefectRateTrend[]
}

export function DefectRateTrendChart({ data }: DefectRateTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>불량률 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getMonth() + 1}/${date.getDate()}`
              }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              label={{ value: '불량률 (%)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              label={{ value: '검사 건수', angle: 90, position: 'insideRight' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          날짜
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {data.date}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          검사 건수
                        </span>
                        <span className="font-bold">
                          {data.totalInspections}건
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          불량률
                        </span>
                        <span className="font-bold text-destructive">
                          {data.defectRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          합격률
                        </span>
                        <span className="font-bold text-green-600">
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
              stroke="hsl(var(--destructive))"
              name="불량률 (%)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="passRate"
              stroke="hsl(142.1 76.2% 36.3%)"
              name="합격률 (%)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="totalInspections"
              stroke="hsl(var(--primary))"
              name="검사 건수"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
