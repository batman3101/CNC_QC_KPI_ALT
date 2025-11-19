import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  userName?: string
  userRole?: 'admin' | 'manager' | 'inspector'
}

export function Layout({ userName, userRole }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative min-h-screen">
      <Header
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        userName={userName}
        userRole={userRole}
      />
      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userRole={userRole}
        />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
