// Gemini 호출 프록시.
// GEMINI_API_KEY는 이 함수(Supabase Secret)에만 존재하며 브라우저로 나가지 않는다.
// 클라이언트는 프롬프트가 아니라 type/data만 보낸다 -> 임의 프롬프트 실행 불가.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const DEFAULT_MODEL = 'gemini-3.5-flash'

// 새로고침 1회 = 인사이트 4호출. 분당 12회 = 새로고침 3회 상당.
const RATE_LIMIT_PER_MINUTE = 12

type Language = 'ko' | 'vi'
type InsightType = 'daily-summary' | 'key-issues' | 'performance' | 'risk-alerts'

const INSIGHT_TYPES: InsightType[] = ['daily-summary', 'key-issues', 'performance', 'risk-alerts']

interface AnalyticsDataForAI {
  todayInspections: { total: number; passed: number; failed: number; passRate: number }
  weeklyTrend: { date: string; total: number; passed: number; failed: number; passRate: number }[]
  defectTypeDistribution: { type: string; count: number; percentage: number }[]
  machinePerformance: { machineId: string; machineName: string; total: number; passRate: number }[]
  modelDefectRates: { modelId: string; modelCode: string; total: number; defectRate: number }[]
  pendingDefects: { id: string; type: string; status: string; createdAt: string }[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

type RequestBody =
  | { kind: 'insight'; type: InsightType; language: Language; data: AnalyticsDataForAI }
  | { kind: 'chat'; language: Language; message: string; history: ChatMessage[]; context: AnalyticsDataForAI }

const MESSAGES = {
  unauthorized: { ko: '인증이 필요합니다.', vi: 'Yêu cầu đăng nhập.' },
  invalidAuth: { ko: '유효하지 않은 인증 정보입니다.', vi: 'Thông tin xác thực không hợp lệ.' },
  forbidden: { ko: 'AI 인사이트 사용 권한이 없습니다.', vi: 'Bạn không có quyền sử dụng AI Insights.' },
  rateLimited: {
    ko: '요청이 너무 빈번합니다. 잠시 후 다시 시도하세요.',
    vi: 'Yêu cầu quá thường xuyên. Vui lòng thử lại sau.',
  },
  badRequest: { ko: '요청 본문이 올바르지 않습니다.', vi: 'Nội dung yêu cầu không hợp lệ.' },
  methodNotAllowed: { ko: '허용되지 않은 요청 방식입니다.', vi: 'Phương thức không được phép.' },
  serverError: { ko: '서버 설정 오류가 발생했습니다.', vi: 'Lỗi cấu hình máy chủ.' },
  aiError: { ko: 'AI 응답 생성에 실패했습니다.', vi: 'Không thể tạo phản hồi AI.' },
  emptyResponse: { ko: '응답을 생성할 수 없습니다.', vi: 'Không thể tạo phản hồi.' },
} as const

const SYSTEM_PROMPT: Record<Language, string> = {
  ko: `당신은 CNC 품질 검사 데이터 분석 전문가입니다.
주어진 검사 데이터를 기반으로 분석하고 인사이트를 제공합니다.
답변은 항상 한국어로 제공하세요.
마크다운 형식으로 깔끔하게 정리해주세요.
숫자와 통계는 명확하게 표시하세요.`,

  vi: `Bạn là chuyên gia phân tích dữ liệu kiểm tra chất lượng CNC.
Phân tích và cung cấp insights dựa trên dữ liệu kiểm tra được cung cấp.
Luôn trả lời bằng tiếng Việt.
Định dạng bằng markdown rõ ràng.
Hiển thị số liệu và thống kê một cách rõ ràng.`,
}

const INSIGHT_PROMPTS: Record<InsightType, Record<Language, string>> = {
  'daily-summary': {
    ko: `오늘의 검사 데이터를 분석하여 실무에 도움이 되는 일일 보고서를 작성해주세요.
반드시 포함:
1. **핵심 지표**: 총 검사수량, 불량수량, 불량률 (수량 기반으로 정확히)
2. **전일/주간 대비**: 최근 7일 트렌드와 비교하여 개선/악화 여부
3. **주목할 점**: 불량률이 높은 설비나 모델 (상위 3개)
4. **즉시 조치 필요 사항**: 미해결 불량 현황 및 조치 권고
5. **종합 평가**: 오늘의 품질 상태를 한 줄로 요약`,
    vi: `Phân tích dữ liệu kiểm tra hôm nay và viết báo cáo hàng ngày thiết thực.
Bao gồm:
1. **Chỉ số chính**: Tổng SL kiểm tra, SL lỗi, tỷ lệ lỗi (dựa trên số lượng)
2. **So sánh**: So với xu hướng 7 ngày qua
3. **Điểm chú ý**: Top 3 thiết bị/model có tỷ lệ lỗi cao
4. **Hành động cần thiết**: Lỗi chưa xử lý
5. **Đánh giá tổng thể**: Tóm tắt 1 dòng`,
  },
  'key-issues': {
    ko: `데이터를 기반으로 현재 가장 심각한 품질 이슈 3가지를 분석해주세요.
각 이슈마다:
1. **이슈명**: 구체적인 문제 (예: "CNC-729 설비 불량률 급증")
2. **심각도**: 🔴높음 / 🟡중간 / 🟢낮음
3. **수치 근거**: 관련 데이터 수치 제시
4. **추정 원인**: 가능한 원인 분석
5. **권장 조치**: 즉시/단기/중기 조치 방안`,
    vi: `Phân tích 3 vấn đề chất lượng nghiêm trọng nhất dựa trên dữ liệu.
Mỗi vấn đề:
1. **Tên**: Mô tả cụ thể
2. **Mức độ**: 🔴Cao / 🟡Trung bình / 🟢Thấp
3. **Số liệu**: Dữ liệu minh chứng
4. **Nguyên nhân**: Phân tích nguyên nhân có thể
5. **Khuyến nghị**: Biện pháp ngay/ngắn hạn/trung hạn`,
  },
  performance: {
    ko: `설비별 및 모델별 품질 성과를 심층 분석해주세요.
1. **설비 성과 TOP/BOTTOM 3**: 불량률 기준 최고/최저 성과 설비 비교
2. **모델 성과 TOP/BOTTOM 3**: 불량률 기준 최고/최저 모델 비교
3. **패턴 분석**: 특정 설비-모델 조합에서 반복되는 불량 패턴
4. **개선 우선순위**: 가장 효과적인 개선 대상 추천 (투입 대비 효과 기준)
5. **구체적 액션 아이템**: 담당자가 바로 실행할 수 있는 조치`,
    vi: `Phân tích sâu hiệu suất chất lượng theo thiết bị và model.
1. **TOP/BOTTOM 3 thiết bị**: So sánh theo tỷ lệ lỗi
2. **TOP/BOTTOM 3 model**: So sánh theo tỷ lệ lỗi
3. **Phân tích mẫu**: Mẫu lỗi lặp lại ở tổ hợp thiết bị-model
4. **Ưu tiên cải thiện**: Đề xuất mục tiêu hiệu quả nhất
5. **Hành động cụ thể**: Biện pháp thực hiện ngay`,
  },
  'risk-alerts': {
    ko: `품질 데이터에서 감지되는 잠재적 리스크를 경고해주세요.
1. **불량률 이상 징후**: 급격한 증가 추세 또는 임계값 초과
2. **미조치 불량 리스크**: 오래 방치된 불량, 조치 지연 건
3. **설비 위험 신호**: 불량률이 지속 상승하는 설비
4. **모델별 위험**: 특정 모델의 품질 악화 징후
5. **예방 조치**: 각 리스크별 즉각적인 예방 조치 권고
각 항목에 🚨(긴급) 또는 ⚠️(주의) 표시`,
    vi: `Cảnh báo rủi ro tiềm ẩn từ dữ liệu chất lượng.
1. **Bất thường tỷ lệ lỗi**: Xu hướng tăng đột biến
2. **Rủi ro lỗi chưa xử lý**: Lỗi bị trì hoãn lâu
3. **Tín hiệu thiết bị**: Thiết bị có tỷ lệ lỗi tăng liên tục
4. **Rủi ro model**: Dấu hiệu chất lượng giảm
5. **Phòng ngừa**: Khuyến nghị cho từng rủi ro
Đánh dấu 🚨(khẩn cấp) hoặc ⚠️(chú ý)`,
  },
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function arr(value: unknown, limit: number): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, limit).filter(isRecord)
}

// 프롬프트가 무한정 커지지 않도록 서버에서 배열 길이를 자른다.
function normalizeData(value: unknown): AnalyticsDataForAI {
  const raw = isRecord(value) ? value : {}
  const today = isRecord(raw.todayInspections) ? raw.todayInspections : {}

  return {
    todayInspections: {
      total: num(today.total),
      passed: num(today.passed),
      failed: num(today.failed),
      passRate: num(today.passRate),
    },
    weeklyTrend: arr(raw.weeklyTrend, 14).map((t) => ({
      date: str(t.date),
      total: num(t.total),
      passed: num(t.passed),
      failed: num(t.failed),
      passRate: num(t.passRate),
    })),
    defectTypeDistribution: arr(raw.defectTypeDistribution, 10).map((d) => ({
      type: str(d.type),
      count: num(d.count),
      percentage: num(d.percentage),
    })),
    machinePerformance: arr(raw.machinePerformance, 10).map((m) => ({
      machineId: str(m.machineId),
      machineName: str(m.machineName),
      total: num(m.total),
      passRate: num(m.passRate),
    })),
    modelDefectRates: arr(raw.modelDefectRates, 10).map((m) => ({
      modelId: str(m.modelId),
      modelCode: str(m.modelCode),
      total: num(m.total),
      defectRate: num(m.defectRate),
    })),
    pendingDefects: arr(raw.pendingDefects, 20).map((d) => ({
      id: str(d.id),
      type: str(d.type),
      status: str(d.status),
      createdAt: str(d.createdAt),
    })),
  }
}

function validateBody(value: unknown): RequestBody | null {
  if (!isRecord(value)) return null

  const language: Language = value.language === 'vi' ? 'vi' : 'ko'

  if (value.kind === 'insight') {
    const type = value.type
    if (typeof type !== 'string' || !INSIGHT_TYPES.includes(type as InsightType)) return null
    return { kind: 'insight', type: type as InsightType, language, data: normalizeData(value.data) }
  }

  if (value.kind === 'chat') {
    const message = str(value.message).trim().slice(0, 2000)
    if (!message) return null

    const history: ChatMessage[] = arr(value.history, 5).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: str(m.content).slice(0, 2000),
    }))

    return { kind: 'chat', language, message, history, context: normalizeData(value.context) }
  }

  return null
}

function formatDataForPrompt(data: AnalyticsDataForAI): string {
  const defectRate = data.todayInspections.total > 0
    ? ((data.todayInspections.failed / data.todayInspections.total) * 100).toFixed(2)
    : '0.00'

  return `
## 오늘 검사 데이터 (수량 기반)
- 총 검사수량: ${data.todayInspections.total}개
- 합격수량: ${data.todayInspections.passed}개
- 불량수량: ${data.todayInspections.failed}개
- 합격률: ${data.todayInspections.passRate.toFixed(2)}%
- 불량률: ${defectRate}%
※ 불량률 = 불량수량 / 총검사수량 × 100

## 불량 유형별 분포 (상위)
${data.defectTypeDistribution.map((d) => `- ${d.type}: ${d.count}건 (${d.percentage.toFixed(1)}%)`).join('\n')}

## 설비별 성과 (불량 많은 순)
${data.machinePerformance.slice().sort((a, b) => (100 - a.passRate) - (100 - b.passRate)).reverse().map((m) => `- ${m.machineName}: 검사수량 ${m.total}개, 합격률 ${m.passRate.toFixed(1)}%, 불량률 ${(100 - m.passRate).toFixed(1)}%`).join('\n')}

## 모델별 불량률 (불량률 높은 순)
${data.modelDefectRates.slice().sort((a, b) => b.defectRate - a.defectRate).map((m) => `- ${m.modelCode}: 검사수량 ${m.total}개, 불량률 ${m.defectRate.toFixed(2)}%`).join('\n')}

## 미해결 불량 현황
총 ${data.pendingDefects.length}건 (대기: ${data.pendingDefects.filter((d) => d.status === 'pending').length}건, 조치중: ${data.pendingDefects.filter((d) => d.status === 'in_progress').length}건)
${data.pendingDefects.slice(0, 10).map((d) => `- ${d.type} (${d.status === 'pending' ? '대기' : '조치중'})`).join('\n')}

## 최근 7일 트렌드
${data.weeklyTrend.map((t) => `- ${t.date}: 검사수량 ${t.total}개, 불량수량 ${t.failed}개, 불량률 ${t.total > 0 ? ((t.failed / t.total) * 100).toFixed(2) : '0.00'}%`).join('\n')}
`
}

function buildPrompt(body: RequestBody): string {
  const systemPrompt = SYSTEM_PROMPT[body.language]

  if (body.kind === 'insight') {
    return `${systemPrompt}

${INSIGHT_PROMPTS[body.type][body.language]}

${formatDataForPrompt(body.data)}`
  }

  const historyText = body.history
    .map((msg) => `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}`)
    .join('\n')

  return `${systemPrompt}

## 현재 데이터
${formatDataForPrompt(body.context)}

## 대화 기록
${historyText}

## 사용자 질문
${body.message}

위 질문에 답변해주세요.`
}

async function callGemini(prompt: string, apiKey: string, model: string): Promise<string | null> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          // thinking 모델은 사고 토큰이 이 예산을 함께 소모한다(실측: 사고 1666 + 답변 2121).
          // 데이터가 많은 날 보고서가 잘리지 않도록 여유를 둔다.
          maxOutputTokens: 8192,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    },
  )

  if (!response.ok) {
    const detail = await response.text()
    // 키가 섞여 나갈 수 있는 원문은 서버 로그에만 남기고 클라이언트로는 반환하지 않는다.
    console.error(`gemini-insight: Gemini API ${response.status}`, detail.slice(0, 500))
    return null
  }

  const result = await response.json()
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text
  return typeof text === 'string' && text.length > 0 ? text : ''
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: MESSAGES.methodNotAllowed.ko }, 405)
  }

  // 에러 메시지를 사용자 언어로 돌려주기 위해 본문을 먼저 읽는다(부작용 없음).
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return jsonResponse({ error: MESSAGES.badRequest.ko }, 400)
  }
  const lang: Language = isRecord(rawBody) && rawBody.language === 'vi' ? 'vi' : 'ko'

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  const geminiModel = Deno.env.get('GEMINI_MODEL') || DEFAULT_MODEL

  if (!supabaseUrl || !serviceRoleKey || !geminiApiKey) {
    console.error('gemini-insight: required environment variables are missing')
    return jsonResponse({ error: MESSAGES.serverError[lang] }, 500)
  }

  const tokenMatch = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)
  if (!tokenMatch) return jsonResponse({ error: MESSAGES.unauthorized[lang] }, 401)

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const { data: authData, error: authError } = await adminClient.auth.getUser(tokenMatch[1])
    if (authError || !authData.user) {
      return jsonResponse({ error: MESSAGES.invalidAuth[lang] }, 401)
    }
    const userId = authData.user.id

    // 권한은 프론트 라우트 가드와 같은 진실 원천(role_feature_permissions)을 본다.
    const { data: caller, error: callerError } = await adminClient
      .from('users')
      .select('role, factory_id')
      .eq('id', userId)
      .maybeSingle()

    if (callerError) {
      console.error('gemini-insight: failed to read caller profile', callerError.message)
      return jsonResponse({ error: MESSAGES.serverError[lang] }, 500)
    }
    if (!caller) return jsonResponse({ error: MESSAGES.invalidAuth[lang] }, 401)

    // admin은 불변(break-glass) 역할이므로 항상 허용한다.
    if (caller.role !== 'admin') {
      const { data: permission, error: permissionError } = await adminClient
        .from('role_feature_permissions')
        .select('allowed')
        .eq('factory_id', caller.factory_id)
        .eq('role', caller.role)
        .eq('feature_key', 'aiInsights')
        .maybeSingle()

      if (permissionError) {
        console.error('gemini-insight: failed to read permission', permissionError.message)
        return jsonResponse({ error: MESSAGES.serverError[lang] }, 500)
      }
      if (!permission?.allowed) {
        return jsonResponse({ error: MESSAGES.forbidden[lang] }, 403)
      }
    }

    const body = validateBody(rawBody)
    if (!body) return jsonResponse({ error: MESSAGES.badRequest[lang] }, 400)

    // 레이트리밋: 최근 60초 호출 수
    const windowStart = new Date(Date.now() - 60_000).toISOString()
    const { count, error: countError } = await adminClient
      .from('ai_usage_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('called_at', windowStart)

    if (countError) {
      console.error('gemini-insight: failed to read usage log', countError.message)
      return jsonResponse({ error: MESSAGES.serverError[lang] }, 500)
    }
    if ((count ?? 0) >= RATE_LIMIT_PER_MINUTE) {
      return jsonResponse({ error: MESSAGES.rateLimited[lang] }, 429)
    }

    // Gemini 호출 전에 기록한다. 응답이 느려도 동시 요청이 제한을 우회하지 못하게 한다.
    const { error: logError } = await adminClient
      .from('ai_usage_log')
      .insert({ user_id: userId, kind: body.kind })

    if (logError) {
      console.error('gemini-insight: failed to write usage log', logError.message)
      return jsonResponse({ error: MESSAGES.serverError[lang] }, 500)
    }

    const text = await callGemini(buildPrompt(body), geminiApiKey, geminiModel)
    if (text === null) {
      return jsonResponse({ error: MESSAGES.aiError[lang] }, 502)
    }

    return jsonResponse({ text: text || MESSAGES.emptyResponse[lang] }, 200)
  } catch (error) {
    console.error(
      'gemini-insight: unexpected error',
      error instanceof Error ? error.message : 'unknown',
    )
    return jsonResponse({ error: MESSAGES.aiError[lang] }, 500)
  }
})
