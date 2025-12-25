/**
 * Application Configuration
 *
 * 이 파일에서 애플리케이션의 전역 설정을 관리합니다.
 * 모든 데이터 연결은 Supabase를 통해 이루어집니다.
 */

// API 설정
export const API_CONFIG = {
  // API 요청 타임아웃 (밀리초)
  timeout: 30000,

  // 재시도 설정
  retryAttempts: 3,
  retryDelay: 1000,
}

// 개발 모드 확인
export const isDevelopment = import.meta.env.DEV
export const isProduction = import.meta.env.PROD

// 환경별 설정
export const ENV_CONFIG = {
  development: {
    enableDebugLogs: true,
  },
  production: {
    enableDebugLogs: false,
  },
}

// 현재 환경 설정 가져오기
export const currentEnvConfig = isDevelopment
  ? ENV_CONFIG.development
  : ENV_CONFIG.production

// 환경 정보 출력 (개발 환경에서만)
if (isDevelopment) {
  console.log('🔧 Application Configuration:')
  console.log(`  - Environment: Development`)
  console.log('🔌 Using Supabase connection')
}
