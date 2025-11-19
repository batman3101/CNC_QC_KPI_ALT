import { DefectsList } from '@/components/defects/DefectsList'

export function DefectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">불량 관리</h1>
        <p className="text-muted-foreground">
          발생한 불량을 관리하고 조치하세요
        </p>
      </div>

      <DefectsList />
    </div>
  )
}
