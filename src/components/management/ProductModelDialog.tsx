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

const formSchema = z.object({
  name: z
    .string()
    .min(1, '모델명을 입력해주세요')
    .max(100, '모델명은 100자 이내로 입력해주세요'),
  code: z
    .string()
    .min(1, '모델 코드를 입력해주세요')
    .max(50, '모델 코드는 50자 이내로 입력해주세요')
    .regex(/^[A-Z0-9-_]+$/, '모델 코드는 대문자, 숫자, -, _만 사용 가능합니다'),
})

type FormValues = z.infer<typeof formSchema>

export function ProductModelDialog({
  open,
  onOpenChange,
  model,
}: ProductModelDialogProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const isEditing = !!model

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
        title: '등록 완료',
        description: '제품 모델이 등록되었습니다.',
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
    mutationFn: ({ id, data }: { id: string; data: ProductModelUpdate }) =>
      managementService.updateProductModel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-models'] })
      toast({
        title: '수정 완료',
        description: '제품 모델이 수정되었습니다.',
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
            {isEditing ? '제품 모델 수정' : '제품 모델 등록'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? '제품 모델 정보를 수정합니다.'
              : '새로운 제품 모델을 등록합니다.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>모델명 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: CNC-A1000"
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
                  <FormLabel>모델 코드 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: A1000"
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
