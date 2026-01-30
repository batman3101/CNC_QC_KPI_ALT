/**
 * MonitorPage - 키오스크/모니터 전용 대시보드 페이지
 * - 사이드바 없이 헤더만 표시
 * - 2분(120초)마다 자동 새로고침
 * - URL: /monitor
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  TableContainer,
  Paper,
  IconButton,
  Button,
} from '@mui/material'
import {
  BarChart,
  CheckCircle,
  Cancel,
  AccessTime,
  Brightness4,
  Brightness7,
  Refresh,
} from '@mui/icons-material'
import { useThemeMode } from '@/contexts/ThemeContext'

// Supabase 서비스
import * as inspectionService from '@/services/inspectionService'
import { getMachines, getProductModels, getDefectTypes } from '@/services/managementService'

// 날짜 유틸리티
import { getBusinessDate, formatVietnamDateTime, getTodayBusinessDate } from '@/lib/dateUtils'

// Factory Store
import { useFactoryStore } from '@/stores/factoryStore'

const AUTO_REFRESH_INTERVAL = 2 * 60 * 1000 // 2분 (120초)

export function MonitorPage() {
  const { t, i18n } = useTranslation()
  const { mode, toggleTheme } = useThemeMode()
  const queryClient = useQueryClient()
  const { activeFactoryId } = useFactoryStore()
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ko' ? 'vi' : 'ko'
    i18n.changeLanguage(newLang)
  }

  const currentLanguageShort = i18n.language === 'vi' ? 'VI' : 'KO'

  // 자동 새로고침
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['monitor-inspections', activeFactoryId] })
      queryClient.invalidateQueries({ queryKey: ['monitor-defects', activeFactoryId] })
      setLastUpdated(new Date())
    }, AUTO_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [queryClient, activeFactoryId])

  // 수동 새로고침
  const handleManualRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['monitor-inspections', activeFactoryId] })
    queryClient.invalidateQueries({ queryKey: ['monitor-defects', activeFactoryId] })
    setLastUpdated(new Date())
  }

  // Fetch inspections
  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ['monitor-inspections', activeFactoryId],
    queryFn: () => inspectionService.getInspections({ factoryId: activeFactoryId || undefined }),
  })

  // Fetch defects
  const { data: allDefects = [], isLoading: defectsLoading } = useQuery({
    queryKey: ['monitor-defects', activeFactoryId],
    queryFn: () => inspectionService.getDefects({ factoryId: activeFactoryId || undefined }),
  })

  // Fetch machines
  const { data: machines = [] } = useQuery({
    queryKey: ['machines', activeFactoryId],
    queryFn: () => getMachines(activeFactoryId || undefined),
  })

  // Fetch product models
  const { data: models = [] } = useQuery({
    queryKey: ['product-models'],
    queryFn: getProductModels,
  })

  // Fetch defect types for name display
  const { data: defectTypes = [] } = useQuery({
    queryKey: ['defect-types'],
    queryFn: getDefectTypes,
  })

  // Helper functions
  // Get defect type name by ID
  const getDefectTypeName = (defectTypeId: string): string => {
    const defectType = defectTypes.find((dt) => dt.id === defectTypeId || dt.code === defectTypeId)
    return defectType ? defectType.name : t('defects.unknownType')
  }

  // Helper function to generate formatted inspection ID (INS-MMDD-XXX)
  const getFormattedInspectionId = (inspection: { id: string; created_at: string }, allInspections: typeof inspections): string => {
    const date = new Date(inspection.created_at)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    // Get inspections from the same day, sorted by created_at
    const dateStr = `${date.getFullYear()}-${month}-${day}`
    const sameDayInspections = allInspections
      .filter(i => {
        const iDate = new Date(i.created_at)
        return `${iDate.getFullYear()}-${String(iDate.getMonth() + 1).padStart(2, '0')}-${String(iDate.getDate()).padStart(2, '0')}` === dateStr
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    // Find the sequence number for this inspection
    const seqNum = sameDayInspections.findIndex(i => i.id === inspection.id) + 1

    return `INS-${month}${day}-${String(seqNum).padStart(3, '0')}`
  }

  const getMachineName = (machineId: string | null) => {
    if (!machineId) return 'N/A'
    const machine = machines.find((m) => m.id === machineId)
    return machine?.name || machineId
  }

  const getModelCode = (modelId: string | null) => {
    if (!modelId) return 'N/A'
    const model = models.find((m) => m.id === modelId)
    return model?.code || modelId
  }

  // Get today's business date
  const todayBusinessDate = getTodayBusinessDate()

  // Filter inspections for today's business day
  const todayInspectionsList = inspections.filter((inspection) => {
    const inspectionBusinessDate = getBusinessDate(new Date(inspection.created_at))
    return inspectionBusinessDate === todayBusinessDate
  })

  // Calculate stats
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

  // Get recent inspections
  const recentInspections = [
    ...todayInspectionsList.slice(0, 10),
    ...inspections.filter(i => !todayInspectionsList.includes(i)).slice(0, 10 - todayInspectionsList.length)
  ].slice(0, 10)

  // Get recent defects
  const recentDefects = allDefects.slice(0, 5)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              component="img"
              src="/A symbol BLUE-02.png"
              sx={{ width: 32, height: 32 }}
              alt="Logo"
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                letterSpacing: '-0.025em',
              }}
            >
              CNC QC KPI
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* Last Updated */}
            <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
              {t('monitor.lastUpdated')}: {lastUpdated.toLocaleTimeString()}
            </Typography>

            {/* Manual Refresh */}
            <IconButton onClick={handleManualRefresh} color="primary">
              <Refresh />
            </IconButton>

            {/* Theme Toggle */}
            <IconButton onClick={toggleTheme} color="inherit">
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>

            {/* Language Toggle */}
            <Button
              onClick={toggleLanguage}
              variant="outlined"
              size="small"
              sx={{
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                fontWeight: 600,
              }}
            >
              {currentLanguageShort}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ pt: 10, px: 3, pb: 3 }}>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
                <Card elevation={3}>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
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
              </Grid>
            )
          })}
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Inspections Table */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardHeader title={t('dashboard.recentInspections')} />
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
                  <TableContainer component={Paper} elevation={2}>
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
                                {getFormattedInspectionId(inspection, inspections)}
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
                                color={inspection.status === 'pass' ? 'success' : 'error'}
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
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardHeader title={t('dashboard.recentDefects')} />
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
                        <Typography variant="body2" color="text.secondary" gutterBottom>
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
    </Box>
  )
}
