import { useState, useMemo } from 'react'
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MachinePerformance } from '@/types/analytics'

interface MachinePerformanceChartProps {
  data: MachinePerformance[]
}

export function MachinePerformanceChart({
  data,
}: MachinePerformanceChartProps) {
  const { t } = useTranslation()
  const [topN, setTopN] = useState<string>('10')

  // Sort by defect count desc and take top N, add cumulative %
  const chartData = useMemo(() => {
    const limit = topN === 'all' ? data.length : parseInt(topN)
    const sorted = [...data]
      .sort((a, b) => b.defectCount - a.defectCount)
      .slice(0, limit)

    const totalDefects = sorted.reduce((sum, d) => sum + d.defectCount, 0)
    let cumulative = 0

    return sorted.map((item) => {
      cumulative += item.defectCount
      return {
        ...item,
        cumulativePercent: totalDefects > 0
          ? Math.round((cumulative / totalDefects) * 100)
          : 0,
      }
    })
  }, [data, topN])

  const chartHeight = Math.max(350, chartData.length * 36)

  return (
    <Card
      className="shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{t('charts.machinePerformance')}</CardTitle>
        <Select value={topN} onValueChange={setTopN}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">Top 5</SelectItem>
            <SelectItem value="10">Top 10</SelectItem>
            <SelectItem value="15">Top 15</SelectItem>
            <SelectItem value="all">{t('common.all')}</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--border))"
            />
            <XAxis
              xAxisId="percent"
              type="number"
              orientation="top"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(v) => `${v}%`}
              stroke="hsl(var(--border))"
              hide
            />
            <YAxis
              type="category"
              dataKey="machineName"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              width={90}
              stroke="hsl(var(--border))"
            />
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
                          {t('dashboard.machine')}
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
                          {t('charts.inspectionCount')}
                        </span>
                        <span className="font-bold">
                          {data.totalInspections}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {t('charts.defectCount')}
                        </span>
                        <span className="font-bold text-destructive">
                          {data.defectCount}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {t('charts.defectRate')}
                        </span>
                        <span className="font-bold text-destructive">
                          {data.defectRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {t('charts.cumulativePercent') || '누적 비율'}
                        </span>
                        <span className="font-bold">
                          {data.cumulativePercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
            <Legend
              wrapperStyle={{
                color: 'hsl(var(--foreground))',
                fontSize: '14px'
              }}
            />
            <Bar
              dataKey="defectCount"
              name={t('charts.defectCount')}
              fill="hsl(var(--chart-1))"
              radius={[0, 4, 4, 0]}
              barSize={20}
            />
            <Line
              xAxisId="percent"
              type="monotone"
              dataKey="cumulativePercent"
              name={t('charts.cumulativePercent') || '누적 비율 (%)'}
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ r: 3, fill: 'hsl(var(--chart-2))' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
