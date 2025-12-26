/**
 * Mobile Bottom Navigation Component
 * Shows bottom navigation bar on mobile devices
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useTheme,
  useMediaQuery,
  Badge,
} from '@mui/material'
import {
  Dashboard,
  Assignment,
  Warning,
  AutoAwesome,
} from '@mui/icons-material'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

const mobileNavItems = [
  { path: '/dashboard', icon: Dashboard, labelKey: 'nav.dashboard' },
  { path: '/inspection', icon: Assignment, labelKey: 'nav.inspection' },
  { path: '/defects', icon: Warning, labelKey: 'nav.defects' },
  { path: '/ai-insights', icon: AutoAwesome, labelKey: 'nav.aiInsights' },
]

export function MobileBottomNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { pendingCount } = useNetworkStatus()

  if (!isMobile) return null

  const currentPath = mobileNavItems.find((item) =>
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  )?.path || false

  return (
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
        onChange={(_, newValue) => navigate(newValue)}
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
      </BottomNavigation>
    </Paper>
  )
}
