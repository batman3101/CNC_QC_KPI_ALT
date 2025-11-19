import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import { ProductModelManagement } from '@/components/management/ProductModelManagement'
import { InspectionItemManagement } from '@/components/management/InspectionItemManagement'

export function ManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">관리</h1>
        <p className="text-muted-foreground">
          제품 모델과 검사 항목을 관리하세요
        </p>
      </div>

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList>
          <TabsTrigger value="models">제품 모델</TabsTrigger>
          <TabsTrigger value="items">검사 항목</TabsTrigger>
        </TabsList>

        <TabsContent value="models">
          <ProductModelManagement />
        </TabsContent>

        <TabsContent value="items">
          <InspectionItemManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
