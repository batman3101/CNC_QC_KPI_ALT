import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  ClipboardCheck,
  Settings,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  userRole?: 'admin' | 'manager' | 'inspector'
}

interface NavItem {
  titleKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: ('admin' | 'manager' | 'inspector')[]
}

const getNavItems = (): NavItem[] => [
  {
    titleKey: 'nav.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'manager', 'inspector'],
  },
  {
    titleKey: 'nav.inspection',
    href: '/inspection',
    icon: ClipboardCheck,
    roles: ['admin', 'manager', 'inspector'],
  },
  {
    titleKey: 'nav.defects',
    href: '/defects',
    icon: AlertTriangle,
    roles: ['admin', 'manager', 'inspector'],
  },
  {
    titleKey: 'nav.analytics',
    href: '/analytics',
    icon: TrendingUp,
    roles: ['admin', 'manager'],
  },
  {
    titleKey: 'nav.reports',
    href: '/reports',
    icon: FileText,
    roles: ['admin', 'manager'],
  },
  {
    titleKey: 'nav.management',
    href: '/management',
    icon: Settings,
    roles: ['admin', 'manager'],
  },
]

export function Sidebar({ isOpen, onClose, userRole = 'inspector' }: SidebarProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const navItems = getNavItems()

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 border-r bg-background transition-transform md:sticky md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="flex h-full flex-col gap-2 p-4">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => onClose()}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{t(item.titleKey)}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
