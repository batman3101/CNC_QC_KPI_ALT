import { useTranslation } from 'react-i18next'
import { DefectsList } from '@/components/defects/DefectsList'

export function DefectsPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('defects.title')}</h1>
        <p className="text-muted-foreground">
          {t('defects.description')}
        </p>
      </div>

      <DefectsList />
    </div>
  )
}
