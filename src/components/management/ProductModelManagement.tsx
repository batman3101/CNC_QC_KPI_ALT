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
import { ProductModelDialog } from './ProductModelDialog'
import { ExcelBulkImportDialog } from '@/components/excel-import'
import { DataTable, type ColumnDef } from '@/components/common/DataTable'
import type { Database } from '@/types/database'

// UI 테스트용 Mock 서비스
import * as managementService from '@/ui_test/mockServices/mockManagementService'
import type { ProductModelImportData } from '@/types/excel-import'

// 날짜 유틸리티
import { formatVietnamDate } from '@/lib/dateUtils'

type ProductModel = Database['public']['Tables']['product_models']['Row']

export function ProductModelManagement() {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<ProductModel | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()

  // Fetch product models
  const { data: models = [], isLoading } = useQuery({
    queryKey: ['product-models'],
    queryFn: managementService.getProductModels,
  })

  // Fetch existing codes for duplicate check
  const { data: existingCodes = [] } = useQuery({
    queryKey: ['product-model-codes'],
    queryFn: managementService.getProductModelCodes,
  })

  // Bulk import handler
  const handleBulkSave = async (
    data: Array<Record<string, unknown>>,
    onProgress: (current: number, total: number) => void
  ) => {
    return managementService.bulkCreateProductModels(
      data as unknown as ProductModelImportData[],
      onProgress
    )
  }

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: managementService.deleteProductModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-models'] })
      enqueueSnackbar(t('management.productModelDeleted'), { variant: 'success' })
      setDeleteDialogOpen(false)
      setDeletingId(null)
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message, { variant: 'error' })
    },
  })

  // Column definitions - 모델 코드 기준으로 표시
  const columns: ColumnDef<ProductModel>[] = useMemo(
    () => [
      {
        id: 'code',
        header: t('management.modelCode'),
        cell: (row) => (
          <Chip label={row.code} variant="outlined" size="small" color="primary" />
        ),
      },
      {
        id: 'name',
        header: t('management.modelName'),
        cell: (row) => (
          <Typography variant="body2" fontWeight={500}>
            {row.name}
          </Typography>
        ),
      },
      {
        id: 'created_at',
        header: t('defects.registeredDate'),
        cell: (row) => (
          <Typography variant="body2">
            {formatVietnamDate(row.created_at)}
          </Typography>
        ),
      },
    ],
    [t]
  )

  const handleAdd = () => {
    setEditingModel(null)
    setDialogOpen(true)
  }

  const handleEdit = (model: ProductModel) => {
    setEditingModel(model)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId)
    }
  }

  // Render actions for each row
  const renderActions = (model: ProductModel) => (
    <>
      <IconButton
        size="small"
        onClick={() => handleEdit(model)}
        color="primary"
      >
        <Edit />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => handleDelete(model.id)}
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
        onClick={handleAdd}
      >
        {t('management.addProductModel')}
      </Button>
    </>
  )

  return (
    <>
      <DataTable
        data={models}
        columns={columns}
        loading={isLoading}
        title={t('management.productModelList')}
        getRowId={(row) => row.id}
        renderActions={renderActions}
        toolbarActions={toolbarActions}
        pageSize={20}
        enableFilters={false}
      />

      {/* Add/Edit Dialog */}
      <ProductModelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        model={editingModel}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('management.deleteProductModel')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('management.deleteProductModelConfirm')} {t('management.deleteProductModelWarning')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Dialog */}
      <ExcelBulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        entityType="productModel"
        existingCodes={existingCodes}
        onBulkSave={handleBulkSave}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['product-models'] })
          queryClient.invalidateQueries({ queryKey: ['product-model-codes'] })
        }}
      />
    </>
  )
}
