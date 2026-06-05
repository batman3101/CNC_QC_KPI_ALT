# 불량 포인트 빠른 입력기 & SPC 불량 중심 재구성 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** H/G·MMS 같은 측정 공정에서 100+ 검사 포인트 중 불량 포인트만 빠르게 입력하고, 부품 불량률(p-관리도)과 포인트별 불량 Pareto를 산출하도록 SPC 페이지를 불량 중심으로 재구성한다.

**Architecture:** 기존 테이블 재사용(`inspections` 카운트 + `inspection_results` fail 행). 신규 UI 2개(`DefectPointLogger`, `DefectPointParetoChart`)와 서비스 함수 1개(`getDefectPointPareto`)를 추가하고, 저장은 이미 존재하는 `inspectionService.submitInspection`(현재 미사용)에 연결한다. Cpk UI는 화면에서만 제거하고 계산 엔진 코드는 보존한다.

**Tech Stack:** React 18 + TypeScript, MUI(검사 폼) + shadcn/Radix(SPC 카드), TanStack Query, Recharts, Supabase, react-i18next(한/베 필수).

> **검증 방식(중요):** 이 프로젝트는 테스트 러너가 없다(`AGENTS.md`). 각 태스크 검증은 **`npm run lint`(경고 0) + `npm run build`(tsc 타입체크) + 명시된 수동 확인**으로 한다. 테스트 코드 단계는 사용하지 않는다.

---

## 사전 조건 (구현 전 1회)
- 대상 모델의 검사 포인트 100개를 **기존 Excel 임포터**(`관리 → 검사 항목`, `entityType='inspectionItem'`)로 등록한다. 각 행: 모델코드 · **항목명에 포인트 번호 포함**(예: `37 외경`) · `데이터유형=numeric` · 기준값 · 최소공차 · 최대공차 · 단위. → `inspection_items`가 "기본 OK spec"이 된다. (코드 변경 아님, 데이터 준비)

## File Structure (생성/수정 책임)
- `src/types/spc.ts` — (수정) 불량 포인트 입력/Pareto 타입 추가.
- `src/services/spcService.ts` — (수정) `getDefectPointPareto` 추가. Cpk 함수는 보존(미사용).
- `src/components/spc/DefectPointLogger.tsx` — (생성) 번호검색+측정값+부품그룹 입력 패널. 순수 입력 UI(부모가 상태 소유).
- `src/components/spc/DefectPointParetoChart.tsx` — (생성) 포인트별 불량 Pareto 막대그래프.
- `src/components/inspection/InspectionRecordForm.tsx` — (수정) numeric 항목 존재 시 로거 노출, defect_quantity 자동화, onSubmit에 불량 포인트 전달.
- `src/pages/InspectionPage.tsx` — (수정) 불량 포인트가 있으면 `submitInspection`으로 저장.
- `src/components/spc/SPCKPICards.tsx` — (수정) 검사수량·불량률·미조치알림·TOP불량포인트 카드.
- `src/components/spc/ModelDefectRateTable.tsx` — (생성) 모델별 불량률 표.
- `src/components/spc/ModelSPCSummaryTable.tsx` — (보존, 휴면) Cpk 기반 표 — SPCPage에서 참조만 제거.
- `src/pages/SPCPage.tsx` — (수정) 공정능력 탭 → 불량 포인트 분석 탭 교체, Cpk UI 참조 제거.
- `src/locales/ko/translation.json`, `src/locales/vi/translation.json` — (수정) 신규 키(한/베).

---

## Task 1: i18n 키 추가 (한/베)

**Files:**
- Modify: `src/locales/ko/translation.json` (기존 `"spc"` 객체 내부)
- Modify: `src/locales/vi/translation.json` (기존 `"spc"` 객체 내부)

- [ ] **Step 1: ko 번역 키 추가** — `src/locales/ko/translation.json`의 `"spc"` 객체 안, `"guide"` 키 앞에 다음 블록을 추가한다.

```json
"defectPoint": {
  "panelTitle": "불량 포인트 입력",
  "panelHelper": "불량난 포인트 번호를 검색해 측정값을 입력하세요. 합격 포인트는 입력하지 않습니다.",
  "searchPlaceholder": "포인트 번호 검색 (예: 37)",
  "measuredValue": "측정값",
  "spec": "규격",
  "add": "추가",
  "addPart": "부품 추가",
  "part": "부품",
  "noNumericItems": "이 모델·공정에는 수치형 검사 항목이 없습니다. (관리 → 검사 항목에서 Excel로 등록)",
  "withinSpecWarning": "규격 내 값입니다 — 그래도 불량으로 기록할까요?",
  "duplicatePoint": "이미 추가된 포인트입니다",
  "defectiveParts": "불량 부품 수",
  "noPoints": "추가된 불량 포인트가 없습니다",
  "remove": "삭제"
},
"defectAnalysis": {
  "tabTitle": "불량 포인트 분석",
  "paretoTitle": "검사 포인트별 불량 Pareto",
  "pointName": "검사 포인트",
  "defectCount": "불량 수",
  "noData": "선택한 기간에 불량 포인트 데이터가 없습니다"
},
"kpi2": {
  "inspectedQty": "검사 수량",
  "defectRate": "불량률",
  "topDefectPoint": "TOP 불량 포인트",
  "modelDefectRate": "모델별 불량률"
},
```

- [ ] **Step 2: vi 번역 키 추가** — `src/locales/vi/translation.json`의 `"spc"` 객체 안 동일 위치에 추가한다.

```json
"defectPoint": {
  "panelTitle": "Nhập điểm lỗi",
  "panelHelper": "Tìm số điểm bị lỗi và nhập giá trị đo. Điểm đạt thì không nhập.",
  "searchPlaceholder": "Tìm số điểm (VD: 37)",
  "measuredValue": "Giá trị đo",
  "spec": "Quy cách",
  "add": "Thêm",
  "addPart": "Thêm chi tiết",
  "part": "Chi tiết",
  "noNumericItems": "Model·công đoạn này chưa có hạng mục dạng số. (Đăng ký bằng Excel ở Quản lý → Hạng mục kiểm tra)",
  "withinSpecWarning": "Giá trị nằm trong quy cách — vẫn ghi nhận là lỗi?",
  "duplicatePoint": "Điểm này đã được thêm",
  "defectiveParts": "Số chi tiết lỗi",
  "noPoints": "Chưa thêm điểm lỗi nào",
  "remove": "Xóa"
},
"defectAnalysis": {
  "tabTitle": "Phân tích điểm lỗi",
  "paretoTitle": "Pareto lỗi theo điểm kiểm tra",
  "pointName": "Điểm kiểm tra",
  "defectCount": "Số lỗi",
  "noData": "Không có dữ liệu điểm lỗi trong khoảng đã chọn"
},
"kpi2": {
  "inspectedQty": "Số lượng kiểm",
  "defectRate": "Tỉ lệ lỗi",
  "topDefectPoint": "Điểm lỗi nhiều nhất",
  "modelDefectRate": "Tỉ lệ lỗi theo model"
},
```

- [ ] **Step 3: 검증** — Run: `npm run build`. Expected: PASS (JSON 파싱 오류 없음). JSON 끝쉼표·따옴표 확인.
- [ ] **Step 4: Commit**

```bash
git add src/locales/ko/translation.json src/locales/vi/translation.json
git commit -m "i18n: add defect-point logger and defect-analysis keys (ko/vi)"
```

---

## Task 2: 타입 + Pareto 서비스 함수

**Files:**
- Modify: `src/types/spc.ts` (파일 끝에 추가)
- Modify: `src/services/spcService.ts` (파일 끝에 추가)

- [ ] **Step 1: 타입 추가** — `src/types/spc.ts` 맨 끝에 추가한다.

```typescript
// ============================================
// 10. 불량 포인트 입력 (Exception Defect-Point Logger)
// ============================================

/** 입력 중인 불량 포인트 1건 */
export interface DefectPointEntry {
  item_id: string
  item_name: string
  measured_value: number | null
}

/** 한 부품 = 불량 포인트 묶음 */
export type DefectPart = DefectPointEntry[]

/** 포인트별 Pareto 1행 */
export interface DefectPointParetoRow {
  item_id: string
  item_name: string
  defect_count: number
}
```

- [ ] **Step 2: Pareto 서비스 함수 추가** — `src/services/spcService.ts` 맨 끝에 추가한다. (상단 import의 `SPCFilters`, `getBusinessDateRangeFilter`는 이미 존재)

```typescript
// ============================================
// 6. 불량 포인트 Pareto (불량 발생 포인트 집계)
// ============================================

import type { DefectPointParetoRow } from '@/types/spc'

/**
 * inspection_results(result='fail')를 item_id별로 집계 → 포인트별 불량 Pareto
 */
export async function getDefectPointPareto(
  filters: { model_id?: string; process_id?: string; date_from: Date; date_to: Date },
  factoryId?: string
): Promise<DefectPointParetoRow[]> {
  const dateFilter = getBusinessDateRangeFilter(filters.date_from, filters.date_to)

  let query = supabase
    .from('inspection_results')
    .select(`
      item_id,
      result,
      inspection_items!inner ( name ),
      inspections!inner ( model_id, inspection_process, factory_id, created_at )
    `)
    .eq('result', 'fail')
    .gte('inspections.created_at', dateFilter.gte)
    .lte('inspections.created_at', dateFilter.lte)

  if (filters.model_id) query = query.eq('inspections.model_id', filters.model_id)
  if (filters.process_id) query = query.eq('inspections.inspection_process', filters.process_id)
  if (factoryId) query = query.eq('inspections.factory_id', factoryId)

  const { data, error } = await query
  if (error) {
    console.error('[SPC] Failed to fetch defect-point pareto:', error)
    return []
  }

  // item_id별 카운트
  const counts = new Map<string, { name: string; count: number }>()
  for (const row of (data || []) as Array<Record<string, unknown>>) {
    const itemId = row.item_id as string
    const item = row.inspection_items as { name: string } | null
    const name = item?.name ?? itemId
    const prev = counts.get(itemId)
    if (prev) prev.count += 1
    else counts.set(itemId, { name, count: 1 })
  }

  return Array.from(counts.entries())
    .map(([item_id, v]) => ({ item_id, item_name: v.name, defect_count: v.count }))
    .sort((a, b) => b.defect_count - a.defect_count)
}
```

- [ ] **Step 3: 검증** — Run: `npm run lint && npm run build`. Expected: PASS. (새 export는 아직 미사용 — 사용처는 다음 태스크)
- [ ] **Step 4: Commit**

```bash
git add src/types/spc.ts src/services/spcService.ts
git commit -m "feat(spc): add defect-point types and getDefectPointPareto service"
```

---

## Task 3: DefectPointLogger 컴포넌트 (순수 입력 UI)

**Files:**
- Create: `src/components/spc/DefectPointLogger.tsx`

부모(InspectionRecordForm)가 `parts` 상태를 소유하고, 이 컴포넌트는 표시 + 변경 콜백만 담당한다(제어 컴포넌트).

- [ ] **Step 1: 컴포넌트 생성** — 아래 전체 코드를 작성한다.

```tsx
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box, Paper, Typography, TextField, Button, IconButton, Chip,
  Autocomplete, Alert, Divider,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import type { Database } from '@/types/database'
import type { DefectPart, DefectPointEntry } from '@/types/spc'

type InspectionItem = Database['public']['Tables']['inspection_items']['Row']

interface DefectPointLoggerProps {
  /** 선택 모델·공정의 numeric 검사 항목 목록 */
  items: InspectionItem[]
  /** 부품별 불량 포인트 묶음 (제어 상태) */
  parts: DefectPart[]
  onChange: (parts: DefectPart[]) => void
}

export function DefectPointLogger({ items, parts, onChange }: DefectPointLoggerProps) {
  const { t } = useTranslation()
  const [activePart, setActivePart] = useState(0)
  const [selectedItem, setSelectedItem] = useState<InspectionItem | null>(null)
  const [measured, setMeasured] = useState('')
  const [warn, setWarn] = useState<string | null>(null)
  const valueRef = useRef<HTMLInputElement>(null)

  const specOf = (it: InspectionItem) => ({
    usl: it.standard_value + it.tolerance_max,
    lsl: it.standard_value + it.tolerance_min,
  })

  const optionLabel = (it: InspectionItem) => {
    const { usl, lsl } = specOf(it)
    return `${it.name}  (${lsl} ~ ${usl}${it.unit ? ' ' + it.unit : ''})`
  }

  const currentPart: DefectPart = parts[activePart] ?? []

  const addPoint = () => {
    if (!selectedItem) return
    if (currentPart.some((p) => p.item_id === selectedItem.id)) {
      setWarn(t('spc.defectPoint.duplicatePoint'))
      return
    }
    const value = measured.trim() === '' ? null : Number(measured)
    if (value !== null && !Number.isNaN(value)) {
      const { usl, lsl } = specOf(selectedItem)
      if (value >= lsl && value <= usl) {
        // 규격 내 값 — 경고만 표시하고 추가는 허용
        setWarn(t('spc.defectPoint.withinSpecWarning'))
      } else {
        setWarn(null)
      }
    }
    const entry: DefectPointEntry = {
      item_id: selectedItem.id,
      item_name: selectedItem.name,
      measured_value: value !== null && !Number.isNaN(value) ? value : null,
    }
    const next = parts.slice()
    next[activePart] = [...currentPart, entry]
    onChange(next)
    setSelectedItem(null)
    setMeasured('')
  }

  const removePoint = (partIdx: number, itemId: string) => {
    const next = parts
      .map((p, i) => (i === partIdx ? p.filter((e) => e.item_id !== itemId) : p))
      .filter((p) => p.length > 0)
    onChange(next.length > 0 ? next : [])
    setActivePart((idx) => Math.min(idx, Math.max(0, (next.length || 1) - 1)))
  }

  const addPart = () => {
    const next = [...parts, []]
    onChange(next)
    setActivePart(next.length - 1)
  }

  const totalPoints = useMemo(() => parts.reduce((s, p) => s + p.length, 0), [parts])

  if (items.length === 0) {
    return <Alert severity="info">{t('spc.defectPoint.noNumericItems')}</Alert>
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2 }}>
      <Typography variant="subtitle1" fontWeight={700}>{t('spc.defectPoint.panelTitle')}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        {t('spc.defectPoint.panelHelper')}
      </Typography>

      {/* 부품 그룹 */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {parts.map((_, i) => (
          <Chip
            key={i}
            label={`${t('spc.defectPoint.part')} ${i + 1}`}
            color={i === activePart ? 'primary' : 'default'}
            onClick={() => setActivePart(i)}
            variant={i === activePart ? 'filled' : 'outlined'}
          />
        ))}
        <Button size="small" startIcon={<AddIcon />} onClick={addPart}>
          {t('spc.defectPoint.addPart')}
        </Button>
      </Box>

      {/* 입력 행 */}
      <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' } }}>
        <Autocomplete
          sx={{ flex: 2, minWidth: 200 }}
          options={items}
          value={selectedItem}
          onChange={(_e, v) => { setSelectedItem(v); setWarn(null); valueRef.current?.focus() }}
          getOptionLabel={optionLabel}
          isOptionEqualToValue={(o, v) => o.id === v.id}
          renderInput={(params) => (
            <TextField {...params} label={t('spc.defectPoint.searchPlaceholder')} size="small" />
          )}
        />
        <TextField
          inputRef={valueRef}
          sx={{ flex: 1, minWidth: 120 }}
          type="number"
          size="small"
          label={t('spc.defectPoint.measuredValue')}
          value={measured}
          onChange={(e) => setMeasured(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPoint() } }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={addPoint} disabled={!selectedItem}>
          {t('spc.defectPoint.add')}
        </Button>
      </Box>
      {warn && <Alert severity="warning" sx={{ mt: 1 }}>{warn}</Alert>}

      <Divider sx={{ my: 2 }} />

      {/* 추가된 불량 포인트 목록 (부품별) */}
      {totalPoints === 0 ? (
        <Typography variant="body2" color="text.secondary">{t('spc.defectPoint.noPoints')}</Typography>
      ) : (
        parts.map((part, pi) => (
          <Box key={pi} sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600}>{t('spc.defectPoint.part')} {pi + 1}</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              {part.map((e) => (
                <Chip
                  key={e.item_id}
                  label={`${e.item_name}${e.measured_value !== null ? ' = ' + e.measured_value : ''}`}
                  color="error"
                  variant="outlined"
                  onDelete={() => removePoint(pi, e.item_id)}
                  deleteIcon={<DeleteIcon />}
                />
              ))}
            </Box>
          </Box>
        ))
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" fontWeight={600}>
          {t('spc.defectPoint.defectiveParts')}: {parts.filter((p) => p.length > 0).length}
        </Typography>
      </Box>
    </Paper>
  )
}
```

- [ ] **Step 2: 검증** — Run: `npm run lint && npm run build`. Expected: PASS. (미사용 컴포넌트 — import 경고 없도록 export만)
- [ ] **Step 3: Commit**

```bash
git add src/components/spc/DefectPointLogger.tsx
git commit -m "feat(spc): add DefectPointLogger exception-entry component"
```

---

## Task 4: 검사 폼에 로거 연결 (InspectionRecordForm)

**Files:**
- Modify: `src/components/inspection/InspectionRecordForm.tsx`

선택 모델+공정에 numeric 항목이 있으면 로거를 노출하고, 불량 부품 수를 자동 계산하며, onSubmit으로 불량 포인트를 전달한다.

- [ ] **Step 1: import 및 props 시그니처 확장** — 파일 상단 import에 추가:

```tsx
import { useQuery } from '@tanstack/react-query' // 이미 import되어 있으면 생략
import * as managementService from '@/services/managementService' // 이미 import됨
import { DefectPointLogger } from '@/components/spc/DefectPointLogger'
import type { DefectPart } from '@/types/spc'
```

`InspectionRecordFormProps`의 `onSubmit` 타입을 다음으로 변경한다:

```tsx
onSubmit: (data: InspectionRecordInput, photoFile: File | null, defectParts: DefectPart[]) => Promise<void>
```

- [ ] **Step 2: numeric 항목 조회 + 불량 포인트 상태 추가** — 컴포넌트 본문, 기존 `useForm` 아래에 추가:

```tsx
const [defectParts, setDefectParts] = useState<DefectPart[]>([])

const { data: numericItems = [] } = useQuery({
  queryKey: ['inspection-items-numeric', modelId],
  queryFn: () => managementService.getInspectionItems(modelId),
  enabled: !!modelId,
  select: (items) => items.filter((it) => it.data_type === 'numeric'),
})

const hasNumericItems = numericItems.length > 0
const defectivePartCount = defectParts.filter((p) => p.length > 0).length
```

- [ ] **Step 3: defect_quantity 자동화** — numeric 항목이 있을 때는 로거의 불량부품수로 폼 값을 동기화한다. 본문에 추가:

```tsx
useEffect(() => {
  if (hasNumericItems) setValue('defectQuantity', defectivePartCount)
}, [hasNumericItems, defectivePartCount, setValue])
```

(`useEffect`가 import되어 있지 않으면 `import { useState, useRef, useEffect } from 'react'`로 보강)

- [ ] **Step 4: 로거 패널 렌더** — Step 2 "workflowQuantities" `Paper` 블록(검사수량/불량수량) 바로 아래에 다음을 삽입한다. numeric 항목이 있으면 표시:

```tsx
{hasNumericItems && (
  <DefectPointLogger
    items={numericItems}
    parts={defectParts}
    onChange={setDefectParts}
  />
)}
```

- [ ] **Step 5: onSubmit 호출에 defectParts 전달** — 기존 `handleFormSubmit`의 `onSubmit({...}, photoFile)` 호출을 다음으로 변경:

```tsx
await onSubmit({
  model_id: modelId,
  inspection_process: inspectionProcess,
  defect_type_id: values.defectTypeId || null,
  machine_id: selectedMachine?.id || null,
  machine_number: selectedMachine?.name || null,
  inspector_id: values.inspectorId,
  inspection_quantity: values.inspectionQuantity,
  defect_quantity: values.defectQuantity,
}, photoFile, defectParts)
```

- [ ] **Step 6: 검증** — Run: `npm run lint && npm run build`. Expected: PASS. 그리고 `npm run dev` → `검사 실행` → numeric 항목이 등록된 모델 선택 → 불량 포인트 패널이 보이고, 포인트 추가 시 "불량 수량"이 자동으로 부품 수와 일치하는지 확인.
- [ ] **Step 7: Commit**

```bash
git add src/components/inspection/InspectionRecordForm.tsx
git commit -m "feat(inspection): show DefectPointLogger for measurement processes and auto-derive defect qty"
```

---

## Task 5: 저장 연결 (InspectionPage → submitInspection)

**Files:**
- Modify: `src/pages/InspectionPage.tsx`

불량 포인트가 있으면 `submitInspection`(inspections + inspection_results fail 행 기록)로, 없으면 기존 `createInspectionRecord`로 저장한다.

- [ ] **Step 1: useAuth import 확인 후 handleSubmit 시그니처 확장** — 상단에 `import { useAuth } from '@/hooks/useAuth'` 추가(없으면), 본문에 `const { profile } = useAuth()` 추가(없으면). `handleSubmit`을 다음으로 교체한다:

```tsx
const handleSubmit = async (
  data: InspectionRecordInput,
  photoFile: File | null,
  defectParts: DefectPart[],
) => {
  let photoUrl: string | null = null
  if (photoFile) {
    photoUrl = await inspectionService.compressAndUploadPhoto(photoFile)
  }

  const failedPoints = defectParts.flat()

  if (failedPoints.length > 0) {
    // 불량 포인트가 있는 측정 공정 → inspections + inspection_results 동시 기록
    await inspectionService.submitInspection({
      userId: data.inspector_id,
      machineId: data.machine_id || undefined,
      modelId: data.model_id,
      inspectionProcess: data.inspection_process.code, // 코드 저장(코드베이스 전역 규약: inspection_process 컬럼=공정 코드)
      inspectionQuantity: data.inspection_quantity,
      defectQuantity: data.defect_quantity,
      results: failedPoints.map((p) => ({
        itemId: p.item_id,
        measuredValue: p.measured_value ?? 0,
        result: 'fail' as const,
      })),
      defectType: data.defect_type_id || undefined,
      photoUrl: photoUrl || undefined,
      factoryId: activeFactoryId || undefined,
    })
  } else {
    // 기존 카운트 기반 경로 (GO/NO-GO 등)
    await inspectionService.createInspectionRecord({
      ...data,
      photo_url: photoUrl,
      factory_id: activeFactoryId || undefined,
    })
  }

  await queryClient.invalidateQueries({ queryKey: ['defects'] })
  await queryClient.invalidateQueries({ queryKey: ['inspections'] })
  await queryClient.invalidateQueries({ queryKey: ['dashboard-defects'] })
  await queryClient.invalidateQueries({ queryKey: ['spc-pchart'] })
  await queryClient.invalidateQueries({ queryKey: ['spc-defect-pareto'] })

  enqueueSnackbar(t('inspection.submitSuccess'), { variant: 'success' })
  setInspectionState({ isActive: false, modelId: null, inspectionProcess: null })
}
```

상단 import에 타입 추가: `import type { InspectionRecordInput } from '@/types/inspection'`(이미 있으면 생략), `import type { DefectPart } from '@/types/spc'`.

- [ ] **Step 2: 검증** — Run: `npm run lint && npm run build`. Expected: PASS. `npm run dev`에서 numeric 모델로 검사수량 입력 + 불량 포인트 2개(부품 2개) 추가 후 저장 → 콘솔/네트워크에서 `inspections` 1행 + `inspection_results` 2행(result='fail') 기록 확인. (Mock 모드면 mock 서비스 반영 확인)
- [ ] **Step 3: Commit**

```bash
git add src/pages/InspectionPage.tsx
git commit -m "feat(inspection): persist defect points via submitInspection"
```

---

## Task 6: DefectPointParetoChart 컴포넌트

**Files:**
- Create: `src/components/spc/DefectPointParetoChart.tsx`

- [ ] **Step 1: 컴포넌트 생성**

```tsx
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { DefectPointParetoRow } from '@/types/spc'

interface DefectPointParetoChartProps {
  data: DefectPointParetoRow[]
  maxBars?: number
}

const BAR_COLORS = ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d']

export function DefectPointParetoChart({ data, maxBars = 15 }: DefectPointParetoChartProps) {
  const { t } = useTranslation()
  const rows = data.slice(0, maxBars)

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">{t('spc.defectAnalysis.paretoTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t('spc.defectAnalysis.noData')}
          </p>
        ) : (
          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer>
              <BarChart data={rows} layout="vertical" margin={{ left: 24, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="item_name"
                  width={140}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(v: number) => [v, t('spc.defectAnalysis.defectCount')]} />
                <Bar dataKey="defect_count" name={t('spc.defectAnalysis.defectCount')}>
                  {rows.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[Math.min(i, BAR_COLORS.length - 1)]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: 검증** — Run: `npm run lint && npm run build`. Expected: PASS.
- [ ] **Step 3: Commit**

```bash
git add src/components/spc/DefectPointParetoChart.tsx
git commit -m "feat(spc): add DefectPointParetoChart"
```

---

## Task 7: SPC 페이지 재구성 (공정능력 탭 → 불량 포인트 분석)

**Files:**
- Modify: `src/pages/SPCPage.tsx`

- [ ] **Step 1: import 교체** — `ProcessCapabilityCard` import를 제거(파일은 보존)하고 추가:

```tsx
import { DefectPointParetoChart } from '@/components/spc/DefectPointParetoChart'
import { getDefectPointPareto } from '@/services/spcService'
```

`@/components/spc` 묶음 import에서 `ProcessCapabilityCard`는 빼고 나머지는 유지한다.

- [ ] **Step 2: Pareto 쿼리 추가** — 기존 `capabilityData` useQuery를 제거하고 다음으로 대체:

```tsx
const { data: defectPareto = [] } = useQuery({
  queryKey: ['spc-defect-pareto', selectedModelId, selectedProcessId, dateRange, activeFactoryId],
  queryFn: () =>
    getDefectPointPareto(
      {
        model_id: selectedModelId,
        process_id: selectedProcessId,
        date_from: dateRange?.from || defaultDateRange.from,
        date_to: dateRange?.to || defaultDateRange.to,
      },
      activeFactoryId || undefined,
    ),
})
```

- [ ] **Step 3: 탭3 내용 교체** — `<TabPanel value={tabValue} index={2}>` 내부 전체(공정능력 분석 조건부 블록)를 다음으로 교체:

```tsx
<TabPanel value={tabValue} index={2}>
  <DefectPointParetoChart data={defectPareto} />
</TabPanel>
```

탭 라벨도 변경: `<Tab label={t('spc.processCapability')} />` → `<Tab label={t('spc.defectAnalysis.tabTitle')} />`.

- [ ] **Step 4: 탭2 항목필터 제거** — `<SPCFilters ... showItemFilter={tabValue === 2} />`를 `showItemFilter={false}`로 변경(공정능력 항목 선택 불필요).

- [ ] **Step 5: 검증** — Run: `npm run lint && npm run build`. Expected: PASS (미사용 import 경고 0). `npm run dev` → SPC 분석 → 탭3가 "불량 포인트 분석"으로 바뀌고 Pareto가 표시되는지 확인.
- [ ] **Step 6: Commit**

```bash
git add src/pages/SPCPage.tsx
git commit -m "feat(spc): replace capability tab with defect-point pareto analysis"
```

---

## Task 8: KPI 카드 & 모델 표 불량 중심 변경

**Files:**
- Modify: `src/components/spc/SPCKPICards.tsx`
- Modify: `src/components/spc/ModelSPCSummaryTable.tsx`
- Modify: `src/pages/SPCPage.tsx` (KPI에 넘길 데이터 구성)

- [ ] **Step 1: SPCPage에서 불량률 KPI 데이터 구성** — `kpiSummary` useMemo를 불량 중심으로 보강한다. 기존 `kpiSummary` 계산 뒤에 파생값을 추가:

```tsx
const defectKpi = useMemo(() => {
  const inspected = pChartData?.statistics.totalInspections ?? 0
  const defects = pChartData?.statistics.totalDefects ?? 0
  const rate = inspected > 0 ? (defects / inspected) * 100 : 0
  const top = defectPareto[0]
  return {
    inspectedQty: inspected,
    defectRate: rate,
    openAlerts: allAlerts.filter((a) => a.status === 'open').length,
    topDefectPoint: top ? `${top.item_name} (${top.defect_count})` : '-',
  }
}, [pChartData, defectPareto, allAlerts])
```

기존 KPI 렌더 블록 `{kpiSummary && (<Box sx={{ mb: 3 }}><SPCKPICards data={kpiSummary} /></Box>)}`을 항상 렌더로 교체: `<Box sx={{ mb: 3 }}><SPCKPICards defect={defectKpi} /></Box>` (아래 Step 2의 새 props).

- [ ] **Step 2: SPCKPICards를 불량 KPI props로 교체** — 파일 전체를 다음으로 교체한다.

```tsx
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, Percent, AlertTriangle, Crosshair, CheckCircle2 } from 'lucide-react'

export interface DefectKpi {
  inspectedQty: number
  defectRate: number
  openAlerts: number
  topDefectPoint: string
}

interface SPCKPICardsProps {
  defect: DefectKpi
}

export function SPCKPICards({ defect }: SPCKPICardsProps) {
  const { t } = useTranslation()
  const rateColor =
    defect.defectRate <= 1 ? 'text-green-600' : defect.defectRate <= 3 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 검사 수량 */}
      <Card className="shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('spc.kpi2.inspectedQty')}</CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{defect.inspectedQty.toLocaleString()}</div>
        </CardContent>
      </Card>

      {/* 불량률 */}
      <Card className="shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('spc.kpi2.defectRate')}</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${rateColor}`}>{defect.defectRate.toFixed(2)}%</div>
        </CardContent>
      </Card>

      {/* 미조치 알림 */}
      <Card className="shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('spc.kpi.openAlerts')}</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${defect.openAlerts > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{defect.openAlerts}</div>
          {defect.openAlerts === 0 && (
            <p className="mt-2 text-xs text-green-600">
              <CheckCircle2 className="mr-1 inline h-3 w-3" />
              {t('spc.chart.noViolation')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* TOP 불량 포인트 */}
      <Card className="shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('spc.kpi2.topDefectPoint')}</CardTitle>
          <Crosshair className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
            {defect.topDefectPoint}
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: 모델별 불량률 서비스 추가** — `src/services/spcService.ts` 끝에 추가:

```typescript
// ============================================
// 7. 모델별 불량률 (inspections 집계, 조인 미사용)
// ============================================

export interface ModelDefectRate {
  model_id: string
  model_name: string
  model_code: string
  inspected: number
  defects: number
  defect_rate: number
}

export async function getModelDefectRates(
  filters: { process_id?: string; date_from: Date; date_to: Date },
  models: { id: string; name: string; code: string }[],
  factoryId?: string,
): Promise<ModelDefectRate[]> {
  const dateFilter = getBusinessDateRangeFilter(filters.date_from, filters.date_to)
  let query = supabase
    .from('inspections')
    .select('model_id, inspection_quantity, defect_quantity')
    .gte('created_at', dateFilter.gte)
    .lte('created_at', dateFilter.lte)
  if (filters.process_id) query = query.eq('inspection_process', filters.process_id)
  if (factoryId) query = query.eq('factory_id', factoryId)

  const { data, error } = await query
  if (error) {
    console.error('[SPC] Failed to fetch model defect rates:', error)
    return []
  }

  const agg = new Map<string, { inspected: number; defects: number }>()
  for (const row of data || []) {
    const cur = agg.get(row.model_id) ?? { inspected: 0, defects: 0 }
    cur.inspected += row.inspection_quantity || 0
    cur.defects += row.defect_quantity || 0
    agg.set(row.model_id, cur)
  }

  return models
    .map((m) => {
      const a = agg.get(m.id) ?? { inspected: 0, defects: 0 }
      return {
        model_id: m.id,
        model_name: m.name,
        model_code: m.code,
        inspected: a.inspected,
        defects: a.defects,
        defect_rate: a.inspected > 0 ? (a.defects / a.inspected) * 100 : 0,
      }
    })
    .filter((m) => m.inspected > 0)
    .sort((a, b) => b.defect_rate - a.defect_rate)
}
```

- [ ] **Step 4: ModelDefectRateTable 컴포넌트 생성** — `src/components/spc/ModelDefectRateTable.tsx`:

```tsx
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TrendingUp } from 'lucide-react'
import type { ModelDefectRate } from '@/services/spcService'

interface ModelDefectRateTableProps {
  data: ModelDefectRate[]
  onRowClick?: (modelId: string) => void
}

export function ModelDefectRateTable({ data, onRowClick }: ModelDefectRateTableProps) {
  const { t } = useTranslation()
  const rateColor = (r: number) => (r <= 1 ? 'text-green-600' : r <= 3 ? 'text-yellow-600' : 'text-red-600')

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('spc.kpi2.modelDefectRate')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground">{t('spc.noData')}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dashboard.model')}</TableHead>
                  <TableHead className="text-center">{t('spc.kpi2.inspectedQty')}</TableHead>
                  <TableHead className="text-center">{t('spc.chart.defectCount')}</TableHead>
                  <TableHead className="text-center">{t('spc.kpi2.defectRate')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((m) => (
                  <TableRow
                    key={m.model_id}
                    className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                    onClick={() => onRowClick?.(m.model_id)}
                  >
                    <TableCell>
                      <div className="font-medium">{m.model_name}</div>
                      <div className="text-xs text-muted-foreground">{m.model_code}</div>
                    </TableCell>
                    <TableCell className="text-center">{m.inspected.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{m.defects.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={rateColor(m.defect_rate)}>
                        {m.defect_rate.toFixed(2)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: SPCPage에서 모델 표 교체 + 쿼리 연결** — `src/pages/SPCPage.tsx`:
  - import 추가: `import { ModelDefectRateTable } from '@/components/spc/ModelDefectRateTable'`, `import { getModelDefectRates } from '@/services/spcService'`. `@/components/spc` 묶음 import에서 `ModelSPCSummaryTable` 제거(파일 보존).
  - 쿼리 추가:

```tsx
const { data: modelDefectRates = [] } = useQuery({
  queryKey: ['spc-model-defect-rates', selectedProcessId, dateRange, activeFactoryId, productModels],
  queryFn: () =>
    getModelDefectRates(
      {
        process_id: selectedProcessId,
        date_from: dateRange?.from || defaultDateRange.from,
        date_to: dateRange?.to || defaultDateRange.to,
      },
      productModels.map((m) => ({ id: m.id, name: m.name, code: m.code })),
      activeFactoryId || undefined,
    ),
  enabled: productModels.length > 0,
})
```
  - 대시보드 탭의 `<ModelSPCSummaryTable data={modelSummary} onRowClick={...} />`를 다음으로 교체:

```tsx
<ModelDefectRateTable
  data={modelDefectRates}
  onRowClick={(modelId) => { setSelectedModelId(modelId); setTabValue(1) }}
/>
```

- [ ] **Step 6: 검증** — Run: `npm run lint && npm run build`. Expected: PASS. `npm run dev` → SPC 분석 상단 카드(검사수량·불량률·미조치알림·TOP불량포인트) + 대시보드 모델별 불량률 표 확인.
- [ ] **Step 7: Commit**

```bash
git add src/services/spcService.ts src/components/spc/SPCKPICards.tsx src/components/spc/ModelDefectRateTable.tsx src/pages/SPCPage.tsx
git commit -m "feat(spc): defect-centric KPI cards and model defect-rate table"
```

---

## Task 9: 가이드 카드 정리 + 최종 점검

**Files:**
- Modify: `src/components/spc/SPCGuide.tsx` (선택적 정리)
- Modify: `src/pages/SPCPage.tsx` (Cpk 잔여 참조 제거 확인)

- [ ] **Step 1: SPCPage의 미사용 Cpk 쿼리/메모 제거** — Task 7·8 적용 후 더 이상 쓰이지 않는 다음을 SPCPage에서 제거한다: `allCpkData` useQuery, `kpiSummary` useMemo, `modelSummary` useMemo, 그리고 미사용이 된 import(`fetchAllItemCpkValues`, `transformToKPISummary`, `transformToModelSummary`, `getProcessCapabilityData`, 필요 없어진 `getInspectionItems`). **`src/lib/spc-calculations.ts`와 `spcService.ts`의 Cpk 함수 자체는 삭제 금지(보존).** p-chart(`getPChartData`)·알림(`generateAndUpsertAlerts`/`getSPCAlerts`)·`getDefectPointPareto`·`getModelDefectRates` 쿼리는 유지.
- [ ] **Step 2: 가이드 텍스트 정리(선택)** — `SPCGuide.tsx`의 Cpk 항목은 유지해도 무방하나, 현재 플로우가 불량 추적임을 안내하는 한 줄을 추가하려면 i18n 키로 처리한다(하드코딩 금지 — CLAUDE.md). 시간이 없으면 생략 가능.
- [ ] **Step 3: 전체 검증** — Run: `npm run lint && npm run build`. Expected: PASS, 경고 0. `npm run dev` 전체 플로우 1회: 항목 Excel 등록(사전조건) → 검사 실행에서 불량 포인트 입력·저장 → SPC 분석에서 ① 관리도 불량률 점 ② 탭3 Pareto ③ 상단 불량률/TOP포인트 KPI가 모두 반영되는지 확인.
- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(spc): tidy dormant Cpk references, final defect-flow verification"
```

---

## Self-Review (작성자 점검 결과)

**1. 사양 커버리지:** 사양 §4 데이터(Task 2,5) · §5 컴포넌트/변경(Task 2~8) · §6 페이지 재구성(Task 7,8) · §7 입력 UX(Task 3,4) · §8 엣지(Task 3: 중복/규격내 경고; Task 4: defect_qty 자동; 기존 폼의 defect>inspection 검증 유지) · §9 비목표(Cpk 코드 보존 — Task 9에서 삭제 금지 명시) 모두 태스크로 매핑됨. ✅

**2. 플레이스홀더:** 없음. 모든 코드 단계에 실제 코드 포함. (구 버전에서 모호했던 ModelSPCSummaryTable 인플레이스 편집은 제거 — 대신 신규 `ModelDefectRateTable` + `getModelDefectRates` 전체 코드를 Task 8 Step 3·4에 명시하고, 기존 Cpk 표는 휴면 보존.)

**3. 타입 일관성:** `DefectPart`/`DefectPointEntry`(Task 2)는 Logger(Task 3)·Form(Task 4)·Page(Task 5)에서 동일 사용. `DefectKpi`(Task 8 SPCKPICards) ↔ SPCPage `defectKpi`(Task 8 Step 1) 필드명 일치(inspectedQty/defectRate/openAlerts/topDefectPoint). `getDefectPointPareto`(Task 2) ↔ 사용처(Task 7,8) 시그니처 일치. `submitInspection` 호출 인자(Task 5)는 `InspectionSubmitData`(inspectionService.ts:211) 필드와 일치. ✅

**알려진 의존(해소됨):** 모든 신규/수정 코드의 시그니처는 확인된 소스 기반이다 — `submitInspection`(inspectionService.ts:211–277), `getPChartData`/`getBusinessDateRangeFilter`(spcService.ts), `InspectionRecordInput`(types/inspection.ts), `inspection_items` 컬럼(database.ts), `ModelSPCSummaryTable`/`SPCKPICards` 구조 모두 직접 확인함. 실행 시 주의점 하나: SPCPage의 기존 KPI 가드(`{kpiSummary && ...}`)와 모델표 렌더(`<ModelSPCSummaryTable .../>`)를 정확히 교체할 것(Task 8 Step 1·5).
```
