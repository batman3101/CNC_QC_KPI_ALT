import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function DefectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">불량 관리</h1>
        <p className="text-muted-foreground">
          발생한 불량을 관리하고 조치하세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>불량 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            불량 목록이 여기에 표시됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
