import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
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

  const sortedData = [...data].sort((a, b) =>
    b.percentage - a.percentage ||
    b.count - a.count ||
    a.defectType.localeCompare(b.defectType)
  )

  return (
    <Card
      className="shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg"
    >
      <CardHeader>
        <CardTitle>{t('charts.defectTypeDistribution')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={sortedData}
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
                if (percentage < 4) return null
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
              {sortedData.map((_, index) => (
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
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 grid max-h-56 grid-cols-1 gap-2 overflow-auto pr-1 text-sm sm:grid-cols-2">
          {sortedData.map((item, index) => (
            <div
              key={item.defectType}
              className="flex min-w-0 items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-2.5 py-2"
            >
              <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">
                {index + 1}
              </span>
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {item.defectType}
              </span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {item.percentage.toFixed(1)}%
              </span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
