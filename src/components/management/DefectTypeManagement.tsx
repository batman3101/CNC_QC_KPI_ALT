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
import { DefectTypeDialog } from './DefectTypeDialog'
import type { Database } from '@/types/database'

// UI 테스트용 Mock 서비스
import * as managementService from '@/ui_test/mockServices/mockManagementService'

type DefectType = Database['public']['Tables']['defect_types']['Row']

export function DefectTypeManagement() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<DefectType | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch defect types
  const { data: types = [], isLoading } = useQuery({
    queryKey: ['defect-types-rows'],
    queryFn: managementService.getDefectTypesRows,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: managementService.deleteDefectTypeRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defect-types-rows'] })
      queryClient.invalidateQueries({ queryKey: ['defect-types'] })
      toast({
        title: t('management.deleteDefectType'),
        description: t('management.defectTypeDeleted'),
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

  // Filter types by search query
  const filteredTypes = types.filter(
    (type) =>
      type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddClick = () => {
    setEditingType(null)
    setDialogOpen(true)
  }

  const handleEditClick = (type: DefectType) => {
    setEditingType(type)
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
    setEditingType(null)
  }

  const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
    } as const

    return <Badge variant={variants[severity]}>{t(`management.severity.${severity}`)}</Badge>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('management.defectTypes')}</CardTitle>
            <Button onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" />
              {t('management.addDefectType')}
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
          ) : filteredTypes.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">{t('common.noData')}</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('management.defectCode')}</TableHead>
                    <TableHead>{t('management.defectName')}</TableHead>
                    <TableHead>{t('management.description')}</TableHead>
                    <TableHead>{t('management.severity')}</TableHead>
                    <TableHead>{t('management.status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.code}</TableCell>
                      <TableCell>{type.name}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {type.description || '-'}
                      </TableCell>
                      <TableCell>{getSeverityBadge(type.severity)}</TableCell>
                      <TableCell>
                        {type.is_active ? (
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
                            onClick={() => handleEditClick(type)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(type.id)}
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

      <DefectTypeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleDialogSuccess}
        editingType={editingType}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('management.deleteDefectType')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('management.deleteDefectTypeConfirm')}
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
