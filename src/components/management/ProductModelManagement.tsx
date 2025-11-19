import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { ProductModelDialog } from './ProductModelDialog'
import type { Database } from '@/types/database'

// UI 테스트용 Mock 서비스
import * as managementService from '@/ui_test/mockServices/mockManagementService'

type ProductModel = Database['public']['Tables']['product_models']['Row']

export function ProductModelManagement() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<ProductModel | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()

  // Fetch product models
  const { data: models = [], isLoading } = useQuery({
    queryKey: ['product-models'],
    queryFn: managementService.getProductModels,
  })

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

  // Filter models by search query
  const filteredModels = models.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.code.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              {t('management.productModelList')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAdd}
            >
              {t('management.addProductModel')}
            </Button>
          </Box>

          {/* Search */}
          <Box sx={{ mb: 3 }}>
            <TextField
              placeholder={t('common.search')}
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
          </Box>

          {/* Table */}
          {isLoading ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {t('common.loading')}
              </Typography>
            </Box>
          ) : filteredModels.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {searchQuery ? t('common.noData') : t('common.noData')}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('management.modelName')}</TableCell>
                    <TableCell>{t('management.modelCode')}</TableCell>
                    <TableCell>{t('defects.registeredDate')}</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredModels.map((model) => (
                    <TableRow key={model.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {model.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={model.code} variant="outlined" size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(model.created_at).toLocaleDateString('ko-KR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

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
    </>
  )
}
