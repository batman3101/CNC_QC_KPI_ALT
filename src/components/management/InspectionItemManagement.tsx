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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Upload,
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { InspectionItemDialog } from './InspectionItemDialog'
import { ExcelBulkImportDialog } from '@/components/excel-import'
import { DataTable, type ColumnDef } from '@/components/common/DataTable'
import type { Database } from '@/types/database'
import type { InspectionItemImportData } from '@/types/excel-import'

// UI 테스트용 Mock 서비스
import * as managementService from '@/ui_test/mockServices/mockManagementService'

type ProductModel = Database['public']['Tables']['product_models']['Row']
type InspectionItem = Database['public']['Tables']['inspection_items']['Row']

export function InspectionItemManagement() {
  const { t } = useTranslation()
  const [selectedModelId, setSelectedModelId] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()

  // Fetch product models for filter
  const { data: models = [] } = useQuery({
    queryKey: ['product-models'],
    queryFn: managementService.getProductModels,
  })

  // Fetch inspection items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inspection-items', selectedModelId],
    queryFn: () =>
      managementService.getInspectionItems(
        selectedModelId === 'all' ? undefined : selectedModelId
      ),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: managementService.deleteInspectionItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-items'] })
      enqueueSnackbar(t('management.inspectionItemDeleted'), { variant: 'success' })
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
    return managementService.bulkCreateInspectionItems(
      data as unknown as InspectionItemImportData[],
      onProgress
    )
  }

  // Get model code by ID
  const getModelCode = (modelId: string) => {
    const model = models.find((m) => m.id === modelId)
    return model?.code || modelId
  }

  // Column definitions
  const columns: ColumnDef<InspectionItem>[] = useMemo(
    () => [
      {
        id: 'model_id',
        header: t('management.modelCode'),
        cell: (row) => (
          <Chip
            label={getModelCode(row.model_id)}
            size="small"
            color="primary"
            variant="outlined"
          />
        ),
        searchable: false,
      },
      {
        id: 'name',
        header: t('management.itemName'),
        cell: (row) => (
          <Typography variant="body2" fontWeight={500}>
            {row.name}
          </Typography>
        ),
      },
      {
        id: 'data_type',
        header: t('management.dataType'),
        cell: (row) => (
          <Chip
            label={row.data_type === 'numeric' ? t('management.dataTypeNumeric') : t('management.dataTypeOkNg')}
            size="small"
            color={row.data_type === 'numeric' ? 'primary' : 'default'}
            variant="outlined"
          />
        ),
        filterType: 'select',
        filterOptions: [
          { label: t('management.dataTypeNumeric'), value: 'numeric' },
          { label: t('management.dataTypeOkNg'), value: 'ok_ng' },
        ],
      },
      {
        id: 'standard_value',
        header: t('management.standardValue'),
        align: 'right',
        cell: (row) => (
          <Typography variant="body2">
            {row.data_type === 'numeric' ? row.standard_value.toFixed(2) : '-'}
          </Typography>
        ),
        searchable: false,
      },
      {
        id: 'tolerance',
        header: t('management.tolerance'),
        align: 'right',
        sortable: false,
        cell: (row) => (
          <Typography variant="body2">
            {row.data_type === 'numeric'
              ? `±${((row.tolerance_max - row.standard_value) || 0).toFixed(2)}`
              : '-'}
          </Typography>
        ),
        searchable: false,
      },
      {
        id: 'unit',
        header: t('management.unit'),
        cell: (row) => (
          <Typography variant="body2">
            {row.unit || '-'}
          </Typography>
        ),
      },
    ],
    [t, models]
  )

  const handleAdd = () => {
    setEditingItem(null)
    setDialogOpen(true)
  }

  const handleEdit = (item: InspectionItem) => {
    setEditingItem(item)
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
  const renderActions = (item: InspectionItem) => (
    <>
      <IconButton
        size="small"
        onClick={() => handleEdit(item)}
        color="primary"
      >
        <Edit />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => handleDelete(item.id)}
        color="error"
      >
        <Delete />
      </IconButton>
    </>
  )

  // Toolbar actions with model filter - 모델 코드 기준
  const toolbarActions = (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>{t('management.modelCode')}</InputLabel>
        <Select
          value={selectedModelId}
          onChange={(e) => setSelectedModelId(e.target.value)}
          label={t('management.modelCode')}
        >
          <MenuItem value="all">{t('common.all')}</MenuItem>
          {models.map((model) => (
            <MenuItem key={model.id} value={model.id}>
              {model.code} - {model.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
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
        {t('management.addInspectionItem')}
      </Button>
    </Box>
  )

  return (
    <>
      <DataTable
        data={items}
        columns={columns}
        loading={isLoading}
        title={t('management.inspectionItemList')}
        getRowId={(row) => row.id}
        renderActions={renderActions}
        toolbarActions={toolbarActions}
        pageSize={20}
        enableFilters={true}
      />

      {/* Add/Edit Dialog */}
      <InspectionItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        models={models}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('management.deleteInspectionItem')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('management.deleteInspectionItemConfirm')}
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
        entityType="inspectionItem"
        existingModels={models as ProductModel[]}
        onBulkSave={handleBulkSave}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['inspection-items'] })
        }}
      />
    </>
  )
}
