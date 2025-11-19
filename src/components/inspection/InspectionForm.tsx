import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  XCircle,
  Save,
  AlertCircle,
  ArrowLeft,
  Camera,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/stores/authStore'
import type { Database } from '@/types/database'

// UI 테스트용 Mock 서비스
import * as managementService from '@/ui_test/mockServices/mockManagementService'
import * as inspectionService from '@/ui_test/mockServices/mockInspectionService'

type InspectionItem = Database['public']['Tables']['inspection_items']['Row']
type InspectionResultInsert =
  Database['public']['Tables']['inspection_results']['Insert']

interface InspectionFormProps {
  machineId: string
  modelId: string
  onComplete: () => void
  onCancel: () => void
}

interface ItemResult {
  itemId: string
  measuredValue: number
  result: 'pass' | 'fail'
  isOkNg: boolean
  okNgValue?: boolean
}

export function InspectionForm({
  machineId,
  modelId,
  onComplete,
  onCancel,
}: InspectionFormProps) {
  const [itemResults, setItemResults] = useState<Record<string, ItemResult>>({})
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuthStore()

  // Fetch inspection items for the selected model
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['inspection-items', modelId],
    queryFn: () => managementService.getInspectionItems(modelId),
  })

  // Create dynamic form schema
  const createFormSchema = () => {
    const schema: Record<string, z.ZodTypeAny> = {}

    items.forEach((item) => {
      if (item.data_type === 'numeric') {
        schema[item.id] = z
          .number({ invalid_type_error: '숫자를 입력해주세요' })
          .or(z.string().transform((val) => parseFloat(val)))
      } else {
        schema[item.id] = z.boolean()
      }
    })

    return z.object(schema)
  }

  const form = useForm({
    resolver: zodResolver(createFormSchema()),
  })

  // Check if value is within tolerance
  const checkTolerance = (
    value: number,
    item: InspectionItem
  ): 'pass' | 'fail' => {
    if (item.data_type === 'ok_ng') return 'pass'

    if (value < item.tolerance_min || value > item.tolerance_max) {
      return 'fail'
    }
    return 'pass'
  }

  // Handle value change for numeric items
  const handleNumericChange = (itemId: string, value: string) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      // Remove result if value is invalid
      const newResults = { ...itemResults }
      delete newResults[itemId]
      setItemResults(newResults)
      return
    }

    const result = checkTolerance(numValue, item)
    setItemResults({
      ...itemResults,
      [itemId]: {
        itemId,
        measuredValue: numValue,
        result,
        isOkNg: false,
      },
    })
  }

  // Handle OK/NG checkbox
  const handleOkNgChange = (itemId: string, checked: boolean) => {
    setItemResults({
      ...itemResults,
      [itemId]: {
        itemId,
        measuredValue: checked ? 1 : 0,
        result: checked ? 'pass' : 'fail',
        isOkNg: true,
        okNgValue: checked,
      },
    })
  }

  // Save inspection mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated')

      // 1. Create inspection
      const inspection = await inspectionService.createInspection({
        user_id: user.id,
        machine_id: machineId,
        model_id: modelId,
        status: 'pending',
      })

      // 2. Create inspection results
      const results: InspectionResultInsert[] = Object.values(itemResults).map(
        (result) => ({
          inspection_id: inspection.id,
          item_id: result.itemId,
          measured_value: result.measuredValue,
          result: result.result,
        })
      )

      await inspectionService.batchCreateInspectionResults(results)

      // 3. Determine overall status
      const overallStatus =
        inspectionService.determineInspectionStatus(results)

      // 4. Update inspection status
      await inspectionService.updateInspectionStatus(
        inspection.id,
        overallStatus
      )

      return { inspection, overallStatus }
    },
    onSuccess: ({ overallStatus }) => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] })
      queryClient.invalidateQueries({ queryKey: ['kpi-summary'] })

      toast({
        title: '검사 완료',
        description: `검사 결과: ${overallStatus === 'pass' ? '합격' : '불합격'}`,
        variant: overallStatus === 'pass' ? 'default' : 'destructive',
      })

      onComplete()
    },
    onError: (error: Error) => {
      toast({
        title: '저장 실패',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleSave = () => {
    // Check if all items have results
    const missingItems = items.filter((item) => !itemResults[item.id])

    if (missingItems.length > 0) {
      toast({
        title: '입력 필요',
        description: `${missingItems.length}개 항목이 입력되지 않았습니다.`,
        variant: 'destructive',
      })
      return
    }

    saveMutation.mutate()
  }

  // Calculate completion
  const totalItems = items.length
  const completedItems = Object.keys(itemResults).length
  const failedItems = Object.values(itemResults).filter(
    (r) => r.result === 'fail'
  ).length

  if (itemsLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            검사 항목을 불러오는 중...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              이 제품 모델에 등록된 검사 항목이 없습니다. 먼저 검사 항목을
              등록해주세요.
            </AlertDescription>
          </Alert>
          <Button onClick={onCancel} variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>검사 진행 현황</CardTitle>
            <Button variant="outline" size="sm" onClick={onCancel}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              취소
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">진행률</div>
              <div className="mt-1 text-2xl font-bold">
                {totalItems > 0
                  ? Math.round((completedItems / totalItems) * 100)
                  : 0}
                %
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {completedItems} / {totalItems} 항목
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">합격</div>
              <div className="mt-1 text-2xl font-bold text-green-600">
                {completedItems - failedItems}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">항목</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">불합격</div>
              <div className="mt-1 text-2xl font-bold text-destructive">
                {failedItems}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">항목</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inspection Items Card */}
      <Card>
        <CardHeader>
          <CardTitle>검사 항목</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="space-y-6">
              {items.map((item, index) => {
                const result = itemResults[item.id]
                const isNumeric = item.data_type === 'numeric'

                return (
                  <div
                    key={item.id}
                    className="rounded-lg border p-4 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <h4 className="font-medium">{item.name}</h4>
                          {result && (
                            <Badge
                              variant={
                                result.result === 'pass'
                                  ? 'default'
                                  : 'destructive'
                              }
                              className="ml-auto"
                            >
                              {result.result === 'pass' ? (
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                              ) : (
                                <XCircle className="mr-1 h-3 w-3" />
                              )}
                              {result.result === 'pass' ? '합격' : '불합격'}
                            </Badge>
                          )}
                        </div>

                        {isNumeric ? (
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">
                              기준: {item.standard_value.toFixed(2)} {item.unit} (
                              {item.tolerance_min.toFixed(2)} ~{' '}
                              {item.tolerance_max.toFixed(2)} {item.unit})
                            </div>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder={`측정값 입력 (${item.unit})`}
                                onChange={(e) =>
                                  handleNumericChange(item.id, e.target.value)
                                }
                                className="max-w-xs"
                              />
                              <span className="flex items-center text-sm text-muted-foreground">
                                {item.unit}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={item.id}
                              onCheckedChange={(checked) =>
                                handleOkNgChange(item.id, checked === true)
                              }
                            />
                            <label
                              htmlFor={item.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              OK (합격)
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Form>

          {/* Save Button */}
          <div className="mt-6 flex gap-2">
            <Button
              onClick={handleSave}
              className="flex-1"
              size="lg"
              disabled={completedItems !== totalItems || saveMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? '저장 중...' : '검사 완료 및 저장'}
            </Button>
          </div>

          {completedItems !== totalItems && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              모든 항목을 입력해주세요 ({completedItems}/{totalItems})
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
