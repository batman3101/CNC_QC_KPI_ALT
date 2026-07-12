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

  // 불량률을 퍼센트로 변환. 관리한계는 점마다 다르므로(표본 크기의 함수) 각
  // 점이 자기 한계를 들고 다닌다 - 수평 상수선으로는 그릴 수 없다.
  const chartData = data.map(point => ({
    ...point,
    defect_rate_pct: point.defect_rate * 100,
    ucl_pct: point.ucl * 100,
    lcl_pct: point.lcl * 100,
  }))

  // LCL이 모든 점에서 0이면(불량률이 낮아 p_bar - 3σ가 음수) 선을 그려도
  // x축과 겹쳐 읽을 정보가 없다.
  const hasLowerLimit = limits.lcl_max > 0

  const pct = (v: number) => `${(v * 100).toFixed(2)}%`
  const rangeLabel = (min: number, max: number) =>
    min.toFixed(6) === max.toFixed(6) ? pct(min) : `${pct(min)} ~ ${pct(max)}`

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
                      {/* 이 점의 한계. 표본 크기에 따라 달라지므로 점마다 보여준다. */}
                      <span className="text-muted-foreground">{t('spc.ucl')}:</span>
                      <span>{point.ucl_pct.toFixed(2)}%</span>
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

            {/* Center Line — 표본 크기와 무관한 유일한 상수 */}
            <ReferenceLine
              y={limits.centerLine * 100}
              stroke="hsl(var(--chart-4))"
              strokeWidth={2}
              label={{
                value: `CL: ${pct(limits.centerLine)}`,
                position: 'right',
                fill: 'hsl(var(--chart-4))',
                fontSize: 10,
              }}
            />

            {/* UCL — 점마다 다르므로 계단선으로 그린다 */}
            <Line
              type="stepAfter"
              dataKey="ucl_pct"
              stroke="hsl(var(--destructive))"
              strokeDasharray="5 5"
              strokeWidth={2}
              name={t('spc.ucl')}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />

            {/* LCL — 전부 0이면 x축과 겹치므로 생략 */}
            {hasLowerLimit && (
              <Line
                type="stepAfter"
                dataKey="lcl_pct"
                stroke="hsl(var(--chart-1))"
                strokeDasharray="5 5"
                strokeWidth={2}
                name={t('spc.lcl')}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            )}

            {/* Data Line */}
            <Line
              type="monotone"
              dataKey="defect_rate_pct"
              stroke="hsl(var(--chart-2))"
              name={t('spc.chart.defectRate')}
              strokeWidth={2}
              // Recharts renders one dot per data point as a list, so the
              // element this returns needs its own key.
              dot={({ cx, cy, index, payload }) => {
                const isViolation = payload.is_violation
                return (
                  <circle
                    key={`p-dot-${payload.date ?? index}`}
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

        {/* 관리한계 정보. UCL/LCL은 표본 크기에 따라 변하므로 단일 값이 아니라
            창(window) 내 범위를 보여준다. */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
            <span>{t('spc.ucl')}: {rangeLabel(limits.ucl_min, limits.ucl_max)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-4))' }} />
            <span>{t('spc.cl')}: {pct(limits.centerLine)}</span>
          </div>
          {hasLowerLimit && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
              <span>{t('spc.lcl')}: {rangeLabel(limits.lcl_min, limits.lcl_max)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
