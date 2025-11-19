# CNC Quality Inspection KPI App - 개발 TODO

## Phase 1: 프로젝트 초기 셋업 ✅

### 1.1 개발 환경 구성
- [ ] Vite + React + TypeScript 프로젝트 초기화
- [ ] 패키지 설치 (TailwindCSS, shadcn/ui, TanStack Query, Zustand 등)
- [ ] ESLint, Prettier 설정
- [ ] Git 초기화 및 .gitignore 설정
- [ ] 환경 변수 파일 (.env) 설정

### 1.2 Supabase 설정
- [ ] Supabase 프로젝트 생성
- [ ] 데이터베이스 스키마 설계 및 테이블 생성
  - [ ] users 테이블
  - [ ] machines 테이블
  - [ ] product_models 테이블
  - [ ] inspection_items 테이블
  - [ ] inspections 테이블
  - [ ] inspection_results 테이블
  - [ ] defects 테이블
- [ ] Row Level Security (RLS) 정책 설정
- [ ] Storage Bucket 생성 (불량 사진 저장용)
- [ ] Supabase 클라이언트 설정 (src/lib/supabase.ts)

### 1.3 기본 프로젝트 구조 생성
- [ ] 디렉토리 구조 생성 (components, features, hooks, lib, pages, services, types)
- [ ] TypeScript 타입 정의 파일 생성 (types/database.ts)
- [ ] 유틸리티 함수 작성 (lib/utils.ts)

---

## Phase 2: 기본 UI 및 레이아웃 구성

### 2.1 shadcn/ui 컴포넌트 설치
- [ ] shadcn/ui 초기화 및 설정
- [ ] 필수 컴포넌트 설치
  - [ ] Button, Input, Card
  - [ ] Form, Label
  - [ ] Table, Dialog
  - [ ] Select, Checkbox
  - [ ] Toast, Alert
  - [ ] Tabs, Badge

### 2.2 레이아웃 컴포넌트 구현
- [ ] Header 컴포넌트 (로고, 네비게이션, 사용자 정보)
- [ ] Sidebar 컴포넌트 (메뉴, 모바일 반응형)
- [ ] Layout Wrapper 컴포넌트
- [ ] Footer 컴포넌트 (옵션)

### 2.3 라우팅 설정
- [ ] React Router 설치 및 설정
- [ ] 기본 라우트 구조 정의
  - [ ] /login
  - [ ] /dashboard
  - [ ] /inspection
  - [ ] /management
  - [ ] /settings

---

## Phase 3: 인증 시스템 (Auth & RBAC)

### 3.1 로그인/회원가입 기능
- [ ] 로그인 페이지 UI 구현
- [ ] Supabase Auth 연동
- [ ] 이메일/비밀번호 로그인 구현
- [ ] 로그아웃 기능 구현
- [ ] 인증 상태 관리 (Zustand)

### 3.2 권한 관리 (RBAC)
- [ ] 사용자 역할 정의 (Admin, Manager, Inspector)
- [ ] 역할 기반 라우트 보호 (Protected Routes)
- [ ] 역할별 UI 조건부 렌더링
- [ ] RLS 정책과 연동

---

## Phase 4: 마스터 데이터 관리

### 4.1 설비 관리 (Machines)
- [ ] 설비 목록 조회 페이지 (Table)
- [ ] 설비 등록 Dialog/Form
- [ ] 설비 수정 기능
- [ ] 설비 삭제 기능
- [ ] 설비 검색 및 필터링

### 4.2 제품 모델 관리 (Product Models)
- [ ] 제품 모델 목록 조회
- [ ] 제품 모델 등록/수정/삭제
- [ ] 모델별 검사 항목 연결

### 4.3 검사 항목 관리 (Inspection Items)
- [ ] 검사 항목 목록 조회 (모델별)
- [ ] 검사 항목 등록 Form (스펙, 공차 설정)
- [ ] 검사 항목 수정/삭제
- [ ] 데이터 타입 설정 (수치형, OK/NG형)

---

## Phase 5: 검사 데이터 입력 (Inspection Execution)

### 5.1 검사 진입 화면
- [ ] 설비 선택 UI (Dropdown/Card)
- [ ] 제품 모델 선택 UI
- [ ] QR/바코드 스캔 기능 (react-qr-reader)
- [ ] 검사 시작 버튼

### 5.2 실시간 입력 폼
- [ ] 동적 검사 항목 폼 생성
- [ ] 측정값 입력 필드 (React Hook Form + Zod)
- [ ] 스펙 기준 자동 판정 로직 (Pass/Fail 실시간 표시)
- [ ] 비정상 값 입력 시 Validation 경고
- [ ] 입력 중 임시 저장 기능 (Zustand)

### 5.3 증빙 자료 업로드
- [ ] 모바일 카메라 연동
- [ ] 사진 업로드 기능 (Supabase Storage)
- [ ] 사진 미리보기 및 삭제

### 5.4 검사 완료 및 저장
- [ ] 검사 결과 저장 (inspections, inspection_results 테이블)
- [ ] 검사 완료 확인 Dialog
- [ ] 검사 중단/보류 기능 (사유 입력)

---

## Phase 6: 불량 관리 (Defect Management)

### 6.1 불량 등록
- [ ] Fail 발생 시 자동 불량 등록 팝업
- [ ] 불량 유형(코드) 선택 Dropdown
- [ ] 불량 위치 입력
- [ ] 불량 사진 업로드
- [ ] 비고 입력

### 6.2 불량 처리 프로세스
- [ ] 불량 목록 조회 (상태별 필터링)
- [ ] 불량 상태 변경 (조치 대기 → 조치 완료)
- [ ] 불량 상세 정보 Dialog
- [ ] 불량 처리 이력 추적

---

## Phase 7: KPI 대시보드 (Dashboard)

### 7.1 KPI 위젯 구현
- [ ] 검사 건수 카드 (금일/주간/월간)
- [ ] 불량률 카드 및 추세 그래프 (Recharts)
- [ ] 최초 합격률 (FPY) 카드
- [ ] 평균 검사 소요 시간 카드

### 7.2 차트 및 시각화
- [ ] 모델별 불량 파레토 차트 (Bar Chart)
- [ ] 설비별 불량 분포 차트
- [ ] 기간별 품질 추이 라인 차트
- [ ] 날짜 범위 선택 필터

### 7.3 실시간 데이터 반영
- [ ] Supabase Realtime Subscription 설정
- [ ] TanStack Query를 통한 데이터 동기화
- [ ] 자동 새로고침 기능

---

## Phase 8: 보고서 및 알림 (Reporting & Alerts)

### 8.1 보고서 생성
- [ ] 날짜 범위 선택 UI
- [ ] PDF 보고서 생성 (react-pdf 또는 jspdf)
- [ ] Excel 다운로드 기능
- [ ] 검사 성적서 템플릿 디자인

### 8.2 알림 시스템
- [ ] 연속 불량 발생 감지 로직
- [ ] KPI 목표 미달 감지
- [ ] In-app Toast 알림 구현 (shadcn/ui Toast)
- [ ] 이메일 알림 (Supabase Functions 활용)

---

## Phase 9: 모바일 최적화 및 반응형 디자인

### 9.1 모바일 UI 개선
- [ ] 터치 친화적 버튼 크기 조정
- [ ] 모바일 네비게이션 (햄버거 메뉴)
- [ ] 검사 입력 폼 모바일 최적화
- [ ] 카메라 기능 최적화

### 9.2 반응형 디자인
- [ ] Tailwind Responsive 클래스 적용
- [ ] 데스크탑 vs 모바일 레이아웃 테스트
- [ ] 태블릿 화면 대응

---

## Phase 10: 성능 최적화 및 테스트

### 10.1 성능 최적화
- [ ] 코드 스플리팅 (React.lazy)
- [ ] 이미지 최적화 (압축, WebP 변환)
- [ ] TanStack Query 캐싱 전략 최적화
- [ ] Lighthouse 성능 점수 90+ 목표

### 10.2 테스트
- [ ] 주요 기능 단위 테스트 (Vitest)
- [ ] E2E 테스트 (Playwright 또는 Cypress)
- [ ] 크로스 브라우저 테스트

---

## Phase 11: 배포 및 운영

### 11.1 Vercel 배포
- [ ] GitHub 저장소 연동
- [ ] Vercel 프로젝트 생성 및 배포
- [ ] 환경 변수 설정 (Supabase URL, API Key)
- [ ] 자동 배포 (CI/CD) 파이프라인 구성

### 11.2 모니터링 및 로깅
- [ ] Sentry 또는 LogRocket 연동 (에러 추적)
- [ ] Google Analytics 연동 (사용자 분석)
- [ ] Supabase 로그 모니터링

---

## Phase 12: 추가 기능 (Optional)

- [ ] 다국어 지원 (i18n)
- [ ] 다크 모드 지원
- [ ] PWA (Progressive Web App) 변환
- [ ] 오프라인 모드 (Service Worker)
- [ ] 알림 설정 커스터마이징
- [ ] 사용자별 대시보드 위젯 커스터마이징

---

## 참고 문서

- [PRD.md](./Docs/PRD.md) - Product Requirements Document
- [STACK.md](./Docs/STACK.md) - Tech Stack & Development Environment
