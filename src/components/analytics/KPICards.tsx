import { Card, CardContent, Box, Typography, Skeleton, Grid } from '@mui/material'
import {
  BarChart as BarChartIcon,
  CheckCircle,
  Cancel,
  Schedule,
  TrendingUp,
  People,
} from '@mui/icons-material'
<<<<<<< HEAD
import { useTranslation } from 'react-i18next'
=======
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
import type { KPISummary } from '@/types/analytics'

interface KPICardsProps {
  data?: KPISummary
  isLoading?: boolean
}

export function KPICards({ data, isLoading }: KPICardsProps) {
<<<<<<< HEAD
  const { t } = useTranslation()

=======
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
  if (isLoading || !data) {
    return (
      <Grid container spacing={3}>
        {[...Array(6)].map((_, i) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
            <Card>
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
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
<<<<<<< HEAD
                {t('charts.inspectionCount')}
=======
                총 검사 건수
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
              </Typography>
              <BarChartIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {data.totalInspections.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
<<<<<<< HEAD
              {t('analytics.period')}
=======
              선택된 기간
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* First Pass Yield */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
<<<<<<< HEAD
                {t('analytics.fpy')}
=======
                최초 합격률 (FPY)
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
              </Typography>
              <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} color="success.main" gutterBottom>
              {data.fpy.toFixed(2)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
<<<<<<< HEAD
              {t('analytics.target95')}
=======
              목표: 95% 이상
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Defect Rate */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
<<<<<<< HEAD
                {t('charts.defectRate')}
=======
                불량률
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
              </Typography>
              <Cancel sx={{ color: 'error.main', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} color="error.main" gutterBottom>
              {data.overallDefectRate.toFixed(2)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
<<<<<<< HEAD
              {t('analytics.totalDefects', { count: data.totalDefects })}
=======
              총 {data.totalDefects}건
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Average Inspection Time */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
<<<<<<< HEAD
                {t('dashboard.avgInspectionTime')}
=======
                평균 검사 시간
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
              </Typography>
              <Schedule sx={{ color: 'text.secondary', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {data.avgInspectionTime.toFixed(1)}분
            </Typography>
            <Typography variant="caption" color="text.secondary">
<<<<<<< HEAD
              {t('analytics.target5min')}
=======
              목표: 5분 이하
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Active Inspectors */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
<<<<<<< HEAD
                {t('analytics.activeInspectors')}
=======
                활동 검사자
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
              </Typography>
              <People sx={{ color: 'text.secondary', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {data.activeInspectors}명
            </Typography>
            <Typography variant="caption" color="text.secondary">
<<<<<<< HEAD
              {t('analytics.period')}
=======
              선택된 기간
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Quality Trend */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
<<<<<<< HEAD
                {t('analytics.qualityTrend')}
=======
                품질 트렌드
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
              </Typography>
              <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} color="success.main" gutterBottom>
<<<<<<< HEAD
              {t('analytics.excellent')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('analytics.vsTarget', { value: (data.fpy - 95).toFixed(2) })}
=======
              우수
            </Typography>
            <Typography variant="caption" color="text.secondary">
              목표 대비 +{(data.fpy - 95).toFixed(2)}%
>>>>>>> b4e71650e7ce2bca30d3999c3af60ea9b9a8188c
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
