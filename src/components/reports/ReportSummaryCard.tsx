import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Grid,
  Skeleton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material'
import {
  CheckCircle,
  Cancel,
  TrendingUp,
  Assessment,
} from '@mui/icons-material'
import type { ReportSummary } from '@/types/report'

interface ReportSummaryCardProps {
  summary: ReportSummary | undefined
  isLoading: boolean
}

export function ReportSummaryCard({ summary, isLoading }: ReportSummaryCardProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <Card elevation={3}>
        <CardHeader title={t('reports.summary')} />
        <CardContent>
          <Box sx={{ py: 2 }}>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} height={80} sx={{ mb: 2 }} />
            ))}
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return null
  }

  const stats = [
    {
      title: t('reports.totalInspections'),
      value: summary.total_inspections,
      icon: Assessment,
      color: 'primary.main',
    },
    {
      title: t('reports.passedInspections'),
      value: summary.passed_inspections,
      icon: CheckCircle,
      color: 'success.main',
    },
    {
      title: t('reports.failedInspections'),
      value: summary.failed_inspections,
      icon: Cancel,
      color: 'error.main',
    },
    {
      title: t('reports.passRate'),
      value: `${summary.pass_rate.toFixed(1)}%`,
      icon: TrendingUp,
      color: summary.pass_rate >= 95 ? 'success.main' : 'warning.main',
    },
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* KPI Stats */}
      <Card elevation={3}>
        <CardHeader title={t('reports.summary')} />
        <CardContent>
          <Grid container spacing={2}>
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                  <Card
                    variant="outlined"
                    sx={{
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2,
                      },
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {stat.title}
                        </Typography>
                        <Icon sx={{ color: stat.color, fontSize: 20 }} />
                      </Box>
                      <Typography variant="h5" fontWeight={700}>
                        {stat.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Defects by Type */}
      <Card elevation={3}>
        <CardHeader title={t('reports.defectsByType')} />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {summary.defects_by_type.map((defect) => {
              const percentage = (
                (defect.count / summary.total_defects) *
                100
              ).toFixed(1)
              return (
                <Box key={defect.type}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2">{defect.type}</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {defect.count}건 ({percentage}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(percentage)}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              )
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Process Performance */}
      <Card elevation={3}>
        <CardHeader title={t('reports.processPerformance')} />
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('reports.process')}</TableCell>
                  <TableCell align="center">{t('reports.inspectionCount')}</TableCell>
                  <TableCell align="center">{t('reports.passRate')}</TableCell>
                  <TableCell align="center">{t('reports.grade')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.inspections_by_process.map((process) => (
                  <TableRow key={process.process_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {process.process_name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{process.count}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {process.pass_rate.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          process.pass_rate >= 95
                            ? t('reports.excellent')
                            : process.pass_rate >= 90
                            ? t('reports.good')
                            : t('reports.needsImprovement')
                        }
                        color={
                          process.pass_rate >= 95
                            ? 'success'
                            : process.pass_rate >= 90
                            ? 'primary'
                            : 'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Model Performance */}
      <Card elevation={3}>
        <CardHeader title={t('reports.modelPerformance')} />
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('reports.model')}</TableCell>
                  <TableCell align="center">{t('reports.inspectionCount')}</TableCell>
                  <TableCell align="center">{t('reports.passRate')}</TableCell>
                  <TableCell align="center">{t('reports.grade')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.inspections_by_model.map((model) => (
                  <TableRow key={model.model_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {model.model_name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{model.count}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {model.pass_rate.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={
                          model.pass_rate >= 95
                            ? t('reports.excellent')
                            : model.pass_rate >= 90
                            ? t('reports.good')
                            : t('reports.needsImprovement')
                        }
                        color={
                          model.pass_rate >= 95
                            ? 'success'
                            : model.pass_rate >= 90
                            ? 'primary'
                            : 'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}
