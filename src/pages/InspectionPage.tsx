import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function InspectionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">검사 실행</h1>
        <p className="text-muted-foreground">
          새로운 품질 검사를 시작하고 데이터를 입력하세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>검사 시작</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            검사 폼이 여기에 표시됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
