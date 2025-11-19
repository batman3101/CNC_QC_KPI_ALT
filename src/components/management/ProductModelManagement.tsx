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
import { ProductModelDialog } from './ProductModelDialog'
import type { Database } from '@/types/database'

// UI 테스트용 Mock 서비스
import * as managementService from '@/ui_test/mockServices/mockManagementService'

type ProductModel = Database['public']['Tables']['product_models']['Row']

export function ProductModelManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<ProductModel | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch product models
  const { data: models = [], isLoading } = useQuery({
    queryKey: ['product-models'],
    queryFn: managementService.getProductModels,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: managementService.deleteProductModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-models'] })
      toast({
        title: '삭제 완료',
        description: '제품 모델이 삭제되었습니다.',
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

  // Filter models by search query
  const filteredModels = models.filter(
    (model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = () => {
    setEditingModel(null)
    setDialogOpen(true)
  }

  const handleEdit = (model: ProductModel) => {
    setEditingModel(model)
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
            <CardTitle>제품 모델 목록</CardTitle>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              모델 등록
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="모델명 또는 코드로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              데이터를 불러오는 중...
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery
                ? '검색 결과가 없습니다.'
                : '등록된 제품 모델이 없습니다.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>모델명</TableHead>
                    <TableHead>모델 코드</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModels.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">{model.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{model.code}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(model.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(model)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(model.id)}
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
      <ProductModelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        model={editingModel}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>제품 모델 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 제품 모델을 삭제하시겠습니까? 연결된 검사 항목이 있는 경우
              삭제할 수 없습니다.
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
