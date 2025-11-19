import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/types/database'

// UI 테스트용 Mock 서비스
import * as managementService from '@/ui_test/mockServices/mockManagementService'

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
  const { toast } = useToast()
  const isEditing = !!model

  const formSchema = createFormSchema(t)

  const form = useForm<FormValues>({
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
        form.reset({
          name: model.name,
          code: model.code,
        })
      } else {
        form.reset({
          name: '',
          code: '',
        })
      }
    }
  }, [open, model, form])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ProductModelInsert) =>
      managementService.createProductModel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-models'] })
      toast({
        title: t('management.addProductModel'),
        description: t('management.productModelCreated'),
      })
      onOpenChange(false)
      form.reset()
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductModelUpdate }) =>
      managementService.updateProductModel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-models'] })
      toast({
        title: t('management.editProductModel'),
        description: t('management.productModelUpdated'),
      })
      onOpenChange(false)
      form.reset()
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      })
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('management.editProductModel') : t('management.addProductModel')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('management.editProductModel')
              : t('management.addProductModel')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('management.modelName')} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="CNC-A1000"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('management.modelCode')} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="A1000"
                      {...field}
                      disabled={isLoading}
                      onChange={(e) => {
                        // Auto uppercase
                        field.onChange(e.target.value.toUpperCase())
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common.loading') : isEditing ? t('common.edit') : t('common.add')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
