import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import {
  BarChart as BarChartIcon,
  CheckCircle,
  Cancel,
  Schedule,
  TrendingUp,
  People,
} from '@mui/icons-material'
import type { KPISummary } from '@/types/analytics'

interface KPICardsProps {
  data?: KPISummary
  isLoading?: boolean
}

export function KPICards({ data, isLoading }: KPICardsProps) {
  if (isLoading || !data) {
    return (
      <Grid2 container spacing={3}>
        {[...Array(6)].map((_, i) => (
          <Grid2 xs={12} sm={6} lg={4} key={i}>
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
          </Grid2>
        ))}
      </Grid2>
    )
  }

  return (
    <Grid2 container spacing={3}>
      {/* Total Inspections */}
      <Grid2 xs={12} sm={6} lg={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                총 검사 건수
              </Typography>
              <BarChartIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {data.totalInspections.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              선택된 기간
            </Typography>
          </CardContent>
        </Card>
      </Grid2>

      {/* First Pass Yield */}
      <Grid2 xs={12} sm={6} lg={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                최초 합격률 (FPY)
              </Typography>
              <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} color="success.main" gutterBottom>
              {data.fpy.toFixed(2)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              목표: 95% 이상
            </Typography>
          </CardContent>
        </Card>
      </Grid2>

      {/* Defect Rate */}
      <Grid2 xs={12} sm={6} lg={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                불량률
              </Typography>
              <Cancel sx={{ color: 'error.main', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} color="error.main" gutterBottom>
              {data.overallDefectRate.toFixed(2)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              총 {data.totalDefects}건
            </Typography>
          </CardContent>
        </Card>
      </Grid2>

      {/* Average Inspection Time */}
      <Grid2 xs={12} sm={6} lg={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                평균 검사 시간
              </Typography>
              <Schedule sx={{ color: 'text.secondary', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {data.avgInspectionTime.toFixed(1)}분
            </Typography>
            <Typography variant="caption" color="text.secondary">
              목표: 5분 이하
            </Typography>
          </CardContent>
        </Card>
      </Grid2>

      {/* Active Inspectors */}
      <Grid2 xs={12} sm={6} lg={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                활동 검사자
              </Typography>
              <People sx={{ color: 'text.secondary', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {data.activeInspectors}명
            </Typography>
            <Typography variant="caption" color="text.secondary">
              선택된 기간
            </Typography>
          </CardContent>
        </Card>
      </Grid2>

      {/* Quality Trend */}
      <Grid2 xs={12} sm={6} lg={4}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="body2" fontWeight={500} color="text.secondary">
                품질 트렌드
              </Typography>
              <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} color="success.main" gutterBottom>
              우수
            </Typography>
            <Typography variant="caption" color="text.secondary">
              목표 대비 +{(data.fpy - 95).toFixed(2)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid2>
    </Grid2>
  )
}
