import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Grid,
} from '@mui/material'
import {
  Warning as WarningIcon,
  Visibility,
  CheckCircle,
  Schedule,
  PlayArrow,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { DefectDetailDialog } from './DefectDetailDialog'
import type { Database } from '@/types/database'

// UI 테스트용 Mock 서비스
import * as inspectionService from '@/ui_test/mockServices/mockInspectionService'

type Defect = Database['public']['Tables']['defects']['Row']

export function DefectsList() {
  const { t } = useTranslation()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()

  const statusConfig = {
    pending: {
      label: t('defects.statusPending'),
      icon: Schedule,
      color: 'error' as const,
    },
    in_progress: {
      label: t('defects.statusInProgress'),
      icon: PlayArrow,
      color: 'primary' as const,
    },
    resolved: {
      label: t('defects.statusResolved'),
      icon: CheckCircle,
      color: 'success' as const,
    },
  }

  // Fetch defects
  const { data: defects = [], isLoading } = useQuery({
    queryKey: ['defects'],
    queryFn: () => inspectionService.getDefects(),
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: 'pending' | 'in_progress' | 'resolved'
    }) => inspectionService.updateDefectStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] })
      enqueueSnackbar(t('defects.statusChanged'), { variant: 'success' })
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message, { variant: 'error' })
    },
  })

  // Filter defects
  const filteredDefects = defects.filter((defect) => {
    const matchesStatus =
      statusFilter === 'all' || defect.status === statusFilter
    const matchesSearch =
      searchQuery === '' ||
      defect.defect_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      defect.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const handleViewDetail = (defect: Defect) => {
    setSelectedDefect(defect)
    setDetailDialogOpen(true)
  }

  const handleStatusChange = (defectId: string, newStatus: Defect['status']) => {
    updateStatusMutation.mutate({ id: defectId, status: newStatus })
  }

  // Calculate counts
  const counts = {
    all: defects.length,
    pending: defects.filter((d) => d.status === 'pending').length,
    in_progress: defects.filter((d) => d.status === 'in_progress').length,
    resolved: defects.filter((d) => d.status === 'resolved').length,
  }

  return (
    <>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {t('defects.title')}
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {counts.all}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {t('defects.statusPending')}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="error.main">
                    {counts.pending}
                  </Typography>
                </Box>
                <Schedule sx={{ fontSize: 32, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {t('defects.statusInProgress')}
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {counts.in_progress}
                  </Typography>
                </Box>
                <PlayArrow sx={{ fontSize: 32, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {t('defects.statusResolved')}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {counts.resolved}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 32, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Defects Table */}
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              {t('defects.listTitle')}
            </Typography>
          </Box>

          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              placeholder={t('defects.defectType')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>{t('defects.filterByStatus')}</InputLabel>
              <Select
                value={statusFilter}
                label={t('defects.filterByStatus')}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">{t('defects.all')}</MenuItem>
                <MenuItem value="pending">{t('defects.statusPending')}</MenuItem>
                <MenuItem value="in_progress">{t('defects.statusInProgress')}</MenuItem>
                <MenuItem value="resolved">{t('defects.statusResolved')}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Table */}
          {isLoading ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {t('common.loading')}
              </Typography>
            </Box>
          ) : filteredDefects.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {searchQuery || statusFilter !== 'all'
                  ? t('common.noData')
                  : t('common.noData')}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={2}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('defects.defectType')}</TableCell>
                    <TableCell>{t('defects.description')}</TableCell>
                    <TableCell>{t('defects.status')}</TableCell>
                    <TableCell>{t('defects.registeredDate')}</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDefects.map((defect) => {
                    const config = statusConfig[defect.status]
                    const Icon = config.icon

                    return (
                      <TableRow key={defect.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {defect.defect_type}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 400 }}>
                          <Typography variant="body2" noWrap>
                            {defect.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<Icon />}
                            label={config.label}
                            color={config.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(defect.created_at).toLocaleDateString('ko-KR')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetail(defect)}
                              color="primary"
                            >
                              <Visibility />
                            </IconButton>
                            {defect.status === 'pending' && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleStatusChange(defect.id, 'in_progress')}
                              >
                                {t('defects.startAction')}
                              </Button>
                            )}
                            {defect.status === 'in_progress' && (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleStatusChange(defect.id, 'resolved')}
                              >
                                {t('defects.completeAction')}
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <DefectDetailDialog
        defect={selectedDefect}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onStatusChange={handleStatusChange}
      />
    </>
  )
}
