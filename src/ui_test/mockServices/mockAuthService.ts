/**
 * Mock Authentication Service for Development
 *
 * 개발 환경에서 Supabase 없이 로그인 테스트를 위한 Mock 서비스
 * Supabase 연결 시 이 파일을 삭제하세요.
 */

interface MockUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'inspector'
  aud: string
  created_at: string
}

interface MockAuthResponse {
  user: MockUser | null
  error: string | null
}

// 테스트 계정 목록
const MOCK_USERS: MockUser[] = [
  {
    id: 'mock-admin-001',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin',
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-manager-001',
    email: 'manager@test.com',
    name: 'Manager User',
    role: 'manager',
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-inspector-001',
    email: 'inspector@test.com',
    name: 'Inspector User',
    role: 'inspector',
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
]

// 모든 테스트 계정의 비밀번호는 동일
const MOCK_PASSWORD = 'test123'

/**
 * Mock 로그인 함수
 */
export async function mockSignIn(
  email: string,
  password: string
): Promise<MockAuthResponse> {
  // 실제 API 호출을 시뮬레이션하기 위한 지연
  await new Promise((resolve) => setTimeout(resolve, 500))

  // 비밀번호 확인
  if (password !== MOCK_PASSWORD) {
    return {
      user: null,
      error: 'Invalid email or password',
    }
  }

  // 이메일로 사용자 찾기
  const user = MOCK_USERS.find((u) => u.email === email)

  if (!user) {
    return {
      user: null,
      error: 'Invalid email or password',
    }
  }

  // 세션 저장 (localStorage)
  localStorage.setItem('mock_session', JSON.stringify(user))

  return {
    user,
    error: null,
  }
}

/**
 * Mock 로그아웃 함수
 */
export async function mockSignOut(): Promise<{ error: string | null }> {
  // 세션 제거
  localStorage.removeItem('mock_session')

  return {
    error: null,
  }
}

/**
 * Mock 세션 가져오기
 */
export async function mockGetSession(): Promise<MockAuthResponse> {
  const sessionData = localStorage.getItem('mock_session')

  if (!sessionData) {
    return {
      user: null,
      error: null,
    }
  }

  try {
    const user = JSON.parse(sessionData) as MockUser
    return {
      user,
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      error: 'Invalid session data',
    }
  }
}

/**
 * 테스트 계정 정보 출력
 */
export function printMockCredentials() {
  console.log('🔐 Mock Authentication - Test Credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  MOCK_USERS.forEach((user) => {
    console.log(`👤 ${user.role.toUpperCase()}:`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Password: ${MOCK_PASSWORD}`)
    console.log(`   Name: ${user.name}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  })
}
