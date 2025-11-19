# Claude AI 개발 가이드

이 문서는 Claude AI가 CNC QC KPI 프로젝트의 프론트엔드를 개발할 때 **반드시** 따라야 하는 규칙과 가이드라인을 정의합니다.

---

## 🌐 국제화 (Internationalization - i18n)

### ⚠️ 필수 준수 사항

**모든 프론트엔드 컴포넌트는 반드시 베트남어(Vietnamese)와 한국어(Korean) 이중 언어를 지원해야 합니다.**

이 프로젝트는 베트남 직원과 한국 직원이 함께 사용하므로, 모든 UI 텍스트는 번역 가능해야 합니다.

---

### 📚 i18n 설정

#### 패키지
- `i18next`: 국제화 프레임워크
- `react-i18next`: React 통합
- `i18next-browser-languagedetector`: 브라우저 언어 자동 감지

#### 설정 파일
- **i18n 설정**: `src/i18n/config.ts`
- **한국어 번역**: `src/locales/ko/translation.json`
- **베트남어 번역**: `src/locales/vi/translation.json`

#### 초기화
`src/App.tsx`에서 i18n 설정을 import:
```typescript
import '@/i18n/config'
```

---

### 🔧 컴포넌트에서 i18n 사용하기

#### 기본 패턴

**1. Import 추가:**
```typescript
import { useTranslation } from 'react-i18next'
```

**2. Hook 사용:**
```typescript
export function MyComponent() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('common.title')}</h1>
      <p>{t('common.description')}</p>
    </div>
  )
}
```

**3. 하드코딩된 텍스트 금지:**
```typescript
// ❌ 잘못된 예시
<button>저장</button>
<h1>대시보드</h1>

// ✅ 올바른 예시
<button>{t('common.save')}</button>
<h1>{t('dashboard.title')}</h1>
```

---

### 📝 번역 키 구조

번역 키는 다음과 같은 계층 구조를 따릅니다:

```json
{
  "common": {
    "save": "저장",
    "cancel": "취소",
    "delete": "삭제",
    "edit": "수정",
    "add": "등록",
    "search": "검색",
    "loading": "로딩 중...",
    "noData": "데이터가 없습니다"
  },
  "auth": {
    "login": "로그인",
    "logout": "로그아웃",
    "email": "이메일",
    "password": "비밀번호"
  },
  "dashboard": {
    "title": "대시보드",
    "description": "실시간 품질 지표를 확인하세요",
    "todayInspections": "금일 검사",
    "passRate": "합격률"
  },
  "validation": {
    "required": "필수 입력 항목입니다",
    "email": "올바른 이메일 형식이 아닙니다",
    "number": "숫자만 입력 가능합니다"
  }
}
```

#### 네이밍 규칙
- **공통 요소**: `common.*` (save, cancel, delete, edit, add, etc.)
- **페이지별**: `{pageName}.*` (dashboard, inspection, defects, management, etc.)
- **검증 메시지**: `validation.*`
- **내비게이션**: `nav.*`

---

### 🛠️ Form Validation with Zod

Zod 검증 스키마에서 i18n을 사용할 때:

```typescript
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

// Helper function으로 스키마 생성
function createFormSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, t('validation.enterModelName')),
    code: z.string().min(1, t('validation.enterModelCode')),
    email: z.string().email(t('validation.email'))
  })
}

export function MyFormComponent() {
  const { t } = useTranslation()

  // t 함수를 전달하여 스키마 생성
  const formSchema = createFormSchema(t)
  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', code: '' }
  })

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('management.modelName')}</FormLabel>
            <FormControl>
              <Input {...field} placeholder={t('validation.enterModelName')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  )
}
```

**중요 포인트:**
1. 검증 스키마를 함수로 감싸서 `t` 함수를 매개변수로 받음
2. 컴포넌트 내부에서 `t`를 전달하여 스키마 생성
3. 타입은 `z.infer<ReturnType<typeof createFormSchema>>`로 추론

---

### 🌍 언어 전환 기능

Header 컴포넌트에 언어 선택기가 구현되어 있습니다:

```typescript
import { useTranslation } from 'react-i18next'

export function Header() {
  const { t, i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <DropdownMenu>
      <DropdownMenuItem onClick={() => changeLanguage('ko')}>
        한국어 (Korean)
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => changeLanguage('vi')}>
        Tiếng Việt (Vietnamese)
      </DropdownMenuItem>
    </DropdownMenu>
  )
}
```

---

### 📋 새로운 컴포넌트 생성 시 체크리스트

새로운 컴포넌트를 만들 때 **반드시** 다음 단계를 따르세요:

- [ ] `import { useTranslation } from 'react-i18next'` 추가
- [ ] `const { t } = useTranslation()` 선언
- [ ] 모든 하드코딩된 한국어/베트남어 텍스트를 `t('key')` 호출로 대체
- [ ] Form validation이 있다면 `createFormSchema(t)` 패턴 사용
- [ ] 새로운 번역 키가 필요하다면 `src/locales/ko/translation.json`과 `src/locales/vi/translation.json`에 추가
- [ ] Toast 메시지, Alert, 에러 메시지 모두 번역 키 사용

---

### 🚫 하지 말아야 할 것

```typescript
// ❌ 절대 하지 마세요
<h1>대시보드</h1>
<button>저장</button>
<p>데이터가 없습니다</p>
const schema = z.string().min(1, '필수 입력 항목입니다')

// ✅ 올바른 방법
<h1>{t('dashboard.title')}</h1>
<button>{t('common.save')}</button>
<p>{t('common.noData')}</p>
const schema = z.string().min(1, t('validation.required'))
```

---

### 📖 번역 키 참조

자주 사용되는 번역 키:

#### Common (공통)
- `common.save` - 저장
- `common.cancel` - 취소
- `common.delete` - 삭제
- `common.edit` - 수정
- `common.add` - 등록
- `common.search` - 검색
- `common.filter` - 필터
- `common.export` - 내보내기
- `common.close` - 닫기
- `common.loading` - 로딩 중...
- `common.noData` - 데이터가 없습니다
- `common.error` - 오류가 발생했습니다
- `common.success` - 성공
- `common.actions` - 작업

#### Navigation (내비게이션)
- `nav.dashboard` - 대시보드
- `nav.inspection` - 검사 실행
- `nav.defects` - 불량 관리
- `nav.analytics` - 분석
- `nav.reports` - 리포트
- `nav.management` - 관리

#### Validation (검증)
- `validation.required` - 필수 입력 항목입니다
- `validation.email` - 올바른 이메일 형식이 아닙니다
- `validation.number` - 숫자만 입력 가능합니다
- `validation.selectModel` - 제품 모델을 선택해주세요
- `validation.selectMachine` - 설비를 선택해주세요

전체 번역 키는 `src/locales/ko/translation.json` 파일을 참조하세요.

---

### 🔍 번역 누락 확인 방법

개발 완료 후 다음을 확인:

1. **콘솔 에러 확인**: i18next가 누락된 키에 대해 경고를 출력합니다
2. **언어 전환 테스트**: Header에서 한국어 ↔ 베트남어 전환하여 모든 텍스트가 변경되는지 확인
3. **페이지별 체크**: 각 페이지를 방문하여 하드코딩된 텍스트가 없는지 확인

---

### 🎯 요약

**핵심 원칙:**
1. **모든 UI 텍스트는 번역 키를 사용**
2. **하드코딩된 한국어/베트남어 텍스트 금지**
3. **새 컴포넌트 = useTranslation 필수**
4. **Form validation도 i18n 적용**
5. **번역 키 추가 시 ko와 vi 둘 다 업데이트**

이 가이드라인을 따르면 모든 사용자(한국인, 베트남인)가 자신의 언어로 편안하게 시스템을 사용할 수 있습니다.

---

## 📱 추가 개발 가이드라인

### UI 컴포넌트
- **shadcn/ui** 사용
- 일관된 디자인 시스템 유지
- 반응형 디자인 (모바일, 태블릿, 데스크톱)

### 상태 관리
- **Client State**: Zustand (`src/stores/`)
- **Server State**: TanStack Query (`@tanstack/react-query`)
- **Form State**: React Hook Form + Zod

### 코드 스타일
- TypeScript 사용
- ESLint 규칙 준수
- 명확한 타입 정의

### 폴더 구조
```
src/
├── components/       # 재사용 가능한 컴포넌트
│   ├── ui/          # shadcn/ui 컴포넌트
│   ├── layout/      # 레이아웃 컴포넌트
│   └── {feature}/   # 기능별 컴포넌트
├── pages/           # 페이지 컴포넌트
├── hooks/           # Custom Hooks
├── stores/          # Zustand stores
├── lib/             # 유틸리티 함수
├── types/           # TypeScript 타입 정의
├── i18n/            # i18n 설정
└── locales/         # 번역 파일
    ├── ko/
    └── vi/
```

---

**이 문서는 프로젝트의 모든 프론트엔드 개발 작업에 적용되며, 반드시 준수해야 합니다.**
