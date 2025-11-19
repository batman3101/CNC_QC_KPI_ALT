# Tech Stack & Development Environment

본 프로젝트는 빠르고 안정적인 풀스택 개발을 위해 아래의 기술 스택을 사용합니다.

## 1. Frontend (Client-Side)
* **Framework:** **React** (Vite 기반)
    * 빠른 빌드 속도와 최신 React 기능 활용.
* **Language:** **TypeScript**
    * 정적 타입 검사를 통한 런타임 오류 최소화 및 코드 안정성 확보.
* **Styling & UI Components:**
    * **Tailwind CSS:** 유틸리티 우선 CSS 프레임워크로 빠른 스타일링.
    * **shadcn/ui:** Radix UI 기반의 재사용 가능한 컴포넌트 라이브러리 (디자인 일관성 확보).
    * **Lucide React:** 아이콘 라이브러리.
* **State Management:**
    * **TanStack Query (React Query):** 서버 상태(Server State) 관리, 캐싱, 데이터 동기화 효율화.
    * **Zustand:** 클라이언트 전역 상태(검사 진행 중 임시 데이터 등) 관리.
* **Form & Validation:**
    * **React Hook Form:** 비제어 컴포넌트 기반의 고성능 폼 처리.
    * **Zod:** 스키마 기반 데이터 유효성 검사 (TypeScript와 강력한 호환).
* **Data Visualization (Chart):**
    * **Recharts:** React에 최적화된 차트 라이브러리 (KPI 대시보드 구현용).

## 2. Backend & Database (Serverless)
* **Platform:** **Supabase**
    * **Database:** PostgreSQL 기반. 강력한 관계형 데이터베이스.
    * **Auth:** 이메일 로그인 및 Row Level Security (RLS)를 통한 역할 기반 데이터 접근 제어.
    * **Storage:** 검사 불량 사진 저장을 위한 이미지 스토리지.
    * **Realtime:** 대시보드에 실시간 데이터 반영을 위한 Subscription 기능 활용.

## 3. Deployment & CI/CD
* **Platform:** **Vercel**
    * Frontend 호스팅 및 Serverless Functions 배포.
    * GitHub 연동을 통한 자동 배포(CI/CD) 파이프라인 구축.

## 4. 개발 도구 및 라이브러리 (Tools & Libs)
* **Package Manager:** `npm` 또는 `pnpm`
* **Date Handling:** `date-fns` (날짜 포맷팅 및 계산).
* **PDF Generation:** `react-pdf` 또는 `jspdf` (검사 보고서 출력용).
* **Barcode Scanning:** `react-qr-reader` (모바일 웹에서 QR/바코드 인식).

## 5. 프로젝트 구조 (Directory Structure Example)
```bash
src/
├── assets/         # 이미지, 폰트 등 정적 파일
├── components/     # 공통 컴포넌트 (Button, Input 등 - shadcn)
│   ├── ui/         # shadcn/ui 컴포넌트
│   └── layout/     # Header, Sidebar, LayoutWrapper
├── features/       # 기능별 모듈 (핵심 비즈니스 로직)
│   ├── auth/       # 로그인, 회원가입
│   ├── dashboard/  # 차트, KPI 요약
│   ├── inspection/ # 검사 폼, 검사 로직
│   └── management/ # 설비, 검사 항목 관리
├── hooks/          # 커스텀 React Hooks
├── lib/            # 유틸리티 함수, Supabase Client 설정
├── pages/          # 라우트 페이지 (React Router)
├── services/       # API 호출 함수 (Supabase 쿼리)
├── types/          # TypeScript 타입 정의 (DB 스키마 등)
└── App.tsx