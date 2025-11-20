/**
 * Application Configuration
 *
 * 이 파일에서 애플리케이션의 전역 설정을 관리합니다.
 * Mock 모드와 실제 Supabase 모드를 전환할 수 있습니다.
 */

// Mock 모드 설정
// true: Mock 서비스 사용 (Supabase 연결 없이 프론트엔드 테스트)
// false: 실제 Supabase 서비스 사용
export const USE_MOCK_MODE = true

// Mock 모드 설정을 개별적으로 제어할 수 있습니다
export const USE_MOCK_AUTH = USE_MOCK_MODE
export const USE_MOCK_INSPECTION = USE_MOCK_MODE
export const USE_MOCK_ANALYTICS = USE_MOCK_MODE
export const USE_MOCK_MANAGEMENT = USE_MOCK_MODE
export const USE_MOCK_REPORTS = USE_MOCK_MODE
export const USE_MOCK_DEFECTS = USE_MOCK_MODE

// API 설정
export const API_CONFIG = {
  // API 요청 타임아웃 (밀리초)
  timeout: 30000,

  // 재시도 설정
  retryAttempts: 3,
  retryDelay: 1000,
}

// Mock 데이터 설정
export const MOCK_CONFIG = {
  // Mock API 응답 지연 시간 (밀리초)
  apiDelay: 500,

  // Mock 로그인 지연 시간 (밀리초)
  loginDelay: 1000,

  // 콘솔에 Mock 정보 출력 여부
  logMockCalls: true,
}

// 개발 모드 확인
export const isDevelopment = import.meta.env.DEV
export const isProduction = import.meta.env.PROD

// 환경별 설정
export const ENV_CONFIG = {
  development: {
    enableDebugLogs: true,
    showMockDataInfo: true,
  },
  production: {
    enableDebugLogs: false,
    showMockDataInfo: false,
  },
}

// 현재 환경 설정 가져오기
export const currentEnvConfig = isDevelopment
  ? ENV_CONFIG.development
  : ENV_CONFIG.production

// Mock 모드 정보 출력 (개발 환경에서만)
if (isDevelopment && currentEnvConfig.showMockDataInfo) {
  console.log('🔧 Application Configuration:')
  console.log(`  - USE_MOCK_MODE: ${USE_MOCK_MODE}`)
  console.log(`  - Environment: ${isDevelopment ? 'Development' : 'Production'}`)

  if (USE_MOCK_MODE) {
    console.log('📦 Running in MOCK mode - No Supabase connection required')
    console.log('   All data operations use mock services')
  } else {
    console.log('🔌 Running in REAL mode - Supabase connection active')
  }
}
