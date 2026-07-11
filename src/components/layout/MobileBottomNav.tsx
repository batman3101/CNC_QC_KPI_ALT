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
  QueryStats,
} from '@mui/icons-material'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { usePermissions } from '@/hooks/usePermissions'
import type { PermissionKey } from '@/types/permissions'

interface MobileNavItem {
  path: string
  icon: typeof Dashboard
  labelKey: string
  permission: PermissionKey
}

const mobileNavItems: MobileNavItem[] = [
  { path: '/dashboard', icon: Dashboard, labelKey: 'nav.dashboard', permission: 'dashboard' },
  { path: '/inspection', icon: Assignment, labelKey: 'nav.inspection', permission: 'inspection' },
  { path: '/defects', icon: Warning, labelKey: 'nav.defects', permission: 'defects' },
  { path: '/ai-insights', icon: AutoAwesome, labelKey: 'nav.aiInsights', permission: 'aiInsights' },
]

const hiddenNavItems: MobileNavItem[] = [
  { path: '/analytics', icon: TrendingUp, labelKey: 'nav.analytics', permission: 'analytics' },
  { path: '/spc', icon: QueryStats, labelKey: 'nav.spc', permission: 'spc' },
  { path: '/reports', icon: Description, labelKey: 'nav.reports', permission: 'reports' },
  { path: '/management', icon: Settings, labelKey: 'nav.management', permission: 'management' },
  { path: '/users', icon: People, labelKey: 'nav.userManagement', permission: 'userManagement' },
]

export function MobileBottomNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { pendingCount } = useNetworkStatus()
  const { hasPermission } = usePermissions()
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (!isMobile) return null

  const visibleMobileItems = mobileNavItems.filter((item) => hasPermission(item.permission))
  const visibleHiddenItems = hiddenNavItems.filter((item) => hasPermission(item.permission))

  // Check if current path is in mobile nav items
  const mobileNavMatch = visibleMobileItems.find((item) =>
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
          {visibleMobileItems.map((item) => (
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
