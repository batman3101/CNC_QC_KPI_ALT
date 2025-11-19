import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ClipboardCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/types/database'

// UI 테스트용 Mock 서비스
import * as inspectionService from '@/ui_test/mockServices/mockInspectionService'
import * as managementService from '@/ui_test/mockServices/mockManagementService'

type Machine = Database['public']['Tables']['machines']['Row']
type ProductModel = Database['public']['Tables']['product_models']['Row']

interface InspectionSetupProps {
  onStart: (data: { machineId: string; modelId: string }) => void
}

type FormValues = z.infer<ReturnType<typeof createFormSchema>>

function createFormSchema(t: (key: string) => string) {
  return z.object({
    machineId: z.string().min(1, t('validation.selectMachine')),
    modelId: z.string().min(1, t('validation.selectModel')),
  })
}

export function InspectionSetup({ onStart }: InspectionSetupProps) {
  const { t } = useTranslation()
  const form = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(t)),
    defaultValues: {
      machineId: '',
      modelId: '',
    },
  })

  // Fetch machines
  const { data: machines = [], isLoading: machinesLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: inspectionService.getMachines,
  })

  // Fetch product models
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['product-models'],
    queryFn: managementService.getProductModels,
  })

  const selectedMachineId = form.watch('machineId')
  const selectedModelId = form.watch('modelId')

  const selectedMachine = machines.find((m) => m.id === selectedMachineId)
  const selectedModel = models.find((m) => m.id === selectedModelId)

  const onSubmit = (values: FormValues) => {
    onStart({
      machineId: values.machineId,
      modelId: values.modelId,
    })
  }

  const isLoading = machinesLoading || modelsLoading

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          {t('inspection.setupTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Machine Selection */}
            <FormField
              control={form.control}
              name="machineId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('inspection.selectMachine')} *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('inspection.selectMachinePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {machines.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          <div className="flex items-center gap-2">
                            <span>{machine.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {machine.model}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Model Selection */}
            <FormField
              control={form.control}
              name="modelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('inspection.selectModel')} *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('inspection.selectModelPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {model.code}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Summary */}
            {selectedMachine && selectedModel && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="mb-3 font-medium">검사 정보 확인</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('dashboard.machine')}:</span>
                    <span className="font-medium">{selectedMachine.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('dashboard.model')}:</span>
                    <span className="font-medium">{selectedModel.name}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Start Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!selectedMachine || !selectedModel}
            >
              <ClipboardCheck className="mr-2 h-4 w-4" />
              {t('inspection.startInspection')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
