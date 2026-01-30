import { useState, useMemo } from 'react'
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
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Warning as WarningIcon,
  Visibility,
  CheckCircle,
  Schedule,
  PlayArrow,
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { DefectDetailDialog } from './DefectDetailDialog'
import { DataTable, type ColumnDef } from '@/components/common/DataTable'
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
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

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

  // Fetch defects
  const { data: defects = [], isLoading } = useQuery({
    queryKey: ['defects', activeFactoryId],
    queryFn: () => inspectionService.getDefects({ factoryId: activeFactoryId || undefined }),
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
      // 캐시 데이터를 직접 업데이트하여 즉시 UI에 반영
      queryClient.setQueryData<Defect[]>(['defects', activeFactoryId], (oldData) => {
        if (!oldData) return oldData
        return oldData.map((defect) =>
          defect.id === updatedDefect.id
            ? { ...defect, status: updatedDefect.status }
            : defect
        )
      })
      // 대시보드의 불량 데이터도 업데이트
      queryClient.setQueryData<Defect[]>(['dashboard-defects', activeFactoryId], (oldData) => {
        if (!oldData) return oldData
        return oldData.map((defect) =>
          defect.id === updatedDefect.id
            ? { ...defect, status: updatedDefect.status }
            : defect
        )
      })

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

  // Filter defects by status
  const filteredDefects = useMemo(() => {
    if (statusFilter === 'all') return defects
    return defects.filter((defect) => defect.status === statusFilter)
  }, [defects, statusFilter])

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
        filterType: 'select',
        filterOptions: [
          { label: t('defects.statusPending'), value: 'pending' },
          { label: t('defects.statusInProgress'), value: 'in_progress' },
          { label: t('defects.statusResolved'), value: 'resolved' },
        ],
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, productModels, defectTypes]
  )

  const handleViewDetail = (defect: Defect) => {
    setSelectedDefect(defect)
    setDetailDialogOpen(true)
  }

  const handleStatusChange = (defectId: string, newStatus: Defect['status']) => {
    updateStatusMutation.mutate({ id: defectId, status: newStatus })
  }

  // Render actions for each row
  const renderActions = (defect: Defect) => (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation()
          handleViewDetail(defect)
        }}
        color="primary"
      >
        <Visibility />
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

  // Toolbar with status filter
  const toolbarActions = (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel>{t('defects.filterByStatus')}</InputLabel>
      <Select
        value={statusFilter}
        label={t('defects.filterByStatus')}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <MenuItem value="all">{t('common.all')}</MenuItem>
        <MenuItem value="pending">{t('defects.statusPending')}</MenuItem>
        <MenuItem value="in_progress">{t('defects.statusInProgress')}</MenuItem>
        <MenuItem value="resolved">{t('defects.statusResolved')}</MenuItem>
      </Select>
    </FormControl>
  )

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
      <DataTable
        data={filteredDefects}
        columns={columns}
        loading={isLoading}
        title={t('defects.listTitle')}
        getRowId={(row) => row.id}
        renderActions={renderActions}
        toolbarActions={toolbarActions}
        searchPlaceholder={t('defects.defectType')}
        pageSize={isMobile ? 5 : 20}
        enableFilters={true}
      />

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
