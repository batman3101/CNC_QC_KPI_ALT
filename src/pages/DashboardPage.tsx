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
import { getMachines, getProductModels, getDefectTypes } from '@/services/managementService'

// 날짜 유틸리티
import { formatVietnamDateTime, formatDateString, toVietnamTime } from '@/lib/dateUtils'

// Factory Store
import { useFactoryStore } from '@/stores/factoryStore'

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { activeFactoryId } = useFactoryStore()

  // Today's KPI cards, counted in the database over the current business day.
  const { data: todayStats } = useQuery({
    queryKey: ['dashboard-today-stats', activeFactoryId],
    queryFn: () =>
      inspectionService.getDashboardTodayStats(activeFactoryId || undefined),
  })

  // The ten most recent inspections. Each row carries the sequence number of
  // its own day, so the INS-MMDD-XXX id no longer requires holding that whole
  // day - previously the whole table - in the browser.
  const { data: recentInspections = [], isLoading } = useQuery({
    queryKey: ['dashboard-inspections', activeFactoryId],
    queryFn: () =>
      inspectionService.getRecentInspections(activeFactoryId || undefined, 10),
  })

  // Fetch recent defects. Only the five shown below are requested: this used to
  // page the entire defects table into the browser and then .slice(0, 5) it.
  const { data: recentDefectsPage, isLoading: defectsLoading } = useQuery({
    queryKey: ['dashboard-defects', activeFactoryId],
    queryFn: () =>
      inspectionService.getDefectsPage({
        page: 0,
        pageSize: 5,
        factoryId: activeFactoryId || undefined,
      }),
  })

  // Fetch machines from Management
  const { data: machines = [] } = useQuery({
    queryKey: ['machines', activeFactoryId],
    queryFn: () => getMachines(activeFactoryId || undefined),
  })

  // Fetch product models from Management
  const { data: models = [] } = useQuery({
    queryKey: ['product-models'],
    queryFn: getProductModels,
  })

  // Fetch defect types for name display
  const { data: defectTypes = [] } = useQuery({
    queryKey: ['defect-types'],
    queryFn: getDefectTypes,
  })

  // Helper function to get defect type name by ID
  const getDefectTypeName = (defectTypeId: string): string => {
    const defectType = defectTypes.find((dt) => dt.id === defectTypeId || dt.code === defectTypeId)
    return defectType ? defectType.name : t('defects.unknownType')
  }

  // Helper function to generate formatted inspection ID (INS-MMDD-XXX).
  //
  // day_seq is the row's position within its own *Vietnam* day, computed by
  // Postgres, so the MMDD part has to be the Vietnam date too. Reading it off
  // the browser's local clock made the two disagree for anyone outside VN: a
  // 23:30 VN inspection is already the next day in Korea, so it was labelled
  // with tomorrow's date but yesterday's sequence number, colliding with the
  // genuine first inspection of that day.
  const getFormattedInspectionId = (inspection: {
    created_at: string
    day_seq: number
  }): string => {
    // formatDateString reads the local fields of the shifted Date, which is how
    // toVietnamTime is meant to be consumed - toISOString() would re-apply the
    // offset and shift it back out.
    const [, month, day] = formatDateString(
      toVietnamTime(new Date(inspection.created_at))
    ).split('-')

    return `INS-${month}${day}-${String(inspection.day_seq).padStart(3, '0')}`
  }

  // Helper function to get machine name by ID
  const getMachineName = (machineId: string | null) => {
    if (!machineId) return t('common.notAvailable')
    const machine = machines.find((m) => m.id === machineId)
    return machine?.name || machineId
  }

  // Helper function to get model code by ID
  const getModelCode = (modelId: string | null) => {
    if (!modelId) return t('common.notAvailable')
    const model = models.find((m) => m.id === modelId)
    return model?.code || modelId
  }

  // Today's business day (08:00 ~ next day 07:59) is resolved by the database.
  const todayInspectionsCount = todayStats?.inspectionCount ?? 0
  const todayInspectionQty = todayStats?.inspectionQty ?? 0
  const todayDefectQty = todayStats?.defectQty ?? 0
  const failedInspections = todayStats?.failedCount ?? 0
  const passRate =
    todayInspectionQty > 0
      ? (((todayInspectionQty - todayDefectQty) / todayInspectionQty) * 100).toFixed(1)
      : '0.0'
  const defectRate =
    todayInspectionQty > 0
      ? ((todayDefectQty / todayInspectionQty) * 100).toFixed(1)
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

  // recentInspections is already the ten newest, ordered by the database.

  // Get recent defects (최근 5개)
  const recentDefects = recentDefectsPage?.rows ?? []

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
                  transition: 'box-shadow 0.2s ease-out',
                  '&:hover': {
                    boxShadow: 4,
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
              transition: 'box-shadow 0.2s ease-out',
              '&:hover': {
                boxShadow: 4,
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
                        borderColor: inspection.status === 'pass' ? 'success.main' : 'error.main',
                        bgcolor: inspection.status === 'pass' ? 'rgba(46, 125, 50, 0.06)' : 'rgba(211, 47, 47, 0.06)',
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
                              {getFormattedInspectionId(inspection)}
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
              transition: 'box-shadow 0.2s ease-out',
              '&:hover': {
                boxShadow: 4,
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
                        transition: 'background-color 0.2s ease-out, border-color 0.2s ease-out',
                        cursor: 'pointer',
                        '&:hover': {
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
                          {getDefectTypeName(defect.defect_type)}
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
