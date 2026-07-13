# Gemini 호출 서버 프록시 설계

- 날짜: 2026-07-13
- 상태: 승인됨

## 문제

`src/services/geminiService.ts`가 브라우저에서 Gemini API를 직접 호출한다. 키를 `VITE_GEMINI_API_KEY`로 주입하는데, `VITE_` 접두사 환경변수는 프론트엔드 번들에 평문으로 박힌다. 실제로 브라우저 네트워크 탭에서 요청 URL에 키가 그대로 노출되는 것을 확인했다:

```
https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=AIzaSy...
```

배포 시 누구나 키를 추출해 사용할 수 있고, 과금은 프로젝트 소유자에게 청구된다.

## 목표

1. Gemini API 키를 브라우저 번들에서 완전히 제거한다.
2. 인증된 사용자만, 그리고 `aiInsights` 권한을 가진 역할만 AI 기능을 호출할 수 있게 한다.
3. 사용자가 임의 프롬프트를 프로젝트 키로 실행하지 못하게 한다.
4. 호출 남용으로 인한 과금 폭주를 서버에서 막는다.

## 설계

### 경계선

프롬프트 조립까지 서버로 이관한다. 클라이언트는 `type`(4종 enum) + 구조화된 데이터만 보낸다. 프롬프트 문자열을 그대로 중계하는 "얇은 프록시"는 채택하지 않는다 — 로그인한 사용자가 프로젝트 키로 아무 프롬프트나 실행할 수 있게 되기 때문이다.

### 데이터 흐름

```
브라우저 ──(Supabase JWT)──> Edge Function: gemini-insight
                              ├ 본문 파싱 (에러 메시지 지역화를 위해 language 선취득)
                              ├ JWT 검증
                              ├ aiInsights 권한 확인 (role_feature_permissions)
                              ├ 레이트리밋 (ai_usage_log, 분당 12회)
                              ├ 본문 검증 (enum, 배열 길이 상한)
                              ├ 프롬프트 조립
                              └──(GEMINI_API_KEY)──> Gemini
```

### 요청 계약

```ts
{ kind: 'insight', type: 'daily-summary'|'key-issues'|'performance'|'risk-alerts',
  language: 'ko'|'vi', data: AnalyticsDataForAI }

{ kind: 'chat', language: 'ko'|'vi', message: string, history: ChatMessage[] }

→ 200 { text: string }
```

### 권한

프론트 라우트 가드가 쓰는 것과 같은 진실 원천을 서버도 본다: `users`에서 호출자의 `role`/`factory_id`를 읽고, `role_feature_permissions`에서 `feature_key = 'aiInsights'`의 `allowed`를 조회한다. `admin`은 불변(break-glass) 역할이므로 항상 허용한다.

이렇게 하면 관리자가 나중에 inspector에게 AI 권한을 열어줘도 서버 코드를 고칠 필요가 없다.

### 레이트리밋

`ai_usage_log` 테이블에 호출을 기록하고, 최근 60초 호출 수가 12회 이상이면 429를 반환한다 (새로고침 1회 = 4호출이므로 분당 새로고침 3회 상당).

RLS를 켜되 정책은 하나도 만들지 않는다. 정책이 없으면 익명·인증 사용자는 전부 차단되고 `service_role`만 우회한다. Edge Function은 service_role로 기록하므로 정상 동작하면서, 클라이언트는 로그를 읽거나 삭제할 수 없다.

### 입력 크기 상한

프롬프트 비대화를 막기 위해 서버에서 배열을 자른다: `weeklyTrend` 14개, 그 외 분포/성과 배열 10개, 챗봇 `history` 최근 5개, `message` 2000자.

### 에러 처리

| 상황 | 상태 | 클라이언트 표시 |
|---|---|---|
| 미인증/토큰 만료 | 401 | 기존 인증 흐름 |
| `aiInsights` 권한 없음 | 403 | 권한 안내 |
| 분당 12회 초과 | 429 | 요청 빈번 안내 |
| Gemini 오류 / 키 미설정 | 500 | 일반 오류 |

에러 메시지는 요청의 `language`에 따라 ko/vi로 서버에서 지역화한다. 키 관련 내부 사정은 클라이언트로 노출하지 않고 서버 로그에만 남긴다.

### 클라이언트 변경

`callGeminiAPI(prompt)` 한 함수만 `supabase.functions.invoke('gemini-insight', { body })`로 교체한다. `supabase-js`가 세션 JWT를 자동으로 붙인다.

`generateInsight` / `chatWithAI` / `generateAllInsights`의 시그니처는 그대로 유지하므로 `AIInsightsPage.tsx`와 `AIChatbot.tsx`는 수정하지 않는다. 모든 Gemini 트래픽이 단일 초크포인트를 지나기 때문에 가능한 구조다.

프롬프트 상수(`SYSTEM_PROMPT`, `INSIGHT_PROMPTS`, `formatDataForPrompt`)는 Edge Function으로 이동한다. 복사가 아니라 이동이다 — 중복은 표류한다.

### 환경변수

- 제거: `VITE_GEMINI_API_KEY`, `VITE_GEMINI_MODEL` (`.env`, `.env.example`, `vite-env.d.ts`)
- 추가: Supabase Secret `GEMINI_API_KEY`, `GEMINI_MODEL`

### 키 재발급 (필수, 소유자 직접 수행)

기존 키는 이미 번들과 네트워크 URL로 노출됐다. 서버로 옮긴다고 유출된 키가 회수되지는 않는다. Google AI Studio에서 새 키를 발급하고 기존 키를 폐기해야 이 작업이 완결된다.

## 검증

브라우저 네트워크 탭 기준:

- `supabase.co/functions/v1/gemini-insight` 요청 4건, 200
- `generativelanguage.googleapis.com` 요청 **0건**
- 프로덕션 번들(`dist`)에 `AIzaSy` 문자열 0건
- 새로고침 연타 시 429 + 안내 메시지
- 인사이트 4종 + 챗봇 정상 렌더링

## 채택하지 않은 대안

- **얇은 프록시(prompt 그대로 중계)**: 변경량은 가장 적지만, 로그인 사용자가 임의 프롬프트를 프로젝트 키로 실행할 수 있고 프롬프트가 번들에 남는다.
- **서버가 DB에서 분석 데이터 직접 조회**: 데이터 위변조까지 차단되나, 페이지가 화면용으로 이미 보유한 데이터를 서버가 중복 조회하게 되고 작업량이 가장 크다.
