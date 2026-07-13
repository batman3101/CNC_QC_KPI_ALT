// Gemini AI 서비스
//
// Gemini는 브라우저에서 직접 호출하지 않는다. supabase/functions/gemini-insight를 경유한다.
// API 키는 Supabase Secret에만 존재하며 번들에 포함되지 않는다.
// 프롬프트 조립도 Edge Function이 담당한다 - 클라이언트는 type/data만 보내므로
// 로그인 사용자가 임의 프롬프트를 프로젝트 키로 실행할 수 없다.

import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type {
  InsightType,
  AnalyticsDataForAI,
  GenerateInsightRequest,
  ChatRequest,
} from '@/types/ai-insights'

const EDGE_FUNCTION = 'gemini-insight'

// Edge Function이 도달 가능한 경우의 에러 메시지는 서버가 요청 언어로 지역화해 내려준다.
// 아래 문구는 함수에 닿지도 못한 경우(네트워크 단절 등)에만 쓰인다.
const CONNECTION_ERROR: Record<'ko' | 'vi', string> = {
  ko: 'AI 서비스에 연결하지 못했습니다.',
  vi: 'Không thể kết nối dịch vụ AI.',
}

type InvokeBody =
  | { kind: 'insight'; type: InsightType; language: 'ko' | 'vi'; data: AnalyticsDataForAI }
  | {
      kind: 'chat'
      language: 'ko' | 'vi'
      message: string
      history: ChatRequest['history']
      context: AnalyticsDataForAI
    }

// 함수가 4xx/5xx를 반환하면 supabase-js는 본문을 파싱하지 않은 FunctionsHttpError를 준다.
// 서버가 내려준 지역화 메시지를 꺼내 그대로 사용자에게 보여준다.
async function readServerError(error: unknown): Promise<string | null> {
  if (!(error instanceof FunctionsHttpError)) return null

  try {
    const payload = await error.context.json()
    return typeof payload?.error === 'string' ? payload.error : null
  } catch {
    return null
  }
}

async function invokeGemini(body: InvokeBody): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ text?: string }>(EDGE_FUNCTION, { body })

  if (error) {
    throw new Error((await readServerError(error)) ?? CONNECTION_ERROR[body.language])
  }
  if (!data?.text) {
    throw new Error(CONNECTION_ERROR[body.language])
  }

  return data.text
}

// 인사이트 생성
export async function generateInsight(request: GenerateInsightRequest): Promise<string> {
  const { type, data, language } = request
  return invokeGemini({ kind: 'insight', type, language, data })
}

// 챗봇 대화
export async function chatWithAI(request: ChatRequest): Promise<string> {
  const { message, context, history, language } = request
  return invokeGemini({ kind: 'chat', language, message, history, context })
}

// 모든 인사이트 생성
export async function generateAllInsights(
  data: AnalyticsDataForAI,
  language: 'ko' | 'vi'
): Promise<Record<InsightType, string>> {
  const types: InsightType[] = ['daily-summary', 'key-issues', 'performance', 'risk-alerts']

  const results = await Promise.all(
    types.map(type => generateInsight({ type, data, language }))
  )

  return {
    'daily-summary': results[0],
    'key-issues': results[1],
    'performance': results[2],
    'risk-alerts': results[3],
  }
}
