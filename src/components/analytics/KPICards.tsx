import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { KPISummary } from '@/types/analytics'

interface KPICardsProps {
  data: KPISummary
  isLoading?: boolean
}

export function KPICards({ data, isLoading }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              <div className="mt-1 h-3 w-32 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total Inspections */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 검사 건수</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.totalInspections.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">선택된 기간</p>
        </CardContent>
      </Card>

      {/* First Pass Yield */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            최초 합격률 (FPY)
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {data.fpy.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">
            목표: 95% 이상
          </p>
        </CardContent>
      </Card>

      {/* Defect Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">불량률</CardTitle>
          <XCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {data.overallDefectRate.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">
            총 {data.totalDefects}건
          </p>
        </CardContent>
      </Card>

      {/* Average Inspection Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            평균 검사 시간
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.avgInspectionTime.toFixed(1)}분
          </div>
          <p className="text-xs text-muted-foreground">
            목표: 5분 이하
          </p>
        </CardContent>
      </Card>

      {/* Active Inspectors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">활동 검사자</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.activeInspectors}명</div>
          <p className="text-xs text-muted-foreground">선택된 기간</p>
        </CardContent>
      </Card>

      {/* Quality Trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">품질 트렌드</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">우수</div>
          <p className="text-xs text-muted-foreground">
            목표 대비 +{(data.fpy - 95).toFixed(2)}%
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
