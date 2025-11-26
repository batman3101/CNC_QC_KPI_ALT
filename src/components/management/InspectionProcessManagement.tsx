import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
import { InspectionProcessDialog } from './InspectionProcessDialog'
import type { Database } from '@/types/database'

// UI 테스트용 Mock 서비스
import * as managementService from '@/ui_test/mockServices/mockManagementService'

type InspectionProcess = Database['public']['Tables']['inspection_processes']['Row']

export function InspectionProcessManagement() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProcess, setEditingProcess] = useState<InspectionProcess | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch inspection processes
  const { data: processes = [], isLoading } = useQuery({
    queryKey: ['inspection-processes'],
    queryFn: managementService.getInspectionProcesses,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: managementService.deleteInspectionProcess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-processes'] })
      toast({
        title: t('management.deleteInspectionProcess'),
        description: t('management.inspectionProcessDeleted'),
      })
      setDeleteDialogOpen(false)
      setDeletingId(null)
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Filter processes by search query
  const filteredProcesses = processes.filter(
    (process) =>
      process.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      process.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddClick = () => {
    setEditingProcess(null)
    setDialogOpen(true)
  }

  const handleEditClick = (process: InspectionProcess) => {
    setEditingProcess(process)
    setDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId)
    }
  }

  const handleDialogSuccess = () => {
    setDialogOpen(false)
    setEditingProcess(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('management.inspectionProcesses')}</CardTitle>
            <Button onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" />
              {t('management.addInspectionProcess')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('management.searchByNameOrCode')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">{t('common.loading')}</div>
            </div>
          ) : filteredProcesses.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">{t('common.noData')}</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('management.processCode')}</TableHead>
                    <TableHead>{t('management.processName')}</TableHead>
                    <TableHead>{t('management.description')}</TableHead>
                    <TableHead>{t('management.status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProcesses.map((process) => (
                    <TableRow key={process.id}>
                      <TableCell className="font-medium">{process.code}</TableCell>
                      <TableCell>{process.name}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {process.description || '-'}
                      </TableCell>
                      <TableCell>
                        {process.is_active ? (
                          <Badge variant="default">{t('management.active')}</Badge>
                        ) : (
                          <Badge variant="secondary">{t('management.inactive')}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(process)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(process.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

      <InspectionProcessDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleDialogSuccess}
        editingProcess={editingProcess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('management.deleteInspectionProcess')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('management.deleteInspectionProcessConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
