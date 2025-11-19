import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">보고서</h1>
        <p className="text-muted-foreground">
          검사 성적서 및 분석 보고서를 생성하세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>보고서 생성</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            보고서 생성 옵션이 여기에 표시됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
