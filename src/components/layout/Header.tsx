import { AppBar, Toolbar, IconButton, Typography, Menu, MenuItem, Box, ListItemIcon, ListItemText, Divider } from '@mui/material'
import { Menu as MenuIcon, Person, Logout, Language, Brightness4, Brightness7 } from '@mui/icons-material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useThemeMode } from '@/contexts/ThemeContext'

interface HeaderProps {
  onMenuClick: () => void
  userName?: string
  userRole?: string
}

export function Header({ onMenuClick, userName, userRole }: HeaderProps) {
  const { t, i18n } = useTranslation()
  const { signOut } = useAuth()
  const { mode, toggleTheme } = useThemeMode()
  const [languageAnchorEl, setLanguageAnchorEl] = useState<null | HTMLElement>(null)
  const [userAnchorEl, setUserAnchorEl] = useState<null | HTMLElement>(null)

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    setLanguageAnchorEl(null)
  }

  const currentLanguage = i18n.language === 'vi' ? 'Tiếng Việt' : '한국어'

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
      <Toolbar sx={{ minHeight: 64 }}>
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
            }}
          >
            CNC QC KPI
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Theme Toggle */}
          <IconButton onClick={toggleTheme} color="inherit">
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          {/* Language Switcher */}
          <IconButton
            color="inherit"
            onClick={(e) => setLanguageAnchorEl(e.currentTarget)}
          >
            <Language />
            <Typography variant="body2" sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
              {currentLanguage}
            </Typography>
          </IconButton>
          <Menu
            anchorEl={languageAnchorEl}
            open={Boolean(languageAnchorEl)}
            onClose={() => setLanguageAnchorEl(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => changeLanguage('ko')}>
              한국어 (Korean)
            </MenuItem>
            <MenuItem onClick={() => changeLanguage('vi')}>
              Tiếng Việt (Vietnamese)
            </MenuItem>
          </Menu>

          {/* User Menu */}
          <IconButton
            color="inherit"
            onClick={(e) => setUserAnchorEl(e.currentTarget)}
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
