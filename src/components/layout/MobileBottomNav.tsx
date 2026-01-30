/**
 * Mobile Bottom Navigation Component
 * Shows bottom navigation bar on mobile devices
 */

import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
  useMediaQuery,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  Dashboard,
  Assignment,
  Warning,
  AutoAwesome,
  MoreHoriz,
  TrendingUp,
  Description,
  Settings,
  People,
} from '@mui/icons-material'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useAuthStore } from '@/stores/authStore'

const mobileNavItems = [
  { path: '/dashboard', icon: Dashboard, labelKey: 'nav.dashboard' },
  { path: '/inspection', icon: Assignment, labelKey: 'nav.inspection' },
  { path: '/defects', icon: Warning, labelKey: 'nav.defects' },
  { path: '/ai-insights', icon: AutoAwesome, labelKey: 'nav.aiInsights' },
]

const hiddenNavItems = [
  { path: '/analytics', icon: TrendingUp, labelKey: 'nav.analytics', roles: ['admin', 'manager'] },
  { path: '/reports', icon: Description, labelKey: 'nav.reports', roles: ['admin', 'manager'] },
  { path: '/management', icon: Settings, labelKey: 'nav.management', roles: ['admin', 'manager'] },
  { path: '/users', icon: People, labelKey: 'nav.userManagement', roles: ['admin', 'manager'] },
]

export function MobileBottomNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { pendingCount } = useNetworkStatus()
  const { profile } = useAuthStore()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (!isMobile) return null

  const userRole = profile?.role || 'inspector'
  const visibleHiddenItems = hiddenNavItems.filter(item => item.roles.includes(userRole))

  // Check if current path is in mobile nav items
  const mobileNavMatch = mobileNavItems.find((item) =>
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  )

  // Check if current path is in hidden nav items
  const hiddenNavMatch = visibleHiddenItems.find((item) =>
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  )

  const currentPath = mobileNavMatch?.path || (hiddenNavMatch ? 'more' : false)

  const handleNavigationChange = (_: unknown, newValue: string) => {
    if (newValue === 'more') {
      setDrawerOpen(true)
    } else {
      navigate(newValue)
    }
  }

  const handleDrawerItemClick = (path: string) => {
    navigate(path)
    setDrawerOpen(false)
  }

  return (
    <>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar + 1,
          borderTop: 1,
          borderColor: 'divider',
          // Safe area inset for iOS
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        elevation={3}
      >
        <BottomNavigation
          value={currentPath}
          onChange={handleNavigationChange}
          showLabels
          sx={{
            height: 64,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              padding: '6px 12px',
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              '&.Mui-selected': {
                fontSize: '0.75rem',
              },
            },
          }}
        >
          {mobileNavItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              value={item.path}
              label={t(item.labelKey)}
              icon={
                item.path === '/inspection' && pendingCount > 0 ? (
                  <Badge badgeContent={pendingCount} color="warning" max={99}>
                    <item.icon />
                  </Badge>
                ) : (
                  <item.icon />
                )
              }
            />
          ))}
          {visibleHiddenItems.length > 0 && (
            <BottomNavigationAction
              value="more"
              label={t('nav.viewAll')}
              icon={<MoreHoriz />}
            />
          )}
        </BottomNavigation>
      </Paper>

      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingBottom: 'env(safe-area-inset-bottom)',
          },
        }}
      >
        <List sx={{ padding: 2 }}>
          {visibleHiddenItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleDrawerItemClick(item.path)}
                  selected={isActive}
                  sx={{
                    borderRadius: 1,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                      },
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.contrastText,
                      },
                    },
                  }}
                >
                  <ListItemIcon>
                    <item.icon />
                  </ListItemIcon>
                  <ListItemText primary={t(item.labelKey)} />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Drawer>
    </>
  )
}
