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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/types/database'

// UI 테스트용 Mock 서비스
import * as managementService from '@/ui_test/mockServices/mockManagementService'

type InspectionItem = Database['public']['Tables']['inspection_items']['Row']
type InspectionItemInsert =
  Database['public']['Tables']['inspection_items']['Insert']
type InspectionItemUpdate =
  Database['public']['Tables']['inspection_items']['Update']
type ProductModel = Database['public']['Tables']['product_models']['Row']

interface InspectionItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: InspectionItem | null
  models: ProductModel[]
}

function createFormSchema(t: (key: string) => string) {
  return z.object({
    model_id: z.string().min(1, t('validation.selectModel')),
    name: z
      .string()
      .min(1, t('validation.enterItemName'))
      .max(100, t('validation.enterItemName')),
    data_type: z.enum(['numeric', 'ok_ng'], {
      required_error: t('validation.selectDataType'),
    }),
    standard_value: z.number().optional(),
    tolerance: z.number().optional(),
    unit: z.string().optional(),
  })
}

type FormValues = z.infer<ReturnType<typeof createFormSchema>>

export function InspectionItemDialog({
  open,
  onOpenChange,
  item,
  models,
}: InspectionItemDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const isEditing = !!item

  const formSchema = createFormSchema(t)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model_id: '',
      name: '',
      data_type: 'ok_ng',
      standard_value: 0,
      tolerance: 0,
      unit: '',
    },
  })

  const dataType = form.watch('data_type')

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open) {
      if (item) {
        const tolerance =
          item.data_type === 'numeric'
            ? item.tolerance_max - item.standard_value
            : 0
        form.reset({
          model_id: item.model_id,
          name: item.name,
          data_type: item.data_type,
          standard_value: item.standard_value || 0,
          tolerance: tolerance,
          unit: item.unit || '',
        })
      } else {
        form.reset({
          model_id: '',
          name: '',
          data_type: 'ok_ng',
          standard_value: 0,
          tolerance: 0,
          unit: '',
        })
      }
    }
  }, [open, item, form])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: InspectionItemInsert) =>
      managementService.createInspectionItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-items'] })
      toast({
        title: t('management.addInspectionItem'),
        description: t('management.inspectionItemCreated'),
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
    mutationFn: ({ id, data }: { id: string; data: InspectionItemUpdate }) =>
      managementService.updateInspectionItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-items'] })
      toast({
        title: t('management.editInspectionItem'),
        description: t('management.inspectionItemUpdated'),
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
    const { tolerance, ...rest } = values

    let itemData: InspectionItemInsert | InspectionItemUpdate

    if (values.data_type === 'numeric') {
      const standardValue = values.standard_value || 0
      const toleranceValue = tolerance || 0
      itemData = {
        ...rest,
        standard_value: standardValue,
        tolerance_min: standardValue - toleranceValue,
        tolerance_max: standardValue + toleranceValue,
        unit: values.unit || 'mm',
      }
    } else {
      // OK/NG type
      itemData = {
        model_id: values.model_id,
        name: values.name,
        data_type: 'ok_ng',
        standard_value: 0,
        tolerance_min: 0,
        tolerance_max: 0,
        unit: '',
      }
    }

    if (isEditing && item) {
      updateMutation.mutate({
        id: item.id,
        data: itemData,
      })
    } else {
      createMutation.mutate(itemData as InspectionItemInsert)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('management.editInspectionItem') : t('management.addInspectionItem')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('management.editInspectionItem')
              : t('management.addInspectionItem')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="model_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('management.model')} *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('management.model')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name} ({model.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('management.itemName')} *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('management.itemName')}
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
              name="data_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('management.dataType')} *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ok_ng">{t('management.dataTypeOkNg')}</SelectItem>
                      <SelectItem value="numeric">{t('management.dataTypeNumeric')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    OK/NG: 합격/불합격만 판정 | 수치형: 측정값 입력 (기준값 선택사항)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {dataType === 'numeric' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="standard_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('management.standardValue')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>{t('common.optional')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tolerance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('management.tolerance')} (±)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>{t('common.optional')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('management.unit')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="mm"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription>{t('common.optional')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

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
