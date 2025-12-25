// AI Insights 타입 정의

export type InsightType = 'daily-summary' | 'key-issues' | 'performance' | 'risk-alerts'

export interface Insight {
  type: InsightType
  title: string
  content: string
  generatedAt: string
  isLoading: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// Gemini AI에 전송할 분석 데이터 타입
export interface AnalyticsDataForAI {
  // 오늘 검사 요약
  todayInspections: {
    total: number
    passed: number
    failed: number
    passRate: number
  }
  // 최근 7일 트렌드
  weeklyTrend: {
    date: string
    total: number
    passed: number
    failed: number
    passRate: number
  }[]
  // 불량 유형별 분포
  defectTypeDistribution: {
    type: string
    count: number
    percentage: number
  }[]
  // 설비별 성과
  machinePerformance: {
    machineId: string
    machineName: string
    total: number
    passRate: number
  }[]
  // 모델별 불량률
  modelDefectRates: {
    modelId: string
    modelCode: string
    total: number
    defectRate: number
  }[]
  // 미해결 불량
  pendingDefects: {
    id: string
    type: string
    status: string
    createdAt: string
  }[]
}

// 인사이트 생성 요청
export interface GenerateInsightRequest {
  type: InsightType
  data: AnalyticsDataForAI
  language: 'ko' | 'vi'
}

// 챗봇 요청
export interface ChatRequest {
  message: string
  context: AnalyticsDataForAI
  history: ChatMessage[]
  language: 'ko' | 'vi'
}
