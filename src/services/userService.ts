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

async function getFunctionErrorMessage(error: unknown): Promise<string> {
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
  return '사용자 생성에 실패했습니다'
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
 * 사용자 생성 (관리자 전용 Edge Function)
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
 * 사용자 수정
 */
export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  // 이메일 중복 체크 (자기 자신 제외)
  if (input.email) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', input.email)
      .neq('id', id)
      .single()

    if (existingUser) {
      throw new Error('이미 사용 중인 이메일입니다')
    }
  }

  const updateData: Partial<User> = {}
  if (input.email) updateData.email = input.email
  if (input.name) updateData.name = input.name
  if (input.role) updateData.role = input.role
  if (input.factory_id !== undefined) updateData.factory_id = input.factory_id

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating user:', error)
    throw new Error('사용자 수정에 실패했습니다')
  }

  return data
}

/**
 * 사용자 삭제
 */
export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting user:', error)
    throw new Error('사용자 삭제에 실패했습니다')
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
      let query = supabase.from('users').select('role').range(from, to)
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
