import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DefectTypeDistribution } from '@/types/analytics'

interface DefectTypeChartProps {
  data: DefectTypeDistribution[]
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export function DefectTypeChart({ data }: DefectTypeChartProps) {
  const { t } = useTranslation()

  // Calculate dynamic legend height based on data count
  const legendRowHeight = 22
  const legendColumns = 2
  const legendRows = Math.ceil(data.length / legendColumns)
  const legendHeight = Math.max(36, legendRows * legendRowHeight + 8)
  const chartHeight = 280 + legendHeight

  return (
    <Card
      className="shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg"
    >
      <CardHeader>
        <CardTitle>{t('charts.defectTypeDistribution')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy={130}
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
                    fill="hsl(var(--background))"
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    className="text-xs font-bold"
                  >
                    {`${percentage.toFixed(0)}%`}
                  </text>
                )
              }}
              outerRadius={110}
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
                          {t('charts.defectType')}
                        </span>
                        <span className="font-bold">{data.defectType}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {t('charts.defectCount')}
                        </span>
                        <span className="font-bold">{data.count}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {t('charts.percentage')}
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
              height={legendHeight}
              wrapperStyle={{
                color: 'hsl(var(--foreground))',
                fontSize: '11px',
                lineHeight: '20px',
                paddingTop: '8px',
              }}
              formatter={(_value, entry) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = (entry as any).payload
                return `${data.defectType} (${data.count})`
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
