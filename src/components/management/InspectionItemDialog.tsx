import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

// Supabase 서비스
import * as managementService from '@/services/managementService'

type InspectionItem = Database['public']['Tables']['inspection_items']['Row']
type InspectionItemInsert =
  Database['public']['Tables']['inspection_items']['Insert']
type InspectionItemUpdate =
  Database['public']['Tables']['inspection_items']['Update']
type ProductModel = Database['public']['Tables']['product_models']['Row']
type InspectionProcess = Database['public']['Tables']['inspection_processes']['Row']

interface InspectionItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: InspectionItem | null
  models: ProductModel[]
  processes?: InspectionProcess[]
}

function createFormSchema(t: (key: string) => string) {
  return z.object({
    model_id: z.string().min(1, t('validation.selectModel')),
    machining_process: z.string().optional(),
    process_id: z.string().optional().nullable(),
    name: z
      .string()
      .min(1, t('validation.enterItemName'))
      .max(100, t('validation.enterItemName')),
    data_type: z.enum(['numeric', 'ok_ng'], {
      required_error: t('validation.selectDataType'),
    }),
    standard_value: z.number().optional(),
    tolerance_plus: z.number().optional(),
    tolerance_minus: z.number().optional(),
    unit: z.string().optional(),
  })
}

type FormValues = z.infer<ReturnType<typeof createFormSchema>>

export function InspectionItemDialog({
  open,
  onOpenChange,
  item,
  models,
  processes = [],
}: InspectionItemDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const isEditing = !!item

  // Fetch processes if not provided
  const { data: fetchedProcesses = [] } = useQuery({
    queryKey: ['inspection-processes'],
    queryFn: managementService.getInspectionProcesses,
    enabled: processes.length === 0,
  })

  const availableProcesses = processes.length > 0 ? processes : fetchedProcesses

  const formSchema = createFormSchema(t)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model_id: '',
      machining_process: '',
      process_id: null,
      name: '',
      data_type: 'ok_ng',
      standard_value: 0,
      tolerance_plus: 0,
      tolerance_minus: 0,
      unit: '',
    },
  })

  const dataType = form.watch('data_type')

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open) {
      if (item) {
        const isNumeric = item.data_type === 'numeric'
        // DB stores absolute LSL/USL; convert back to ± offsets for editing.
        const tolerancePlus = isNumeric ? item.tolerance_max - item.standard_value : 0
        const toleranceMinus = isNumeric ? item.standard_value - item.tolerance_min : 0
        form.reset({
          model_id: item.model_id,
          machining_process: item.machining_process || '',
          process_id: item.process_id || null,
          name: item.name,
          data_type: item.data_type,
          standard_value: item.standard_value || 0,
          tolerance_plus: tolerancePlus,
          tolerance_minus: toleranceMinus,
          unit: item.unit || '',
        })
      } else {
        form.reset({
          model_id: '',
          machining_process: '',
          process_id: null,
          name: '',
          data_type: 'ok_ng',
          standard_value: 0,
          tolerance_plus: 0,
          tolerance_minus: 0,
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
    let itemData: InspectionItemInsert | InspectionItemUpdate

    // Handle optional fields - convert empty string to null
    const processId = values.process_id && values.process_id !== '' ? values.process_id : null
    const machiningProcess =
      values.machining_process && values.machining_process.trim() !== ''
        ? values.machining_process.trim()
        : null

    if (values.data_type === 'numeric') {
      const standardValue = values.standard_value || 0
      const plus = values.tolerance_plus || 0
      const minus = values.tolerance_minus || 0
      // Convert ± offsets into absolute spec limits (LSL/USL) for storage.
      itemData = {
        model_id: values.model_id,
        machining_process: machiningProcess,
        process_id: processId,
        name: values.name,
        data_type: 'numeric',
        standard_value: standardValue,
        tolerance_min: standardValue - minus,
        tolerance_max: standardValue + plus,
        unit: values.unit || 'mm',
      }
    } else {
      // OK/NG type
      itemData = {
        model_id: values.model_id,
        machining_process: machiningProcess,
        process_id: processId,
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
                          {model.code} - {model.name}
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
              name="machining_process"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('management.machiningProcessOptional')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('management.machiningProcessPlaceholder')}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>{t('management.machiningProcessDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="process_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('management.processOptional')}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                    value={field.value || '__none__'}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('management.selectProcess')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">{t('management.noProcess')}</SelectItem>
                      {availableProcesses
                        .filter((p) => p.is_active)
                        .map((process) => (
                          <SelectItem key={process.id} value={process.id}>
                            {process.code} - {process.name}
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
                    {t('management.dataTypeHelper')}
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
                            // `parseFloat(v) || 0` turned every intermediate
                            // state into 0. Typing "-" makes a number input
                            // report an empty value, so the field became 0 and
                            // React wrote "0" back into the DOM - erasing the
                            // minus sign and making negative values impossible
                            // to enter. Keep it empty until it parses.
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const next = parseFloat(e.target.value)
                              field.onChange(Number.isNaN(next) ? undefined : next)
                            }}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tolerance_plus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('management.tolerancePlus')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            // `parseFloat(v) || 0` turned every intermediate
                            // state into 0. Typing "-" makes a number input
                            // report an empty value, so the field became 0 and
                            // React wrote "0" back into the DOM - erasing the
                            // minus sign and making negative values impossible
                            // to enter. Keep it empty until it parses.
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const next = parseFloat(e.target.value)
                              field.onChange(Number.isNaN(next) ? undefined : next)
                            }}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>{t('management.tolerancePlusHint')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tolerance_minus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('management.toleranceMinus')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            {...field}
                            // `parseFloat(v) || 0` turned every intermediate
                            // state into 0. Typing "-" makes a number input
                            // report an empty value, so the field became 0 and
                            // React wrote "0" back into the DOM - erasing the
                            // minus sign and making negative values impossible
                            // to enter. Keep it empty until it parses.
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const next = parseFloat(e.target.value)
                              field.onChange(Number.isNaN(next) ? undefined : next)
                            }}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>{t('management.toleranceMinusHint')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
