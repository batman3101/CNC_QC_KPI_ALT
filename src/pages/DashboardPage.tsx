import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  TableContainer,
  Paper,
  Grid,
  Button,
  CardHeader,
} from '@mui/material'
import {
  BarChart,
  CheckCircle,
  Cancel,
  AccessTime,
  ArrowForward,
} from '@mui/icons-material'

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
  const passedInspections = inspections.filter((i) => i.status === 'pass').length
  const failedInspections = inspections.filter((i) => i.status === 'fail').length
  const passRate =
    todayInspections > 0
      ? ((passedInspections / todayInspections) * 100).toFixed(1)
      : '0.0'

  const stats = [
    {
      title: t('dashboard.todayInspections'),
      value: todayInspections.toString(),
      subtitle: t('dashboard.todayBasis'),
      icon: BarChart,
      color: 'text.secondary',
    },
    {
      title: t('dashboard.passRate'),
      value: `${passRate}%`,
      subtitle: t('dashboard.todayBasis'),
      icon: CheckCircle,
      color: 'success.main',
    },
    {
      title: t('dashboard.defectRate'),
      value: failedInspections.toString(),
      subtitle: t('dashboard.todayBasis'),
      icon: Cancel,
      color: 'error.main',
    },
    {
      title: t('dashboard.avgInspectionTime'),
      value: '4.2분',
      subtitle: t('dashboard.todayBasis'),
      icon: AccessTime,
      color: 'text.secondary',
    },
  ]

  // Get recent 10 inspections
  const recentInspections = inspections.slice(0, 10)

  // Mock recent defects (since we don't have a service for it yet in this context)
  const recentDefects = [
    {
      id: 'def001',
      defectType: '스크래치',
      machineName: 'Machine A',
      modelName: 'Model X',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'def002',
      defectType: '이물질',
      machineName: 'Machine B',
      modelName: 'Model Y',
      timestamp: new Date().toISOString(),
    },
  ]

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {t('dashboard.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('dashboard.description')}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight={500}
                    >
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
            </Grid>
          )
        })}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Inspections Table */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={t('dashboard.recentInspections')}
              action={
                <Button endIcon={<ArrowForward />}>
                  {t('dashboard.viewAll')}
                </Button>
              }
            />
            <CardContent>
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
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    mt: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('dashboard.inspectionId')}</TableCell>
                        <TableCell>{t('dashboard.machine')}</TableCell>
                        <TableCell>{t('dashboard.model')}</TableCell>
                        <TableCell>{t('dashboard.status')}</TableCell>
                        <TableCell>{t('dashboard.inspectionDate')}</TableCell>
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
                          <TableCell>
                            {inspection.machine_id?.slice(0, 8) || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {inspection.model_id?.slice(0, 8) || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                inspection.status === 'pass'
                                  ? t('dashboard.pass')
                                  : t('dashboard.fail')
                              }
                              color={
                                inspection.status === 'pass'
                                  ? 'success'
                                  : 'error'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(inspection.created_at).toLocaleString()}
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
        </Grid>

        {/* Recent Defects List */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={t('dashboard.recentDefects')}
              action={
                <Button endIcon={<ArrowForward />}>
                  {t('dashboard.viewAll')}
                </Button>
              }
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentDefects.map((defect) => (
                  <Box
                    key={defect.id}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'background.default',
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        {defect.defectType}
                      </Typography>
                      <Chip
                        label={t('dashboard.pending')}
                        color="warning"
                        size="small"
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {defect.machineName} • {defect.modelName}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {new Date(defect.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
