import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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

export function DefectsList() {
  const { t } = useTranslation()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const statusConfig = {
    pending: {
      label: t('defects.statusPending'),
      icon: Clock,
      variant: 'destructive' as const,
    },
    in_progress: {
      label: t('defects.statusInProgress'),
      icon: PlayCircle,
      variant: 'default' as const,
    },
    resolved: {
      label: t('defects.statusResolved'),
      icon: CheckCircle2,
      variant: 'secondary' as const,
    },
  }

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
        title: t('defects.statusChanged'),
        description: t('defects.statusChanged'),
      })
    },
    onError: (error: Error) => {
      toast({
        title: t('defects.statusChangeError'),
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
                  {t('defects.title')}
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
                  {t('defects.statusPending')}
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
                  {t('defects.statusInProgress')}
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
                  {t('defects.statusResolved')}
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
            <CardTitle>{t('defects.listTitle')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('defects.defectType')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('defects.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('defects.all')}</SelectItem>
                <SelectItem value="pending">{t('defects.statusPending')}</SelectItem>
                <SelectItem value="in_progress">{t('defects.statusInProgress')}</SelectItem>
                <SelectItem value="resolved">{t('defects.statusResolved')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : filteredDefects.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? t('common.noData')
                : t('common.noData')}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('defects.defectType')}</TableHead>
                    <TableHead>{t('defects.description')}</TableHead>
                    <TableHead>{t('defects.status')}</TableHead>
                    <TableHead>{t('defects.registeredDate')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
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
                                {t('defects.startAction')}
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
                                {t('defects.completeAction')}
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
