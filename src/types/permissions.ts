export const PERMISSION_KEYS = [
  'dashboard',
  'inspection',
  'defects',
  'analytics',
  'spc',
  'reports',
  'aiInsights',
  'management',
  'userManagement',
] as const

export type PermissionKey = (typeof PERMISSION_KEYS)[number]

export const PERMISSION_ROUTES: Record<PermissionKey, string> = {
  dashboard: '/dashboard',
  inspection: '/inspection',
  defects: '/defects',
  analytics: '/analytics',
  spc: '/spc',
  reports: '/reports',
  aiInsights: '/ai-insights',
  management: '/management',
  userManagement: '/users',
}

export const PERMISSION_LABEL_KEYS: Record<PermissionKey, string> = {
  dashboard: 'nav.dashboard',
  inspection: 'nav.inspection',
  defects: 'nav.defects',
  analytics: 'nav.analytics',
  spc: 'nav.spc',
  reports: 'nav.reports',
  aiInsights: 'nav.aiInsights',
  management: 'nav.management',
  userManagement: 'nav.userManagement',
}
