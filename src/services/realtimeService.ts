/**
 * Supabase Realtime Service
 * 실시간 데이터 변경 구독 및 TanStack Query 캐시 무효화
 */

import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { QueryClient } from '@tanstack/react-query'

let realtimeChannel: RealtimeChannel | null = null

/**
 * Realtime 구독 시작
 * 검사 실적, 불량 등 주요 테이블의 변경사항을 구독
 */
export function subscribeToRealtime(queryClient: QueryClient, _factoryId?: string | null) {
  // Note: _factoryId는 향후 공장별 필터링 구현 시 사용 예정
  void _factoryId
  // 기존 구독이 있으면 해제
  if (realtimeChannel) {
    realtimeChannel.unsubscribe()
  }

  // 새 채널 생성
  realtimeChannel = supabase
    .channel('db-changes')
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
        // 관련 쿼리 캐시 무효화
        queryClient.invalidateQueries({ queryKey: ['inspections'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        queryClient.invalidateQueries({ queryKey: ['monitor-inspections'] })
        queryClient.invalidateQueries({ queryKey: ['spc-pchart'] })
        queryClient.invalidateQueries({ queryKey: ['spc-kpi-summary'] })
        queryClient.invalidateQueries({ queryKey: ['spc-model-summary'] })
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
        queryClient.invalidateQueries({ queryKey: ['inspections'] })
        queryClient.invalidateQueries({ queryKey: ['inspection-results'] })
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
        queryClient.invalidateQueries({ queryKey: ['defects'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        queryClient.invalidateQueries({ queryKey: ['monitor-defects'] })
        queryClient.invalidateQueries({ queryKey: ['spc-alerts'] })
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
        queryClient.invalidateQueries({ queryKey: ['spc-alerts'] })
        queryClient.invalidateQueries({ queryKey: ['spc-kpi-summary'] })
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
        queryClient.invalidateQueries({ queryKey: ['users'] })
        queryClient.invalidateQueries({ queryKey: ['inspectors'] })
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
