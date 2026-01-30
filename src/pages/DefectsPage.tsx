import { useTranslation } from 'react-i18next'
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material'
import { DefectsList } from '@/components/defects/DefectsList'

export function DefectsPage() {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Box>
      <Box sx={{ mb: { xs: 2, md: 4 } }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" fontWeight={700} gutterBottom>
          {t('defects.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          {t('defects.description')}
        </Typography>
      </Box>

      <DefectsList />
    </Box>
  )
}
