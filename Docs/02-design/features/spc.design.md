# SPC (Statistical Process Control) 상세 설계서

> **Feature**: SPC - 통계적 공정 관리
> **Created**: 2026-02-05
> **Status**: Design
> **Plan Reference**: [spc.plan.md](../../01-plan/features/spc.plan.md)

---

## 1. 아키텍처 설계 (Architecture Design)

### 1.1 전체 구조

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SPC Feature Architecture                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                │
│  │  SPCPage    │   │ AnalyticsPage│   │ DashboardPage│               │
│  │  (신규)     │   │ (SPC 탭 추가)│   │ (SPC 알림)  │               │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘                │
│         │                 │                 │                        │
│  ┌──────▼─────────────────▼─────────────────▼──────┐                │
│  │              SPC Components (신규)               │                │
│  │  ┌───────────────┐  ┌───────────────┐           │                │
│  │  │ControlChart   │  │ProcessCapability│          │                │
│  │  │ - PChart      │  │ - Gauge        │          │                │
│  │  │ - XBarRChart  │  │ - Histogram    │          │                │
│  │  │ - XMRChart    │  │ - Stats        │          │                │
│  │  └───────────────┘  └───────────────┘           │                │
│  │  ┌───────────────┐  ┌───────────────┐           │                │
│  │  │SPCAlerts      │  │SPCSettings    │           │                │
│  │  │ - List        │  │ - Limits      │           │                │
│  │  │ - Dialog      │  │ - Rules       │           │                │
│  │  └───────────────┘  └───────────────┘           │                │
│  └──────────────────────┬───────────────────────────┘                │
│                         │                                            │
│  ┌──────────────────────▼───────────────────────────┐                │
│  │              SPC Service Layer                    │                │
│  │  ┌─────────────────┐  ┌─────────────────┐        │                │
│  │  │ spcService.ts   │  │spc-calculations │        │                │
│  │  │ (API/DB 연동)   │  │ (통계 계산)     │        │                │
│  │  └─────────────────┘  └─────────────────┘        │                │
│  └──────────────────────┬───────────────────────────┘                │
│                         │                                            │
│  ┌──────────────────────▼───────────────────────────┐                │
│  │              Supabase (PostgreSQL)                │                │
│  │  ┌──────────────┐ ┌──────────────┐ ┌────────────┐│                │
│  │  │spc_control_  │ │ spc_alerts   │ │spc_limit_  ││                │
│  │  │limits        │ │              │ │history     ││                │
│  │  └──────────────┘ └──────────────┘ └────────────┘│                │
│  │  ┌──────────────┐ ┌──────────────┐               │                │
│  │  │inspections   │ │inspection_   │  (기존 테이블)│                │
│  │  │              │ │results       │               │                │
│  │  └──────────────┘ └──────────────┘               │                │
│  └──────────────────────────────────────────────────┘                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 파일 구조

```
src/
├── pages/
│   └── SPCPage.tsx                    # SPC 메인 페이지 (신규)
│
├── components/
│   └── spc/                           # SPC 컴포넌트 폴더 (신규)
│       ├── index.ts                   # 배럴 파일
│       │
│       │ # 대시보드
│       ├── SPCDashboard.tsx           # SPC 요약 대시보드
│       ├── SPCKPICards.tsx            # Cp/Cpk KPI 카드
│       ├── CpkSummaryChart.tsx        # 모델별 Cpk 요약 차트
│       │
│       │ # 관리도
│       ├── ControlChart.tsx           # 관리도 기본 컴포넌트
│       ├── PChart.tsx                 # p 관리도 (불량률)
│       ├── NPChart.tsx                # np 관리도 (불량 개수)
│       ├── XMRChart.tsx               # X-MR 관리도
│       ├── XBarRChart.tsx             # X-bar R 관리도
│       ├── ControlChartTooltip.tsx    # 관리도 툴팁
│       ├── ViolationMarker.tsx        # 위반점 마커
│       │
│       │ # 공정능력
│       ├── ProcessCapabilityCard.tsx  # 공정능력 카드
│       ├── CpkGauge.tsx               # Cpk 게이지 차트
│       ├── CapabilityHistogram.tsx    # 히스토그램
│       ├── CapabilityStats.tsx        # 통계 테이블
│       │
│       │ # 알림
│       ├── SPCAlertList.tsx           # 알림 목록
│       ├── SPCAlertDialog.tsx         # 알림 상세/조치
│       ├── SPCAlertBadge.tsx          # 알림 뱃지 (헤더용)
│       │
│       │ # 설정
│       ├── ControlLimitSettings.tsx   # 관리한계 설정
│       ├── ControlLimitDialog.tsx     # 관리한계 편집 다이얼로그
│       ├── AlertRuleSettings.tsx      # 알림 규칙 설정
│       │
│       │ # 필터
│       └── SPCFilters.tsx             # SPC 필터 컴포넌트
│
├── services/
│   └── spcService.ts                  # SPC API 서비스 (신규)
│
├── lib/
│   └── spc-calculations.ts            # SPC 통계 계산 (신규)
│
├── types/
│   └── spc.ts                         # SPC 타입 정의 (신규)
│
└── locales/
    ├── ko/
    │   └── translation.json           # spc.* 키 추가
    └── vi/
        └── translation.json           # spc.* 키 추가
```

---

## 2. 데이터베이스 상세 설계 (Database Design)

### 2.1 ERD (Entity Relationship Diagram)

```
┌─────────────────────┐       ┌─────────────────────┐
│   product_models    │       │ inspection_items    │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │◄──┐   │ id (PK)             │
│ name                │   │   │ model_id (FK)       │──┐
│ code                │   │   │ name                │  │
└─────────────────────┘   │   │ standard_value      │  │
                          │   │ tolerance_min       │  │
                          │   │ tolerance_max       │  │
┌─────────────────────┐   │   │ unit                │  │
│inspection_processes │   │   └─────────────────────┘  │
├─────────────────────┤   │              │             │
│ id (PK)             │◄──┼──────────────┼─────────────┘
│ name                │   │              │
│ code                │   │              ▼
└─────────────────────┘   │   ┌─────────────────────┐
                          │   │ spc_control_limits  │ (신규)
                          │   ├─────────────────────┤
                          ├───│ model_id (FK)       │
                          │   │ item_id (FK)        │──────────┐
                          │   │ process_id (FK)     │          │
                          │   │ ucl, cl, lcl        │          │
                          │   │ usl, lsl            │          │
                          │   │ cp, cpk, pp, ppk    │          │
                          │   │ sample_size         │          │
                          │   │ calculated_at       │          │
                          │   └─────────────────────┘          │
                          │              │                     │
                          │              ▼                     │
                          │   ┌─────────────────────┐          │
                          │   │spc_control_limit_   │ (신규)   │
                          │   │       history       │          │
                          │   ├─────────────────────┤          │
                          │   │ control_limit_id(FK)│          │
                          │   │ previous_ucl/cl/lcl │          │
                          │   │ change_reason       │          │
                          │   │ changed_by (FK)     │          │
                          │   └─────────────────────┘          │
                          │                                    │
                          │   ┌─────────────────────┐          │
                          │   │    spc_alerts       │ (신규)   │
                          │   ├─────────────────────┤          │
                          └───│ model_id (FK)       │          │
                              │ item_id (FK)        │◄─────────┘
                              │ alert_type          │
                              │ measured_value      │
                              │ severity            │
                              │ status              │
                              │ resolution_note     │
                              └─────────────────────┘
```

### 2.2 Supabase Migration SQL

```sql
-- Migration: 001_create_spc_tables.sql

-- 1. spc_control_limits: 검사 항목별 관리한계 설정
CREATE TABLE spc_control_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 연결 관계
  item_id UUID NOT NULL REFERENCES inspection_items(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES product_models(id) ON DELETE CASCADE,
  process_id UUID REFERENCES inspection_processes(id) ON DELETE SET NULL,

  -- 관리한계 (Control Limits)
  ucl DECIMAL(12,4) NOT NULL,           -- Upper Control Limit
  cl DECIMAL(12,4) NOT NULL,            -- Center Line (평균)
  lcl DECIMAL(12,4) NOT NULL,           -- Lower Control Limit

  -- 경고 한계 (Warning Limits) - 2 시그마
  uwl DECIMAL(12,4),                    -- Upper Warning Limit
  lwl DECIMAL(12,4),                    -- Lower Warning Limit

  -- 규격 한계 (Specification Limits)
  usl DECIMAL(12,4),                    -- Upper Specification Limit
  lsl DECIMAL(12,4),                    -- Lower Specification Limit
  target DECIMAL(12,4),                 -- Target Value

  -- 공정능력지수
  cp DECIMAL(6,4),                      -- Process Capability
  cpk DECIMAL(6,4),                     -- Process Capability Index
  cpl DECIMAL(6,4),                     -- Lower Capability
  cpu DECIMAL(6,4),                     -- Upper Capability
  pp DECIMAL(6,4),                      -- Process Performance
  ppk DECIMAL(6,4),                     -- Process Performance Index

  -- 통계 정보
  mean DECIMAL(12,4),                   -- 평균
  std_dev DECIMAL(12,4),                -- 표준편차
  sample_size INT NOT NULL DEFAULT 0,   -- 샘플 크기

  -- 계산 기준 정보
  chart_type VARCHAR(20) DEFAULT 'p-chart', -- 'p-chart', 'np-chart', 'x-mr', 'x-bar-r'
  subgroup_size INT DEFAULT 1,          -- 서브그룹 크기 (X-bar R용)
  data_from TIMESTAMPTZ,                -- 데이터 시작일
  data_to TIMESTAMPTZ,                  -- 데이터 종료일
  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 메타데이터
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 복합 유니크 제약
  CONSTRAINT unique_active_limit UNIQUE (item_id, model_id, process_id, is_active)
);

-- 2. spc_alerts: SPC 이상 알림
CREATE TABLE spc_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 연결 정보
  inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
  inspection_result_id UUID REFERENCES inspection_results(id) ON DELETE SET NULL,
  item_id UUID REFERENCES inspection_items(id) ON DELETE SET NULL,
  model_id UUID NOT NULL REFERENCES product_models(id) ON DELETE CASCADE,
  control_limit_id UUID REFERENCES spc_control_limits(id) ON DELETE SET NULL,

  -- 알림 정보
  alert_type VARCHAR(50) NOT NULL,
  -- 'ucl_exceeded': UCL 초과
  -- 'lcl_exceeded': LCL 미달
  -- 'uwl_exceeded': 경고한계 초과
  -- 'run_above': 연속 7점 중심선 위
  -- 'run_below': 연속 7점 중심선 아래
  -- 'trend_up': 연속 7점 상승
  -- 'trend_down': 연속 7점 하강
  -- 'two_thirds': 3점 중 2점이 경고구역
  -- 'one_third': 4점 중 4점이 1시그마 밖
  -- 'stratification': 15점 연속 1시그마 내
  -- 'mixture': 8점 연속 중심선 통과 없음

  rule_code VARCHAR(20),                -- 'R1', 'R2', 'R3', ... (Nelson Rules)
  rule_description TEXT,                -- 위반 규칙 설명

  -- 측정 정보
  measured_value DECIMAL(12,4),         -- 측정값
  control_limit_value DECIMAL(12,4),    -- 관련 관리한계값
  deviation DECIMAL(12,4),              -- 편차 (측정값 - CL)
  sigma_distance DECIMAL(6,2),          -- 시그마 거리

  -- 연속 데이터 (패턴 규칙용)
  consecutive_points INT,               -- 연속 포인트 수
  point_indices TEXT,                   -- 관련 포인트 인덱스 (JSON array)

  -- 상태
  severity VARCHAR(20) DEFAULT 'warning',
  -- 'info': 정보성 (모니터링)
  -- 'warning': 경고 (조치 권장)
  -- 'critical': 심각 (즉시 조치 필요)

  status VARCHAR(20) DEFAULT 'open',
  -- 'open': 미조치
  -- 'acknowledged': 확인됨
  -- 'in_progress': 조치 중
  -- 'resolved': 해결됨
  -- 'ignored': 무시 (오탐)

  -- 조치 정보
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  root_cause TEXT,                      -- 근본 원인
  corrective_action TEXT,               -- 시정 조치

  -- 메타데이터
  factory_id VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. spc_control_limit_history: 관리한계 변경 이력
CREATE TABLE spc_control_limit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_limit_id UUID NOT NULL REFERENCES spc_control_limits(id) ON DELETE CASCADE,

  -- 이전 값
  previous_ucl DECIMAL(12,4),
  previous_cl DECIMAL(12,4),
  previous_lcl DECIMAL(12,4),
  previous_cp DECIMAL(6,4),
  previous_cpk DECIMAL(6,4),
  previous_sample_size INT,

  -- 새 값
  new_ucl DECIMAL(12,4),
  new_cl DECIMAL(12,4),
  new_lcl DECIMAL(12,4),
  new_cp DECIMAL(6,4),
  new_cpk DECIMAL(6,4),
  new_sample_size INT,

  -- 변경 사유
  change_type VARCHAR(50),              -- 'recalculated', 'manual_adjustment', 'spec_change'
  change_reason TEXT,
  changed_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_spc_limits_model ON spc_control_limits(model_id);
CREATE INDEX idx_spc_limits_item ON spc_control_limits(item_id);
CREATE INDEX idx_spc_limits_active ON spc_control_limits(is_active) WHERE is_active = true;

CREATE INDEX idx_spc_alerts_model ON spc_alerts(model_id);
CREATE INDEX idx_spc_alerts_status ON spc_alerts(status);
CREATE INDEX idx_spc_alerts_severity ON spc_alerts(severity);
CREATE INDEX idx_spc_alerts_created ON spc_alerts(created_at DESC);
CREATE INDEX idx_spc_alerts_factory ON spc_alerts(factory_id);

CREATE INDEX idx_spc_history_limit ON spc_control_limit_history(control_limit_id);

-- RLS (Row Level Security)
ALTER TABLE spc_control_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE spc_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE spc_control_limit_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies (manager, admin만 접근)
CREATE POLICY "SPC limits viewable by managers and admins"
  ON spc_control_limits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  );

CREATE POLICY "SPC limits editable by admins"
  ON spc_control_limits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "SPC alerts viewable by managers and admins"
  ON spc_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  );

CREATE POLICY "SPC alerts manageable by managers and admins"
  ON spc_alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  );
```

---

## 3. TypeScript 타입 정의 (Type Definitions)

### 3.1 src/types/spc.ts

```typescript
/**
 * SPC (Statistical Process Control) 타입 정의
 */

// ============================================
// 1. 기본 타입
// ============================================

/** 관리도 유형 */
export type ControlChartType = 'p-chart' | 'np-chart' | 'x-mr' | 'x-bar-r'

/** 알림 유형 */
export type SPCAlertType =
  | 'ucl_exceeded'      // UCL 초과
  | 'lcl_exceeded'      // LCL 미달
  | 'uwl_exceeded'      // 경고한계 초과
  | 'run_above'         // 연속 7점 중심선 위
  | 'run_below'         // 연속 7점 중심선 아래
  | 'trend_up'          // 연속 7점 상승
  | 'trend_down'        // 연속 7점 하강
  | 'two_thirds'        // 3점 중 2점이 경고구역
  | 'stratification'    // 15점 연속 1시그마 내
  | 'mixture'           // 8점 연속 중심선 통과 없음

/** 알림 심각도 */
export type SPCAlertSeverity = 'info' | 'warning' | 'critical'

/** 알림 상태 */
export type SPCAlertStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'ignored'

/** 공정능력 등급 */
export type CapabilityRating = 'excellent' | 'good' | 'adequate' | 'poor' | 'inadequate'

// ============================================
// 2. 관리한계 (Control Limits)
// ============================================

/** 관리한계 설정 */
export interface SPCControlLimit {
  id: string
  item_id: string
  model_id: string
  process_id?: string | null

  // 관리한계
  ucl: number           // Upper Control Limit
  cl: number            // Center Line
  lcl: number           // Lower Control Limit
  uwl?: number          // Upper Warning Limit
  lwl?: number          // Lower Warning Limit

  // 규격한계
  usl?: number          // Upper Specification Limit
  lsl?: number          // Lower Specification Limit
  target?: number       // Target Value

  // 공정능력지수
  cp?: number
  cpk?: number
  cpl?: number
  cpu?: number
  pp?: number
  ppk?: number

  // 통계 정보
  mean?: number
  std_dev?: number
  sample_size: number

  // 차트 설정
  chart_type: ControlChartType
  subgroup_size: number

  // 계산 기준
  data_from?: string
  data_to?: string
  calculated_at?: string

  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

/** 관리한계 생성 입력 */
export interface SPCControlLimitInput {
  item_id: string
  model_id: string
  process_id?: string
  chart_type: ControlChartType
  subgroup_size?: number
  // 수동 설정 시
  manual_ucl?: number
  manual_cl?: number
  manual_lcl?: number
  usl?: number
  lsl?: number
  target?: number
  // 자동 계산 시
  data_from?: Date
  data_to?: Date
}

/** 관리한계 업데이트 */
export interface SPCControlLimitUpdate {
  ucl?: number
  cl?: number
  lcl?: number
  uwl?: number
  lwl?: number
  usl?: number
  lsl?: number
  target?: number
  is_active?: boolean
  change_reason?: string
}

// ============================================
// 3. SPC 알림 (Alerts)
// ============================================

/** SPC 알림 */
export interface SPCAlert {
  id: string
  inspection_id?: string
  inspection_result_id?: string
  item_id?: string
  model_id: string
  control_limit_id?: string

  alert_type: SPCAlertType
  rule_code?: string
  rule_description?: string

  measured_value?: number
  control_limit_value?: number
  deviation?: number
  sigma_distance?: number

  consecutive_points?: number
  point_indices?: number[]

  severity: SPCAlertSeverity
  status: SPCAlertStatus

  acknowledged_by?: string
  acknowledged_at?: string
  resolved_by?: string
  resolved_at?: string
  resolution_note?: string
  root_cause?: string
  corrective_action?: string

  factory_id?: string
  created_at: string

  // 조인 데이터 (optional)
  item_name?: string
  model_name?: string
  acknowledged_by_name?: string
  resolved_by_name?: string
}

/** 알림 조치 입력 */
export interface SPCAlertResolution {
  status: SPCAlertStatus
  resolution_note?: string
  root_cause?: string
  corrective_action?: string
}

/** 알림 필터 */
export interface SPCAlertFilters {
  status?: SPCAlertStatus[]
  severity?: SPCAlertSeverity[]
  alert_type?: SPCAlertType[]
  model_id?: string
  item_id?: string
  date_from?: Date
  date_to?: Date
}

// ============================================
// 4. 관리도 데이터 (Chart Data)
// ============================================

/** 관리도 데이터 포인트 */
export interface SPCDataPoint {
  index: number
  value: number
  timestamp: string
  inspection_id?: string

  // 위반 정보
  is_violation: boolean
  violation_type?: SPCAlertType
  violation_severity?: SPCAlertSeverity

  // 서브그룹 정보 (X-bar R)
  subgroup_values?: number[]
  range?: number

  // 불량률 관리도 정보 (p-chart)
  sample_size?: number
  defect_count?: number
}

/** 관리도 위반 */
export interface SPCViolation {
  index: number
  point_value: number
  type: SPCAlertType
  severity: SPCAlertSeverity
  description: string
  rule_code?: string
}

/** 관리도 차트 데이터 */
export interface SPCChartData {
  chart_type: ControlChartType
  item_name: string
  model_name: string
  unit: string

  // 데이터 포인트
  points: SPCDataPoint[]

  // 관리한계
  control_limits: {
    ucl: number
    cl: number
    lcl: number
    uwl?: number
    lwl?: number
    usl?: number
    lsl?: number
  }

  // 위반 목록
  violations: SPCViolation[]

  // 공정능력
  process_capability: ProcessCapability

  // 통계 요약
  statistics: SPCStatistics
}

/** R 차트 데이터 (X-bar R용) */
export interface RChartData {
  points: Array<{
    index: number
    range: number
    timestamp: string
  }>
  control_limits: {
    ucl: number
    cl: number
    lcl: number
  }
}

// ============================================
// 5. 공정능력 (Process Capability)
// ============================================

/** 공정능력 지수 */
export interface ProcessCapability {
  cp: number
  cpk: number
  cpl: number
  cpu: number
  pp?: number
  ppk?: number

  rating: CapabilityRating
  rating_description: string

  // 예상 불량률
  expected_defect_ppm?: number    // PPM
  expected_defect_percent?: number // %
}

/** SPC 통계 요약 */
export interface SPCStatistics {
  count: number
  mean: number
  std_dev: number
  min: number
  max: number
  range: number
  median: number

  // 규격 대비
  within_spec_count: number
  within_spec_percent: number

  // 관리한계 대비
  within_control_count: number
  within_control_percent: number
}

// ============================================
// 6. SPC 대시보드
// ============================================

/** 모델별 SPC 요약 */
export interface ModelSPCSummary {
  model_id: string
  model_name: string
  model_code: string

  items_count: number           // 관리 중인 검사항목 수
  avg_cpk: number               // 평균 Cpk
  min_cpk: number               // 최저 Cpk
  max_cpk: number               // 최고 Cpk

  overall_rating: CapabilityRating

  open_alerts_count: number     // 미조치 알림 수
  critical_alerts_count: number // 심각 알림 수
}

/** SPC KPI 요약 */
export interface SPCKPISummary {
  total_monitored_items: number   // 관리 중인 검사항목 수
  avg_cpk: number                 // 전체 평균 Cpk

  excellent_count: number         // Cpk >= 1.67
  good_count: number              // 1.33 <= Cpk < 1.67
  adequate_count: number          // 1.0 <= Cpk < 1.33
  poor_count: number              // Cpk < 1.0

  open_alerts: number
  critical_alerts: number

  trend: 'improving' | 'stable' | 'declining'
}

// ============================================
// 7. 필터 및 옵션
// ============================================

/** SPC 필터 */
export interface SPCFilters {
  model_id?: string
  item_id?: string
  process_id?: string
  chart_type?: ControlChartType
  date_from: Date
  date_to: Date
  factory_id?: string
}

/** 관리한계 계산 옵션 */
export interface ControlLimitCalculationOptions {
  chart_type: ControlChartType
  subgroup_size?: number
  use_moving_range?: boolean
  sigma_multiplier?: number    // 기본 3
  exclude_outliers?: boolean
  min_data_points?: number     // 최소 데이터 수 (기본 25)
}

// ============================================
// 8. 이력 관리
// ============================================

/** 관리한계 변경 이력 */
export interface SPCControlLimitHistory {
  id: string
  control_limit_id: string

  previous_ucl?: number
  previous_cl?: number
  previous_lcl?: number
  previous_cp?: number
  previous_cpk?: number
  previous_sample_size?: number

  new_ucl?: number
  new_cl?: number
  new_lcl?: number
  new_cp?: number
  new_cpk?: number
  new_sample_size?: number

  change_type: 'recalculated' | 'manual_adjustment' | 'spec_change'
  change_reason?: string
  changed_by?: string
  changed_by_name?: string

  created_at: string
}
```

---

## 4. 서비스 레이어 설계 (Service Layer Design)

### 4.1 src/services/spcService.ts

```typescript
/**
 * SPC Service - API 함수 목록
 */

// ============================================
// 1. 관리한계 (Control Limits)
// ============================================

/** 관리한계 목록 조회 */
export async function getControlLimits(
  filters?: { model_id?: string; item_id?: string; is_active?: boolean }
): Promise<SPCControlLimit[]>

/** 단일 관리한계 조회 */
export async function getControlLimit(id: string): Promise<SPCControlLimit | null>

/** 검사항목별 활성 관리한계 조회 */
export async function getActiveControlLimit(
  item_id: string,
  model_id: string,
  process_id?: string
): Promise<SPCControlLimit | null>

/** 관리한계 자동 계산 및 생성 */
export async function calculateAndCreateControlLimit(
  input: SPCControlLimitInput,
  options?: ControlLimitCalculationOptions
): Promise<SPCControlLimit>

/** 관리한계 수동 생성 */
export async function createControlLimit(
  input: SPCControlLimitInput
): Promise<SPCControlLimit>

/** 관리한계 업데이트 */
export async function updateControlLimit(
  id: string,
  update: SPCControlLimitUpdate
): Promise<SPCControlLimit>

/** 관리한계 재계산 */
export async function recalculateControlLimit(
  id: string,
  dateRange?: { from: Date; to: Date }
): Promise<SPCControlLimit>

/** 관리한계 비활성화 */
export async function deactivateControlLimit(id: string): Promise<void>

/** 관리한계 이력 조회 */
export async function getControlLimitHistory(
  control_limit_id: string
): Promise<SPCControlLimitHistory[]>

// ============================================
// 2. SPC 알림 (Alerts)
// ============================================

/** 알림 목록 조회 */
export async function getSPCAlerts(
  filters?: SPCAlertFilters
): Promise<SPCAlert[]>

/** 미조치 알림 수 조회 */
export async function getOpenAlertsCount(
  factory_id?: string
): Promise<{ total: number; critical: number }>

/** 알림 상세 조회 */
export async function getSPCAlert(id: string): Promise<SPCAlert | null>

/** 알림 상태 업데이트 (확인/조치) */
export async function updateSPCAlertStatus(
  id: string,
  resolution: SPCAlertResolution
): Promise<SPCAlert>

/** 알림 일괄 확인 */
export async function acknowledgeAlerts(ids: string[]): Promise<void>

/** 알림 생성 (시스템 내부용) */
export async function createSPCAlert(
  alert: Omit<SPCAlert, 'id' | 'created_at'>
): Promise<SPCAlert>

// ============================================
// 3. 관리도 데이터 (Chart Data)
// ============================================

/** 관리도 데이터 조회 (p-chart) */
export async function getPChartData(
  model_id: string,
  process_id?: string,
  dateRange?: { from: Date; to: Date },
  factory_id?: string
): Promise<SPCChartData>

/** 관리도 데이터 조회 (X-MR) */
export async function getXMRChartData(
  item_id: string,
  model_id: string,
  dateRange?: { from: Date; to: Date },
  factory_id?: string
): Promise<{ xChart: SPCChartData; mrChart: SPCChartData }>

/** 관리도 데이터 조회 (X-bar R) */
export async function getXBarRChartData(
  item_id: string,
  model_id: string,
  subgroup_size: number,
  dateRange?: { from: Date; to: Date },
  factory_id?: string
): Promise<{ xBarChart: SPCChartData; rChart: RChartData }>

// ============================================
// 4. 공정능력 분석 (Process Capability)
// ============================================

/** 공정능력 분석 */
export async function getProcessCapability(
  item_id: string,
  model_id: string,
  dateRange?: { from: Date; to: Date },
  factory_id?: string
): Promise<{
  capability: ProcessCapability
  statistics: SPCStatistics
  histogram: { bin: number; count: number }[]
}>

/** 모델별 Cpk 요약 */
export async function getModelCpkSummary(
  factory_id?: string
): Promise<ModelSPCSummary[]>

// ============================================
// 5. SPC 대시보드
// ============================================

/** SPC KPI 요약 */
export async function getSPCKPISummary(
  factory_id?: string
): Promise<SPCKPISummary>

/** 최근 SPC 알림 */
export async function getRecentSPCAlerts(
  limit?: number,
  factory_id?: string
): Promise<SPCAlert[]>

// ============================================
// 6. 이상 감지 (Violation Detection)
// ============================================

/** 새 검사 데이터에 대한 이상 감지 실행 */
export async function checkForViolations(
  inspection_id: string
): Promise<SPCAlert[]>

/** 데이터 범위에 대한 일괄 이상 감지 */
export async function runViolationDetection(
  model_id: string,
  item_id: string,
  dateRange: { from: Date; to: Date }
): Promise<SPCAlert[]>
```

### 4.2 src/lib/spc-calculations.ts

```typescript
/**
 * SPC 통계 계산 유틸리티
 */

// ============================================
// 1. 기본 통계
// ============================================

/** 평균 계산 */
export function mean(values: number[]): number

/** 표준편차 계산 (모집단) */
export function standardDeviation(values: number[]): number

/** 표준편차 계산 (표본) */
export function sampleStandardDeviation(values: number[]): number

/** 이동 범위 평균 (MR-bar) */
export function movingRangeAverage(values: number[]): number

/** 범위 (R) 계산 */
export function range(values: number[]): number

/** d2 상수 (서브그룹 크기별) */
export function getD2Constant(subgroupSize: number): number

/** d3 상수 */
export function getD3Constant(subgroupSize: number): number

/** A2 상수 (X-bar R용) */
export function getA2Constant(subgroupSize: number): number

/** D3, D4 상수 (R 차트용) */
export function getD3D4Constants(subgroupSize: number): { D3: number; D4: number }

// ============================================
// 2. 관리한계 계산
// ============================================

/** p-chart 관리한계 계산 */
export function calculatePChartLimits(data: {
  defect_count: number
  sample_size: number
}[]): {
  ucl: number
  cl: number
  lcl: number
  p_bar: number
}

/** np-chart 관리한계 계산 */
export function calculateNPChartLimits(data: {
  defect_count: number
  sample_size: number
}[]): {
  ucl: number
  cl: number
  lcl: number
  np_bar: number
}

/** X-MR 관리한계 계산 */
export function calculateXMRLimits(values: number[]): {
  x: { ucl: number; cl: number; lcl: number }
  mr: { ucl: number; cl: number; lcl: number }
  mean: number
  mrBar: number
  sigmaEstimate: number
}

/** X-bar R 관리한계 계산 */
export function calculateXBarRLimits(
  subgroups: number[][]
): {
  xBar: { ucl: number; cl: number; lcl: number }
  r: { ucl: number; cl: number; lcl: number }
  xDoubleBar: number
  rBar: number
  sigmaEstimate: number
}

// ============================================
// 3. 공정능력지수 계산
// ============================================

/** Cp 계산 */
export function calculateCp(
  usl: number,
  lsl: number,
  sigma: number
): number

/** Cpk 계산 */
export function calculateCpk(
  usl: number,
  lsl: number,
  mean: number,
  sigma: number
): { cpk: number; cpl: number; cpu: number }

/** Pp/Ppk 계산 (장기 공정능력) */
export function calculatePpk(
  usl: number,
  lsl: number,
  mean: number,
  overallSigma: number
): { pp: number; ppk: number }

/** 공정능력 등급 판정 */
export function getCapabilityRating(cpk: number): {
  rating: CapabilityRating
  description: string
  color: string
}

/** 예상 불량률 계산 (PPM) */
export function calculateExpectedDefectRate(
  cpk: number
): { ppm: number; percent: number }

// ============================================
// 4. 이상 감지 규칙
// ============================================

/** Nelson Rules 위반 감지 */
export function detectNelsonRuleViolations(
  points: number[],
  cl: number,
  ucl: number,
  lcl: number
): SPCViolation[]

/** Rule 1: 한 점이 관리한계 밖 */
export function checkRule1OutOfLimits(
  points: number[],
  ucl: number,
  lcl: number
): SPCViolation[]

/** Rule 2: 연속 9점이 중심선 한쪽 */
export function checkRule2Run(
  points: number[],
  cl: number,
  consecutiveCount?: number // 기본 7 또는 9
): SPCViolation[]

/** Rule 3: 연속 6점 증가 또는 감소 */
export function checkRule3Trend(
  points: number[],
  consecutiveCount?: number // 기본 6 또는 7
): SPCViolation[]

/** Rule 4: 연속 14점 교대로 증감 */
export function checkRule4Alternating(
  points: number[]
): SPCViolation[]

/** Rule 5: 3점 중 2점이 2시그마 밖 (같은 방향) */
export function checkRule5TwoOfThree(
  points: number[],
  cl: number,
  sigma: number
): SPCViolation[]

/** Rule 6: 5점 중 4점이 1시그마 밖 (같은 방향) */
export function checkRule6FourOfFive(
  points: number[],
  cl: number,
  sigma: number
): SPCViolation[]

/** Rule 7: 연속 15점이 1시그마 내 (Stratification) */
export function checkRule7Stratification(
  points: number[],
  cl: number,
  sigma: number
): SPCViolation[]

/** Rule 8: 연속 8점이 1시그마 밖 (Mixture) */
export function checkRule8Mixture(
  points: number[],
  cl: number,
  sigma: number
): SPCViolation[]

// ============================================
// 5. 히스토그램
// ============================================

/** 히스토그램 빈 계산 */
export function calculateHistogramBins(
  values: number[],
  binCount?: number
): { bin: number; count: number; binStart: number; binEnd: number }[]

/** Sturges 공식으로 빈 개수 결정 */
export function calculateOptimalBinCount(n: number): number
```

---

## 5. UI 컴포넌트 상세 설계 (Component Design)

### 5.1 SPCPage.tsx (메인 페이지)

```tsx
/**
 * SPC 페이지 구조
 * 접근 권한: manager, admin
 */
export function SPCPage() {
  // 탭: 대시보드 | 관리도 | 공정능력 | 알림 | 설정
  return (
    <Layout>
      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">{t('spc.tabs.dashboard')}</TabsTrigger>
          <TabsTrigger value="control-charts">{t('spc.tabs.controlCharts')}</TabsTrigger>
          <TabsTrigger value="capability">{t('spc.tabs.capability')}</TabsTrigger>
          <TabsTrigger value="alerts">
            {t('spc.tabs.alerts')}
            <SPCAlertBadge />
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="settings">{t('spc.tabs.settings')}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="dashboard">
          <SPCDashboard />
        </TabsContent>
        <TabsContent value="control-charts">
          <ControlChartsTab />
        </TabsContent>
        <TabsContent value="capability">
          <ProcessCapabilityTab />
        </TabsContent>
        <TabsContent value="alerts">
          <SPCAlertsTab />
        </TabsContent>
        <TabsContent value="settings">
          <SPCSettingsTab />
        </TabsContent>
      </Tabs>
    </Layout>
  )
}
```

### 5.2 SPCDashboard.tsx

```tsx
/**
 * SPC 대시보드
 * - KPI 카드 4개 (관리항목 수, 평균 Cpk, 미조치 알림, 심각 알림)
 * - 모델별 Cpk 현황 차트
 * - 최근 알림 목록
 */
export function SPCDashboard() {
  const { data: kpiSummary } = useQuery({
    queryKey: ['spc-kpi-summary', factoryId],
    queryFn: () => getSPCKPISummary(factoryId)
  })

  const { data: modelSummaries } = useQuery({
    queryKey: ['spc-model-summary', factoryId],
    queryFn: () => getModelCpkSummary(factoryId)
  })

  const { data: recentAlerts } = useQuery({
    queryKey: ['spc-recent-alerts', factoryId],
    queryFn: () => getRecentSPCAlerts(5, factoryId)
  })

  return (
    <div className="space-y-6">
      {/* KPI 카드 */}
      <SPCKPICards summary={kpiSummary} />

      {/* 모델별 Cpk 현황 */}
      <CpkSummaryChart data={modelSummaries} />

      {/* 최근 알림 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('spc.recentAlerts')}</CardTitle>
        </CardHeader>
        <CardContent>
          <SPCAlertList alerts={recentAlerts} compact />
        </CardContent>
      </Card>
    </div>
  )
}
```

### 5.3 ControlChart.tsx (관리도 기본)

```tsx
/**
 * 관리도 기본 컴포넌트
 * Recharts ComposedChart 기반
 */
interface ControlChartProps {
  data: SPCChartData
  height?: number
  showViolations?: boolean
  showZones?: boolean  // 1σ, 2σ, 3σ 영역
  onPointClick?: (point: SPCDataPoint) => void
}

export function ControlChart({
  data,
  height = 350,
  showViolations = true,
  showZones = true,
  onPointClick
}: ControlChartProps) {
  const { t } = useTranslation()
  const { ucl, cl, lcl, uwl, lwl } = data.control_limits

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t(`spc.chartTypes.${data.chart_type}`)} - {data.item_name}
        </CardTitle>
        <CardDescription>
          {data.model_name} | {t('spc.sampleSize')}: {data.statistics.count}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data.points}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="index" />
            <YAxis domain={['auto', 'auto']} />

            {/* 관리 영역 (Zones) */}
            {showZones && (
              <>
                {/* 3σ 영역 (UCL ~ LCL) */}
                <ReferenceArea y1={lcl} y2={ucl} fill="hsl(var(--chart-1))" fillOpacity={0.05} />
                {/* 2σ 영역 */}
                {uwl && lwl && (
                  <ReferenceArea y1={lwl} y2={uwl} fill="hsl(var(--chart-2))" fillOpacity={0.1} />
                )}
              </>
            )}

            {/* 관리한계선 */}
            <ReferenceLine y={ucl} stroke="red" strokeDasharray="5 5" label="UCL" />
            <ReferenceLine y={cl} stroke="green" label="CL" />
            <ReferenceLine y={lcl} stroke="red" strokeDasharray="5 5" label="LCL" />

            {/* 경고한계선 */}
            {uwl && <ReferenceLine y={uwl} stroke="orange" strokeDasharray="3 3" />}
            {lwl && <ReferenceLine y={lwl} stroke="orange" strokeDasharray="3 3" />}

            {/* 데이터 라인 */}
            <Line
              type="linear"
              dataKey="value"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={({ cx, cy, payload }) => (
                <circle
                  cx={cx}
                  cy={cy}
                  r={payload.is_violation ? 6 : 4}
                  fill={payload.is_violation ? 'red' : 'hsl(var(--chart-1))'}
                  stroke={payload.is_violation ? 'darkred' : 'none'}
                  strokeWidth={2}
                  onClick={() => onPointClick?.(payload)}
                  style={{ cursor: 'pointer' }}
                />
              )}
            />

            <Tooltip content={<ControlChartTooltip />} />
          </ComposedChart>
        </ResponsiveContainer>

        {/* 위반 목록 */}
        {showViolations && data.violations.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-destructive">
              {t('spc.violations')} ({data.violations.length})
            </h4>
            {data.violations.map((v, i) => (
              <ViolationMarker key={i} violation={v} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### 5.4 CpkGauge.tsx (공정능력 게이지)

```tsx
/**
 * Cpk 게이지 차트
 * 반원형 게이지로 Cpk 값 표시
 */
interface CpkGaugeProps {
  cpk: number
  rating: CapabilityRating
}

export function CpkGauge({ cpk, rating }: CpkGaugeProps) {
  const { t } = useTranslation()

  // 게이지 색상 (등급별)
  const colors = {
    excellent: 'hsl(var(--chart-1))',  // 녹색
    good: 'hsl(var(--chart-2))',       // 파랑
    adequate: 'hsl(var(--chart-4))',   // 노랑
    poor: 'hsl(var(--chart-5))',       // 주황
    inadequate: 'hsl(var(--destructive))' // 빨강
  }

  // Cpk 0~2 범위를 0~180도로 변환
  const angle = Math.min(Math.max(cpk, 0), 2) * 90

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('spc.processCapability')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {/* 게이지 (SVG) */}
        <div className="relative w-48 h-24">
          <svg viewBox="0 0 200 100" className="w-full h-full">
            {/* 배경 아크 */}
            <path
              d="M 10 90 A 80 80 0 0 1 190 90"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="15"
            />
            {/* 값 아크 */}
            <path
              d={`M 10 90 A 80 80 0 0 1 ${10 + 180 * Math.sin(angle * Math.PI / 180)} ${90 - 80 * (1 - Math.cos(angle * Math.PI / 180))}`}
              fill="none"
              stroke={colors[rating]}
              strokeWidth="15"
              strokeLinecap="round"
            />
            {/* 중앙 값 */}
            <text x="100" y="85" textAnchor="middle" className="text-2xl font-bold">
              {cpk.toFixed(2)}
            </text>
          </svg>
        </div>

        {/* 등급 표시 */}
        <div className="mt-2 flex items-center gap-2">
          <span
            className="px-2 py-1 rounded text-sm font-medium text-white"
            style={{ backgroundColor: colors[rating] }}
          >
            {t(`spc.ratings.${rating}`)}
          </span>
        </div>

        {/* 범례 */}
        <div className="mt-4 grid grid-cols-5 gap-1 text-xs">
          <span>0.67</span>
          <span>1.0</span>
          <span>1.33</span>
          <span>1.67</span>
          <span>2.0</span>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 6. 번역 키 (i18n Keys)

### 6.1 src/locales/ko/translation.json (추가)

```json
{
  "spc": {
    "title": "통계적 공정 관리 (SPC)",
    "description": "실시간 공정 모니터링 및 품질 분석",

    "tabs": {
      "dashboard": "대시보드",
      "controlCharts": "관리도",
      "capability": "공정능력",
      "alerts": "알림",
      "settings": "설정"
    },

    "kpi": {
      "monitoredItems": "관리 항목",
      "avgCpk": "평균 Cpk",
      "openAlerts": "미조치 알림",
      "criticalAlerts": "심각 알림"
    },

    "chartTypes": {
      "p-chart": "p 관리도 (불량률)",
      "np-chart": "np 관리도 (불량 개수)",
      "x-mr": "X-MR 관리도",
      "x-bar-r": "X-bar R 관리도"
    },

    "controlLimits": {
      "ucl": "관리상한 (UCL)",
      "cl": "중심선 (CL)",
      "lcl": "관리하한 (LCL)",
      "uwl": "경고상한 (UWL)",
      "lwl": "경고하한 (LWL)",
      "usl": "규격상한 (USL)",
      "lsl": "규격하한 (LSL)"
    },

    "capability": {
      "cp": "공정능력지수 (Cp)",
      "cpk": "공정능력지수 (Cpk)",
      "pp": "공정성능지수 (Pp)",
      "ppk": "공정성능지수 (Ppk)",
      "mean": "평균",
      "stdDev": "표준편차",
      "sampleSize": "샘플 크기"
    },

    "ratings": {
      "excellent": "우수 (≥1.67)",
      "good": "양호 (1.33~1.67)",
      "adequate": "적정 (1.0~1.33)",
      "poor": "불량 (0.67~1.0)",
      "inadequate": "부적합 (<0.67)"
    },

    "alerts": {
      "title": "SPC 알림",
      "ucl_exceeded": "UCL 초과",
      "lcl_exceeded": "LCL 미달",
      "run_above": "연속점 상향",
      "run_below": "연속점 하향",
      "trend_up": "상승 추세",
      "trend_down": "하강 추세",
      "two_thirds": "2/3 규칙 위반"
    },

    "alertStatus": {
      "open": "미조치",
      "acknowledged": "확인됨",
      "in_progress": "조치 중",
      "resolved": "해결됨",
      "ignored": "무시"
    },

    "alertSeverity": {
      "info": "정보",
      "warning": "경고",
      "critical": "심각"
    },

    "actions": {
      "calculate": "계산",
      "recalculate": "재계산",
      "acknowledge": "확인",
      "resolve": "해결",
      "viewDetails": "상세 보기"
    },

    "messages": {
      "noData": "SPC 분석을 위한 데이터가 부족합니다",
      "minDataRequired": "최소 25개의 데이터 포인트가 필요합니다",
      "calculationSuccess": "관리한계가 계산되었습니다",
      "alertResolved": "알림이 해결되었습니다"
    }
  },

  "nav": {
    "spc": "SPC"
  }
}
```

### 6.2 src/locales/vi/translation.json (추가)

```json
{
  "spc": {
    "title": "Kiểm soát quy trình thống kê (SPC)",
    "description": "Giám sát quy trình thời gian thực và phân tích chất lượng",

    "tabs": {
      "dashboard": "Bảng điều khiển",
      "controlCharts": "Biểu đồ kiểm soát",
      "capability": "Năng lực quy trình",
      "alerts": "Cảnh báo",
      "settings": "Cài đặt"
    },

    "kpi": {
      "monitoredItems": "Hạng mục giám sát",
      "avgCpk": "Cpk trung bình",
      "openAlerts": "Cảnh báo chưa xử lý",
      "criticalAlerts": "Cảnh báo nghiêm trọng"
    },

    "chartTypes": {
      "p-chart": "Biểu đồ p (Tỷ lệ lỗi)",
      "np-chart": "Biểu đồ np (Số lượng lỗi)",
      "x-mr": "Biểu đồ X-MR",
      "x-bar-r": "Biểu đồ X-bar R"
    },

    "controlLimits": {
      "ucl": "Giới hạn kiểm soát trên (UCL)",
      "cl": "Đường trung tâm (CL)",
      "lcl": "Giới hạn kiểm soát dưới (LCL)",
      "uwl": "Giới hạn cảnh báo trên (UWL)",
      "lwl": "Giới hạn cảnh báo dưới (LWL)",
      "usl": "Giới hạn quy cách trên (USL)",
      "lsl": "Giới hạn quy cách dưới (LSL)"
    },

    "capability": {
      "cp": "Chỉ số năng lực (Cp)",
      "cpk": "Chỉ số năng lực (Cpk)",
      "pp": "Chỉ số hiệu suất (Pp)",
      "ppk": "Chỉ số hiệu suất (Ppk)",
      "mean": "Giá trị trung bình",
      "stdDev": "Độ lệch chuẩn",
      "sampleSize": "Kích thước mẫu"
    },

    "ratings": {
      "excellent": "Xuất sắc (≥1.67)",
      "good": "Tốt (1.33~1.67)",
      "adequate": "Đạt (1.0~1.33)",
      "poor": "Kém (0.67~1.0)",
      "inadequate": "Không đạt (<0.67)"
    },

    "alerts": {
      "title": "Cảnh báo SPC",
      "ucl_exceeded": "Vượt UCL",
      "lcl_exceeded": "Dưới LCL",
      "run_above": "Điểm liên tục phía trên",
      "run_below": "Điểm liên tục phía dưới",
      "trend_up": "Xu hướng tăng",
      "trend_down": "Xu hướng giảm",
      "two_thirds": "Vi phạm quy tắc 2/3"
    },

    "alertStatus": {
      "open": "Chưa xử lý",
      "acknowledged": "Đã xác nhận",
      "in_progress": "Đang xử lý",
      "resolved": "Đã giải quyết",
      "ignored": "Bỏ qua"
    },

    "alertSeverity": {
      "info": "Thông tin",
      "warning": "Cảnh báo",
      "critical": "Nghiêm trọng"
    },

    "actions": {
      "calculate": "Tính toán",
      "recalculate": "Tính lại",
      "acknowledge": "Xác nhận",
      "resolve": "Giải quyết",
      "viewDetails": "Xem chi tiết"
    },

    "messages": {
      "noData": "Không đủ dữ liệu để phân tích SPC",
      "minDataRequired": "Cần ít nhất 25 điểm dữ liệu",
      "calculationSuccess": "Đã tính toán giới hạn kiểm soát",
      "alertResolved": "Đã giải quyết cảnh báo"
    }
  },

  "nav": {
    "spc": "SPC"
  }
}
```

---

## 7. 라우트 설정 (Route Configuration)

### 7.1 App.tsx 수정

```tsx
// App.tsx에 추가
import { SPCPage } from '@/pages/SPCPage'

// Routes 내부
<Route
  path="/spc"
  element={
    <ProtectedRoute allowedRoles={['manager', 'admin']}>
      <SPCPage />
    </ProtectedRoute>
  }
/>
```

### 7.2 Sidebar 메뉴 추가

```tsx
// Sidebar.tsx 메뉴 항목
{
  title: t('nav.spc'),
  icon: <LineChartIcon className="h-4 w-4" />,
  href: '/spc',
  roles: ['manager', 'admin']
}
```

---

## 8. 구현 순서 체크리스트 (Implementation Checklist)

### Phase 1: 기반 구축
- [ ] `src/types/spc.ts` 생성
- [ ] Supabase migration SQL 실행
- [ ] `src/services/spcService.ts` 기본 구조
- [ ] `src/locales/ko/translation.json` spc 키 추가
- [ ] `src/locales/vi/translation.json` spc 키 추가

### Phase 2: 통계 계산 로직
- [ ] `src/lib/spc-calculations.ts` 생성
- [ ] 기본 통계 함수 구현
- [ ] p-chart 관리한계 계산
- [ ] X-MR 관리한계 계산
- [ ] Cp/Cpk 계산
- [ ] Nelson Rules 위반 감지

### Phase 3: 관리도 컴포넌트
- [ ] `src/components/spc/` 폴더 생성
- [ ] ControlChart.tsx (기본)
- [ ] PChart.tsx
- [ ] XMRChart.tsx
- [ ] ControlChartTooltip.tsx
- [ ] ViolationMarker.tsx

### Phase 4: 공정능력 컴포넌트
- [ ] CpkGauge.tsx
- [ ] CapabilityHistogram.tsx
- [ ] CapabilityStats.tsx
- [ ] ProcessCapabilityCard.tsx

### Phase 5: SPC 페이지 및 대시보드
- [ ] SPCPage.tsx
- [ ] SPCDashboard.tsx
- [ ] SPCKPICards.tsx
- [ ] CpkSummaryChart.tsx
- [ ] SPCFilters.tsx
- [ ] 라우트 추가 (App.tsx)
- [ ] 사이드바 메뉴 추가

### Phase 6: 알림 시스템
- [ ] SPCAlertList.tsx
- [ ] SPCAlertDialog.tsx
- [ ] SPCAlertBadge.tsx
- [ ] 이상 감지 서비스 로직

### Phase 7: 설정
- [ ] ControlLimitSettings.tsx
- [ ] ControlLimitDialog.tsx
- [ ] AlertRuleSettings.tsx

### Phase 8: 테스트 및 최적화
- [ ] Mock 데이터 추가
- [ ] 통합 테스트
- [ ] 성능 최적화
- [ ] 모바일 UI 검증

---

## 9. 승인 (Approval)

| 역할 | 이름 | 날짜 | 서명 |
|------|------|------|------|
| 설계 | | | |
| 개발 | | | |
| QA | | | |

---

*이 문서는 PDCA Design 단계의 산출물입니다.*
*Plan 문서: [spc.plan.md](../../01-plan/features/spc.plan.md)*
