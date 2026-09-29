/**
 * User Service - Supabase 전용
 */

import { supabase } from '@/lib/supabase'
import { paginatedFetch } from '@/lib/supabasePagination'
import type { Database } from '@/types/database'

type User = Database['public']['Tables']['users']['Row']

export interface CreateUserInput {
  email: string
  name: string
  role: 'admin' | 'manager' | 'inspector'
  password: string
  factory_id?: string
}

export interface UpdateUserInput {
  email?: string
  name?: string
  role?: 'admin' | 'manager' | 'inspector'
  password?: string
  factory_id?: string
}

async function getFunctionErrorMessage(
  error: unknown,
  fallback = '사용자 생성에 실패했습니다'
): Promise<string> {
  const context = (error as { context?: unknown } | null)?.context
  if (context instanceof Response) {
    try {
      const payload: unknown = await context.json()
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof payload.error === 'string'
      ) {
        return payload.error
      }
    } catch {
      // Fall through to the stable client-facing message.
    }
  }
  return fallback
}

/**
 * 모든 사용자 조회
 */
export async function getUsers(factoryId?: string): Promise<User[]> {
  try {
    return await paginatedFetch<User>((from, to) => {
      let query = supabase
        .from('users')
        .select('*')
        .is('deactivated_at', null)
        .order('created_at', { ascending: false })
        .range(from, to)
      if (factoryId) {
        query = query.eq('factory_id', factoryId)
      }
      return query
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

/**
 * ID로 사용자 조회
 */
export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return data
}

/**
 * 사용자 생성 (서버에서 역할·공장·기능 권한 검사)
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const { data, error } = await supabase.functions.invoke<{ user: User }>('admin-create-user', {
    body: input,
  })

  if (error || !data?.user) {
    console.error('Admin create user function error:', error?.message)
    throw new Error(await getFunctionErrorMessage(error))
  }

  return data.user
}

/**
 * 사용자 수정 (서버에서 역할·공장·기능 권한 검사)
 *
 * Goes through the Edge Function rather than updating public.users directly:
 * the login email and password live in Auth, which only the service role can
 * change for another user. Updating the table alone left a changed email out
 * of the login and silently dropped a new password.
 */
export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  const { data, error } = await supabase.functions.invoke<{ user: User }>('admin-manage-user', {
    body: { action: 'update', user_id: id, ...input },
  })

  if (error || !data?.user) {
    console.error('Admin manage user function error (update):', error?.message)
    throw new Error(await getFunctionErrorMessage(error, '사용자 수정에 실패했습니다'))
  }

  return data.user
}

/**
 * 사용자 비활성화
 *
 * Deactivates instead of deleting: inspections.user_id is ON DELETE SET NULL,
 * so a delete erased the inspector from every inspection that person recorded,
 * and it left the Auth login working. The function bans the login and marks
 * the profile, which stays so history keeps the name.
 */
export async function deactivateUser(id: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ user: User }>('admin-manage-user', {
    body: { action: 'deactivate', user_id: id },
  })

  if (error || !data?.user) {
    console.error('Admin manage user function error (deactivate):', error?.message)
    throw new Error(await getFunctionErrorMessage(error, '사용자 비활성화에 실패했습니다'))
  }
}

/**
 * 사용자 이메일 목록 조회 (중복 체크용)
 */
export async function getUserEmails(): Promise<string[]> {
  try {
    const rows = await paginatedFetch<{ email: string }>((from, to) =>
      supabase.from('users').select('email').range(from, to)
    )
    return rows.map(u => u.email)
  } catch (error) {
    console.error('Error fetching user emails:', error)
    return []
  }
}

/**
 * 역할별 사용자 수 조회
 */
export async function getUserCountsByRole(factoryId?: string): Promise<Record<string, number>> {
  try {
    const rows = await paginatedFetch<{ role: string }>((from, to) => {
      let query = supabase.from('users').select('role').is('deactivated_at', null).range(from, to)
      if (factoryId) {
        query = query.eq('factory_id', factoryId)
      }
      return query
    })
    return {
      admin: rows.filter(u => u.role === 'admin').length,
      manager: rows.filter(u => u.role === 'manager').length,
      inspector: rows.filter(u => u.role === 'inspector').length,
      total: rows.length,
    }
  } catch (error) {
    console.error('Error fetching user counts:', error)
    return { admin: 0, manager: 0, inspector: 0, total: 0 }
  }
}
