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
import { InspectionProcessDialog } from './InspectionProcessDialog'
import { ExcelBulkImportDialog } from '@/components/excel-import'
import { DataTable, type ColumnDef } from '@/components/common/DataTable'
import type { Database } from '@/types/database'
import type { InspectionProcessImportData } from '@/types/excel-import'

// UI 테스트용 Mock 서비스
import * as managementService from '@/ui_test/mockServices/mockManagementService'

type InspectionProcess = Database['public']['Tables']['inspection_processes']['Row']

export function InspectionProcessManagement() {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProcess, setEditingProcess] = useState<InspectionProcess | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()

  // Fetch inspection processes
  const { data: processes = [], isLoading } = useQuery({
    queryKey: ['inspection-processes'],
    queryFn: managementService.getInspectionProcesses,
  })

  // Fetch existing codes for duplicate check
  const { data: existingCodes = [] } = useQuery({
    queryKey: ['inspection-process-codes'],
    queryFn: managementService.getInspectionProcessCodes,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: managementService.deleteInspectionProcess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-processes'] })
      enqueueSnackbar(t('management.inspectionProcessDeleted'), { variant: 'success' })
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
    return managementService.bulkCreateInspectionProcesses(
      data as unknown as InspectionProcessImportData[],
      onProgress
    )
  }

  // Column definitions
  const columns: ColumnDef<InspectionProcess>[] = useMemo(
    () => [
      {
        id: 'code',
        header: t('management.processCode'),
        cell: (row) => (
          <Chip label={row.code} variant="outlined" size="small" />
        ),
      },
      {
        id: 'name',
        header: t('management.processName'),
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
              maxWidth: 300,
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
    setEditingProcess(null)
    setDialogOpen(true)
  }

  const handleEditClick = (process: InspectionProcess) => {
    setEditingProcess(process)
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
    setEditingProcess(null)
  }

  // Render actions for each row
  const renderActions = (process: InspectionProcess) => (
    <>
      <IconButton
        size="small"
        onClick={() => handleEditClick(process)}
        color="primary"
      >
        <Edit />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => handleDeleteClick(process.id)}
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
        {t('management.addInspectionProcess')}
      </Button>
    </>
  )

  return (
    <>
      <DataTable
        data={processes}
        columns={columns}
        loading={isLoading}
        title={t('management.inspectionProcesses')}
        getRowId={(row) => row.id}
        renderActions={renderActions}
        toolbarActions={toolbarActions}
        searchPlaceholder={t('management.searchByNameOrCode')}
        pageSize={20}
        enableFilters={true}
      />

      <InspectionProcessDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleDialogSuccess}
        editingProcess={editingProcess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('management.deleteInspectionProcess')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('management.deleteInspectionProcessConfirm')}
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
        entityType="inspectionProcess"
        existingCodes={existingCodes}
        onBulkSave={handleBulkSave}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['inspection-processes'] })
          queryClient.invalidateQueries({ queryKey: ['inspection-process-codes'] })
        }}
      />
    </>
  )
}
