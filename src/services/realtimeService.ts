/**
 * Supabase Realtime Service
 * 실시간 데이터 변경 구독 및 TanStack Query 캐시 무효화
 */

import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { QueryClient } from '@tanstack/react-query'
import { permissionQueryKeys } from './permissionService'

let realtimeChannel: RealtimeChannel | null = null
let channelSeq = 0

/**
 * Query keys a change to each table invalidates.
 *
 * TanStack matches query keys element by element, not by string prefix: an
 * invalidation of `['dashboard']` does NOT match a query keyed
 * `['dashboard-today-stats', factoryId]`. The lists below therefore have to
 * name the exact first segment each query actually uses. They previously named
 * keys no query has ever used (`dashboard`, `monitor-inspections`,
 * `inspections`, `inspection-results`, `spc-all-cpk-data`), so realtime events
 * arrived and invalidated nothing - the dashboard and the monitor board went
 * stale until their own staleTime expired.
 */
const INSPECTION_KEYS = [
  'dashboard-today-stats',
  'dashboard-inspections',
  'public-monitor-data',
  'spc-pchart',
  'spc-model-defect-rates',
  'spc-defect-pareto',
  'kpi-summary',
  'defect-trend',
  'model-distribution',
  'machine-performance',
  'hourly-distribution',
  'inspector-performance',
  'ai-snapshot',
  'ai-machine-performance',
  'report-summary',
] as const

const INSPECTION_RESULT_KEYS = ['spc-defect-pareto'] as const

const DEFECT_KEYS = [
  'defects',
  'defect-stats',
  'defect-pending-count',
  'dashboard-defects',
  'public-monitor-data',
  'defect-types-analytics',
  'ai-defect-types',
  'ai-unresolved-defects',
  'report-summary',
] as const

const SPC_ALERT_KEYS = [
  'spc-alerts',
  'spc-alerts-all',
  'spc-open-alerts-count',
] as const

const USER_KEYS = ['users', 'user-emails', 'inspector-list'] as const

function invalidate(queryClient: QueryClient, keys: readonly string[]) {
  for (const key of keys) {
    queryClient.invalidateQueries({ queryKey: [key] })
  }
}

/**
 * Realtime 구독 시작
 * 검사 실적, 불량 등 주요 테이블의 변경사항을 구독
 */
export function subscribeToRealtime(queryClient: QueryClient, _factoryId?: string | null) {
  // Note: _factoryId는 향후 공장별 필터링 구현 시 사용 예정
  void _factoryId

  // 기존 구독이 있으면 해제.
  // removeChannel() resolves asynchronously, so the new channel is given a fresh
  // topic: reusing 'db-changes' let the in-flight teardown of the old channel
  // tear down the new one, after which no events arrived at all.
  if (realtimeChannel) {
    void supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }

  channelSeq += 1

  // 새 채널 생성
  realtimeChannel = supabase
    .channel(`db-changes-${channelSeq}`)
    // 검사 실적 (inspections) 테이블 구독
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'inspections',
      },
      (payload) => {
        console.log('[Realtime] inspections changed:', payload.eventType)
        invalidate(queryClient, INSPECTION_KEYS)
      }
    )
    // 검사 결과 (inspection_results) 테이블 구독
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'inspection_results',
      },
      (payload) => {
        console.log('[Realtime] inspection_results changed:', payload.eventType)
        invalidate(queryClient, INSPECTION_RESULT_KEYS)
      }
    )
    // 불량 (defects) 테이블 구독
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'defects',
      },
      (payload) => {
        console.log('[Realtime] defects changed:', payload.eventType)
        // Defect counts live in separate count-only queries and are not
        // refreshed by invalidating the list.
        invalidate(queryClient, DEFECT_KEYS)
      }
    )
    // SPC 알림 (spc_alerts) 테이블 구독
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'spc_alerts',
      },
      (payload) => {
        console.log('[Realtime] spc_alerts changed:', payload.eventType)
        invalidate(queryClient, SPC_ALERT_KEYS)
      }
    )
    // 사용자 (users) 테이블 구독
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users',
      },
      (payload) => {
        console.log('[Realtime] users changed:', payload.eventType)
        invalidate(queryClient, USER_KEYS)
      }
    )
    // 설비 (machines) 테이블 구독
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'machines',
      },
      (payload) => {
        console.log('[Realtime] machines changed:', payload.eventType)
        queryClient.invalidateQueries({ queryKey: ['machines'] })
      }
    )
    // 제품 모델 (product_models) 테이블 구독
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'product_models',
      },
      (payload) => {
        console.log('[Realtime] product_models changed:', payload.eventType)
        queryClient.invalidateQueries({ queryKey: ['product-models'] })
        queryClient.invalidateQueries({ queryKey: ['spc-product-models'] })
      }
    )
    // 역할별 기능 권한 변경
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'role_feature_permissions',
      },
      () => {
        queryClient.invalidateQueries({ queryKey: permissionQueryKeys.all })
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Successfully subscribed to database changes')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Failed to subscribe to database changes')
      }
    })

  return realtimeChannel
}

/**
 * Realtime 구독 해제
 */
export function unsubscribeFromRealtime() {
  if (realtimeChannel) {
    realtimeChannel.unsubscribe()
    realtimeChannel = null
    console.log('[Realtime] Unsubscribed from database changes')
  }
}

/**
 * 현재 구독 상태 확인
 */
export function isRealtimeSubscribed(): boolean {
  return realtimeChannel !== null
}
