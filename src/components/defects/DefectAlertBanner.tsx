import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  IconButton,
} from '@mui/material'
import {
  Warning as WarningIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import * as inspectionService from '@/services/inspectionService'
import { useFactoryStore } from '@/stores/factoryStore'

export function DefectAlertBanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)
  const { activeFactoryId } = useFactoryStore()

  // Counted in the database, and scoped to the active factory so the number
  // matches the /defects list this banner links to. It previously pulled every
  // defect row and counted them client-side, unscoped — which for an admin
  // mixed both factories into a count that the linked page would not agree with.
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['defect-pending-count', activeFactoryId],
    queryFn: () => inspectionService.getPendingDefectCount(activeFactoryId || undefined),
    refetchInterval: 30000, // 30초마다 자동 갱신
  })

  // Don't show if no pending defects or dismissed
  if (pendingCount === 0 || dismissed) {
    return null
  }

  return (
    <Collapse in={pendingCount > 0 && !dismissed}>
      <Alert
        severity="warning"
        icon={<WarningIcon />}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate('/defects')}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {t('defects.alert.viewDetails')}
            </Button>
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setDismissed(true)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </Box>
        }
        sx={{
          mb: 2,
          '& .MuiAlert-message': {
            display: 'flex',
            alignItems: 'center',
            width: '100%',
          },
        }}
      >
        <AlertTitle sx={{ mb: 0, fontWeight: 600 }}>
          {t('defects.alert.pendingCount', { count: pendingCount })}
        </AlertTitle>
        <Box component="span" sx={{ ml: 1, color: 'warning.dark' }}>
          {t('defects.alert.pendingWarning')}
        </Box>
      </Alert>
    </Collapse>
  )
}
