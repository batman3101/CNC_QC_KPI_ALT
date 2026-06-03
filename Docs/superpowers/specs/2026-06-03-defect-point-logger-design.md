# 설계 사양서 — 불량 포인트 빠른 입력기 & SPC 페이지 불량 중심 재구성

- **작성일:** 2026-06-03
- **상태:** 검토 대기 (Draft for review)
- **대상 앱:** CNC QC KPI (React + TS + Vite + Supabase, 한/베 i18n)
- **관련 메모:** `spc-cpk-needs-measured-values` (왜 Cpk가 0으로 나오는지)

---

## 1. 배경 / 문제

현재 SPC 분석 페이지의 **공정능력(Cpk) 영역은 항상 0 / "불량"** 으로 표시된다. 원인은 고장이 아니라 데이터 부재다:

- Cpk는 **분포 전체(합격품 포함 실측값)** 가 있어야 계산되는 계량형(variable) 지표다.
- 현장 공정 대부분은 **GO/NO-GO JIG 검사**로, 빠르게 합/부만 판정하고 다음 공정으로 넘긴다 → 치수 입력 불가.
- 치수 입력이 가능한 공정은 **H/G 검사, MMS 검사** 두 곳뿐이며, 한 모델당 **검사 포인트가 100개 이상**이라 전수 치수 입력은 비현실적이다.
- 따라서 이 개선은 **Cpk(공정능력)를 추구하지 않는다.** 대신 **"불량 포인트만 빠르게 기록"** 하여 ① 부품 불량률(p-관리도)과 ② 포인트별 불량 Pareto를 얻는 **계수형(attribute) 불량 추적**으로 방향을 정한다.

> 통계적 근거: 불량(규격 밖) 값만 모으면 분포의 꼬리만 모은 것이라 평균·표준편차가 왜곡되어 Cpk가 무의미해진다. 불량만 입력하는 방식은 본질적으로 계수형이며, 맞는 도구는 p-관리도 + Pareto다. (NIST/SEMATECH e-Handbook, ASQ, Minitab으로 교차검증됨 — `Docs/SPC_사용_가이드.html` 참조)

---

## 2. 목표 / 비목표

### 목표
1. H/G·MMS 같은 측정 공정에서 **불량 포인트만 빠르게 입력**하는 UI 제공.
2. 입력 데이터로 **부품 단위 불량률**(p-관리도, 기존 기능 재사용)을 채운다.
3. **검사 포인트별 불량 Pareto**(어느 포인트가 자주/심하게 터지나)를 신규 제공.
4. SPC 페이지를 **Cpk 중심 → 불량 포인트 중심**으로 재구성하여 "0/불량" 혼란을 제거.

### 비목표
- Cpk/Cp/Pp/Ppk 산출 및 공정능력 분석 (이 플로우 범위 밖).
- 기존 GO/NO-GO 검사 입력 흐름의 동작 변경.
- 측정기(구글시트/엑셀) 자동 연동 (추후 별도 개선으로 고려; 본 사양은 **앱 내 직접 입력**).
- DB 스키마 마이그레이션 (신규 테이블/컬럼 없이 기존 테이블 재사용).

---

## 3. 확정된 결정 사항

| # | 결정 | 값 |
|---|---|---|
| D1 | 데이터 방향 | 앱 내 직접 입력 (예외 입력) |
| D2 | 불량률 기준 | **부품 단위** 불량률(p-관리도) + **포인트별** Pareto |
| D3 | 입력 흐름 | **세션/로트 단위** — 검사수량(분모) 입력 후 불량 부품의 포인트만 입력 |
| D4 | 빠른 입력 UI | **번호 검색 + 즉시 입력** (자동완성 → 측정값 → 규격 자동비교 → Enter로 추가 → 목록 누적) |
| D5 | 포인트/spec 마스터 | **기존 Excel 임포터**(`inspectionItem`)로 사전 등록. 포인트 1개 = `inspection_items` 1행(numeric+기준값/공차) |
| D6 | 불량유형 | 선택(옵션), 기본 "치수불량" — **세션 단위 저장**(`inspections.defect_type`). 포인트별 저장은 컬럼 필요 → 범위 밖 |
| D7 | Pareto 위치 | SPC 페이지의 **기존 "공정능력 분석" 탭을 "불량 포인트 분석"으로 교체** |
| D8 | 부품 구분 | `부품 추가` 버튼으로 **명시적 그룹화** |
| D9 | Cpk 제거 범위 | **UI에서만 제거(숨김/대체) + 계산 엔진 코드는 보존(휴면)** |

---

## 4. 데이터 모델 (기존 테이블 재사용, 마이그레이션 없음)

### 4.1 검사 포인트 마스터 — `inspection_items`
- 포인트 1개 = `inspection_items` 1행: `data_type='numeric'`, `standard_value`(기준값), `tolerance_min`/`tolerance_max`(공차), `unit`, `name`.
- **규약:** 포인트 **번호를 `name`에 포함**한다 (예: `37 외경`, `82 내경`). 빠른 검색은 `name` 매칭으로 동작.
- 규격 자동판정: `USL = standard_value + tolerance_max`, `LSL = standard_value + tolerance_min`. (현 시스템 동일 규약)
- 등록 경로: 기존 **Excel 일괄 업로드**(`entityType: 'inspectionItem'`). 100개 포인트+spec을 Excel 한 장으로 등록 → "기본 OK spec".

### 4.2 검사 세션 — `inspections` (1세션 = 1행)
| 필드 | 값 |
|---|---|
| `model_id`, `inspection_process` | 선택한 모델·공정 |
| `inspection_quantity` | 검사 수량(총 부품, **분모**) |
| `defect_quantity` | **불량 부품 수 = 입력된 부품 그룹 수(자동 계산)** |
| `defect_type` | (옵션) 세션 대표 불량유형 또는 null |
| `status` | `defect_quantity>0 ? 'fail' : 'pass'` |
| `user_id`/inspector, `machine_id`, `photo_url`, `factory_id` | 기존과 동일 |

### 4.3 불량 포인트 — `inspection_results` (불량 포인트마다 1행)
| 필드 | 값 |
|---|---|
| `inspection_id` | 위 세션 id |
| `item_id` | 불량 포인트(검사항목) id |
| `measured_value` | 입력한 측정값 (옵션 허용) |
| `result` | `'fail'` |

> **부품 그룹은 UI 개념**이다. 정확한 불량부품수는 `defect_quantity`에 저장하고, Pareto는 `inspection_results`(result='fail')를 `item_id`별로 집계한다. 부품 단위 추적이 더 필요해지면 추후 `part_index` 컬럼을 추가할 수 있으나 현재 범위 밖(YAGNI).
>
> **불량유형 저장:** `inspection_results`에는 `defect_type` 컬럼이 없으므로(마이그레이션 회피), 불량유형은 **세션 단위 `inspections.defect_type`** 에만 저장한다. 포인트마다 다른 불량유형을 저장하려면 컬럼 추가가 필요 → 범위 밖.

### 4.4 산출 계산
- **부품 불량률 (p-관리도):** `Σ defect_quantity / Σ inspection_quantity` (기존 `getPChartData` 그대로 작동).
- **포인트 Pareto:** `inspection_results`에서 `result='fail'`을 `item_id`별 count → `inspection_items.name` 조인. 신규 서비스 함수 `getDefectPointPareto(filters)`.

---

## 5. 컴포넌트 / 변경 범위 (파일 단위)

### 신규
- `src/components/spc/DefectPointLogger.tsx` — 불량 포인트 빠른 입력 패널 (D4 UI). props: 모델·공정·검사항목 목록, onChange(불량부품/포인트 구조).
- `src/components/spc/DefectPointParetoChart.tsx` — 포인트별 불량 Pareto 막대그래프 (Recharts).
- `src/services/spcService.ts`에 `getDefectPointPareto(filters, factoryId)` 추가.

### 변경
- `src/components/inspection/InspectionRecordForm.tsx` — 선택 모델+공정에 **numeric 검사항목이 존재하면** `DefectPointLogger` 패널을 노출(측정 공정 자동 감지). `defect_quantity`는 로거의 부품 그룹 수로 자동 채움.
- `src/pages/InspectionPage.tsx` — `handleSubmit`에서 세션(`inspections`) + 불량 포인트(`inspection_results`) 동시 기록(기존 `inspectionService.submitInspection` 재활용/확장).
- `src/services/inspectionService.ts` — 검사 기록 시 `inspection_results` fail 행 동시 insert 경로 정리(이미 존재하는 `submitInspection`를 UI에 연결).
- `src/pages/SPCPage.tsx` — 페이지 재구성(아래 §6).
- `src/components/spc/SPCKPICards.tsx` — KPI 카드 교체(아래 §6).
- `src/components/spc/ModelSPCSummaryTable.tsx` — 모델별 **불량률** 표로 변경.
- `src/components/spc/SPCGuide.tsx` — Cpk 설명 항목 정리(불량 포인트 가이드로 보강).
- `src/locales/ko/translation.json`, `src/locales/vi/translation.json` — 신규 키 추가 (**한/베 양쪽 필수**, CLAUDE.md 규칙).

### 보존(휴면, 손대지 않음 — D9)
- `src/lib/spc-calculations.ts` (Cp/Cpk/Ppk/Nelson 계산) — 그대로.
- `src/services/spcService.ts`의 `fetchAllItemCpkValues`, `getProcessCapabilityData`, `transformTo*Summary`의 Cpk 부분 — 코드 유지(미사용). 데이터가 생기면 재노출만 하면 부활.
- `src/components/spc/ProcessCapabilityCard.tsx` — 코드 유지(현재 화면에서 미참조 처리).

---

## 6. SPC 페이지 재구성 (Cpk 중심 → 불량 포인트 중심)

| 영역 | 현재 | 변경 후 |
|---|---|---|
| KPI 카드 | 관리 항목 수 · 평균 Cpk · 미조치 알림 · Cpk 등급 분포 | **검사 수량 · 불량률 · 미조치 알림 · TOP 불량 포인트** |
| 탭1 SPC 대시보드 | 가이드 + 모델별 **공정능력** 표 + 최근 알림 + p-차트 미리보기 | 가이드(정리) + 모델별 **불량률** 표 + 최근 알림 + p-차트 미리보기 |
| 탭2 관리도 | p-관리도(불량률) | ✅ 그대로 |
| 탭3 공정능력 분석 | Cpk·히스토그램 (`ProcessCapabilityCard`) | → **"불량 포인트 분석"** (`DefectPointParetoChart`)으로 교체 |
| 탭4 SPC 알림 | Nelson 규칙 알림 | ✅ 그대로 |

- KPI "검사 수량/불량률"은 기존 `getPChartData` 통계에서 산출, "TOP 불량 포인트"는 `getDefectPointPareto` 1위 항목.
- Cpk 관련 UI 컴포넌트/import는 SPCPage에서 **참조 제거**(파일은 보존).

---

## 7. 불량 포인트 입력 UX (D4 상세)

1. 검사 실행에서 모델·공정 선택 → numeric 항목 존재 시 패널 노출.
2. **검사 수량(분모)** 입력 — 검사자가 **자유롭게 정수 입력**(세션에서 검사한 총 부품 수). 고정값/프리셋 없음. 제약은 §8 검증만(≥1, 그리고 ≥ 불량부품수).
3. **[불량 포인트 추가]**: 번호 검색창 입력 → 자동완성 목록(`번호 · 항목명 (기준값 ±공차)`) → 선택.
4. **측정값** 입력 → 규격 자동 비교:
   - 규격 밖 → ❌ 불량 확정, 목록에 추가(Enter).
   - 규격 내 → ⚠️ 경고("규격 내 값입니다 — 정말 불량?") + 사유/불량유형 선택 시 추가 허용.
   - 값 미입력 허용(비치수 불량) — 가능하면 입력 권장.
5. **부품 그룹:** `부품 추가` 버튼으로 새 부품 시작 → "부품 A: #37 #82 / 부품 B: #5".
6. **미리보기:** 불량부품수(=그룹 수), 불량률(=불량부품/검사수량) 실시간 표시.
7. **저장:** `inspections` 1행 + `inspection_results`(fail 행 N개) 기록 → 기존 p-관리도/알림/신규 Pareto 자동 반영.

### 빠른 입력 키 동작
- 검색창 숫자 입력 → 즉시 필터, ↑↓ 선택, Enter로 항목 확정 → 측정값 포커스 → Enter로 추가 → 검색창 재포커스(반복). 키보드/숫자패드만으로 연속 입력 가능.

---

## 8. 에러 / 엣지 케이스
- `불량부품수 > 검사수량` 방지 (기존 검증 재사용).
- 같은 부품 내 **같은 포인트 중복 추가 방지**.
- 측정값이 규격 내인데 불량 등록 시 경고 + 사유 요구.
- 검사 수량 0 또는 미입력 시 저장 불가.
- 모델+공정에 numeric 항목이 없으면 패널 비노출(기존 카운트 입력만).
- 저장 실패 시 토스트 + 부분 저장 방지(세션·결과를 한 트랜잭션 흐름으로).

---

## 9. 범위 밖 (Out of scope)
- 구글시트/엑셀 자동 연동 (추후 별도 개선).
- Cpk 코드 완전 삭제 (보존 결정).
- 부품 단위 상세 추적(`part_index`) — 필요 시 후속.
- **포인트별 불량유형 저장** (`inspection_results.defect_type` 컬럼 필요) — 현재는 세션 단위만.
- 측정기 장비 직결(시리얼/USB).

---

## 10. 미해결 질문
- (없음 — 모든 핵심 결정 확정됨. 구현 중 세부는 계획 단계에서 처리.)
