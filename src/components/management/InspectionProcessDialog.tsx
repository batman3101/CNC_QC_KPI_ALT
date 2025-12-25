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
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/types/database'

// Supabase 서비스
import * as managementService from '@/services/managementService'

type InspectionProcess = Database['public']['Tables']['inspection_processes']['Row']
type InspectionProcessInsert = Database['public']['Tables']['inspection_processes']['Insert']
type InspectionProcessUpdate = Database['public']['Tables']['inspection_processes']['Update']

interface InspectionProcessDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editingProcess?: InspectionProcess | null
}

function createFormSchema(t: (key: string) => string) {
  return z.object({
    code: z.string().min(1, t('validation.required')),
    name: z.string().min(1, t('validation.required')),
    description: z.string().optional(),
    is_active: z.boolean(),
  })
}

type FormValues = z.infer<ReturnType<typeof createFormSchema>>

export function InspectionProcessDialog({
  open,
  onClose,
  onSuccess,
  editingProcess,
}: InspectionProcessDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isEditing = !!editingProcess

  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(t)),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      is_active: true,
    },
  })

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (editingProcess) {
        form.reset({
          code: editingProcess.code,
          name: editingProcess.name,
          description: editingProcess.description || '',
          is_active: editingProcess.is_active,
        })
      } else {
        form.reset({
          code: '',
          name: '',
          description: '',
          is_active: true,
        })
      }
    }
  }, [open, editingProcess, form])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: InspectionProcessInsert) =>
      managementService.createInspectionProcess(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-processes'] })
      toast({
        title: t('management.addInspectionProcess'),
        description: t('management.inspectionProcessAdded'),
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
    mutationFn: (data: InspectionProcessUpdate & { id: string }) =>
      managementService.updateInspectionProcess(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-processes'] })
      toast({
        title: t('management.updateInspectionProcess'),
        description: t('management.inspectionProcessUpdated'),
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

  const onSubmit = (values: FormValues) => {
    // 명시적으로 모든 필드를 포함하여 업데이트 시 누락 방지
    const processData = {
      code: values.code,
      name: values.name,
      description: values.description || null,
      is_active: values.is_active,
    }

    if (isEditing && editingProcess) {
      updateMutation.mutate({
        id: editingProcess.id,
        ...processData,
      })
    } else {
      createMutation.mutate(processData)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('management.updateInspectionProcess')
              : t('management.addInspectionProcess')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('management.updateInspectionProcessDescription')
              : t('management.addInspectionProcessDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('management.processCode')} *</FormLabel>
                  <FormControl>
                    <Input placeholder="IQC, PQC, OQC..." {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('management.processCodeDescription')}
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
                  <FormLabel>{t('management.processName')} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t('management.processNamePlaceholder')} {...field} />
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
