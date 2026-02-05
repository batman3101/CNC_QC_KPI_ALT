/**
 * SPC Alert Badge 컴포넌트
 * 헤더에 미조치 알림 수를 뱃지로 표시
 */

import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'
import { getOpenAlertsCount } from '@/services/spcService'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface SPCAlertBadgeProps {
  className?: string
  showIcon?: boolean
  onClick?: () => void
}

export function SPCAlertBadge({
  className,
  showIcon = false,
  onClick,
}: SPCAlertBadgeProps) {
  const { profile } = useAuthStore()
  const factoryId = profile?.factory_id

  const { data: alertCounts } = useQuery({
    queryKey: ['spc-open-alerts-count', factoryId],
    queryFn: () => getOpenAlertsCount(factoryId || undefined),
    refetchInterval: 60000, // 1분마다 새로고침
    enabled: !!profile && ['admin', 'manager'].includes(profile.role),
  })

  const totalAlerts = alertCounts?.total ?? 0
  const criticalAlerts = alertCounts?.critical ?? 0

  if (totalAlerts === 0) {
    return null
  }

  const hasCritical = criticalAlerts > 0

  return (
    <div
      className={cn(
        'relative inline-flex items-center',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {showIcon && (
        <Bell
          className={cn(
            'h-5 w-5',
            hasCritical ? 'text-red-500' : 'text-yellow-500'
          )}
        />
      )}
      <Badge
        variant={hasCritical ? 'destructive' : 'secondary'}
        className={cn(
          'min-w-[20px] justify-center text-xs',
          showIcon && 'absolute -right-2 -top-2 px-1.5',
          hasCritical && 'animate-pulse'
        )}
      >
        {totalAlerts > 99 ? '99+' : totalAlerts}
      </Badge>
    </div>
  )
}
