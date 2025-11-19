import { useTranslation } from 'react-i18next'
import { Box, Typography, Card, CardContent } from '@mui/material'

export function ReportsPage() {
  const { t } = useTranslation()

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          {t('reports.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('reports.description')}
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {t('reports.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('reports.comingSoon')}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
