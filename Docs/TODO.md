# CNC Quality Inspection KPI App - 개발 TODO

## Phase 1: 프로젝트 초기 셋업 ✅

### 1.1 개발 환경 구성 ✅
- [x] Vite + React + TypeScript 프로젝트 초기화
- [x] 패키지 설치 (TailwindCSS, shadcn/ui, TanStack Query, Zustand 등)
- [x] ESLint, Prettier 설정
- [x] Git 초기화 및 .gitignore 설정
- [x] 환경 변수 파일 (.env) 설정

### 1.2 Supabase 설정 (준비 완료, 실제 연결 대기)
- [ ] Supabase 프로젝트 생성
- [x] 데이터베이스 스키마 설계 및 SQL 작성 (Docs/supabase-schema.sql)
  - [x] users 테이블
  - [x] machines 테이블
  - [x] product_models 테이블
  - [x] inspection_items 테이블
  - [x] inspections 테이블
  - [x] inspection_results 테이블
  - [x] defects 테이블
- [x] Row Level Security (RLS) 정책 SQL 작성
- [ ] Storage Bucket 생성 (불량 사진 저장용) - Supabase 프로젝트 생성 후
- [x] Supabase 클라이언트 설정 (src/lib/supabase.ts)

### 1.3 기본 프로젝트 구조 생성 ✅
- [x] 디렉토리 구조 생성 (components, features, hooks, lib, pages, services, types)
- [x] TypeScript 타입 정의 파일 생성 (types/database.ts, types/analytics.ts)
- [x] 유틸리티 함수 작성 (lib/utils.ts)

---

## Phase 2: 기본 UI 및 레이아웃 구성 ✅

### 2.1 shadcn/ui 컴포넌트 설치 ✅
- [x] shadcn/ui 초기화 및 설정
- [x] 필수 컴포넌트 설치 (총 16개)
  - [x] Button, Input, Card
  - [x] Form, Label
  - [x] Table, Dialog
  - [x] Select, Checkbox
  - [x] Toast, Alert
  - [x] Tabs, Badge
  - [x] Calendar, Popover (날짜 선택기)
  - [x] Dropdown Menu

### 2.2 레이아웃 컴포넌트 구현 ✅
- [x] Header 컴포넌트 (로고, 네비게이션, 사용자 정보, 로그아웃)
- [x] Sidebar 컴포넌트 (메뉴, 모바일 반응형, 역할 기반 필터링)
- [x] Layout Wrapper 컴포넌트
- [x] Footer 컴포넌트 (옵션) - 생략

### 2.3 라우팅 설정 ✅
- [x] React Router 설치 및 설정
- [x] 기본 라우트 구조 정의
  - [x] /login
  - [x] /dashboard
  - [x] /inspection
  - [x] /defects
  - [x] /analytics (추가)
  - [x] /reports (추가)
  - [x] /management

---

## Phase 3: 인증 시스템 (Auth & RBAC) ✅

### 3.1 로그인/회원가입 기능 ✅
- [x] 로그인 페이지 UI 구현
- [x] Supabase Auth 준비 (실제 연결은 Supabase 프로젝트 생성 후)
- [x] 이메일/비밀번호 로그인 로직 구현
- [x] 로그아웃 기능 구현
- [x] 인증 상태 관리 (Zustand)

### 3.2 권한 관리 (RBAC) ✅
- [x] 사용자 역할 정의 (Admin, Manager, Inspector)
- [x] 역할 기반 라우트 보호 (Protected Routes)
- [x] 역할별 UI 조건부 렌더링 (Sidebar 메뉴)
- [x] RLS 정책 준비 (SQL 파일에 작성 완료)

---

## Phase 4: 마스터 데이터 관리 ✅

> **참고**: 설비 관리는 다른 애플리케이션에서 관리하므로 제외되었습니다.

### 4.1 제품 모델 관리 (Product Models) ✅
- [x] 제품 모델 목록 조회 (Table, 검색, 필터링)
- [x] 제품 모델 등록/수정/삭제 (Dialog + Form)
- [x] React Hook Form + Zod Validation
- [x] Mock 데이터 및 서비스 구현

### 4.2 검사 항목 관리 (Inspection Items) ✅
- [x] 검사 항목 목록 조회 (모델별 필터링)
- [x] 검사 항목 등록 Form (스펙, 공차 설정)
- [x] 검사 항목 수정/삭제
- [x] 데이터 타입 설정 (수치형, OK/NG형)
- [x] 모델별 검사 항목 연결

---

## Phase 5: 검사 데이터 입력 (Inspection Execution) ✅

### 5.1 검사 진입 화면 ✅
- [x] 설비 선택 UI (Dropdown - 다른 앱에서 관리하는 설비 목록)
- [x] 제품 모델 선택 UI
- [x] 검사 정보 확인 섹션
- [x] 검사 시작 버튼
- [ ] QR/바코드 스캔 기능 (html5-qrcode) - 향후 추가 예정

### 5.2 동적 검사 폼 ✅
- [x] 동적 검사 항목 폼 생성 (모델별 검사 항목 로드)
- [x] 측정값 입력 필드 (수치형 / OK/NG형)
- [x] 스펙 기준 자동 판정 로직 (Pass/Fail 실시간 표시)
- [x] 실시간 Validation 및 공차 체크
- [x] 진행률 표시 (완료/전체)
- [x] 합격/불합격 카운트 실시간 업데이트

### 5.3 검사 완료 및 저장 ✅
- [x] 검사 결과 저장 (inspections, inspection_results 테이블)
- [x] 전체 항목 입력 완료 검증
- [x] 검사 상태 자동 판정 (Pass/Fail)
- [x] Toast 알림으로 결과 표시
- [x] 검사 취소 기능

---

## Phase 6: 불량 관리 (Defect Management) ✅

### 6.1 불량 목록 및 상태 관리 ✅
- [x] 불량 목록 조회 (Table)
- [x] 상태별 필터링 (조치 대기 / 조치 중 / 조치 완료)
- [x] 검색 기능 (불량 유형, 설명)
- [x] KPI 요약 카드 (전체/대기/진행/완료 건수)
- [x] 불량 상태 변경 버튼 (조치 시작 / 조치 완료)

### 6.2 불량 상세 정보 ✅
- [x] 불량 상세 정보 Dialog
- [x] 불량 유형 및 설명 표시
- [x] 등록일시 표시
- [x] 불량 사진 표시 (있는 경우)
- [x] 상태별 다음 단계 액션 버튼

### 6.3 Mock 서비스 구현 ✅
- [x] 불량 CRUD 서비스 (getDefects, createDefect, updateDefectStatus)
- [x] 검사 서비스와 통합 (검사 실패 시 불량 등록 가능)

---

## Phase 7: KPI 대시보드 및 분석 (Dashboard & Analytics) 🚧 진행 중

### 7.1 기본 대시보드 (Dashboard Page)
- [x] 기본 KPI 카드 구현 (검사 건수, 합격률, 불량 건수, 평균 시간)
- [ ] 최근 검사 내역 테이블
- [ ] 실시간 데이터 반영

### 7.2 고급 분석 페이지 (Analytics Page) ✅
- [x] 날짜 범위 필터 (Calendar Picker)
- [x] 설비/모델별 필터
- [x] KPI 요약 카드 (6개 지표)
  - [x] 총 검사 건수
  - [x] 최초 합격률 (FPY)
  - [x] 불량률
  - [x] 평균 검사 시간
  - [x] 활동 검사자 수
  - [x] 품질 트렌드

### 7.3 차트 및 시각화 ✅
- [x] 불량률 추이 차트 (Line Chart - 일별 트렌드)
- [x] 모델별 불량 분포 (Bar Chart)
- [x] 설비별 성능 파레토 차트 (Bar Chart - 불량 건수 정렬)
- [x] 불량 유형 분포 (Pie Chart)
- [x] 시간대별 검사 분포 (Area Chart - 0-23시)
- [x] 검사자별 성능 (Bar Chart)

### 7.4 백엔드 로직 ✅
- [x] 분석 쿼리 서비스 작성 (src/services/analyticsService.ts)
  - [x] KPI 요약 쿼리
  - [x] 불량률 추이 쿼리
  - [x] 모델별 분포 쿼리
  - [x] 설비별 성능 쿼리
  - [x] 불량 유형 분포 쿼리
  - [x] 시간대별 분포 쿼리
  - [x] 검사자별 성능 쿼리

### 7.5 UI 테스트 시스템 ✅
- [x] Mock 데이터 생성 (src/ui_test/mockData/)
- [x] Mock 서비스 구현 (src/ui_test/mockServices/)
- [x] 실제 서비스와 동일한 인터페이스 유지
- [x] Supabase 연결 시 ui_test 폴더 삭제만 하면 됨

### 7.6 실시간 데이터 반영
- [ ] Supabase Realtime Subscription 설정
- [x] TanStack Query를 통한 데이터 동기화 및 캐싱
- [ ] 자동 새로고침 기능

---

## Phase 8: 보고서 및 알림 (Reporting & Alerts)

### 8.1 보고서 생성
- [ ] 날짜 범위 선택 UI (분석 페이지의 필터 재사용 가능)
- [ ] PDF 보고서 생성 (jspdf + jspdf-autotable)
- [ ] Excel 다운로드 기능
- [ ] 검사 성적서 템플릿 디자인

### 8.2 알림 시스템
- [ ] 연속 불량 발생 감지 로직
- [ ] KPI 목표 미달 감지
- [x] In-app Toast 알림 준비 (shadcn/ui Toast 설치됨)
- [ ] 이메일 알림 (Supabase Functions 활용)

---

## Phase 9: 모바일 최적화 및 반응형 디자인

### 9.1 모바일 UI 개선
- [ ] 터치 친화적 버튼 크기 조정
- [x] 모바일 네비게이션 (햄버거 메뉴 - Sidebar 구현됨)
- [ ] 검사 입력 폼 모바일 최적화
- [ ] 카메라 기능 최적화

### 9.2 반응형 디자인
- [x] Tailwind Responsive 클래스 적용 (기본 레이아웃)
- [ ] 데스크탑 vs 모바일 레이아웃 테스트
- [ ] 태블릿 화면 대응

---

## Phase 10: 성능 최적화 및 테스트

### 10.1 성능 최적화
- [ ] 코드 스플리팅 (React.lazy)
- [ ] 이미지 최적화 (압축, WebP 변환)
- [x] TanStack Query 캐싱 전략 설정 완료
- [ ] Lighthouse 성능 점수 90+ 목표

### 10.2 테스트
- [ ] 주요 기능 단위 테스트 (Vitest)
- [ ] E2E 테스트 (Playwright 또는 Cypress)
- [ ] 크로스 브라우저 테스트

---

## Phase 11: 배포 및 운영

### 11.1 Vercel 배포
- [x] GitHub 저장소 연동 완료 (https://github.com/batman3101/CNC_QC_KPI_ALT)
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

## 📊 현재 진행 상황 (2025-01-19 업데이트)

### ✅ 완료된 기능

1. **프로젝트 초기 셋업** (Phase 1-3)
   - Vite + React + TypeScript 환경
   - 모든 필수 라이브러리 설치
   - Git 저장소 초기화 및 GitHub 푸시
   - shadcn/ui 16개 컴포넌트
   - 반응형 레이아웃 (Header, Sidebar, Layout)
   - 7개 라우트 페이지
   - 로그인 페이지 및 Zustand 인증 스토어
   - Protected Routes 및 역할 기반 접근 제어 (RBAC)

2. **마스터 데이터 관리** (Phase 4) ⭐ 핵심 완료
   - 제품 모델 CRUD (목록, 등록, 수정, 삭제)
   - 검사 항목 CRUD (모델별 연결, 공차 설정)
   - React Hook Form + Zod Validation
   - Mock 데이터 및 서비스 구현

3. **검사 실행 기능** (Phase 5) ⭐ 핵심 완료
   - 검사 진입 화면 (설비/모델 선택)
   - 동적 검사 폼 (모델별 항목 자동 로드)
   - 실시간 공차 체크 및 Pass/Fail 판정
   - 진행률 및 결과 통계 실시간 표시
   - 검사 결과 저장 (inspections, inspection_results)

4. **불량 관리** (Phase 6) ⭐ 핵심 완료
   - 불량 목록 조회 및 상태별 필터링
   - KPI 요약 카드 (전체/대기/진행/완료)
   - 불량 상세 정보 Dialog
   - 불량 상태 변경 (조치 대기 → 조치 중 → 조치 완료)
   - Mock 서비스 구현

5. **분석 기능** (Phase 7) ⭐ 핵심 완료
   - 6종 고급 차트 (Recharts)
   - 동적 필터링 시스템
   - KPI 대시보드
   - Mock 데이터 시스템

### 🚧 다음 단계

1. **Supabase 실제 연결** (최우선)
   - 프로젝트 생성
   - 스키마 적용 (SQL 파일 실행, machines 테이블 제외)
   - 환경 변수 설정
   - ui_test 폴더 삭제 및 실제 데이터 연동

2. **보고서 및 알림** (Phase 8)
   - PDF/Excel 보고서 생성
   - 연속 불량 감지 알림

3. **모바일 최적화** (Phase 9)
   - 검사 입력 폼 모바일 최적화
   - 카메라 기능 추가

---

## 참고 문서

- [PRD.md](./PRD.md) - Product Requirements Document
- [STACK.md](./STACK.md) - Tech Stack & Development Environment
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - 개발 환경 셋업 가이드
- [supabase-schema.sql](./supabase-schema.sql) - 데이터베이스 스키마
