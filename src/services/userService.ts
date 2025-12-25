/**
 * User Service - Supabase 전용
 */

import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type User = Database['public']['Tables']['users']['Row']

export interface CreateUserInput {
  email: string
  name: string
  role: 'admin' | 'manager' | 'inspector'
  password: string
}

export interface UpdateUserInput {
  email?: string
  name?: string
  role?: 'admin' | 'manager' | 'inspector'
  password?: string
}

/**
 * 모든 사용자 조회
 */
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    throw error
  }

  return data || []
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
 * 사용자 생성 (Supabase Auth 사용)
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  // 이메일 중복 체크
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', input.email)
    .single()

  if (existingUser) {
    throw new Error('이미 사용 중인 이메일입니다')
  }

  // Supabase Auth를 통해 사용자 생성
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        name: input.name,
        role: input.role,
      },
    },
  })

  if (authError) {
    console.error('Auth error:', authError)
    throw new Error('사용자 생성에 실패했습니다: ' + authError.message)
  }

  if (!authData.user) {
    throw new Error('사용자 생성에 실패했습니다')
  }

  // users 테이블에 추가 정보 저장
  const { data: userData, error: userError } = await supabase
    .from('users')
    .update({
      name: input.name,
      role: input.role,
    })
    .eq('id', authData.user.id)
    .select()
    .single()

  if (userError) {
    console.error('User table update error:', userError)
    // Auth 사용자는 생성되었으므로 기본 정보 반환
    return {
      id: authData.user.id,
      email: input.email,
      name: input.name,
      role: input.role,
      created_at: new Date().toISOString(),
    }
  }

  return userData
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
  const { data, error } = await supabase
    .from('users')
    .select('email')

  if (error) {
    console.error('Error fetching user emails:', error)
    return []
  }

  return data?.map(u => u.email) || []
}

/**
 * 역할별 사용자 수 조회
 */
export async function getUserCountsByRole(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('users')
    .select('role')

  if (error) {
    console.error('Error fetching user counts:', error)
    return { admin: 0, manager: 0, inspector: 0, total: 0 }
  }

  const users = data || []
  return {
    admin: users.filter(u => u.role === 'admin').length,
    manager: users.filter(u => u.role === 'manager').length,
    inspector: users.filter(u => u.role === 'inspector').length,
    total: users.length,
  }
}
