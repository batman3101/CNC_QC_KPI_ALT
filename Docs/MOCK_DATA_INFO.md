# Mock 데이터 정보

## 개요

이 파일은 프론트엔드 테스트를 위한 Mock 데이터의 구조와 내용을 설명합니다.

## 📊 데이터 규모

- **검사 데이터**: 600건 (최근 90일)
  - 일반 검사: 500건
  - Edge Cases: 100건
- **불량 데이터**: 약 25-35건 (검사 실패 건수 기반)
- **설비**: 10개
- **제품 모델**: 15개
- **사용자**: 15명 (관리자 2명, 매니저 3명, 검사자 10명)

## Mock 서비스 파일

### 1. mockAuthService.ts

**테스트 계정 (15명):**

**관리자 (2명):**
```typescript
{ email: 'admin@test.com', password: 'password123', name: '김관리' }
{ email: 'admin2@test.com', password: 'password123', name: '이관리' }
```

**매니저 (3명):**
```typescript
{ email: 'manager@test.com', password: 'password123', name: '박매니저' }
{ email: 'manager2@test.com', password: 'password123', name: '정매니저' }
{ email: 'manager3@test.com', password: 'password123', name: '최매니저' }
```

**검사자 (10명):**
```typescript
{ email: 'inspector@test.com', password: 'password123', name: '김철수' }
{ email: 'inspector2@test.com', password: 'password123', name: '이영희' }
{ email: 'inspector3@test.com', password: 'password123', name: '박민수' }
{ email: 'inspector4@test.com', password: 'password123', name: '정수연' }
{ email: 'inspector5@test.com', password: 'password123', name: '최동욱' }
{ email: 'inspector6@test.com', password: 'password123', name: '강미영' }
{ email: 'inspector7@test.com', password: 'password123', name: '윤성호' }
{ email: 'inspector8@test.com', password: 'password123', name: '임지은' }
{ email: 'inspector9@test.com', password: 'password123', name: '한상우' }
{ email: 'inspector10@test.com', password: 'password123', name: '송민지' }
```

### 2. mockInspectionService.ts

**검사 데이터 (600건):**
- 생성 날짜: 최근 90일
- 상태 분포: Pass 약 96%, Fail 약 4% (설비별로 다름)
- 설비: 10개
  - CNC 밀링 #1, #2 (Haas VF-2, DMG Mori NLX 2500)
  - CNC 선반 #1, #2 (Mazak Integrex i-200, Okuma LB3000)
  - CNC 복합기 #1 (DMG Mori NTX 1000)
  - 머시닝센터 #1, #2 (Brother S1000, Doosan DNM 400)
  - 연삭기 #1, #2 (Studer S31, Okamoto ACC-52)
  - EDM 방전기 #1 (Sodick AQ360L)
- 모델: 15개 (BHB-002, SHA-001, FLC-003, GAD-004, CNE-005, PST-006, CYL-007, VAL-008, SPR-009, BLT-010, NUT-011, WSH-012, PIN-013, BRK-014, PLT-015)

**시간대별 패턴:**
- 근무 시간: 7:00-18:00
- 점심 시간: 12:00-13:00 (검사 적음)
- 주중 패턴: 월요일 80%, 수요일 120%, 금요일 90%
- 주말: 20% (특별 근무)

**불량 데이터 (25-35건, 검사 실패 건수에 따라 자동 생성):**
- 불량 유형 (가중치):
  - 치수 불량: 40%
  - 표면 불량: 25%
  - 형상 불량: 15%
  - 재질 불량: 10%
  - 조립 불량: 5%
  - 도장 불량: 3%
  - 기타: 2%
- 상태 분포 (날짜 기반 자동 결정):
  - 최근 3일 이내: pending 70%, in_progress 30%
  - 3-7일: pending 30%, in_progress 30%, resolved 40%
  - 7일 이상: resolved 80%, in_progress 20%

**검사 항목 (모델별 5개씩):**
```typescript
{
  name: '길이',
  standard_value: 100,
  tolerance_min: 99.5,
  tolerance_max: 100.5,
  unit: 'mm',
  data_type: 'numeric'
}
```

### 3. mockAnalyticsService.ts

**KPI 요약:**
- 총 검사: 245건
- 합격: 231건 (94.3%)
- 불합격: 14건 (5.7%)
- 총 불량: 18건
- 평균 검사 시간: 4.2분
- 활동 검사자: 3명

**불량 유형별 분포:**
- 치수 불량: 8건 (44%)
- 표면 불량: 5건 (28%)
- 형상 불량: 3건 (17%)
- 기타: 2건 (11%)

**설비별 성능:**
```typescript
{
  machine_name: 'CNC 밀링 #1',
  total_inspections: 102,
  pass_rate: 95.1%
},
{
  machine_name: 'CNC 밀링 #2',
  total_inspections: 89,
  pass_rate: 93.3%
},
{
  machine_name: 'CNC 선반 #1',
  total_inspections: 54,
  pass_rate: 94.4%
}
```

**모델별 성능:**
```typescript
{
  model_name: 'BHB-002',
  total_inspections: 78,
  pass_rate: 96.2%
},
{
  model_name: 'SHA-001',
  total_inspections: 65,
  pass_rate: 92.3%
},
{
  model_name: 'FLC-003',
  total_inspections: 54,
  pass_rate: 94.4%
},
{
  model_name: 'GAD-004',
  total_inspections: 48,
  pass_rate: 93.8%
}
```

### 4. mockManagementService.ts

**제품 모델 (15개):**
```typescript
BHB-002: 베어링 하우징 B형
SHA-001: 샤프트 A형
FLC-003: 플랜지 C형
GAD-004: 기어 조립체 D형
CNE-005: 커넥터 E형
PST-006: 피스톤 F형
CYL-007: 실린더 G형
VAL-008: 밸브 H형
SPR-009: 스프링 I형
BLT-010: 볼트 J형
NUT-011: 너트 K형
WSH-012: 와셔 L형
PIN-013: 핀 M형
BRK-014: 브래킷 N형
PLT-015: 플레이트 O형
```

**검사 항목 (모델별 5개씩, 총 75개):**
- 수치형 데이터: 길이, 직경, 두께, 무게 등
- OK/NG 데이터: 외관 검사

**설비별 불량률:**
- machine-003 (Mazak): 2.0% (최고 성능)
- machine-010 (EDM): 2.5%
- machine-002 (DMG Mori): 3.0%
- machine-008 (Studer): 3.0%
- machine-004 (Okuma): 3.5%
- machine-001 (Haas): 4.0%
- machine-007 (Doosan): 4.0%
- machine-005 (DMG Mori Complex): 4.5%
- machine-006 (Brother): 5.0% (노후 설비)
- machine-009 (Okamoto): 5.5% (가장 나쁨)

### 5. mockReportService.ts

**기존 리포트 (5개):**
```typescript
{
  id: 'report-001',
  title: '일일 품질 리포트 - 2025-01-19',
  type: 'daily',
  format: 'pdf',
  status: 'completed',
  date_from: '2025-01-19',
  date_to: '2025-01-19'
},
{
  id: 'report-002',
  title: '주간 품질 리포트 - 2025년 3주차',
  type: 'weekly',
  format: 'pdf',
  status: 'completed',
  date_from: '2025-01-13',
  date_to: '2025-01-19'
},
{
  id: 'report-003',
  title: '월간 품질 리포트 - 2024년 12월',
  type: 'monthly',
  format: 'excel',
  status: 'completed',
  date_from: '2024-12-01',
  date_to: '2024-12-31'
},
{
  id: 'report-004',
  title: '맞춤 리포트 - CNC 밀링 #1 분석',
  type: 'custom',
  format: 'pdf',
  status: 'completed',
  date_from: '2025-01-01',
  date_to: '2025-01-19',
  machine_id: 'machine-001'
},
{
  id: 'report-005',
  title: '생성 중인 리포트',
  type: 'daily',
  format: 'pdf',
  status: 'generating',
  date_from: '2025-01-20',
  date_to: '2025-01-20'
}
```

## Mock 데이터 수정 방법

### 검사 데이터 추가

`src/ui_test/mockServices/mockInspectionService.ts` 파일 수정:

```typescript
export const mockInspections: Inspection[] = [
  {
    id: 'new-inspection-id',
    user_id: 'user-001',
    machine_id: 'machine-001',
    model_id: 'model-001',
    status: 'pass',
    created_at: new Date().toISOString(),
  },
  // 기존 데이터...
]
```

### 불량 유형 추가

```typescript
const defectTypes = [
  '치수 불량',
  '표면 불량',
  '형상 불량',
  '재질 불량',  // 새로 추가
  '기타',
]
```

### 제품 모델 추가

```typescript
export const mockProductModels: ProductModel[] = [
  {
    id: 'model-new',
    code: 'NEW-001',
    name: '신규 제품',
    created_at: new Date().toISOString(),
  },
  // 기존 데이터...
]
```

## API 응답 시간 조정

`src/config/app.config.ts` 파일에서 조정:

```typescript
export const MOCK_CONFIG = {
  apiDelay: 500,      // 일반 API 응답 지연 (밀리초)
  loginDelay: 1000,   // 로그인 응답 지연
}
```

## Mock vs Real 데이터 차이점

### Mock 모드
- ✅ 빠른 프론트엔드 개발/테스트
- ✅ Supabase 연결 불필요
- ✅ 데이터 즉시 수정 가능
- ✅ 네트워크 오류 없음
- ❌ 실제 데이터베이스 제약 없음
- ❌ 동시성 제어 없음

### Real 모드 (Supabase)
- ✅ 실제 데이터베이스 제약 적용
- ✅ 동시성 제어
- ✅ 실제 사용자 간 데이터 공유
- ✅ 트랜잭션 지원
- ❌ 네트워크 의존
- ❌ Supabase 설정 필요

## 테스트 시나리오별 데이터

### 시나리오 1: 정상 검사 흐름
1. 로그인: inspector@test.com
2. 설비 선택: CNC 밀링 #1
3. 모델 선택: BHB-002
4. 검사 항목 5개 로드
5. 모든 측정값을 공차 범위 내로 입력
6. 결과: Pass

### 시나리오 2: 불량 발생 및 처리
1. 로그인: inspector@test.com
2. 검사 실행 중 공차 범위 밖 값 입력
3. 결과: Fail, 불량 자동 등록
4. 로그인: manager@test.com
5. 불량 관리에서 상태를 "처리중"으로 변경
6. 조치 완료 후 "완료"로 변경

### 시나리오 3: 리포트 생성 및 분석
1. 로그인: manager@test.com
2. 분석 페이지에서 30일 데이터 확인
3. 리포트 페이지에서 월간 리포트 생성 (PDF)
4. 다운로드하여 내용 확인
5. Excel 형식으로도 생성하여 비교

## 데이터 일관성 유지

Mock 데이터는 브라우저 세션 동안만 유지됩니다:
- 새로고침: 데이터 유지 ✅
- 브라우저 종료: 데이터 초기화 ⚠️
- localStorage/sessionStorage: 사용하지 않음

따라서 테스트 후 항상 초기 상태로 돌아갑니다.

## 문제 해결

### 데이터가 표시되지 않을 때
1. `USE_MOCK_MODE = true` 확인
2. 브라우저 콘솔에서 에러 확인
3. Mock 서비스 파일의 데이터 구조 확인

### 데이터가 저장되지 않을 때
- Mock 모드에서는 데이터가 메모리에만 저장됨
- 페이지 새로고침 시 유지되지만 브라우저 종료 시 초기화됨
- 영구 저장이 필요하면 Real 모드 사용

---

**마지막 업데이트:** 2025-01-20
