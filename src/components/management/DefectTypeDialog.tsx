import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/types/database'

// UI 테스트용 Mock 서비스
import * as managementService from '@/ui_test/mockServices/mockManagementService'

type DefectType = Database['public']['Tables']['defect_types']['Row']
type DefectTypeInsert = Database['public']['Tables']['defect_types']['Insert']
type DefectTypeUpdate = Database['public']['Tables']['defect_types']['Update']

interface DefectTypeDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editingType?: DefectType | null
}

function createFormSchema(t: (key: string) => string) {
  return z.object({
    code: z.string().min(1, t('validation.required')),
    name: z.string().min(1, t('validation.required')),
    description: z.string().optional(),
    severity: z.enum(['low', 'medium', 'high']),
    is_active: z.boolean(),
  })
}

type FormValues = z.infer<ReturnType<typeof createFormSchema>>

export function DefectTypeDialog({
  open,
  onClose,
  onSuccess,
  editingType,
}: DefectTypeDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isEditing = !!editingType

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(t)),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      severity: 'medium',
      is_active: true,
    },
  })

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (editingType) {
        form.reset({
          code: editingType.code,
          name: editingType.name,
          description: editingType.description || '',
          severity: editingType.severity,
          is_active: editingType.is_active,
        })
      } else {
        form.reset({
          code: '',
          name: '',
          description: '',
          severity: 'medium',
          is_active: true,
        })
      }
    }
  }, [open, editingType, form])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: DefectTypeInsert) =>
      managementService.createDefectTypeRow(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defect-types-rows'] })
      queryClient.invalidateQueries({ queryKey: ['defect-types'] })
      toast({
        title: t('management.addDefectType'),
        description: t('management.defectTypeAdded'),
      })
      onSuccess()
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
    mutationFn: (data: DefectTypeUpdate & { id: string }) =>
      managementService.updateDefectTypeRow(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defect-types-rows'] })
      queryClient.invalidateQueries({ queryKey: ['defect-types'] })
      toast({
        title: t('management.updateDefectType'),
        description: t('management.defectTypeUpdated'),
      })
      onSuccess()
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const onSubmit = async (values: FormValues) => {
    console.log('Form submitted with values:', values)

    // 명시적으로 모든 필드를 포함하여 업데이트 시 누락 방지
    const defectTypeData = {
      code: values.code,
      name: values.name,
      description: values.description || null,
      severity: values.severity as 'low' | 'medium' | 'high',
      is_active: values.is_active,
    }

    try {
      if (isEditing && editingType) {
        await updateMutation.mutateAsync({
          id: editingType.id,
          ...defectTypeData,
        })
      } else {
        await createMutation.mutateAsync(defectTypeData)
      }
    } catch (error) {
      console.error('Mutation error:', error)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('management.updateDefectType')
              : t('management.addDefectType')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('management.updateDefectTypeDescription')
              : t('management.addDefectTypeDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit(onSubmit)(e)
            }}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('management.defectCode')} *</FormLabel>
                  <FormControl>
                    <Input placeholder="DIM, SUR, SHA..." {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('management.defectCodeDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('management.defectName')} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t('management.defectNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('management.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('management.descriptionPlaceholder')}
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('management.severity')} *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('management.selectSeverity')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">{t('management.severityLevel.low')}</SelectItem>
                      <SelectItem value="medium">{t('management.severityLevel.medium')}</SelectItem>
                      <SelectItem value="high">{t('management.severityLevel.high')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('management.severityDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('management.activeStatus')}</FormLabel>
                    <FormDescription>
                      {t('management.activeStatusDescription')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('common.loading')
                  : isEditing
                    ? t('common.save')
                    : t('common.add')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
