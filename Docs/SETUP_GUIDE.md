# 개발 환경 셋업 가이드

## 현재 완료된 작업

### Phase 1: 프로젝트 초기 셋업 ✅
- [x] Vite + React + TypeScript 프로젝트 구조 생성
- [x] 모든 필수 패키지 설치 완료
- [x] Tailwind CSS 및 shadcn/ui 컴포넌트 설치
- [x] 기본 디렉토리 구조 생성
- [x] 환경 변수 파일 (.env) 생성

### Phase 2: 기본 UI 및 레이아웃 ✅
- [x] shadcn/ui 초기화 (16개 컴포넌트 설치)
- [x] Header 컴포넌트 구현 (사용자 메뉴, 로그아웃 포함)
- [x] Sidebar 컴포넌트 구현 (역할 기반 메뉴)
- [x] Layout Wrapper 구현

### Phase 3: 인증 시스템 ✅
- [x] Zustand 인증 스토어 구현
- [x] Supabase Auth 통합
- [x] useAuth 커스텀 훅 구현
- [x] Protected Routes 구현
- [x] 역할 기반 접근 제어 (RBAC)
- [x] 로그인 페이지 완성

### Phase 4: 라우팅 및 페이지 ✅
- [x] React Router 설정
- [x] 기본 페이지 생성 (Dashboard, Inspection, Defects, Reports, Management)
- [x] 개발 서버 실행 (http://localhost:5173)

---

## 다음 단계: Supabase 설정

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속 및 회원가입/로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: CNC-QC-KPI
   - **Database Password**: 안전한 비밀번호 설정 (반드시 기억하세요!)
   - **Region**: Northeast Asia (Seoul) 권장
4. 프로젝트 생성 대기 (약 2-3분)

### 2. 데이터베이스 스키마 설정

1. Supabase 대시보드에서 **SQL Editor** 메뉴 클릭
2. "New query" 클릭
3. `Docs/supabase-schema.sql` 파일의 내용을 복사하여 붙여넣기
4. **Run** 버튼 클릭하여 실행
5. 성공 메시지 확인

이 스크립트는 다음을 자동으로 생성합니다:
- 7개의 테이블 (users, machines, product_models, inspection_items, inspections, inspection_results, defects)
- 인덱스 (성능 최적화)
- Row Level Security (RLS) 정책 (역할 기반 접근 제어)
- 회원가입 시 자동으로 users 테이블에 프로필 생성하는 트리거

### 3. Storage 버킷 생성

1. Supabase 대시보드에서 **Storage** 메뉴 클릭
2. "New bucket" 클릭
3. 버킷 정보 입력:
   - **Name**: `defect-photos`
   - **Public bucket**: 체크 (불량 사진 공개 접근 허용)
4. "Create bucket" 클릭

### 4. 환경 변수 설정

1. Supabase 대시보드에서 **Settings** → **API** 메뉴 클릭
2. **Project URL**과 **anon public** 키 복사
3. 프로젝트의 `.env` 파일 열기
4. 다음과 같이 수정:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

5. 파일 저장

### 5. 개발 서버 재시작

환경 변수 변경 후 개발 서버를 재시작해야 합니다:

```bash
# 현재 실행 중인 서버 종료 (Ctrl + C)
# 다시 시작
npm run dev
```

### 6. 테스트 계정 생성

1. 브라우저에서 `http://localhost:5173/login` 접속
2. Supabase 대시보드의 **Authentication** → **Users** 메뉴에서 "Add user" 클릭
3. 이메일과 비밀번호 입력 후 생성
4. **또는** Supabase SQL Editor에서 직접 생성:

```sql
-- 테스트 계정 생성 (Supabase Auth를 통해)
-- Authentication > Users에서 먼저 이메일/비밀번호로 사용자 생성 후
-- 해당 사용자의 ID를 아래 쿼리에서 사용

-- 예시: Manager 역할 부여
UPDATE public.users
SET role = 'manager', name = '관리자'
WHERE email = 'manager@example.com';

-- 예시: Admin 역할 부여
UPDATE public.users
SET role = 'admin', name = '관리자'
WHERE email = 'admin@example.com';
```

---

## 현재 작동하는 기능

1. **로그인/로그아웃**
   - `/login` 페이지에서 Supabase Auth를 통한 인증
   - Header의 드롭다운 메뉴에서 로그아웃

2. **역할 기반 접근 제어**
   - Inspector: 대시보드, 검사 실행, 불량 관리 접근 가능
   - Manager: Inspector 권한 + 보고서, 관리 메뉴 접근
   - Admin: 모든 메뉴 접근

3. **반응형 레이아웃**
   - 모바일: 햄버거 메뉴로 사이드바 토글
   - 데스크탑: 고정 사이드바

4. **페이지 네비게이션**
   - 대시보드 (/)
   - 검사 실행 (/inspection)
   - 불량 관리 (/defects)
   - 보고서 (/reports) - Manager, Admin만
   - 관리 (/management) - Manager, Admin만

---

## 다음 개발 단계 (TODO.md 참고)

### Phase 4: 마스터 데이터 관리
- [ ] 설비 관리 CRUD 구현
- [ ] 제품 모델 관리 CRUD 구현
- [ ] 검사 항목 관리 CRUD 구현

### Phase 5: 검사 데이터 입력
- [ ] 검사 진입 화면 (설비/모델 선택)
- [ ] 동적 검사 폼 생성
- [ ] 실시간 Pass/Fail 판정
- [ ] 사진 업로드 기능

### Phase 6: 불량 관리
- [ ] 불량 등록 및 조회
- [ ] 불량 상태 변경
- [ ] 불량 사진 관리

### Phase 7: KPI 대시보드
- [ ] KPI 카드 위젯 (검사 건수, 불량률, FPY, 평균 시간)
- [ ] Recharts를 사용한 차트 구현
- [ ] 실시간 데이터 반영

---

## 개발 팁

### 개발 서버 명령어

```bash
npm run dev      # 개발 서버 시작
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
npm run lint     # ESLint 실행
```

### shadcn/ui 컴포넌트 추가

```bash
npx shadcn@latest add [component-name]
```

### Supabase 쿼리 테스트

Supabase 대시보드의 SQL Editor에서 쿼리를 직접 테스트할 수 있습니다.

### 유용한 링크

- [Supabase 문서](https://supabase.com/docs)
- [shadcn/ui 컴포넌트](https://ui.shadcn.com/docs/components)
- [TanStack Query 문서](https://tanstack.com/query/latest)
- [Recharts 예제](https://recharts.org/en-US/examples)

---

## 문제 해결

### Supabase 연결 오류
- `.env` 파일의 URL과 API Key 확인
- 개발 서버 재시작 확인
- Supabase 프로젝트가 활성화 상태인지 확인

### 로그인 실패
- Supabase Authentication에서 사용자가 생성되었는지 확인
- Email 인증이 필요한 경우 Supabase 설정에서 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 페이지 접근 거부
- 사용자의 role이 올바르게 설정되었는지 확인
- RLS 정책이 올바르게 적용되었는지 확인
