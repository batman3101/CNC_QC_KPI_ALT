import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function ManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">관리</h1>
        <p className="text-muted-foreground">
          설비, 제품 모델, 검사 항목을 관리하세요
        </p>
      </div>

      <Tabs defaultValue="machines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="machines">설비 관리</TabsTrigger>
          <TabsTrigger value="models">제품 모델</TabsTrigger>
          <TabsTrigger value="items">검사 항목</TabsTrigger>
        </TabsList>

        <TabsContent value="machines">
          <Card>
            <CardHeader>
              <CardTitle>설비 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                설비 목록이 여기에 표시됩니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>제품 모델 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                제품 모델 목록이 여기에 표시됩니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>검사 항목 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                검사 항목 목록이 여기에 표시됩니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
