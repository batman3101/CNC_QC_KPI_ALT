/**
 * PWA Install Prompt Component
 * Shows a prompt to install the app when available
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Snackbar,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material'
import { Close, GetApp } from '@mui/icons-material'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show prompt after a short delay
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
    setShowPrompt(false)
  }

  const handleClose = () => {
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <Snackbar
      open={showPrompt}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ mb: { xs: 8, md: 2 } }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3,
          maxWidth: 400,
        }}
      >
        <GetApp color="primary" />
        <Typography variant="body2" sx={{ flex: 1 }}>
          {t('pwa.installPrompt')}
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={handleInstall}
        >
          {t('pwa.install')}
        </Button>
        <IconButton size="small" onClick={handleClose}>
          <Close fontSize="small" />
        </IconButton>
      </Box>
    </Snackbar>
  )
}
