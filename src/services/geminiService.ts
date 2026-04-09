// Gemini AI 서비스

import type {
  InsightType,
  AnalyticsDataForAI,
  GenerateInsightRequest,
  ChatRequest,
} from '@/types/ai-insights'

// Gemini API 키
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// Gemini API 엔드포인트
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

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
5. **Đánh giá tổng thể**: Tóm tắt 1 dòng`
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
5. **Khuyến nghị**: Biện pháp ngay/ngắn hạn/trung hạn`
  },
  'performance': {
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
5. **Hành động cụ thể**: Biện pháp thực hiện ngay`
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
Đánh dấu 🚨(khẩn cấp) hoặc ⚠️(chú ý)`
  }
}

// 데이터를 문자열로 변환
function formatDataForPrompt(data: AnalyticsDataForAI, factoryName?: string): string {
  const defectRate = data.todayInspections.total > 0
    ? ((data.todayInspections.failed / data.todayInspections.total) * 100).toFixed(2)
    : '0.00'

  return `
${factoryName ? `## 공장: ${factoryName}\n` : ''}
## 오늘 검사 데이터 (수량 기반)
- 총 검사수량: ${data.todayInspections.total}개
- 합격수량: ${data.todayInspections.passed}개
- 불량수량: ${data.todayInspections.failed}개
- 합격률: ${data.todayInspections.passRate.toFixed(2)}%
- 불량률: ${defectRate}%
※ 불량률 = 불량수량 / 총검사수량 × 100

## 불량 유형별 분포 (상위)
${data.defectTypeDistribution.slice(0, 10).map(d => `- ${d.type}: ${d.count}건 (${d.percentage.toFixed(1)}%)`).join('\n')}

## 설비별 성과 (불량 많은 순)
${data.machinePerformance.sort((a, b) => (100 - a.passRate) - (100 - b.passRate)).reverse().slice(0, 10).map(m => `- ${m.machineName}: 검사수량 ${m.total}개, 합격률 ${m.passRate.toFixed(1)}%, 불량률 ${(100 - m.passRate).toFixed(1)}%`).join('\n')}

## 모델별 불량률 (불량률 높은 순)
${data.modelDefectRates.sort((a, b) => b.defectRate - a.defectRate).slice(0, 10).map(m => `- ${m.modelCode}: 검사수량 ${m.total}개, 불량률 ${m.defectRate.toFixed(2)}%`).join('\n')}

## 미해결 불량 현황
총 ${data.pendingDefects.length}건 (대기: ${data.pendingDefects.filter(d => d.status === 'pending').length}건, 조치중: ${data.pendingDefects.filter(d => d.status === 'in_progress').length}건)
${data.pendingDefects.slice(0, 10).map(d => `- ${d.type} (${d.status === 'pending' ? '대기' : '조치중'})`).join('\n')}

## 최근 7일 트렌드
${data.weeklyTrend.map(t => `- ${t.date}: 검사수량 ${t.total}개, 불량수량 ${t.failed}개, 불량률 ${t.total > 0 ? ((t.failed / t.total) * 100).toFixed(2) : '0.00'}%`).join('\n')}
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
        maxOutputTokens: 4096,
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
