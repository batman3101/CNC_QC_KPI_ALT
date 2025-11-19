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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MachinePerformance } from '@/types/analytics'

interface MachinePerformanceChartProps {
  data: MachinePerformance[]
}

export function MachinePerformanceChart({
  data,
}: MachinePerformanceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>설비별 성능 (파레토 차트)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="machineName"
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
              domain={[0, 100]}
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
                          설비
                        </span>
                        <span className="font-bold">
                          {data.machineName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {data.machineModel}
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
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          평균 검사시간
                        </span>
                        <span className="font-bold">
                          {data.avgInspectionTime.toFixed(1)}분
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
              fill="hsl(var(--destructive))"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="defectRate"
              name="불량률 (%)"
              fill="hsl(var(--primary))"
              opacity={0.3}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
