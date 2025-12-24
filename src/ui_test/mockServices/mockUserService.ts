/**
 * Mock User Service for User Management
 *
 * 사용자 관리 페이지를 위한 Mock 서비스
 * localStorage를 사용하여 데이터 영속성 제공
 */

import { MOCK_USERS } from './mockAuthService'
import type { Database } from '@/types/database'

type User = Database['public']['Tables']['users']['Row']

// localStorage 키
const STORAGE_KEY = 'cnc_qc_users'

// API 지연 시뮬레이션 (ms)
const API_DELAY = 300

// 타입 정의
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

// localStorage에서 데이터 로드
function loadUsers(): User[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load users from localStorage:', error)
  }

  // 기본 데이터 초기화 (MOCK_USERS에서 가져옴)
  const defaultUsers: User[] = MOCK_USERS.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    created_at: user.created_at,
  }))

  saveUsers(defaultUsers)
  return defaultUsers
}

// localStorage에 데이터 저장
function saveUsers(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  } catch (error) {
    console.error('Failed to save users to localStorage:', error)
  }
}

// UUID 생성
function generateId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 모든 사용자 조회
 */
export async function getUsers(): Promise<User[]> {
  await new Promise((resolve) => setTimeout(resolve, API_DELAY))
  const users = loadUsers()
  return users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

/**
 * ID로 사용자 조회
 */
export async function getUserById(id: string): Promise<User | null> {
  await new Promise((resolve) => setTimeout(resolve, API_DELAY))
  const users = loadUsers()
  return users.find((user) => user.id === id) || null
}

/**
 * 사용자 생성
 */
export async function createUser(data: CreateUserInput): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, API_DELAY))

  const users = loadUsers()

  // 이메일 중복 체크
  if (users.some((u) => u.email === data.email)) {
    throw new Error('이미 사용 중인 이메일입니다')
  }

  const newUser: User = {
    id: generateId(),
    email: data.email,
    name: data.name,
    role: data.role,
    created_at: new Date().toISOString(),
  }

  users.push(newUser)
  saveUsers(users)

  return newUser
}

/**
 * 사용자 수정
 */
export async function updateUser(id: string, data: UpdateUserInput): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, API_DELAY))

  const users = loadUsers()
  const index = users.findIndex((u) => u.id === id)

  if (index === -1) {
    throw new Error('사용자를 찾을 수 없습니다')
  }

  // 이메일 중복 체크 (자기 자신 제외)
  if (data.email && users.some((u) => u.email === data.email && u.id !== id)) {
    throw new Error('이미 사용 중인 이메일입니다')
  }

  const updatedUser: User = {
    ...users[index],
    ...(data.email && { email: data.email }),
    ...(data.name && { name: data.name }),
    ...(data.role && { role: data.role }),
  }

  users[index] = updatedUser
  saveUsers(users)

  return updatedUser
}

/**
 * 사용자 삭제
 */
export async function deleteUser(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, API_DELAY))

  const users = loadUsers()
  const index = users.findIndex((u) => u.id === id)

  if (index === -1) {
    throw new Error('사용자를 찾을 수 없습니다')
  }

  users.splice(index, 1)
  saveUsers(users)
}

/**
 * 사용자 이메일 목록 조회 (중복 체크용)
 */
export async function getUserEmails(): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, API_DELAY / 2))
  const users = loadUsers()
  return users.map((u) => u.email)
}

/**
 * 역할별 사용자 수 조회
 */
export async function getUserCountsByRole(): Promise<Record<string, number>> {
  await new Promise((resolve) => setTimeout(resolve, API_DELAY / 2))
  const users = loadUsers()

  return {
    admin: users.filter((u) => u.role === 'admin').length,
    manager: users.filter((u) => u.role === 'manager').length,
    inspector: users.filter((u) => u.role === 'inspector').length,
    total: users.length,
  }
}
