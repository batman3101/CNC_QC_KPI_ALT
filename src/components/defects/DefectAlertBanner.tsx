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

export function DefectAlertBanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  // Fetch defects to count pending ones
  const { data: defects = [] } = useQuery({
    queryKey: ['defects'],
    queryFn: () => inspectionService.getDefects(),
    refetchInterval: 30000, // 30초마다 자동 갱신
  })

  // Count pending defects
  const pendingCount = defects.filter((d) => d.status === 'pending').length

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
