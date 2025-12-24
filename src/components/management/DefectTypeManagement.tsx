import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Button,
  IconButton,
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Upload,
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { DefectTypeDialog } from './DefectTypeDialog'
import { ExcelBulkImportDialog } from '@/components/excel-import'
import { DataTable, type ColumnDef } from '@/components/common/DataTable'
import type { Database } from '@/types/database'
import type { DefectTypeImportData } from '@/types/excel-import'

// UI 테스트용 Mock 서비스
import * as managementService from '@/ui_test/mockServices/mockManagementService'

type DefectType = Database['public']['Tables']['defect_types']['Row']

export function DefectTypeManagement() {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<DefectType | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()

  // Fetch defect types
  const { data: types = [], isLoading } = useQuery({
    queryKey: ['defect-types-rows'],
    queryFn: managementService.getDefectTypesRows,
  })

  // Fetch existing codes for duplicate check
  const { data: existingCodes = [] } = useQuery({
    queryKey: ['defect-type-codes'],
    queryFn: managementService.getDefectTypeCodes,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: managementService.deleteDefectTypeRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defect-types-rows'] })
      queryClient.invalidateQueries({ queryKey: ['defect-types'] })
      enqueueSnackbar(t('management.defectTypeDeleted'), { variant: 'success' })
      setDeleteDialogOpen(false)
      setDeletingId(null)
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message, { variant: 'error' })
    },
  })

  // Bulk import handler
  const handleBulkSave = async (
    data: Array<Record<string, unknown>>,
    onProgress: (current: number, total: number) => void
  ) => {
    return managementService.bulkCreateDefectTypes(
      data as unknown as DefectTypeImportData[],
      onProgress
    )
  }

  // Get severity chip color
  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    const colors: Record<string, 'success' | 'warning' | 'error'> = {
      low: 'success',
      medium: 'warning',
      high: 'error',
    }
    return colors[severity]
  }

  // Column definitions
  const columns: ColumnDef<DefectType>[] = useMemo(
    () => [
      {
        id: 'code',
        header: t('management.defectCode'),
        cell: (row) => (
          <Chip label={row.code} variant="outlined" size="small" />
        ),
      },
      {
        id: 'name',
        header: t('management.defectName'),
        cell: (row) => (
          <Typography variant="body2" fontWeight={500}>
            {row.name}
          </Typography>
        ),
      },
      {
        id: 'description',
        header: t('management.description'),
        cell: (row) => (
          <Typography
            variant="body2"
            sx={{
              maxWidth: 250,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.description || '-'}
          </Typography>
        ),
      },
      {
        id: 'severity',
        header: t('management.severity'),
        cell: (row) => (
          <Chip
            label={t(`management.severityLevel.${row.severity}`)}
            size="small"
            color={getSeverityColor(row.severity)}
          />
        ),
        filterType: 'select',
        filterOptions: [
          { label: t('management.severityLevel.low'), value: 'low' },
          { label: t('management.severityLevel.medium'), value: 'medium' },
          { label: t('management.severityLevel.high'), value: 'high' },
        ],
      },
      {
        id: 'is_active',
        header: t('management.status'),
        cell: (row) => (
          <Chip
            label={row.is_active ? t('management.active') : t('management.inactive')}
            size="small"
            color={row.is_active ? 'success' : 'default'}
          />
        ),
        filterType: 'select',
        filterOptions: [
          { label: t('management.active'), value: 'true' },
          { label: t('management.inactive'), value: 'false' },
        ],
      },
    ],
    [t]
  )

  const handleAddClick = () => {
    setEditingType(null)
    setDialogOpen(true)
  }

  const handleEditClick = (type: DefectType) => {
    setEditingType(type)
    setDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId)
    }
  }

  const handleDialogSuccess = () => {
    setDialogOpen(false)
    setEditingType(null)
  }

  // Render actions for each row
  const renderActions = (type: DefectType) => (
    <>
      <IconButton
        size="small"
        onClick={() => handleEditClick(type)}
        color="primary"
      >
        <Edit />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => handleDeleteClick(type.id)}
        color="error"
      >
        <Delete />
      </IconButton>
    </>
  )

  // Toolbar actions
  const toolbarActions = (
    <>
      <Button
        variant="outlined"
        startIcon={<Upload />}
        onClick={() => setImportDialogOpen(true)}
      >
        {t('bulkImport.import')}
      </Button>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={handleAddClick}
      >
        {t('management.addDefectType')}
      </Button>
    </>
  )

  return (
    <>
      <DataTable
        data={types}
        columns={columns}
        loading={isLoading}
        title={t('management.defectTypes')}
        getRowId={(row) => row.id}
        renderActions={renderActions}
        toolbarActions={toolbarActions}
        searchPlaceholder={t('management.searchByNameOrCode')}
        pageSize={20}
        enableFilters={true}
      />

      <DefectTypeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleDialogSuccess}
        editingType={editingType}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('management.deleteDefectType')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('management.deleteDefectTypeConfirm')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Dialog */}
      <ExcelBulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        entityType="defectType"
        existingCodes={existingCodes}
        onBulkSave={handleBulkSave}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['defect-types-rows'] })
          queryClient.invalidateQueries({ queryKey: ['defect-types'] })
          queryClient.invalidateQueries({ queryKey: ['defect-type-codes'] })
        }}
      />
    </>
  )
}
