/**
 * Offline Status Indicator Component
 * Shows network status and pending sync count
 */

import { useTranslation } from 'react-i18next'
import { Chip, Badge, Tooltip, CircularProgress, Box } from '@mui/material'
import { WifiOff, CloudSync, CloudDone } from '@mui/icons-material'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export function OfflineIndicator() {
  const { t } = useTranslation()
  const { isOnline, pendingCount, isSyncing, sync } = useNetworkStatus()

  if (isSyncing) {
    return (
      <Tooltip title={t('pwa.syncPending')}>
        <Chip
          icon={<CircularProgress size={16} color="inherit" />}
          label={pendingCount}
          color="info"
          size="small"
          sx={{ cursor: 'pointer' }}
        />
      </Tooltip>
    )
  }

  if (!isOnline) {
    return (
      <Tooltip title={t('pwa.offline')}>
        <Badge badgeContent={pendingCount} color="warning" max={99}>
          <Chip
            icon={<WifiOff />}
            label={t('pwa.offline')}
            color="error"
            size="small"
          />
        </Badge>
      </Tooltip>
    )
  }

  if (pendingCount > 0) {
    return (
      <Tooltip title={`${pendingCount} ${t('pwa.syncPending')}`}>
        <Chip
          icon={<CloudSync />}
          label={pendingCount}
          color="warning"
          size="small"
          onClick={sync}
          sx={{ cursor: 'pointer' }}
        />
      </Tooltip>
    )
  }

  return (
    <Tooltip title={t('pwa.online')}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CloudDone fontSize="small" color="success" sx={{ opacity: 0.7 }} />
      </Box>
    </Tooltip>
  )
}
