import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import type { Database } from '@/types/database'

// Supabase 서비스
import * as managementService from '@/services/managementService'

type ProductModel = Database['public']['Tables']['product_models']['Row']
type ProductModelInsert =
  Database['public']['Tables']['product_models']['Insert']
type ProductModelUpdate =
  Database['public']['Tables']['product_models']['Update']

interface ProductModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model?: ProductModel | null
}

function createFormSchema(t: (key: string) => string) {
  return z.object({
    name: z
      .string()
      .min(1, t('validation.enterModelName'))
      .max(100, t('validation.enterModelName')),
    code: z
      .string()
      .min(1, t('validation.enterModelCode'))
      .max(50, t('validation.enterModelCode'))
      .regex(/^[A-Z0-9-_]+$/, t('validation.enterModelCode')),
  })
}

type FormValues = z.infer<ReturnType<typeof createFormSchema>>

export function ProductModelDialog({
  open,
  onOpenChange,
  model,
}: ProductModelDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const isEditing = !!model

  const formSchema = createFormSchema(t)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
    },
  })

  // Reset form when dialog opens/closes or model changes
  useEffect(() => {
    if (open) {
      if (model) {
        reset({
          name: model.name,
          code: model.code,
        })
      } else {
        reset({
          name: '',
          code: '',
        })
      }
    }
  }, [open, model, reset])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ProductModelInsert) =>
      managementService.createProductModel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-models'] })
      enqueueSnackbar(t('management.productModelCreated'), { variant: 'success' })
      onOpenChange(false)
      reset()
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message, { variant: 'error' })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductModelUpdate }) =>
      managementService.updateProductModel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-models'] })
      enqueueSnackbar(t('management.productModelUpdated'), { variant: 'success' })
      onOpenChange(false)
      reset()
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message, { variant: 'error' })
    },
  })

  const onSubmit = (values: FormValues) => {
    if (isEditing && model) {
      updateMutation.mutate({
        id: model.id,
        data: values,
      })
    } else {
      createMutation.mutate(values)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {isEditing ? t('management.editProductModel') : t('management.addProductModel')}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {isEditing
            ? t('management.editProductModel')
            : t('management.addProductModel')}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={`${t('management.modelName')} *`}
                  placeholder="CNC-A1000"
                  disabled={isLoading}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={`${t('management.modelCode')} *`}
                  placeholder="A1000"
                  disabled={isLoading}
                  error={!!errors.code}
                  helperText={errors.code?.message}
                  onChange={(e) => {
                    // Auto uppercase
                    field.onChange(e.target.value.toUpperCase())
                  }}
                  fullWidth
                />
              )}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? t('common.loading') : isEditing ? t('common.edit') : t('common.add')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
