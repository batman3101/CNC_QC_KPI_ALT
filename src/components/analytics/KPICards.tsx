import { Card, CardContent, Box, Typography, Skeleton, Grid } from '@mui/material'
import {
  BarChart as BarChartIcon,
  CheckCircle,
  Cancel,
  Schedule,
  TrendingUp,
  People,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import type { KPISummary } from '@/types/analytics'

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
            <Card 
              elevation={3}
              sx={{
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Skeleton variant="text" width={100} height={20} />
                  <Skeleton variant="circular" width={24} height={24} />
                </Box>
                <Skeleton variant="text" width={80} height={40} />
                <Skeleton variant="text" width={120} height={16} />
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
        <Card 
          elevation={3}
          sx={{
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6,
            },
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                {t('charts.inspectionCount')}
              </Typography>
              <BarChartIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {data.totalInspections.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('analytics.period')}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* First Pass Yield */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card 
          elevation={3}
          sx={{
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6,
            },
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                {t('analytics.fpy')}
              </Typography>
              <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} color="success.main" gutterBottom>
              {data.fpy.toFixed(2)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('analytics.target95')}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Defect Rate */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card 
          elevation={3}
          sx={{
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6,
            },
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                {t('charts.defectRate')}
              </Typography>
              <Cancel sx={{ color: 'error.main', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} color="error.main" gutterBottom>
              {data.overallDefectRate.toFixed(2)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('analytics.totalDefects', { count: data.totalDefects })}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Average Inspection Time */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card 
          elevation={3}
          sx={{
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6,
            },
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                {t('dashboard.avgInspectionTime')}
              </Typography>
              <Schedule sx={{ color: 'text.secondary', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {data.avgInspectionTime.toFixed(1)}분
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('analytics.target5min')}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Active Inspectors */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card 
          elevation={3}
          sx={{
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6,
            },
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                {t('analytics.activeInspectors')}
              </Typography>
              <People sx={{ color: 'text.secondary', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {data.activeInspectors}명
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('analytics.period')}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Quality Trend */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card 
          elevation={3}
          sx={{
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6,
            },
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                {t('analytics.qualityTrend')}
              </Typography>
              <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} color="success.main" gutterBottom>
              {t('analytics.excellent')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('analytics.vsTarget', { value: (data.fpy - 95).toFixed(2) })}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
