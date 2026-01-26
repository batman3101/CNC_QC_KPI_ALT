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
  TextField,
  InputAdornment,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Upload,
  Search,
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { InspectionItemDialog } from './InspectionItemDialog'
import { ExcelBulkImportDialog } from '@/components/excel-import'
import { DataTable, type ColumnDef } from '@/components/common/DataTable'
import type { Database } from '@/types/database'
import type { InspectionItemImportData } from '@/types/excel-import'

// Supabase 서비스
import * as managementService from '@/services/managementService'

type ProductModel = Database['public']['Tables']['product_models']['Row']
type InspectionItem = Database['public']['Tables']['inspection_items']['Row']
type InspectionProcess = Database['public']['Tables']['inspection_processes']['Row']

export function InspectionItemManagement() {
  const { t } = useTranslation()
  const [selectedModelId, setSelectedModelId] = useState<string>('all')
  const [selectedProcessId, setSelectedProcessId] = useState<string>('all')
  const [selectedDataType, setSelectedDataType] = useState<string>('all')
  const [nameFilter, setNameFilter] = useState<string>('')
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

  // Fetch inspection processes
  const { data: processes = [] } = useQuery({
    queryKey: ['inspection-processes'],
    queryFn: managementService.getInspectionProcesses,
  })

  // Fetch inspection items
  const { data: rawItems = [], isLoading } = useQuery({
    queryKey: ['inspection-items', selectedModelId],
    queryFn: () =>
      managementService.getInspectionItems(
        selectedModelId === 'all' ? undefined : selectedModelId
      ),
  })

  // Client-side filtering for process, data type, and name
  const items = useMemo(() => {
    let filtered = rawItems

    // Filter by process
    if (selectedProcessId !== 'all') {
      filtered = filtered.filter((item) => item.process_id === selectedProcessId)
    }

    // Filter by data type
    if (selectedDataType !== 'all') {
      filtered = filtered.filter((item) => item.data_type === selectedDataType)
    }

    // Filter by name
    if (nameFilter.trim()) {
      const searchLower = nameFilter.toLowerCase().trim()
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [rawItems, selectedProcessId, selectedDataType, nameFilter])

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

  // Get process code by ID
  const getProcessCode = (processId: string | null) => {
    if (!processId) return '-'
    const process = processes.find((p) => p.id === processId)
    return process?.code || '-'
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
        id: 'process_id',
        header: t('management.processCode'),
        cell: (row) => {
          const processCode = getProcessCode(row.process_id)
          return processCode !== '-' ? (
            <Chip
              label={processCode}
              size="small"
              color="secondary"
              variant="outlined"
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          )
        },
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
        searchable: false,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, models, processes]
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

  // Toolbar actions with filters
  const toolbarActions = (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Model Code Filter */}
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>{t('management.modelCode')}</InputLabel>
        <Select
          value={selectedModelId}
          onChange={(e) => setSelectedModelId(e.target.value)}
          label={t('management.modelCode')}
        >
          <MenuItem value="all">{t('common.all')}</MenuItem>
          {models.map((model) => (
            <MenuItem key={model.id} value={model.id}>
              {model.code}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Process Code Filter */}
      <FormControl size="small" sx={{ minWidth: 130 }}>
        <InputLabel>{t('management.processCode')}</InputLabel>
        <Select
          value={selectedProcessId}
          onChange={(e) => setSelectedProcessId(e.target.value)}
          label={t('management.processCode')}
        >
          <MenuItem value="all">{t('common.all')}</MenuItem>
          {processes.map((process) => (
            <MenuItem key={process.id} value={process.id}>
              {process.code}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Data Type Filter */}
      <FormControl size="small" sx={{ minWidth: 130 }}>
        <InputLabel>{t('management.dataType')}</InputLabel>
        <Select
          value={selectedDataType}
          onChange={(e) => setSelectedDataType(e.target.value)}
          label={t('management.dataType')}
        >
          <MenuItem value="all">{t('common.all')}</MenuItem>
          <MenuItem value="numeric">{t('management.dataTypeNumeric')}</MenuItem>
          <MenuItem value="ok_ng">{t('management.dataTypeOkNg')}</MenuItem>
        </Select>
      </FormControl>

      {/* Name Filter */}
      <TextField
        size="small"
        placeholder={t('management.itemName')}
        value={nameFilter}
        onChange={(e) => setNameFilter(e.target.value)}
        sx={{ minWidth: 150 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

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
        enableSearch={false}
        enableFilters={false}
      />

      {/* Add/Edit Dialog */}
      <InspectionItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        models={models}
        processes={processes}
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
        existingProcesses={processes as InspectionProcess[]}
        onBulkSave={handleBulkSave}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['inspection-items'] })
        }}
      />
    </>
  )
}
