import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Eye,
  CheckCircle2,
  Clock,
  PlayCircle,
  Search,
} from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { DefectDetailDialog } from './DefectDetailDialog'
import type { Database } from '@/types/database'

// UI 테스트용 Mock 서비스
import * as inspectionService from '@/ui_test/mockServices/mockInspectionService'

type Defect = Database['public']['Tables']['defects']['Row']

const statusConfig = {
  pending: {
    label: '조치 대기',
    icon: Clock,
    variant: 'destructive' as const,
  },
  in_progress: {
    label: '조치 중',
    icon: PlayCircle,
    variant: 'default' as const,
  },
  resolved: {
    label: '조치 완료',
    icon: CheckCircle2,
    variant: 'secondary' as const,
  },
}

export function DefectsList() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch defects
  const { data: defects = [], isLoading } = useQuery({
    queryKey: ['defects'],
    queryFn: () => inspectionService.getDefects(),
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: 'pending' | 'in_progress' | 'resolved'
    }) => inspectionService.updateDefectStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] })
      toast({
        title: '상태 변경 완료',
        description: '불량 상태가 변경되었습니다.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: '상태 변경 실패',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Filter defects
  const filteredDefects = defects.filter((defect) => {
    const matchesStatus =
      statusFilter === 'all' || defect.status === statusFilter
    const matchesSearch =
      searchQuery === '' ||
      defect.defect_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      defect.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const handleViewDetail = (defect: Defect) => {
    setSelectedDefect(defect)
    setDetailDialogOpen(true)
  }

  const handleStatusChange = (defectId: string, newStatus: Defect['status']) => {
    updateStatusMutation.mutate({ id: defectId, status: newStatus })
  }

  // Calculate counts
  const counts = {
    all: defects.length,
    pending: defects.filter((d) => d.status === 'pending').length,
    in_progress: defects.filter((d) => d.status === 'in_progress').length,
    resolved: defects.filter((d) => d.status === 'resolved').length,
  }

  return (
    <>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  전체 불량
                </p>
                <p className="text-2xl font-bold">{counts.all}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  조치 대기
                </p>
                <p className="text-2xl font-bold text-destructive">
                  {counts.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  조치 중
                </p>
                <p className="text-2xl font-bold">{counts.in_progress}</p>
              </div>
              <PlayCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  조치 완료
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {counts.resolved}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Defects Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>불량 목록</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="불량 유형 또는 설명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="pending">조치 대기</SelectItem>
                <SelectItem value="in_progress">조치 중</SelectItem>
                <SelectItem value="resolved">조치 완료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              데이터를 불러오는 중...
            </div>
          ) : filteredDefects.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? '검색 결과가 없습니다.'
                : '등록된 불량이 없습니다.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>불량 유형</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDefects.map((defect) => {
                    const config = statusConfig[defect.status]
                    const Icon = config.icon

                    return (
                      <TableRow key={defect.id}>
                        <TableCell className="font-medium">
                          {defect.defect_type}
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {defect.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant}>
                            <Icon className="mr-1 h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(defect.created_at).toLocaleDateString(
                            'ko-KR'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetail(defect)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {defect.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleStatusChange(defect.id, 'in_progress')
                                }
                              >
                                조치 시작
                              </Button>
                            )}
                            {defect.status === 'in_progress' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleStatusChange(defect.id, 'resolved')
                                }
                              >
                                조치 완료
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <DefectDetailDialog
        defect={selectedDefect}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onStatusChange={handleStatusChange}
      />
    </>
  )
}
