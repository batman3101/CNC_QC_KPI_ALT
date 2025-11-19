import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DefectTypeDistribution } from '@/types/analytics'

interface DefectTypeChartProps {
  data: DefectTypeDistribution[]
}

const COLORS = [
  'hsl(var(--destructive))',
  'hsl(var(--primary))',
  'hsl(142.1 76.2% 36.3%)',
  'hsl(47.9 95.8% 53.1%)',
  'hsl(280.4 89.5% 47.8%)',
  'hsl(24.6 95% 53.1%)',
]

export function DefectTypeChart({ data }: DefectTypeChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>불량 유형 분포</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                percentage,
              }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180))
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180))

                return (
                  <text
                    x={x}
                    y={y}
                    fill="white"
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    className="text-xs font-bold"
                  >
                    {`${percentage.toFixed(0)}%`}
                  </text>
                )
              }}
              outerRadius={120}
              dataKey="count"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const data = payload[0].payload
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          불량 유형
                        </span>
                        <span className="font-bold">{data.defectType}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          건수
                        </span>
                        <span className="font-bold">{data.count}건</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          비율
                        </span>
                        <span className="font-bold">
                          {data.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => {
                const data = entry.payload
                return `${data.defectType} (${data.count}건)`
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
