import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HourlyDistribution } from '@/types/analytics'

interface HourlyDistributionChartProps {
  data: HourlyDistribution[]
}

export function HourlyDistributionChart({
  data,
}: HourlyDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>시간대별 검사 분포</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorInspections" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="colorDefects" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--destructive))"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--destructive))"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}시`}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          시간
                        </span>
                        <span className="font-bold">{data.hour}시</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          검사 건수
                        </span>
                        <span className="font-bold">
                          {data.inspectionCount}건
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
                    </div>
                  </div>
                )
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="inspectionCount"
              stroke="hsl(var(--primary))"
              fillOpacity={1}
              fill="url(#colorInspections)"
              name="검사 건수"
            />
            <Area
              type="monotone"
              dataKey="defectCount"
              stroke="hsl(var(--destructive))"
              fillOpacity={1}
              fill="url(#colorDefects)"
              name="불량 건수"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
