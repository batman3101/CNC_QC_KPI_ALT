import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import { ProductModelManagement } from '@/components/management/ProductModelManagement'
import { InspectionItemManagement } from '@/components/management/InspectionItemManagement'

export function ManagementPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('management.title')}</h1>
        <p className="text-muted-foreground">
          {t('management.description')}
        </p>
      </div>

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList>
          <TabsTrigger value="models">{t('management.productModels')}</TabsTrigger>
          <TabsTrigger value="items">{t('management.inspectionItems')}</TabsTrigger>
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
