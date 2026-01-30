import { AppBar, Toolbar, IconButton, Typography, Menu, MenuItem, Box, ListItemIcon, ListItemText, Divider, Button, Badge, Tooltip, useMediaQuery, useTheme } from '@mui/material'
import { Menu as MenuIcon, Person, Logout, Brightness4, Brightness7, NotificationsOutlined, Factory as FactoryIcon } from '@mui/icons-material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useThemeMode } from '@/contexts/ThemeContext'
import { OfflineIndicator } from '@/components/pwa'
import * as inspectionService from '@/services/inspectionService'
import { useFactoryStore } from '@/stores/factoryStore'
import { useAuthStore } from '@/stores/authStore'

interface HeaderProps {
  onMenuClick: () => void
  userName?: string
  userRole?: string
}

export function Header({ onMenuClick, userName, userRole }: HeaderProps) {
  const { t, i18n } = useTranslation()
  const { signOut } = useAuth()
  const { mode, toggleTheme } = useThemeMode()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [userAnchorEl, setUserAnchorEl] = useState<null | HTMLElement>(null)
  const { activeFactoryId, setActiveFactory } = useFactoryStore()
  const { profile } = useAuthStore()
  const isAdmin = profile?.role === 'admin'

  const toggleFactory = () => {
    if (!isAdmin) return
    const next = activeFactoryId === 'ALT' ? 'ALV' : 'ALT'
    setActiveFactory(next)
  }

  // Fetch pending defect count for notification badge
  const { data: defects = [] } = useQuery({
    queryKey: ['defects', activeFactoryId],
    queryFn: () => inspectionService.getDefects({ factoryId: activeFactoryId || undefined }),
    refetchInterval: 30000, // 30초마다 자동 갱신
  })

  const pendingDefectCount = defects.filter((d) => d.status === 'pending').length

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ko' ? 'vi' : 'ko'
    i18n.changeLanguage(newLang)
  }

  const currentLanguageShort = i18n.language === 'vi' ? 'VI' : 'KO'

  const handleUserMenuClose = () => {
    setUserAnchorEl(null)
  }

  const handleSignOut = () => {
    handleUserMenuClose()
    signOut()
  }

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, md: 64 } }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            component="img"
            src="/A symbol BLUE-02.png"
            sx={{ width: 32, height: 32, display: { xs: 'none', sm: 'block' } }}
            alt="Logo"
          />
          <Typography
            variant="h6"
            component="a"
            href="/"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              textDecoration: 'none',
              letterSpacing: '-0.025em',
              fontSize: '1.25rem',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            CNC QC KPI
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, alignItems: 'center' }}>
          {/* Factory Toggle */}
          {activeFactoryId && (
            <Tooltip title={isAdmin ? t('factory.select') : t('factory.current')}>
              <span>
                <Button
                  onClick={toggleFactory}
                  disabled={!isAdmin}
                  variant="outlined"
                  size="small"
                  startIcon={isMobile ? undefined : <FactoryIcon />}
                  sx={{
                    minWidth: isMobile ? 44 : 'auto',
                    minHeight: 44,
                    px: isMobile ? 0.75 : 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontWeight: 600,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    textTransform: 'none',
                    color: mode === 'dark' ? 'white' : 'black',
                    borderColor: mode === 'dark' ? 'white' : 'black',
                    '&:hover': {
                      borderColor: mode === 'dark' ? 'white' : 'black',
                      backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    },
                    '&.Mui-disabled': {
                      color: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                      borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                    },
                  }}
                >
                  {activeFactoryId}
                </Button>
              </span>
            </Tooltip>
          )}

          {/* Defect Notification Bell */}
          <Tooltip title={pendingDefectCount > 0 ? t('defects.alert.pendingCount', { count: pendingDefectCount }) : t('defects.noPending')}>
            <IconButton
              color="inherit"
              onClick={() => navigate('/defects')}
              sx={{ minWidth: 44, minHeight: 44 }}
            >
              <Badge
                badgeContent={pendingDefectCount}
                color="error"
                max={99}
              >
                <NotificationsOutlined />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Offline Indicator */}
          <OfflineIndicator />

          {/* Theme Toggle */}
          <IconButton onClick={toggleTheme} color="inherit" sx={{ minWidth: 44, minHeight: 44 }}>
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          {/* Language Toggle */}
          <Button
            onClick={toggleLanguage}
            variant="outlined"
            size="small"
            sx={{
              minWidth: isMobile ? 44 : 'auto',
              minHeight: 44,
              px: isMobile ? 0.75 : 1.5,
              py: 0.5,
              borderRadius: 1,
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              textTransform: 'none',
              color: mode === 'dark' ? 'white' : 'black',
              borderColor: mode === 'dark' ? 'white' : 'black',
              '&:hover': {
                borderColor: mode === 'dark' ? 'white' : 'black',
                backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              },
            }}
          >
            {currentLanguageShort}
          </Button>

          {/* User Menu */}
          <IconButton
            color="inherit"
            onClick={(e) => setUserAnchorEl(e.currentTarget)}
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            <Person />
          </IconButton>
          <Menu
            anchorEl={userAnchorEl}
            open={Boolean(userAnchorEl)}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: { minWidth: 200 },
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                {userName || t('auth.login')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {userRole || 'Inspector'}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleSignOut} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <Logout fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>{t('auth.logout')}</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
