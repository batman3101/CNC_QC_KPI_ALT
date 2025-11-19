import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { InspectionItemDialog } from './InspectionItemDialog'
import type { Database } from '@/types/database'

// UI 테스트용 Mock 서비스
import * as managementService from '@/ui_test/mockServices/mockManagementService'

type InspectionItem = Database['public']['Tables']['inspection_items']['Row']
type ProductModel = Database['public']['Tables']['product_models']['Row']

export function InspectionItemManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedModelId, setSelectedModelId] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch product models for filter
  const { data: models = [] } = useQuery({
    queryKey: ['product-models'],
    queryFn: managementService.getProductModels,
  })

  // Fetch inspection items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inspection-items', selectedModelId],
    queryFn: () =>
      managementService.getInspectionItems(
        selectedModelId === 'all' ? undefined : selectedModelId
      ),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: managementService.deleteInspectionItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-items'] })
      toast({
        title: '삭제 완료',
        description: '검사 항목이 삭제되었습니다.',
      })
      setDeleteDialogOpen(false)
      setDeletingId(null)
    },
    onError: (error: Error) => {
      toast({
        title: '삭제 실패',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Filter items by search query
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get model name by ID
  const getModelName = (modelId: string) => {
    const model = models.find((m) => m.id === modelId)
    return model?.name || modelId
  }

  const handleAdd = () => {
    setEditingItem(null)
    setDialogOpen(true)
  }

  const handleEdit = (item: InspectionItem) => {
    setEditingItem(item)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>검사 항목 목록</CardTitle>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              항목 등록
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="검사 항목명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedModelId} onValueChange={setSelectedModelId}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="제품 모델 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 모델</SelectItem>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              데이터를 불러오는 중...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery || selectedModelId !== 'all'
                ? '검색 결과가 없습니다.'
                : '등록된 검사 항목이 없습니다.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제품 모델</TableHead>
                    <TableHead>검사 항목</TableHead>
                    <TableHead>타입</TableHead>
                    <TableHead>기준값</TableHead>
                    <TableHead>공차</TableHead>
                    <TableHead>단위</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="secondary">
                          {getModelName(item.model_id)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.data_type === 'numeric' ? 'default' : 'outline'
                          }
                        >
                          {item.data_type === 'numeric' ? '수치형' : 'OK/NG'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.data_type === 'numeric'
                          ? item.standard_value.toFixed(2)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {item.data_type === 'numeric'
                          ? `±${((item.tolerance_max - item.standard_value) || 0).toFixed(2)}`
                          : '-'}
                      </TableCell>
                      <TableCell>{item.unit || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <InspectionItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editingItem}
        models={models}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>검사 항목 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 검사 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
