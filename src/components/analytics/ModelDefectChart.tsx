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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ModelDefectDistribution } from '@/types/analytics'

interface ModelDefectChartProps {
  data: ModelDefectDistribution[]
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(221.2 83.2% 53.3%)',
  'hsl(142.1 76.2% 36.3%)',
  'hsl(47.9 95.8% 53.1%)',
]

export function ModelDefectChart({ data }: ModelDefectChartProps) {
  // Sort by defect count
  const sortedData = [...data].sort((a, b) => b.defectCount - a.defectCount)

  return (
    <Card>
      <CardHeader>
        <CardTitle>모델별 불량 분포</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="modelCode"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              label={{ value: '불량 건수', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              label={{ value: '불량률 (%)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          모델
                        </span>
                        <span className="font-bold">
                          {data.modelName} ({data.modelCode})
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          총 검사
                        </span>
                        <span className="font-bold">
                          {data.totalInspections}건
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          불량 건수
                        </span>
                        <span className="font-bold text-destructive">
                          {data.defectCount}건
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          불량률
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
              name="불량 건수"
              radius={[8, 8, 0, 0]}
            >
              {sortedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
            <Bar
              yAxisId="right"
              dataKey="defectRate"
              name="불량률 (%)"
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
