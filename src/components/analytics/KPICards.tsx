import { Card, CardContent, Box, Typography, Skeleton, Grid } from '@mui/material'
import {
  BarChart as BarChartIcon,
  CheckCircle,
  Cancel,
  Build,
  TrendingUp,
  EmojiEvents,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import type { KPISummary } from '@/types/analytics'

// 순위별 메달 색상
const rankColors = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
}

// 카드 공통 스타일
const cardSx = {
  transition: 'all 0.3s ease-in-out',
  height: '100%',
  minHeight: 160,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: 6,
  },
}

const cardContentSx = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}

interface KPICardsProps {
  data?: KPISummary
  isLoading?: boolean
}

export function KPICards({ data, isLoading }: KPICardsProps) {
  const { t } = useTranslation()

  if (isLoading || !data) {
    return (
      <Grid container spacing={3}>
        {[...Array(6)].map((_, i) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
            <Card elevation={3} sx={cardSx}>
              <CardContent sx={cardContentSx}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Skeleton variant="text" width={100} height={20} />
                  <Skeleton variant="circular" width={24} height={24} />
                </Box>
                <Skeleton variant="text" width={80} height={40} />
                <Box sx={{ mt: 'auto' }}>
                  <Skeleton variant="text" width={120} height={16} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    )
  }

  return (
    <Grid container spacing={3}>
      {/* Total Inspections */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card elevation={3} sx={cardSx}>
          <CardContent sx={cardContentSx}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                {t('charts.inspectionCount')}
              </Typography>
              <BarChartIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {data.totalInspections.toLocaleString()}
            </Typography>
            <Box sx={{ mt: 'auto' }}>
              <Typography variant="caption" color="text.secondary">
                {t('analytics.period')}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* First Pass Yield */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card elevation={3} sx={cardSx}>
          <CardContent sx={cardContentSx}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                {t('analytics.fpy')}
              </Typography>
              <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} color="success.main" gutterBottom>
              {data.fpy.toFixed(2)}%
            </Typography>
            <Box sx={{ mt: 'auto' }}>
              <Typography variant="caption" color="text.secondary">
                {t('analytics.target95')}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Defect Rate */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card elevation={3} sx={cardSx}>
          <CardContent sx={cardContentSx}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                {t('charts.defectRate')}
              </Typography>
              <Cancel sx={{ color: 'error.main', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} color="error.main" gutterBottom>
              {data.overallDefectRate.toFixed(2)}%
            </Typography>
            <Box sx={{ mt: 'auto' }}>
              <Typography variant="caption" color="text.secondary">
                {t('analytics.totalDefects', { count: data.totalDefects })}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Average Resolution Time */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card elevation={3} sx={cardSx}>
          <CardContent sx={cardContentSx}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                {t('analytics.avgResolutionTime')}
              </Typography>
              <Build sx={{ color: 'primary.main', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {data.avgResolutionTime.toFixed(1)}{t('analytics.hours')}
            </Typography>
            <Box sx={{ mt: 'auto' }}>
              <Typography variant="caption" color="text.secondary">
                {t('analytics.targetResolution')}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Best Inspectors */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card elevation={3} sx={cardSx}>
          <CardContent sx={cardContentSx}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                {t('analytics.bestInspectors')}
              </Typography>
              <EmojiEvents sx={{ color: '#FFD700', fontSize: 20 }} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {data.topInspectors.map((inspector) => (
                <Box
                  key={inspector.rank}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{
                      color: rankColors[inspector.rank as keyof typeof rankColors],
                      minWidth: 20,
                    }}
                  >
                    {inspector.rank}위
                  </Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ flex: 1 }}>
                    {inspector.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {inspector.defectCount}{t('analytics.defectsFound')}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ mt: 'auto' }}>
              <Typography variant="caption" color="text.secondary">
                {t('analytics.mostDefectsFound')}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Quality Trend */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card elevation={3} sx={cardSx}>
          <CardContent sx={cardContentSx}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                {t('analytics.qualityTrend')}
              </Typography>
              <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} color="success.main" gutterBottom>
              {t('analytics.excellent')}
            </Typography>
            <Box sx={{ mt: 'auto' }}>
              <Typography variant="caption" color="text.secondary">
                {t('analytics.vsTarget', { value: (data.fpy - 95).toFixed(2) })}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
