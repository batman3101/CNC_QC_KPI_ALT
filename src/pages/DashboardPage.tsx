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
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  BarChart,
  CheckCircle,
  Cancel,
  AccessTime,
  ArrowForward,
} from '@mui/icons-material'

// Supabase 서비스
import * as inspectionService from '@/services/inspectionService'
import { getMachines, getProductModels } from '@/services/managementService'

// 날짜 유틸리티
import { getBusinessDate, formatVietnamDateTime, getTodayBusinessDate } from '@/lib/dateUtils'

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

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

  // Fetch machines from Management
  const { data: machines = [] } = useQuery({
    queryKey: ['machines'],
    queryFn: getMachines,
  })

  // Fetch product models from Management
  const { data: models = [] } = useQuery({
    queryKey: ['product-models'],
    queryFn: getProductModels,
  })

  // Helper function to get machine name by ID
  const getMachineName = (machineId: string | null) => {
    if (!machineId) return 'N/A'
    const machine = machines.find((m) => m.id === machineId)
    return machine?.name || machineId
  }

  // Helper function to get model code by ID
  const getModelCode = (modelId: string | null) => {
    if (!modelId) return 'N/A'
    const model = models.find((m) => m.id === modelId)
    return model?.code || modelId
  }

  // Get today's business date
  const todayBusinessDate = getTodayBusinessDate()

  // Filter inspections for today's business day (08:00 ~ next day 07:59)
  const todayInspectionsList = inspections.filter((inspection) => {
    const inspectionBusinessDate = getBusinessDate(new Date(inspection.created_at))
    return inspectionBusinessDate === todayBusinessDate
  })

  // Calculate stats from today's business day data
  const todayInspectionsCount = todayInspectionsList.length
  const passedInspections = todayInspectionsList.filter((i) => i.status === 'pass').length
  const failedInspections = todayInspectionsList.filter((i) => i.status === 'fail').length
  const passRate =
    todayInspectionsCount > 0
      ? ((passedInspections / todayInspectionsCount) * 100).toFixed(1)
      : '0.0'
  const defectRate =
    todayInspectionsCount > 0
      ? ((failedInspections / todayInspectionsCount) * 100).toFixed(1)
      : '0.0'

  const stats = [
    {
      title: t('dashboard.todayInspections'),
      value: todayInspectionsCount.toString(),
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

  // Get recent 10 inspections (from today's business day first, then others)
  const recentInspections = [
    ...todayInspectionsList.slice(0, 10),
    ...inspections.filter(i => !todayInspectionsList.includes(i)).slice(0, 10 - todayInspectionsList.length)
  ].slice(0, 10)

  // Get recent defects (최근 5개)
  const recentDefects = allDefects.slice(0, 5)

  return (
    <Box>
      <Box sx={{ mb: { xs: 2, md: 4 } }}>
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          fontWeight={700}
          gutterBottom
        >
          {t('dashboard.title')}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: { xs: 'none', sm: 'block' } }}
        >
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
                  {t('dashboard.goToInspection')}
                </Button>
              }
            />
            <CardContent>
              {isLoading ? (
                <Box sx={{ py: 4 }}>
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} height={isMobile ? 100 : 50} sx={{ mb: 1 }} />
                  ))}
                </Box>
              ) : recentInspections.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('common.noData')}
                  </Typography>
                </Box>
              ) : isMobile ? (
                /* Mobile Card View */
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
                  {recentInspections.map((inspection) => (
                    <Paper
                      key={inspection.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        borderLeft: 4,
                        borderLeftColor: inspection.status === 'pass' ? 'success.main' : 'error.main',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {getModelCode(inspection.model_id)}
                        </Typography>
                        <Chip
                          label={inspection.status === 'pass' ? t('dashboard.pass') : t('dashboard.fail')}
                          color={inspection.status === 'pass' ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {getMachineName(inspection.machine_id)}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {formatVietnamDateTime(inspection.created_at)}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              ) : (
                /* Desktop Table View */
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
                              {getMachineName(inspection.machine_id)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {getModelCode(inspection.model_id)}
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
                              {formatVietnamDateTime(inspection.created_at)}
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
                        {formatVietnamDateTime(defect.created_at)}
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
