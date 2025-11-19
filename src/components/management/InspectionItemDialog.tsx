import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

const formSchema = z
  .object({
    model_id: z.string().min(1, '제품 모델을 선택해주세요'),
    name: z
      .string()
      .min(1, '검사 항목명을 입력해주세요')
      .max(100, '검사 항목명은 100자 이내로 입력해주세요'),
    data_type: z.enum(['numeric', 'ok_ng'], {
      required_error: '데이터 타입을 선택해주세요',
    }),
    standard_value: z.number().optional(),
    tolerance: z.number().optional(),
    unit: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.data_type === 'numeric') {
        return (
          data.standard_value !== undefined &&
          data.tolerance !== undefined &&
          data.unit !== undefined
        )
      }
      return true
    },
    {
      message: '수치형 데이터는 기준값, 공차, 단위를 입력해야 합니다',
      path: ['standard_value'],
    }
  )

type FormValues = z.infer<typeof formSchema>

export function InspectionItemDialog({
  open,
  onOpenChange,
  item,
  models,
}: InspectionItemDialogProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const isEditing = !!item

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model_id: '',
      name: '',
      data_type: 'numeric',
      standard_value: 0,
      tolerance: 0,
      unit: 'mm',
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
          standard_value: item.standard_value,
          tolerance: tolerance,
          unit: item.unit,
        })
      } else {
        form.reset({
          model_id: '',
          name: '',
          data_type: 'numeric',
          standard_value: 0,
          tolerance: 0,
          unit: 'mm',
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
        title: '등록 완료',
        description: '검사 항목이 등록되었습니다.',
      })
      onOpenChange(false)
      form.reset()
    },
    onError: (error: Error) => {
      toast({
        title: '등록 실패',
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
        title: '수정 완료',
        description: '검사 항목이 수정되었습니다.',
      })
      onOpenChange(false)
      form.reset()
    },
    onError: (error: Error) => {
      toast({
        title: '수정 실패',
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
            {isEditing ? '검사 항목 수정' : '검사 항목 등록'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? '검사 항목 정보를 수정합니다.'
              : '새로운 검사 항목을 등록합니다.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="model_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제품 모델 *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="제품 모델을 선택하세요" />
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
                  <FormLabel>검사 항목명 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: 외경, 내경, 높이"
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
                  <FormLabel>데이터 타입 *</FormLabel>
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
                      <SelectItem value="numeric">수치형 (측정값)</SelectItem>
                      <SelectItem value="ok_ng">OK/NG형 (합격/불합격)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    수치형: 측정값을 숫자로 입력 (예: 50.02mm) / OK/NG형: 합격 또는
                    불합격만 선택
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
                        <FormLabel>기준값 *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="50.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tolerance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>공차 (±) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.05"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          허용 오차 범위 (예: ±0.05)
                        </FormDescription>
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
                      <FormLabel>단위 *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="mm, μm, mm², °C 등"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
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
                취소
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '처리 중...' : isEditing ? '수정' : '등록'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
