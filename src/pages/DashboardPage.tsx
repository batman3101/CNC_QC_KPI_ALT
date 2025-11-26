import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

  // Fetch recent inspections
  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ['dashboard-inspections'],
    queryFn: () => inspectionService.getInspections(),
  })

  // Fetch recent defects
  const { data: allDefects = [], isLoading: defectsLoading } = useQuery({
    queryKey: ['dashboard-defects'],
    queryFn: () => inspectionService.getDefects(),
  })

  // Calculate stats from mock data
  const todayInspections = inspections.length
  const passedInspections = inspections.filter((i) => i.status === 'pass').length
  const failedInspections = inspections.filter((i) => i.status === 'fail').length
  const passRate =
    todayInspections > 0
      ? ((passedInspections / todayInspections) * 100).toFixed(1)
      : '0.0'
  const defectRate =
    todayInspections > 0
      ? ((failedInspections / todayInspections) * 100).toFixed(1)
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
      title: t('dashboard.defectCount'),
      value: failedInspections.toString(),
      subtitle: t('dashboard.todayBasis'),
      icon: Cancel,
      color: 'error.main',
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
      value: `${defectRate}%`,
      subtitle: t('dashboard.todayBasis'),
      icon: AccessTime,
      color: 'error.main',
    },
  ]

  // Get recent 10 inspections
  const recentInspections = inspections.slice(0, 10)

  // Get recent defects (최근 5개)
  const recentDefects = allDefects.slice(0, 5)

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
          <Card 
            elevation={3} 
            sx={{ 
              height: '100%',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
          >
            <CardHeader
              title={t('dashboard.recentInspections')}
              action={
                <Button 
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/inspection')}
                >
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
                  elevation={2}
                  sx={{
                    mt: 2,
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
                            <Typography variant="body2">
                              {inspection.machine_id?.includes('machine-001')
                                ? 'CNC 밀링 #1'
                                : inspection.machine_id?.includes('machine-002')
                                ? 'CNC 밀링 #2'
                                : inspection.machine_id?.includes('machine-003')
                                ? 'CNC 선반 #1'
                                : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {inspection.model_id?.includes('BHB')
                                ? 'BHB-002'
                                : inspection.model_id?.includes('SHA')
                                ? 'SHA-001'
                                : inspection.model_id?.includes('FLC')
                                ? 'FLC-003'
                                : inspection.model_id?.includes('GAD')
                                ? 'GAD-004'
                                : inspection.model_id?.includes('CNE')
                                ? 'CNE-005'
                                : 'N/A'}
                            </Typography>
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
          <Card 
            elevation={3} 
            sx={{ 
              height: '100%',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
          >
            <CardHeader
              title={t('dashboard.recentDefects')}
              action={
                <Button 
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/defects')}
                >
                  {t('dashboard.viewAll')}
                </Button>
              }
            />
            <CardContent>
              {defectsLoading ? (
                <Box sx={{ py: 2 }}>
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} height={80} sx={{ mb: 1 }} />
                  ))}
                </Box>
              ) : recentDefects.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('common.noData')}
                  </Typography>
                </Box>
              ) : (
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
                        transition: 'all 0.2s ease-in-out',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateX(4px)',
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover',
                        },
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
                          {defect.defect_type}
                        </Typography>
                        <Chip
                          label={
                            defect.status === 'pending'
                              ? t('dashboard.pending')
                              : defect.status === 'in_progress'
                              ? t('dashboard.inProgress')
                              : t('dashboard.resolved')
                          }
                          color={
                            defect.status === 'pending'
                              ? 'warning'
                              : defect.status === 'in_progress'
                              ? 'info'
                              : 'success'
                          }
                          size="small"
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {defect.description}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {new Date(defect.created_at).toLocaleString('ko-KR')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
