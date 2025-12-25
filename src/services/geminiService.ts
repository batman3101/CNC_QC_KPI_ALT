// Gemini AI 서비스

import type {
  InsightType,
  AnalyticsDataForAI,
  GenerateInsightRequest,
  ChatRequest,
} from '@/types/ai-insights'

// Gemini API 키
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// Gemini API 엔드포인트 (무료 플랜 - gemini-1.5-flash)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

// 시스템 프롬프트
const SYSTEM_PROMPT = {
  ko: `당신은 CNC 품질 검사 데이터 분석 전문가입니다.
주어진 검사 데이터를 기반으로 분석하고 인사이트를 제공합니다.
답변은 항상 한국어로 제공하세요.
마크다운 형식으로 깔끔하게 정리해주세요.
숫자와 통계는 명확하게 표시하세요.`,

  vi: `Bạn là chuyên gia phân tích dữ liệu kiểm tra chất lượng CNC.
Phân tích và cung cấp insights dựa trên dữ liệu kiểm tra được cung cấp.
Luôn trả lời bằng tiếng Việt.
Định dạng bằng markdown rõ ràng.
Hiển thị số liệu và thống kê một cách rõ ràng.`
}

// 인사이트 유형별 프롬프트
const INSIGHT_PROMPTS: Record<InsightType, { ko: string; vi: string }> = {
  'daily-summary': {
    ko: `오늘의 검사 데이터를 요약해주세요.
- 총 검사 수, 합격/불합격 건수, 합격률
- 전반적인 품질 상태 평가
- 간단한 권장 사항`,
    vi: `Tóm tắt dữ liệu kiểm tra hôm nay.
- Tổng số kiểm tra, số đạt/không đạt, tỷ lệ đạt
- Đánh giá tình trạng chất lượng tổng thể
- Đề xuất ngắn gọn`
  },
  'key-issues': {
    ko: `현재 가장 주의가 필요한 품질 이슈 3가지를 알려주세요.
- 각 이슈의 심각도와 영향
- 발생 원인 추정
- 조치 권장 사항`,
    vi: `Cho biết 3 vấn đề chất lượng cần chú ý nhất hiện tại.
- Mức độ nghiêm trọng và ảnh hưởng của từng vấn đề
- Ước tính nguyên nhân
- Đề xuất biện pháp khắc phục`
  },
  'performance': {
    ko: `설비별 및 모델별 품질 성과를 분석해주세요.
- 가장 성과가 좋은/나쁜 설비
- 가장 성과가 좋은/나쁜 모델
- 성과 개선을 위한 제안`,
    vi: `Phân tích hiệu suất chất lượng theo thiết bị và model.
- Thiết bị có hiệu suất tốt nhất/kém nhất
- Model có hiệu suất tốt nhất/kém nhất
- Đề xuất cải thiện hiệu suất`
  },
  'risk-alerts': {
    ko: `현재 품질 데이터에서 발견되는 잠재적 리스크를 알려주세요.
- 리스크 항목과 심각도
- 예상되는 영향
- 예방 조치 권고`,
    vi: `Cho biết các rủi ro tiềm ẩn được phát hiện từ dữ liệu chất lượng hiện tại.
- Các hạng mục rủi ro và mức độ nghiêm trọng
- Ảnh hưởng dự kiến
- Khuyến nghị biện pháp phòng ngừa`
  }
}

// 데이터를 문자열로 변환
function formatDataForPrompt(data: AnalyticsDataForAI): string {
  return `
## 오늘 검사 데이터
- 총 검사: ${data.todayInspections.total}건
- 합격: ${data.todayInspections.passed}건
- 불합격: ${data.todayInspections.failed}건
- 합격률: ${data.todayInspections.passRate.toFixed(1)}%

## 불량 유형별 분포
${data.defectTypeDistribution.map(d => `- ${d.type}: ${d.count}건 (${d.percentage.toFixed(1)}%)`).join('\n')}

## 설비별 성과
${data.machinePerformance.map(m => `- ${m.machineName}: 검사 ${m.total}건, 합격률 ${m.passRate.toFixed(1)}%`).join('\n')}

## 모델별 불량률
${data.modelDefectRates.map(m => `- ${m.modelCode}: 검사 ${m.total}건, 불량률 ${m.defectRate.toFixed(1)}%`).join('\n')}

## 미해결 불량
총 ${data.pendingDefects.length}건
${data.pendingDefects.slice(0, 5).map(d => `- ${d.type} (${d.status})`).join('\n')}

## 최근 7일 트렌드
${data.weeklyTrend.map(t => `- ${t.date}: 검사 ${t.total}건, 합격률 ${t.passRate.toFixed(1)}%`).join('\n')}
`
}

// Gemini API 호출
async function callGeminiAPI(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.')
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Gemini API 오류: ${error.error?.message || '알 수 없는 오류'}`)
  }

  const result = await response.json()
  return result.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 생성할 수 없습니다.'
}

// 인사이트 생성
export async function generateInsight(request: GenerateInsightRequest): Promise<string> {
  const { type, data, language } = request
  const systemPrompt = SYSTEM_PROMPT[language]
  const insightPrompt = INSIGHT_PROMPTS[type][language]
  const dataString = formatDataForPrompt(data)

  const fullPrompt = `${systemPrompt}

${insightPrompt}

${dataString}`

  return callGeminiAPI(fullPrompt)
}

// 챗봇 대화
export async function chatWithAI(request: ChatRequest): Promise<string> {
  const { message, context, history, language } = request
  const systemPrompt = SYSTEM_PROMPT[language]
  const dataString = formatDataForPrompt(context)

  // 대화 히스토리 구성
  const historyText = history.slice(-5).map(msg =>
    `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}`
  ).join('\n')

  const fullPrompt = `${systemPrompt}

## 현재 데이터
${dataString}

## 대화 기록
${historyText}

## 사용자 질문
${message}

위 질문에 답변해주세요.`

  return callGeminiAPI(fullPrompt)
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
