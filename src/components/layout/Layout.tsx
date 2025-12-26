import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Toolbar } from '@mui/material'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'

interface LayoutProps {
  userName?: string
  userRole?: 'admin' | 'manager' | 'inspector'
}

export function Layout({ userName, userRole }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        userName={userName}
        userRole={userRole}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={userRole}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 }, // Responsive padding
          width: { md: 'calc(100% - 256px)' },
          pb: { xs: 10, md: 3 }, // Extra bottom padding for mobile nav
        }}
      >
        <Toolbar /> {/* This pushes content below AppBar */}
        <Outlet />
      </Box>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </Box>
  )
}
