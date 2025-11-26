import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Toolbar } from '@mui/material'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

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
          p: 3,
          width: { md: 'calc(100% - 256px)' },
        }}
      >
        <Toolbar /> {/* This pushes content below AppBar */}
        <Outlet />
      </Box>
    </Box>
  )
}
