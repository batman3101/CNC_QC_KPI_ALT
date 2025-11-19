import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { DefectsList } from '@/components/defects/DefectsList'

export function DefectsPage() {
  const { t } = useTranslation()

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          {t('defects.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('defects.description')}
        </Typography>
      </Box>

      <DefectsList />
    </Box>
  )
}
