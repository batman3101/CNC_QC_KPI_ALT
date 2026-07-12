import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useFactoryStore } from '@/stores/factoryStore'
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import {
  Warning as WarningIcon,
  Visibility,
  CheckCircle,
  Schedule,
  PlayArrow,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { DefectDetailDialog } from './DefectDetailDialog'
import { DefectEditDialog } from './DefectEditDialog'
import { DataTable, type ColumnDef, type SortConfig } from '@/components/common/DataTable'
import type { Database } from '@/types/database'

// Supabase 서비스
import * as inspectionService from '@/services/inspectionService'
import { getProductModels, getDefectTypes } from '@/services/managementService'

// 날짜 유틸리티
import { formatVietnamDateTime } from '@/lib/dateUtils'

type Defect = Database['public']['Tables']['defects']['Row']

export function DefectsList() {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [defectTypeFilter, setDefectTypeFilter] = useState<string>('all')
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [defectToDelete, setDefectToDelete] = useState<Defect | null>(null)

  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const { activeFactoryId } = useFactoryStore()

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

  // Server-driven paging: the table holds ~15k rows, so only the visible page
  // is fetched. Page/sort/filter state lives here and is sent to the database.
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 20)
  const [sort, setSort] = useState<SortConfig | null>(null)

  // Changing what is listed invalidates the current page number. Each control
  // resets the page as part of the same state update, so the query never fires
  // once for the stale page and again for page 0. The factory is switched from
  // the header, outside this component, so it still needs an effect.
  useEffect(() => {
    setPage(0)
  }, [activeFactoryId])

  const changeStatusFilter = (value: string) => {
    setStatusFilter(value)
    setPage(0)
  }

  const changeDefectTypeFilter = (value: string) => {
    setDefectTypeFilter(value)
    setPage(0)
  }

  const changeRowsPerPage = (value: number) => {
    setRowsPerPage(value)
    setPage(0)
  }

  const changeSort = (value: SortConfig | null) => {
    setSort(value)
    setPage(0)
  }

  const { data: defectsPage, isLoading } = useQuery({
    queryKey: [
      'defects',
      activeFactoryId,
      { page, rowsPerPage, statusFilter, defectTypeFilter, sort },
    ],
    queryFn: () =>
      inspectionService.getDefectsPage({
        page,
        pageSize: rowsPerPage,
        status: statusFilter,
        defectType: defectTypeFilter,
        factoryId: activeFactoryId || undefined,
        sort,
      }),
    // Keep the previous page on screen while the next one loads, so paging
    // doesn't flash an empty table.
    placeholderData: (previous) => previous,
  })

  const defects = defectsPage?.rows ?? []
  const totalCount = defectsPage?.totalCount ?? 0

  // Status counts span the whole table, not the current page, so they come from
  // dedicated count-only queries rather than from the rows on screen.
  const { data: stats } = useQuery({
    queryKey: ['defect-stats', activeFactoryId],
    queryFn: () => inspectionService.getDefectStats(activeFactoryId || undefined),
  })

  // Fetch product models for model code display
  const { data: productModels = [] } = useQuery({
    queryKey: ['product-models'],
    queryFn: getProductModels,
  })

  // Fetch defect types for name display
  const { data: defectTypes = [] } = useQuery({
    queryKey: ['defect-types'],
    queryFn: getDefectTypes,
  })

  // Helper function to get model code by model_id
  const getModelCode = (modelId: string): string => {
    const model = productModels.find((m) => m.id === modelId)
    return model ? model.code : '-'
  }

  // Helper function to get defect type name by defect_type (ID)
  const getDefectTypeName = (defectTypeId: string): string => {
    const defectType = defectTypes.find((dt) => dt.id === defectTypeId || dt.code === defectTypeId)
    return defectType ? defectType.name : t('defects.unknownType')
  }

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: 'pending' | 'in_progress' | 'resolved'
    }) => {
      const result = await inspectionService.updateDefect(id, { status })
      return result
    },
    onSuccess: (updatedDefect) => {
      // The list is server-paged, so a status change can move the row onto a
      // different page and shifts the status counts. Refetch rather than
      // patching a cached array that no longer represents the whole result set.
      queryClient.invalidateQueries({ queryKey: ['defects'] })
      queryClient.invalidateQueries({ queryKey: ['defect-stats'] })
      queryClient.invalidateQueries({ queryKey: ['defect-pending-count'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-defects', activeFactoryId] })

      // 상태별로 다른 알림 메시지 표시
      const alertMessage = updatedDefect.status === 'in_progress'
        ? t('defects.alert.startedAction')
        : updatedDefect.status === 'resolved'
        ? t('defects.alert.completedAction')
        : t('defects.statusChanged')

      enqueueSnackbar(alertMessage, {
        variant: updatedDefect.status === 'resolved' ? 'success' : 'info',
        autoHideDuration: 3000,
      })
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message, { variant: 'error' })
    },
  })

  // Delete defect mutation
  const deleteDefectMutation = useMutation({
    mutationFn: (id: string) => inspectionService.deleteDefect(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] })
      queryClient.invalidateQueries({ queryKey: ['defect-stats'] })
      queryClient.invalidateQueries({ queryKey: ['defect-pending-count'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-defects', activeFactoryId] })
      enqueueSnackbar(t('defects.deleteSuccess'), { variant: 'success', autoHideDuration: 3000 })
      setDeleteDialogOpen(false)
      setDefectToDelete(null)
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message, { variant: 'error' })
    },
  })

  // Edit defect mutation
  const editDefectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, string> }) =>
      inspectionService.updateDefect(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] })
      queryClient.invalidateQueries({ queryKey: ['defect-stats'] })
      queryClient.invalidateQueries({ queryKey: ['defect-pending-count'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-defects', activeFactoryId] })
      enqueueSnackbar(t('defects.editSuccess'), { variant: 'success', autoHideDuration: 3000 })
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message, { variant: 'error' })
    },
  })

  // Status and defect-type filtering is done by the database (see the
  // getDefectsPage query above), so `defects` is already the page to render.

  // Column definitions - 새로운 컬럼 순서
  // 1. 등록일시 2. 모델 코드 3. 불량 유형 4. 설명 5. 상태 6. 작업
  const columns: ColumnDef<Defect>[] = useMemo(
    () => [
      {
        id: 'created_at',
        header: t('defects.registeredDate'),
        cell: (row) => (
          <Typography variant="body2">
            {formatVietnamDateTime(row.created_at)}
          </Typography>
        ),
      },
      {
        id: 'model_code',
        header: t('management.modelCode'),
        cell: (row) => (
          <Chip
            label={getModelCode(row.model_id)}
            size="small"
            color="primary"
            variant="outlined"
          />
        ),
      },
      {
        id: 'defect_type',
        header: t('defects.defectType'),
        cell: (row) => (
          <Typography variant="body2" fontWeight={500}>
            {getDefectTypeName(row.defect_type)}
          </Typography>
        ),
      },
      {
        id: 'description',
        header: t('defects.description'),
        cell: (row) => (
          <Typography
            variant="body2"
            sx={{
              maxWidth: 300,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.description}
          </Typography>
        ),
      },
      {
        id: 'status',
        header: t('defects.status'),
        cell: (row) => {
          const config = statusConfig[row.status]
          const Icon = config.icon
          return (
            <Chip
              icon={<Icon />}
              label={config.label}
              color={config.color}
              size="small"
            />
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, productModels, defectTypes]
  )

  const handleViewDetail = (defect: Defect) => {
    setSelectedDefect(defect)
    setDetailDialogOpen(true)
  }

  const handleEdit = (defect: Defect) => {
    setSelectedDefect(defect)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (defect: Defect) => {
    setDefectToDelete(defect)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (defectToDelete) {
      deleteDefectMutation.mutate(defectToDelete.id)
    }
  }

  const handleEditSave = (id: string, data: Record<string, string>) => {
    editDefectMutation.mutate({ id, data })
  }

  const handleStatusChange = (defectId: string, newStatus: Defect['status']) => {
    updateStatusMutation.mutate({ id: defectId, status: newStatus })
  }

  // Render actions for each row
  const renderActions = (defect: Defect) => (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation()
          handleEdit(defect)
        }}
        color="info"
      >
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation()
          handleDeleteClick(defect)
        }}
        color="error"
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation()
          handleViewDetail(defect)
        }}
        color="primary"
      >
        <Visibility fontSize="small" />
      </IconButton>
      {defect.status === 'pending' && (
        <Button
          variant="outlined"
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            handleStatusChange(defect.id, 'in_progress')
          }}
          sx={{ whiteSpace: 'nowrap' }}
        >
          {t('defects.startAction')}
        </Button>
      )}
      {defect.status === 'in_progress' && (
        <Button
          variant="outlined"
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            handleStatusChange(defect.id, 'resolved')
          }}
          sx={{ whiteSpace: 'nowrap' }}
        >
          {t('defects.completeAction')}
        </Button>
      )}
    </Box>
  )

  // Toolbar with defect type and status filters
  const toolbarActions = (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>{t('defects.defectType')}</InputLabel>
        <Select
          value={defectTypeFilter}
          label={t('defects.defectType')}
          onChange={(e) => changeDefectTypeFilter(e.target.value)}
        >
          <MenuItem value="all">{t('common.all')}</MenuItem>
          {defectTypes.map((dt) => (
            <MenuItem key={dt.id} value={dt.id}>
              {dt.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>{t('defects.filterByStatus')}</InputLabel>
        <Select
          value={statusFilter}
          label={t('defects.filterByStatus')}
          onChange={(e) => changeStatusFilter(e.target.value)}
        >
          <MenuItem value="all">{t('common.all')}</MenuItem>
          <MenuItem value="pending">{t('defects.statusPending')}</MenuItem>
          <MenuItem value="in_progress">{t('defects.statusInProgress')}</MenuItem>
          <MenuItem value="resolved">{t('defects.statusResolved')}</MenuItem>
        </Select>
      </FormControl>
    </Box>
  )

  // Counts cover every defect in the factory, not the rows on the current page.
  const counts = {
    all: stats?.total ?? 0,
    pending: stats?.pending ?? 0,
    in_progress: stats?.inProgress ?? 0,
    resolved: stats?.resolved ?? 0,
  }

  return (
    <>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              transition: 'box-shadow 0.2s ease-out',
              '&:hover': {
                boxShadow: 4,
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
              transition: 'box-shadow 0.2s ease-out',
              '&:hover': {
                boxShadow: 4,
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
              transition: 'box-shadow 0.2s ease-out',
              '&:hover': {
                boxShadow: 4,
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
      <DataTable
        data={defects}
        serverPagination={{
          totalCount,
          page,
          rowsPerPage,
          onPageChange: setPage,
          onRowsPerPageChange: changeRowsPerPage,
          sort,
          onSortChange: changeSort,
        }}
        columns={columns}
        loading={isLoading}
        title={t('defects.listTitle')}
        getRowId={(row) => row.id}
        renderActions={renderActions}
        toolbarActions={toolbarActions}
        enableSearch={false}
        // The column filter panel filters in memory, which in server mode would
        // only narrow the visible page. The toolbar selects above filter in the
        // database instead and already cover status and defect type.
        enableFilters={false}
        renderMobileCard={(defect) => {
          const config = statusConfig[defect.status]
          const Icon = config.icon
          return (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 1,
                borderColor: defect.status === 'resolved' ? 'success.main' : defect.status === 'in_progress' ? 'primary.main' : 'error.main',
                bgcolor: defect.status === 'resolved' ? 'rgba(46, 125, 50, 0.06)' : defect.status === 'in_progress' ? 'rgba(25, 118, 210, 0.06)' : 'rgba(211, 47, 47, 0.06)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>{getDefectTypeName(defect.defect_type)}</Typography>
                <Chip icon={<Icon />} label={config.label} color={config.color} size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{getModelCode(defect.model_id)}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1 }}>{defect.description}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.disabled">{formatVietnamDateTime(defect.created_at)}</Typography>
                {renderActions(defect)}
              </Box>
            </Paper>
          )
        }}
      />

      {/* Detail Dialog */}
      <DefectDetailDialog
        defect={selectedDefect}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onStatusChange={handleStatusChange}
      />

      {/* Edit Dialog */}
      <DefectEditDialog
        defect={selectedDefect}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleEditSave}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>{t('common.delete')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('defects.deleteConfirm')}
          </DialogContentText>
          <DialogContentText variant="body2" color="error" sx={{ mt: 1 }}>
            {t('defects.deleteConfirmDescription')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteDefectMutation.isPending}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
