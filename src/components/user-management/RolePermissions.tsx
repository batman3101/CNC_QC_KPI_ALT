import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material'
import { Check, Close } from '@mui/icons-material'

interface Permission {
  feature: string
  featureKey: string
  admin: boolean
  manager: boolean
  inspector: boolean
}

export function RolePermissions() {
  const { t } = useTranslation()

  // 역할별 권한 정의 (하드코딩된 시스템 권한 기반)
  const permissions: Permission[] = useMemo(
    () => [
      {
        feature: t('nav.dashboard'),
        featureKey: 'dashboard',
        admin: true,
        manager: true,
        inspector: true,
      },
      {
        feature: t('nav.inspection'),
        featureKey: 'inspection',
        admin: true,
        manager: true,
        inspector: true,
      },
      {
        feature: t('nav.defects'),
        featureKey: 'defects',
        admin: true,
        manager: true,
        inspector: true,
      },
      {
        feature: t('nav.analytics'),
        featureKey: 'analytics',
        admin: true,
        manager: true,
        inspector: false,
      },
      {
        feature: t('nav.spc'),
        featureKey: 'spc',
        admin: true,
        manager: true,
        inspector: false,
      },
      {
        feature: t('nav.reports'),
        featureKey: 'reports',
        admin: true,
        manager: true,
        inspector: false,
      },
      {
        feature: t('nav.management'),
        featureKey: 'management',
        admin: true,
        manager: true,
        inspector: false,
      },
      {
        feature: t('nav.userManagement'),
        featureKey: 'userManagement',
        admin: true,
        manager: true,
        inspector: false,
      },
    ],
    [t]
  )

  const renderAccessChip = (hasAccess: boolean) => (
    <Chip
      icon={hasAccess ? <Check fontSize="small" /> : <Close fontSize="small" />}
      label={hasAccess ? t('userManagement.hasAccess') : t('userManagement.noAccess')}
      color={hasAccess ? 'success' : 'default'}
      size="small"
      variant={hasAccess ? 'filled' : 'outlined'}
    />
  )

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {t('userManagement.permissionTable')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('userManagement.description')}
        </Typography>
      </Box>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>
                {t('userManagement.feature')}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, minWidth: 150 }}>
                {t('userManagement.roleAdmin')}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, minWidth: 150 }}>
                {t('userManagement.roleManager')}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, minWidth: 150 }}>
                {t('userManagement.roleInspector')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {permissions.map((permission) => (
              <TableRow
                key={permission.featureKey}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Typography variant="body2" fontWeight={500}>
                    {permission.feature}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {renderAccessChip(permission.admin)}
                </TableCell>
                <TableCell align="center">
                  {renderAccessChip(permission.manager)}
                </TableCell>
                <TableCell align="center">
                  {renderAccessChip(permission.inspector)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          * {t('userManagement.permissionNote') || '현재 시스템은 하드코딩된 역할 기반 권한을 사용합니다. 권한 수정이 필요한 경우 시스템 관리자에게 문의하세요.'}
        </Typography>
      </Box>
    </Box>
  )
}
