import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableHead, TableRow, Chip, Skeleton, TableContainer, Paper } from '@mui/material'
import Grid2 from '@mui/material/Grid2'
import { BarChart, CheckCircle, Cancel, AccessTime } from '@mui/icons-material'

// UI 테스트용 Mock 서비스
import * as inspectionService from '@/ui_test/mockServices/mockInspectionService'

export function DashboardPage() {
  const { t } = useTranslation()

  // Fetch recent inspections
  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ['dashboard-inspections'],
    queryFn: () => inspectionService.getInspections(),
  })

  // Calculate stats from mock data
  const todayInspections = inspections.length
  const passedInspections = inspections.filter(i => i.status === 'pass').length
  const failedInspections = inspections.filter(i => i.status === 'fail').length
  const passRate = todayInspections > 0 ? ((passedInspections / todayInspections) * 100).toFixed(1) : '0.0'

  const stats = [
    {
      title: t('dashboard.todayInspections'),
      value: todayInspections.toString(),
      subtitle: '금일 기준',
      icon: BarChart,
      color: 'text.secondary',
    },
    {
      title: t('dashboard.passRate'),
      value: `${passRate}%`,
      subtitle: '금일 기준',
      icon: CheckCircle,
      color: 'success.main',
    },
    {
      title: t('dashboard.defectRate'),
      value: failedInspections.toString(),
      subtitle: '금일 기준',
      icon: Cancel,
      color: 'error.main',
    },
    {
      title: '평균 검사 시간',
      value: '4.2분',
      subtitle: '금일 기준',
      icon: AccessTime,
      color: 'text.secondary',
    },
  ]

  // Get recent 10 inspections
  const recentInspections = inspections.slice(0, 10)

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          {t('dashboard.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('dashboard.description')}
        </Typography>
      </Box>

      <Grid2 container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Grid2 xs={12} sm={6} lg={3} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {stat.title}
                    </Typography>
                    <Icon sx={{ color: stat.color, fontSize: 20 }} />
                  </Box>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stat.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>
          )
        })}
      </Grid2>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {t('dashboard.recentInspections')}
          </Typography>

          {isLoading ? (
            <Box sx={{ py: 4 }}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={50} sx={{ mb: 1 }} />
              ))}
            </Box>
          ) : recentInspections.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {t('common.noData')}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>검사 ID</TableCell>
                    <TableCell>설비</TableCell>
                    <TableCell>제품 모델</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>검사 일시</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentInspections.map((inspection) => (
                    <TableRow key={inspection.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {inspection.id.slice(0, 8)}
                        </Typography>
                      </TableCell>
                      <TableCell>{inspection.machine_id?.slice(0, 8) || 'N/A'}</TableCell>
                      <TableCell>{inspection.model_id?.slice(0, 8) || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={inspection.status === 'pass' ? t('dashboard.pass') : t('dashboard.fail')}
                          color={inspection.status === 'pass' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(inspection.created_at).toLocaleString('ko-KR')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
