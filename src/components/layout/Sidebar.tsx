import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, useTheme, useMediaQuery, Toolbar } from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  userRole?: 'admin' | 'manager' | 'inspector'
}

interface NavItem {
  titleKey: string
  href: string
  icon: React.ComponentType
  roles: ('admin' | 'manager' | 'inspector')[]
}

const getNavItems = (): NavItem[] => [
  {
    titleKey: 'nav.dashboard',
    href: '/dashboard',
    icon: DashboardIcon,
    roles: ['admin', 'manager', 'inspector'],
  },
  {
    titleKey: 'nav.inspection',
    href: '/inspection',
    icon: AssignmentIcon,
    roles: ['admin', 'manager', 'inspector'],
  },
  {
    titleKey: 'nav.defects',
    href: '/defects',
    icon: WarningIcon,
    roles: ['admin', 'manager', 'inspector'],
  },
  {
    titleKey: 'nav.analytics',
    href: '/analytics',
    icon: TrendingUpIcon,
    roles: ['admin', 'manager'],
  },
  {
    titleKey: 'nav.reports',
    href: '/reports',
    icon: DescriptionIcon,
    roles: ['admin', 'manager'],
  },
  {
    titleKey: 'nav.management',
    href: '/management',
    icon: SettingsIcon,
    roles: ['admin', 'manager'],
  },
]

const drawerWidth = 256

export function Sidebar({ isOpen, onClose, userRole = 'inspector' }: SidebarProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))
  const navItems = getNavItems()

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  )

  const drawerContent = (
    <Box>
      <Toolbar /> {/* This pushes content below AppBar */}
      <List sx={{ px: 2 }}>
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href

          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 1, px: 1 }}>
              <ListItemButton
                component={Link}
                to={item.href}
                onClick={() => !isMdUp && onClose()}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  px: 2,
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.16)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    color: 'text.primary',
                    '& .MuiListItemIcon-root': {
                      color: 'text.primary',
                    },
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: 36,
                    color: isActive ? 'primary.main' : 'text.secondary',
                    transition: 'color 0.2s',
                    fontSize: '1.25rem',
                  }}
                >
                  <Icon />
                </ListItemIcon>
                <ListItemText 
                  primary={t(item.titleKey)} 
                  primaryTypographyProps={{ 
                    variant: 'body2', 
                    fontWeight: isActive ? 600 : 500 
                  }} 
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
    </Box>
  )

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={isOpen}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  )
}
