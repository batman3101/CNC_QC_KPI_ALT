/**
 * Process Capability Card 컴포넌트
 * 공정능력 지수 및 히스토그램 표시
 */

import { useTranslation } from 'react-i18next'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CapabilityRating } from '@/types/spc'

interface ProcessCapabilityCardProps {
  capability: {
    cp: number
    cpk: number
    cpl: number
    cpu: number
    rating: CapabilityRating
    ppm: number
  }
  statistics: {
    count: number
    mean: number
    std_dev: number
    min: number
    max: number
  }
  histogram: Array<{
    bin: number
    count: number
    binStart: number
    binEnd: number
  }>
  usl: number
  lsl: number
  target: number
  itemName?: string
}

export function ProcessCapabilityCard({
  capability,
  statistics,
  histogram,
  usl,
  lsl,
  target,
  itemName,
}: ProcessCapabilityCardProps) {
  const { t } = useTranslation()

  const getRatingBadge = (rating: CapabilityRating) => {
    const variants: Record<CapabilityRating, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      excellent: { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
      good: { variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
      adequate: { variant: 'secondary', className: 'bg-yellow-500 text-black hover:bg-yellow-600' },
      poor: { variant: 'destructive', className: 'bg-orange-500 hover:bg-orange-600' },
      inadequate: { variant: 'destructive', className: '' },
    }
    const config = variants[rating]
    return (
      <Badge variant={config.variant} className={config.className}>
        {t(`spc.capability.${rating}`)}
      </Badge>
    )
  }

  return (
    <Card className="shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('spc.processCapability')}</CardTitle>
            {itemName && <CardDescription>{itemName}</CardDescription>}
          </div>
          {getRatingBadge(capability.rating)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 공정능력 지수 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-muted p-3 text-center">
            <div className="text-xs text-muted-foreground">{t('spc.cp')}</div>
            <div className="text-xl font-bold">{capability.cp.toFixed(2)}</div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-center">
            <div className="text-xs text-muted-foreground">{t('spc.cpk')}</div>
            <div className={`text-xl font-bold ${
              capability.cpk >= 1.33 ? 'text-green-600' :
              capability.cpk >= 1.0 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {capability.cpk.toFixed(2)}
            </div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-center">
            <div className="text-xs text-muted-foreground">{t('spc.cpl')}</div>
            <div className="text-xl font-bold">{capability.cpl.toFixed(2)}</div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-center">
            <div className="text-xs text-muted-foreground">{t('spc.cpu')}</div>
            <div className="text-xl font-bold">{capability.cpu.toFixed(2)}</div>
          </div>
        </div>

        {/* 히스토그램 */}
        {histogram.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">{t('spc.histogram.title')}</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={histogram} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="bin"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => value.toFixed(2)}
                  stroke="hsl(var(--border))"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--border))"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [value, t('spc.histogram.frequency')]}
                  labelFormatter={(value) => `${value}`}
                />
                {/* LSL Reference Line */}
                <ReferenceLine
                  x={lsl}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="5 5"
                  label={{ value: 'LSL', position: 'top', fontSize: 10 }}
                />
                {/* Target Reference Line */}
                <ReferenceLine
                  x={target}
                  stroke="hsl(var(--chart-4))"
                  label={{ value: 'Target', position: 'top', fontSize: 10 }}
                />
                {/* USL Reference Line */}
                <ReferenceLine
                  x={usl}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="5 5"
                  label={{ value: 'USL', position: 'top', fontSize: 10 }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 통계 정보 */}
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-5">
          <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
            <span className="text-muted-foreground">{t('spc.statistics.count')}:</span>
            <span className="font-medium">{statistics.count}</span>
          </div>
          <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
            <span className="text-muted-foreground">{t('spc.statistics.mean')}:</span>
            <span className="font-medium">{statistics.mean.toFixed(3)}</span>
          </div>
          <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
            <span className="text-muted-foreground">{t('spc.statistics.stdDev')}:</span>
            <span className="font-medium">{statistics.std_dev.toFixed(4)}</span>
          </div>
          <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
            <span className="text-muted-foreground">{t('spc.statistics.min')}:</span>
            <span className="font-medium">{statistics.min.toFixed(3)}</span>
          </div>
          <div className="flex justify-between rounded bg-muted/50 px-2 py-1">
            <span className="text-muted-foreground">{t('spc.statistics.max')}:</span>
            <span className="font-medium">{statistics.max.toFixed(3)}</span>
          </div>
        </div>

        {/* 규격 정보 */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{t('spc.lsl')}: </span>
            <span className="font-medium">{lsl.toFixed(3)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('spc.target')}: </span>
            <span className="font-medium">{target.toFixed(3)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('spc.usl')}: </span>
            <span className="font-medium">{usl.toFixed(3)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('spc.ppm')}: </span>
            <span className="font-medium">{capability.ppm.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
