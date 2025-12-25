import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Chip,
  IconButton,
  Typography,
  Tooltip,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  AdminPanelSettings,
  SupervisorAccount,
  Person,
} from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { DataTable, type ColumnDef } from '@/components/common/DataTable'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { UserDialog } from './UserDialog'
import { useAuthStore } from '@/stores/authStore'
import type { Database } from '@/types/database'
import * as userService from '@/ui_test/mockServices/mockUserService'

// 날짜 유틸리티
import { formatVietnamDate } from '@/lib/dateUtils'

type User = Database['public']['Tables']['users']['Row']

export function UserList() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const currentUser = useAuthStore((state) => state.user)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  })

  // Fetch existing emails for duplicate check
  const { data: existingEmails = [] } = useQuery({
    queryKey: ['user-emails'],
    queryFn: () => userService.getUserEmails(),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user-emails'] })
      enqueueSnackbar(t('userManagement.userDeleted'), { variant: 'success' })
      setDeleteConfirmOpen(false)
      setUserToDelete(null)
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message, { variant: 'error' })
    },
  })

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <AdminPanelSettings fontSize="small" />
      case 'manager':
        return <SupervisorAccount fontSize="small" />
      case 'inspector':
        return <Person fontSize="small" />
      default:
        return <Person fontSize="small" />
    }
  }

  const getRoleColor = (role: string): 'error' | 'primary' | 'default' => {
    switch (role) {
      case 'admin':
        return 'error'
      case 'manager':
        return 'primary'
      case 'inspector':
        return 'default'
      default:
        return 'default'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return t('userManagement.roleAdmin')
      case 'manager':
        return t('userManagement.roleManager')
      case 'inspector':
        return t('userManagement.roleInspector')
      default:
        return role
    }
  }

  // Column definitions
  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        id: 'name',
        header: t('userManagement.name'),
        cell: (row) => (
          <Typography variant="body2" fontWeight={500}>
            {row.name}
          </Typography>
        ),
      },
      {
        id: 'email',
        header: t('userManagement.email'),
        cell: (row) => (
          <Typography variant="body2">
            {row.email}
          </Typography>
        ),
      },
      {
        id: 'role',
        header: t('userManagement.role'),
        cell: (row) => (
          <Chip
            icon={getRoleIcon(row.role)}
            label={getRoleLabel(row.role)}
            color={getRoleColor(row.role)}
            size="small"
            variant="outlined"
          />
        ),
        filterType: 'select',
        filterOptions: [
          { label: t('userManagement.roleAdmin'), value: 'admin' },
          { label: t('userManagement.roleManager'), value: 'manager' },
          { label: t('userManagement.roleInspector'), value: 'inspector' },
        ],
      },
      {
        id: 'created_at',
        header: t('common.createdAt'),
        cell: (row) => (
          <Typography variant="body2">
            {formatVietnamDate(row.created_at)}
          </Typography>
        ),
        searchable: false,
      },
    ],
    [t]
  )

  const handleAdd = () => {
    setSelectedUser(null)
    setDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setDialogOpen(true)
  }

  const handleDeleteClick = (user: User) => {
    // 자기 자신은 삭제 불가
    if (currentUser && user.id === currentUser.id) {
      enqueueSnackbar(t('userManagement.cannotDeleteSelf'), { variant: 'warning' })
      return
    }
    setUserToDelete(user)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id)
    }
  }

  // Render actions for each row
  const renderActions = (user: User) => (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
      <Tooltip title={t('common.edit')}>
        <IconButton
          size="small"
          color="primary"
          onClick={() => handleEdit(user)}
        >
          <Edit fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('common.delete')}>
        <span>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteClick(user)}
            disabled={currentUser?.id === user.id}
          >
            <Delete fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  )

  // Toolbar with add button
  const toolbarActions = (
    <Button
      variant="contained"
      startIcon={<Add />}
      onClick={handleAdd}
      size="small"
    >
      {t('userManagement.addUser')}
    </Button>
  )

  return (
    <>
      <DataTable
        data={users}
        columns={columns}
        loading={isLoading}
        title={t('userManagement.userList')}
        getRowId={(row) => row.id}
        renderActions={renderActions}
        toolbarActions={toolbarActions}
        searchPlaceholder={t('userManagement.searchByNameOrEmail')}
        pageSize={20}
        enableFilters={true}
      />

      {/* User Dialog */}
      <UserDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            queryClient.invalidateQueries({ queryKey: ['user-emails'] })
          }
        }}
        user={selectedUser}
        existingEmails={existingEmails}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('userManagement.deleteUser')}
        description={t('userManagement.deleteUserConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.isPending}
        variant="danger"
      />
    </>
  )
}
