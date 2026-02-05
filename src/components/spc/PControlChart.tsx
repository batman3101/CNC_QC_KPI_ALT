/**
 * P-Chart (불량률 관리도) 컴포넌트
 * p-chart for defect rate monitoring
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import type { PChartDataPoint, PChartLimits } from '@/types/spc'

interface PControlChartProps {
  data: PChartDataPoint[]
  limits: PChartLimits
  title?: string
  showLegend?: boolean
}

export function PControlChart({
  data,
  limits,
  title,
  showLegend = true
}: PControlChartProps) {
  const { t } = useTranslation()

  const violationCount = data.filter(d => d.is_violation).length

  // 차트 데이터 포맷팅 (불량률을 퍼센트로 변환)
  const chartData = data.map(point => ({
    ...point,
    defect_rate_pct: point.defect_rate * 100,
    ucl_pct: limits.ucl * 100,
    lcl_pct: Math.max(0, limits.lcl) * 100,
    cl_pct: limits.centerLine * 100,
  }))

  return (
    <Card className="shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{title || t('spc.pChart')}</CardTitle>
          <CardDescription>{t('spc.chart.defectRate')}</CardDescription>
        </div>
        {violationCount > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {violationCount} {t('spc.chart.violation')}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => {
                const parts = value.split('-')
                return `${parts[1]}/${parts[2]}`
              }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
              stroke="hsl(var(--border))"
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const point = payload[0].payload as PChartDataPoint & {
                  defect_rate_pct: number
                  ucl_pct: number
                  lcl_pct: number
                  cl_pct: number
                }
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md">
                    <div className="mb-2 font-semibold">{point.date}</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <span className="text-muted-foreground">{t('spc.chart.defectRate')}:</span>
                      <span className={point.is_violation ? 'font-bold text-destructive' : 'font-medium'}>
                        {point.defect_rate_pct.toFixed(2)}%
                      </span>
                      <span className="text-muted-foreground">{t('spc.chart.defectCount')}:</span>
                      <span>{point.defect_count}</span>
                      <span className="text-muted-foreground">{t('spc.chart.sampleSize')}:</span>
                      <span>{point.sample_size}</span>
                      {point.is_violation && (
                        <>
                          <span className="text-muted-foreground">{t('spc.chart.violation')}:</span>
                          <span className="text-destructive">
                            {point.violation_type === 'ucl_exceeded'
                              ? t('spc.alerts.uclExceeded')
                              : t('spc.alerts.lclExceeded')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )
              }}
            />
            {showLegend && (
              <Legend
                wrapperStyle={{
                  color: 'hsl(var(--foreground))',
                  fontSize: '12px',
                }}
              />
            )}

            {/* UCL Reference Line */}
            <ReferenceLine
              y={limits.ucl * 100}
              stroke="hsl(var(--destructive))"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `UCL: ${(limits.ucl * 100).toFixed(2)}%`,
                position: 'right',
                fill: 'hsl(var(--destructive))',
                fontSize: 10,
              }}
            />

            {/* Center Line */}
            <ReferenceLine
              y={limits.centerLine * 100}
              stroke="hsl(var(--chart-4))"
              strokeWidth={2}
              label={{
                value: `CL: ${(limits.centerLine * 100).toFixed(2)}%`,
                position: 'right',
                fill: 'hsl(var(--chart-4))',
                fontSize: 10,
              }}
            />

            {/* LCL Reference Line (only if > 0) */}
            {limits.lcl > 0 && (
              <ReferenceLine
                y={limits.lcl * 100}
                stroke="hsl(var(--chart-1))"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `LCL: ${(limits.lcl * 100).toFixed(2)}%`,
                  position: 'right',
                  fill: 'hsl(var(--chart-1))',
                  fontSize: 10,
                }}
              />
            )}

            {/* Data Line */}
            <Line
              type="monotone"
              dataKey="defect_rate_pct"
              stroke="hsl(var(--chart-2))"
              name={t('spc.chart.defectRate')}
              strokeWidth={2}
              dot={({ cx, cy, payload }) => {
                const isViolation = payload.is_violation
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isViolation ? 6 : 4}
                    fill={isViolation ? 'hsl(var(--destructive))' : 'hsl(var(--chart-2))'}
                    stroke={isViolation ? 'hsl(var(--destructive))' : 'hsl(var(--chart-2))'}
                    strokeWidth={2}
                  />
                )
              }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* 관리한계 정보 */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
            <span>{t('spc.ucl')}: {(limits.ucl * 100).toFixed(2)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-4))' }} />
            <span>{t('spc.cl')}: {(limits.centerLine * 100).toFixed(2)}%</span>
          </div>
          {limits.lcl > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
              <span>{t('spc.lcl')}: {(limits.lcl * 100).toFixed(2)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
