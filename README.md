# CNC Quality Inspection KPI App

CNC 품질 검사 프로세스를 디지털화하고 실시간 KPI 모니터링을 제공하는 웹 애플리케이션입니다.

## 기술 스택

### Frontend
- **React** (Vite)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Query** (Server State)
- **Zustand** (Client State)
- **React Hook Form** + **Zod**
- **Recharts** (Data Visualization)

### Backend
- **Supabase** (PostgreSQL, Auth, Storage, Realtime)

### Deployment
- **Vercel**

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 Supabase 프로젝트 정보를 입력하세요.

```bash
cp .env.example .env
```

```.env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`을 열어 애플리케이션을 확인하세요.

## 🔐 개발 테스트 계정

**Supabase 연결 전까지는 Mock 인증을 사용합니다.**

다음 테스트 계정으로 로그인할 수 있습니다:

### 관리자 (Admin)
```
이메일: admin@test.com
비밀번호: test123
권한: 모든 기능 접근 가능
```

### 매니저 (Manager)
```
이메일: manager@test.com
비밀번호: test123
권한: 분석, 리포트, 관리 페이지 접근
```

### 검사원 (Inspector)
```
이메일: inspector@test.com
비밀번호: test123
권한: 대시보드, 검사 실행, 불량 관리
```

> 💡 **참고**: 브라우저 콘솔(F12)을 열면 테스트 계정 정보가 자동으로 출력됩니다.

> ⚠️ **중요**: Supabase 연결 후에는 `src/hooks/useAuth.ts`에서 `USE_MOCK_AUTH`를 `false`로 변경하세요.

### 4. 빌드

```bash
npm run build
```

### 5. 프리뷰

```bash
npm run preview
```

## 프로젝트 구조

```
src/
├── assets/         # 이미지, 폰트 등 정적 파일
├── components/     # 공통 컴포넌트
│   ├── ui/         # shadcn/ui 컴포넌트
│   └── layout/     # Header, Sidebar, LayoutWrapper
├── features/       # 기능별 모듈
│   ├── auth/       # 로그인, 회원가입
│   ├── dashboard/  # 차트, KPI 요약
│   ├── inspection/ # 검사 폼, 검사 로직
│   └── management/ # 설비, 검사 항목 관리
├── hooks/          # 커스텀 React Hooks
├── lib/            # 유틸리티 함수, Supabase Client 설정
├── pages/          # 라우트 페이지
├── services/       # API 호출 함수 (Supabase 쿼리)
├── types/          # TypeScript 타입 정의
└── App.tsx
```

## Supabase 설정

### 데이터베이스 스키마

Supabase 프로젝트의 SQL Editor에서 다음 테이블을 생성하세요:

- `users` - 사용자 정보 및 역할
- `machines` - 설비 정보
- `product_models` - 제품 모델
- `inspection_items` - 검사 항목 및 스펙
- `inspections` - 검사 실행 기록
- `inspection_results` - 검사 결과 데이터
- `defects` - 불량 정보

자세한 스키마는 `src/types/database.ts`를 참고하세요.

### Row Level Security (RLS)

역할 기반 접근 제어를 위해 RLS 정책을 설정해야 합니다:

- `Admin`: 모든 테이블에 대한 전체 접근
- `Manager`: 읽기 권한 + 마스터 데이터 수정
- `Inspector`: 검사 입력 및 본인 데이터 조회

### Storage Bucket

불량 사진 저장을 위한 `defect-photos` 버킷을 생성하세요.

## shadcn/ui 컴포넌트 추가

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
# 필요한 컴포넌트 추가...
```

## 개발 가이드

### 코드 컨벤션

- ESLint + Prettier 사용
- TypeScript strict mode
- 컴포넌트는 PascalCase
- 파일명은 kebab-case (컴포넌트 제외)

### 커밋 메시지

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 리팩토링
test: 테스트 코드
chore: 빌드, 설정 파일 수정
```

## 문서

- [PRD (Product Requirements Document)](./Docs/PRD.md)
- [STACK (Tech Stack)](./Docs/STACK.md)
- [TODO (Development Roadmap)](./TODO.md)

## 라이선스

MIT
