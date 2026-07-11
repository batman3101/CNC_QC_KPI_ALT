import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useSnackbar } from 'notistack'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useAuthStore } from '@/stores/authStore'
import { useFactoryStore } from '@/stores/factoryStore'
import {
  permissionQueryKeys,
  permissionService,
  type PermissionChange,
} from '@/services/permissionService'
import {
  PERMISSION_KEYS,
  PERMISSION_LABEL_KEYS,
  type PermissionKey,
} from '@/types/permissions'

type EditableRole = 'manager' | 'inspector'
type PermissionMatrix = Record<EditableRole, Record<PermissionKey, boolean>>

function emptyPermissionMatrix(): PermissionMatrix {
  return {
    manager: Object.fromEntries(PERMISSION_KEYS.map((key) => [key, false])) as Record<PermissionKey, boolean>,
    inspector: Object.fromEntries(PERMISSION_KEYS.map((key) => [key, false])) as Record<PermissionKey, boolean>,
  }
}

export function RolePermissions() {
  const { t } = useTranslation()
  const { enqueueSnackbar } = useSnackbar()
  const queryClient = useQueryClient()
  const profile = useAuthStore((state) => state.profile)
  const activeFactoryId = useFactoryStore((state) => state.activeFactoryId)
  const [matrix, setMatrix] = useState<PermissionMatrix>(emptyPermissionMatrix)
  const [isDirty, setIsDirty] = useState(false)
  const canEdit = profile?.role === 'admin'

  const rolePermissionsQuery = useQuery({
    queryKey: permissionQueryKeys.roles(activeFactoryId),
    queryFn: () => permissionService.getRolePermissions(activeFactoryId!),
    enabled: Boolean(activeFactoryId),
  })

  useEffect(() => {
    if (!rolePermissionsQuery.data) return
    const next = emptyPermissionMatrix()
    for (const permission of rolePermissionsQuery.data) {
      if (permission.role === 'manager' || permission.role === 'inspector') {
        next[permission.role][permission.feature_key] = permission.allowed
      }
    }
    setMatrix(next)
    setIsDirty(false)
  }, [rolePermissionsQuery.data])

  const changes = useMemo<PermissionChange[]>(
    () => (['manager', 'inspector'] as const).flatMap((role) =>
      PERMISSION_KEYS.map((feature_key) => ({
        role,
        feature_key,
        allowed: matrix[role][feature_key],
      }))
    ),
    [matrix]
  )

  const saveMutation = useMutation({
    mutationFn: () => permissionService.setRolePermissions(activeFactoryId!, changes),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: permissionQueryKeys.all })
      setIsDirty(false)
      enqueueSnackbar(t('userManagement.permissionSaveSuccess'), { variant: 'success' })
    },
    onError: () => {
      enqueueSnackbar(t('userManagement.permissionSaveError'), { variant: 'error' })
    },
  })

  const togglePermission = (role: EditableRole, featureKey: PermissionKey) => {
    if (!canEdit) return
    setMatrix((current) => ({
      ...current,
      [role]: {
        ...current[role],
        [featureKey]: !current[role][featureKey],
      },
    }))
    setIsDirty(true)
  }

  if (!activeFactoryId) {
    return <Alert severity="info">{t('userManagement.selectFactoryForPermissions')}</Alert>
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {t('userManagement.permissionTable')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('userManagement.permissionFactory', { factory: activeFactoryId })}
          </Typography>
        </Box>
        {canEdit && (
          <Button
            variant="contained"
            disabled={!isDirty || saveMutation.isPending || rolePermissionsQuery.isLoading}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? <CircularProgress size={20} color="inherit" /> : t('common.save')}
          </Button>
        )}
      </Box>

      {!canEdit && <Alert severity="info" sx={{ mb: 2 }}>{t('userManagement.permissionReadOnly')}</Alert>}
      {rolePermissionsQuery.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>{t('userManagement.permissionLoadError')}</Alert>
      )}

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>{t('userManagement.feature')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, minWidth: 150 }}>{t('userManagement.roleAdmin')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, minWidth: 150 }}>{t('userManagement.roleManager')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, minWidth: 150 }}>{t('userManagement.roleInspector')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {PERMISSION_KEYS.map((featureKey) => (
              <TableRow key={featureKey} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row">
                  <Typography variant="body2" fontWeight={500}>{t(PERMISSION_LABEL_KEYS[featureKey])}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Switch checked disabled inputProps={{ 'aria-label': `${t('userManagement.roleAdmin')} ${t(PERMISSION_LABEL_KEYS[featureKey])}` }} />
                </TableCell>
                {(['manager', 'inspector'] as const).map((role) => (
                  <TableCell key={role} align="center">
                    {rolePermissionsQuery.isLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <Switch
                        checked={matrix[role][featureKey]}
                        disabled={!canEdit || rolePermissionsQuery.isError || saveMutation.isPending}
                        onChange={() => togglePermission(role, featureKey)}
                        inputProps={{ 'aria-label': `${t(`userManagement.role${role === 'manager' ? 'Manager' : 'Inspector'}`)} ${t(PERMISSION_LABEL_KEYS[featureKey])}` }}
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Alert severity="info" sx={{ mt: 3 }}>
        {t('userManagement.permissionNote')}
      </Alert>
    </Box>
  )
}
