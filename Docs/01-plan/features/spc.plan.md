# SPC (Statistical Process Control) 기능 구현 계획

> **Feature**: SPC - 통계적 공정 관리
> **Created**: 2026-02-05
> **Status**: Planning
> **Priority**: High

---

## 1. 개요 (Overview)

### 1.1 목적
CNC 품질 검사 데이터를 기반으로 통계적 공정 관리(SPC) 기능을 구현하여:
- 공정의 안정성을 실시간 모니터링
- 이상 패턴을 조기에 감지하여 선제적 조치
- 공정능력지수(Cp/Cpk)를 통한 품질 수준 정량화

### 1.2 배경
현재 시스템은 불량률 추이, 모델별/설비별 분석 등 기본적인 KPI를 제공하지만,
업계 표준인 SPC 관리도 및 공정능력분석 기능이 부재함.

### 1.3 기대 효과
| 항목 | 현재 | 도입 후 |
|------|------|---------|
| 이상 감지 | 사후 분석 | 실시간 알림 |
| 공정 평가 | 불량률만 확인 | Cp/Cpk 정량 평가 |
| 품질 예측 | 불가 | 트렌드 기반 예측 |

---

## 2. 요구사항 (Requirements)

### 2.1 기능 요구사항 (Functional Requirements)

#### FR-01: 관리도 (Control Charts)
| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01-1 | X-bar R 관리도: 연속 측정값의 평균 및 범위 추적 | High |
| FR-01-2 | X-MR 관리도: 개별값 및 이동범위 추적 | High |
| FR-01-3 | p 관리도: 불량률 추적 (현재 데이터 구조에 적합) | High |
| FR-01-4 | np 관리도: 불량 개수 추적 | Medium |
| FR-01-5 | 관리한계선 자동 계산 (UCL, CL, LCL) | High |
| FR-01-6 | 관리한계선 수동 설정 기능 | Medium |

#### FR-02: 공정능력분석 (Process Capability)
| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-02-1 | Cp (공정능력지수) 계산 | High |
| FR-02-2 | Cpk (공정능력지수 - 치우침 고려) 계산 | High |
| FR-02-3 | Pp/Ppk (공정성능지수) 계산 | Medium |
| FR-02-4 | 히스토그램 표시 (규격 한계 포함) | High |
| FR-02-5 | 정규성 검정 결과 표시 | Low |

#### FR-03: 이상 감지 및 알림 (Out-of-Control Detection)
| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-03-1 | 관리한계 초과 감지 (점이 UCL/LCL 밖) | High |
| FR-03-2 | 런(Run) 규칙: 연속 7점 상승/하강 | High |
| FR-03-3 | 트렌드 규칙: 연속 7점 중심선 한쪽 | High |
| FR-03-4 | 2/3 규칙: 3점 중 2점이 경고구역 | Medium |
| FR-03-5 | 실시간 알림 발송 (in-app notification) | High |
| FR-03-6 | 이메일/SMS 알림 (선택적) | Low |

#### FR-04: SPC 대시보드
| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-04-1 | 제품 모델별 SPC 현황 요약 | High |
| FR-04-2 | 검사 항목별 관리도 선택 조회 | High |
| FR-04-3 | 기간별 필터링 | High |
| FR-04-4 | 공정별 필터링 | Medium |
| FR-04-5 | 설비별 필터링 | Medium |
| FR-04-6 | CSV/Excel 내보내기 | Medium |

#### FR-05: 관리한계 설정 관리
| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-05-1 | 검사 항목별 관리한계 저장 | High |
| FR-05-2 | 관리한계 이력 관리 | Medium |
| FR-05-3 | 규격 한계(USL/LSL) 관리 | High |

### 2.2 비기능 요구사항 (Non-Functional Requirements)

| ID | 요구사항 | 기준 |
|----|----------|------|
| NFR-01 | 성능 | 1000개 데이터 포인트 렌더링 < 2초 |
| NFR-02 | 반응형 | 모바일/태블릿에서 차트 가독성 확보 |
| NFR-03 | 다국어 | 한국어/베트남어 완전 지원 |
| NFR-04 | 접근성 | manager, admin 역할만 접근 |
| NFR-05 | 오프라인 | 오프라인 시 캐시된 데이터로 조회 가능 |

---

## 3. 데이터 모델 (Data Model)

### 3.1 현재 활용 가능한 데이터

```
inspections 테이블:
- inspection_quantity (검사 수량)
- defect_quantity (불량 수량)
- model_id, machine_id, inspection_process
- created_at

inspection_results 테이블:
- measured_value (실측값) ← SPC 핵심 데이터
- item_id (검사 항목)
- result (pass/fail)

inspection_items 테이블:
- standard_value (표준값)
- tolerance_min, tolerance_max (공차)
- data_type (numeric/ok_ng)
```

### 3.2 신규 테이블 설계

#### spc_control_limits (관리한계 설정)
```sql
CREATE TABLE spc_control_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES inspection_items(id),  -- 검사 항목
  model_id UUID REFERENCES product_models(id),   -- 제품 모델
  process_id UUID REFERENCES inspection_processes(id), -- 공정 (optional)

  -- 관리한계
  ucl DECIMAL(10,4),          -- Upper Control Limit
  cl DECIMAL(10,4),           -- Center Line
  lcl DECIMAL(10,4),          -- Lower Control Limit

  -- 규격한계 (inspection_items에서 가져오거나 별도 설정)
  usl DECIMAL(10,4),          -- Upper Specification Limit
  lsl DECIMAL(10,4),          -- Lower Specification Limit

  -- 공정능력
  cp DECIMAL(6,3),            -- Process Capability
  cpk DECIMAL(6,3),           -- Process Capability Index
  pp DECIMAL(6,3),            -- Process Performance
  ppk DECIMAL(6,3),           -- Process Performance Index

  -- 계산 기준 정보
  sample_size INT,            -- 샘플 크기
  calculated_at TIMESTAMPTZ,  -- 계산 시점
  data_from DATE,             -- 데이터 시작일
  data_to DATE,               -- 데이터 종료일

  -- 메타데이터
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### spc_alerts (SPC 알림)
```sql
CREATE TABLE spc_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 연결 정보
  inspection_result_id UUID REFERENCES inspection_results(id),
  item_id UUID REFERENCES inspection_items(id),
  model_id UUID REFERENCES product_models(id),

  -- 알림 정보
  alert_type VARCHAR(50) NOT NULL,  -- 'ucl_exceeded', 'lcl_exceeded', 'run_rule', 'trend_rule', 'two_thirds_rule'
  rule_description TEXT,            -- 위반 규칙 설명
  measured_value DECIMAL(10,4),     -- 위반 시점 측정값
  control_limit_value DECIMAL(10,4), -- 관리한계값

  -- 상태
  severity VARCHAR(20) DEFAULT 'warning', -- 'info', 'warning', 'critical'
  status VARCHAR(20) DEFAULT 'open',      -- 'open', 'acknowledged', 'resolved'
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### spc_control_limit_history (관리한계 이력)
```sql
CREATE TABLE spc_control_limit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_limit_id UUID REFERENCES spc_control_limits(id),

  -- 이전 값
  previous_ucl DECIMAL(10,4),
  previous_cl DECIMAL(10,4),
  previous_lcl DECIMAL(10,4),
  previous_cp DECIMAL(6,3),
  previous_cpk DECIMAL(6,3),

  -- 변경 사유
  change_reason TEXT,
  changed_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 TypeScript 타입 정의

```typescript
// src/types/spc.ts

export interface SPCControlLimit {
  id: string
  item_id: string
  model_id: string
  process_id?: string

  // Control Limits
  ucl: number
  cl: number
  lcl: number

  // Specification Limits
  usl: number
  lsl: number

  // Process Capability
  cp: number
  cpk: number
  pp?: number
  ppk?: number

  // Calculation Info
  sample_size: number
  calculated_at: string
  data_from: string
  data_to: string

  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SPCAlert {
  id: string
  inspection_result_id: string
  item_id: string
  model_id: string

  alert_type: 'ucl_exceeded' | 'lcl_exceeded' | 'run_rule' | 'trend_rule' | 'two_thirds_rule'
  rule_description: string
  measured_value: number
  control_limit_value: number

  severity: 'info' | 'warning' | 'critical'
  status: 'open' | 'acknowledged' | 'resolved'
  acknowledged_by?: string
  acknowledged_at?: string
  resolved_by?: string
  resolved_at?: string
  resolution_note?: string

  created_at: string
}

export interface SPCChartData {
  points: SPCDataPoint[]
  controlLimits: {
    ucl: number
    cl: number
    lcl: number
    usl?: number
    lsl?: number
  }
  violations: SPCViolation[]
  processCapability: ProcessCapability
}

export interface SPCDataPoint {
  index: number
  value: number
  timestamp: string
  inspectionId: string
  isViolation: boolean
  violationType?: string
}

export interface SPCViolation {
  index: number
  type: string
  description: string
  severity: 'warning' | 'critical'
}

export interface ProcessCapability {
  cp: number
  cpk: number
  pp?: number
  ppk?: number
  mean: number
  stdDev: number
  rating: 'excellent' | 'good' | 'adequate' | 'poor' | 'inadequate'
}

export type ControlChartType = 'x-bar-r' | 'x-mr' | 'p-chart' | 'np-chart'
```

---

## 4. UI/UX 설계 (UI/UX Design)

### 4.1 페이지 구조

```
/spc (SPCPage.tsx)
├── Tab 0: SPC 대시보드 (SPCDashboard)
│   ├── 공정능력 요약 카드 (4개)
│   ├── 모델별 Cpk 현황 차트
│   └── 최근 SPC 알림 목록
│
├── Tab 1: 관리도 (ControlCharts)
│   ├── 필터 (모델, 검사항목, 공정, 기간)
│   ├── 차트 유형 선택 (X-bar R, X-MR, p, np)
│   └── 관리도 차트 영역
│
├── Tab 2: 공정능력분석 (ProcessCapability)
│   ├── 검사항목 선택
│   ├── Cp/Cpk 게이지 차트
│   ├── 히스토그램 + 규격선
│   └── 통계 요약 테이블
│
├── Tab 3: 알림 관리 (SPCAlerts)
│   ├── 알림 목록 (필터: 상태, 심각도)
│   ├── 알림 상세 / 조치 입력
│   └── 알림 이력
│
└── Tab 4: 설정 (SPCSettings) [Admin Only]
    ├── 관리한계 설정
    ├── 알림 규칙 설정
    └── 관리한계 이력 조회
```

### 4.2 주요 컴포넌트

```
src/components/spc/
├── SPCDashboard.tsx           # SPC 요약 대시보드
├── ControlChart.tsx           # 관리도 차트 (Recharts 기반)
├── XBarRChart.tsx             # X-bar R 관리도
├── XMRChart.tsx               # X-MR 관리도
├── PChart.tsx                 # p 관리도 (불량률)
├── NPChart.tsx                # np 관리도 (불량 개수)
├── ProcessCapabilityGauge.tsx # Cp/Cpk 게이지
├── CapabilityHistogram.tsx    # 히스토그램 + 규격선
├── SPCAlertList.tsx           # 알림 목록
├── SPCAlertDialog.tsx         # 알림 상세/조치
├── SPCFilters.tsx             # SPC 필터 컴포넌트
├── ControlLimitSettings.tsx   # 관리한계 설정
└── SPCKPICards.tsx            # SPC KPI 카드
```

### 4.3 관리도 와이어프레임

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 X-bar R 관리도 - Model A / 외경 치수                      │
├─────────────────────────────────────────────────────────────┤
│ [모델 선택 ▼] [검사항목 ▼] [기간: 최근 7일 ▼] [차트유형 ▼]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  UCL ────────────────────●───────────────────── 10.05      │
│                         ╱ ╲                                 │
│       ●────●───●───●───●   ●───●───●────●                  │
│  CL  ─────────────────────────────────────────── 10.00      │
│                                                             │
│       ●────●───●───●───●───●───●───●────●───●              │
│  LCL ────────────────────────────────────────── 9.95       │
│                                                             │
│  ▲ 2/5: UCL 초과 감지                                       │
├─────────────────────────────────────────────────────────────┤
│ 샘플 #  1   2   3   4   5   6   7   8   9   10              │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 공정능력 게이지 와이어프레임

```
┌─────────────────────────────────────┐
│       공정능력지수 (Cpk)             │
├─────────────────────────────────────┤
│                                     │
│            ◐ 1.45                   │
│         ╭───────────╮               │
│        ╱      │      ╲              │
│       ▕───────●───────▏             │
│       0.67   1.0    1.33   2.0      │
│       Poor  Adequate Good Excellent │
│                                     │
│  ✅ 등급: Good                       │
│  📊 평균: 10.02 | 표준편차: 0.015    │
└─────────────────────────────────────┘
```

---

## 5. 구현 순서 (Implementation Order)

### Phase 1: 기반 구축 (1주)
1. [ ] 데이터베이스 테이블 생성 (Supabase Migration)
2. [ ] TypeScript 타입 정의 (`src/types/spc.ts`)
3. [ ] SPC 서비스 기본 구조 (`src/services/spcService.ts`)
4. [ ] 번역 키 추가 (`locales/ko`, `locales/vi`)

### Phase 2: 핵심 계산 로직 (1주)
5. [ ] SPC 통계 계산 유틸리티 (`src/lib/spc-calculations.ts`)
   - 평균, 표준편차 계산
   - 관리한계 자동 계산 (UCL, CL, LCL)
   - Cp, Cpk 계산
   - 이상 규칙 감지 (Run, Trend, 2/3)
6. [ ] 단위 테스트 작성

### Phase 3: 관리도 컴포넌트 (1주)
7. [ ] ControlChart 기본 컴포넌트 (Recharts)
8. [ ] p-chart 구현 (불량률 - 현재 데이터 활용)
9. [ ] X-MR 차트 구현 (개별 측정값)
10. [ ] X-bar R 차트 구현 (서브그룹)

### Phase 4: 공정능력분석 (3일)
11. [ ] ProcessCapabilityGauge 컴포넌트
12. [ ] CapabilityHistogram 컴포넌트
13. [ ] 공정능력 계산 및 등급 표시

### Phase 5: SPC 대시보드 및 페이지 (4일)
14. [ ] SPCPage 라우트 추가
15. [ ] SPCDashboard 구현
16. [ ] SPCFilters 구현
17. [ ] Tab 네비게이션 구현

### Phase 6: 알림 시스템 (3일)
18. [ ] 실시간 이상 감지 로직
19. [ ] SPCAlertList 컴포넌트
20. [ ] 알림 조치 다이얼로그
21. [ ] 인앱 알림 통합

### Phase 7: 설정 및 관리 (2일)
22. [ ] ControlLimitSettings 컴포넌트
23. [ ] 관리한계 CRUD
24. [ ] 이력 관리

### Phase 8: 테스트 및 최적화 (2일)
25. [ ] 통합 테스트
26. [ ] 성능 최적화
27. [ ] 모바일 UI 검증

---

## 6. 기술 고려사항 (Technical Considerations)

### 6.1 차트 라이브러리
- **Recharts** (기존 사용 중) - 관리도 구현에 적합
- ComposedChart로 라인 + 영역 + 점 조합
- ReferenceArea로 관리한계 영역 표시
- ReferenceLine으로 UCL/CL/LCL 표시

### 6.2 실시간 업데이트
- TanStack Query의 refetchInterval 활용
- 새 검사 데이터 입력 시 자동 갱신
- 알림은 polling 방식 (5분 간격)

### 6.3 성능 최적화
- 대용량 데이터 대응: 페이지네이션 + 무한 스크롤
- 차트 데이터 샘플링 (1000+ 포인트 시)
- useMemo로 계산 결과 캐싱

### 6.4 오프라인 지원
- Dexie (IndexedDB)에 최근 SPC 데이터 캐싱
- 오프라인 시 캐시 데이터로 차트 표시
- 온라인 복귀 시 동기화

---

## 7. 위험 요소 및 완화 방안 (Risks & Mitigation)

| 위험 | 영향 | 완화 방안 |
|------|------|----------|
| inspection_results 데이터 부족 | 관리도 생성 불가 | p-chart (불량률) 먼저 구현, 측정값 기반은 점진적 |
| 계산 복잡도로 인한 성능 저하 | 사용자 경험 저하 | Web Worker 활용, 백엔드 계산 옵션 |
| 사용자의 SPC 이해도 부족 | 기능 활용도 저조 | 도움말/툴팁 충실히 제공, 간단한 가이드 |
| 모바일에서 차트 가독성 | 사용성 저하 | 가로 스크롤, 확대/축소 기능 |

---

## 8. 성공 지표 (Success Metrics)

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| SPC 페이지 접근율 | Manager 중 80% 이상 | 페이지 방문 로그 |
| 알림 조치율 | 발생 알림의 90% 조치 | 알림 상태 통계 |
| 평균 Cpk 개선 | 도입 3개월 후 10% 향상 | Cpk 추이 분석 |
| 이상 조기 감지 | 불량 발생 전 감지 50% | 알림 vs 불량 시간 비교 |

---

## 9. 참고 자료 (References)

- [AIAG SPC Manual](https://www.aiag.org/) - 자동차 산업 SPC 표준
- [Minitab SPC Guide](https://www.minitab.com/en-us/products/real-time-spc/)
- [Western Electric Rules](https://en.wikipedia.org/wiki/Western_Electric_rules)
- [Nelson Rules](https://en.wikipedia.org/wiki/Nelson_rules)

---

## 10. 승인 (Approval)

| 역할 | 이름 | 날짜 | 서명 |
|------|------|------|------|
| 기획 | | | |
| 개발 | | | |
| QA | | | |

---

*이 문서는 PDCA Plan 단계의 산출물입니다.*
