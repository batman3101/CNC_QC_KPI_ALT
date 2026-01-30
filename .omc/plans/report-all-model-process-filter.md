# 리포트 생성: 전체 모델/공정 선택 및 PDF/EXCEL 출력 수정

## 문제 분석

### 현상 1: 드롭다운에 "전체" 옵션 미표시
코드 확인 결과, `ReportGenerator.tsx:212`에 `<MenuItem value="">{t('reports.allModels')}</MenuItem>`가 이미 존재하고, 번역 키도 존재함.
그러나 MUI Select에서 `value=""`일 때 선택된 항목 텍스트가 표시되지 않고 InputLabel만 보여서 사용자에게 "선택 안 됨"처럼 보임.

**해결**: Select에 `displayEmpty` prop 추가 + `renderValue`로 빈 값일 때 "전체 모델"/"전체 공정" 텍스트 표시.

### 현상 2: PDF/EXCEL 출력 미작동
`src/services/reportService.ts:224`에서 `downloadReport()`가 JSON 데이터를 blob으로 반환 — 실제 PDF/Excel 파일이 아님.
`src/utils/reportGenerators.ts`에 `generatePDFReport()`와 `generateExcelReport()` 함수가 이미 구현되어 있지만, `downloadReport()`에서 호출하지 않음.

**해결**: `downloadReport()`에서 format에 따라 `generatePDFReport()` 또는 `generateExcelReport()` 호출.

## 수정 사항

### Task 1: Select에 displayEmpty + renderValue 추가
**파일**: `src/components/reports/ReportGenerator.tsx` (207-218줄, 224-235줄)

모델 코드 Select:
```tsx
<Select
  value={modelId}
  onChange={(e: SelectChangeEvent) => setModelId(e.target.value)}
  label={t('management.modelCode')}
  displayEmpty
  renderValue={(selected) => {
    if (!selected) return t('reports.allModels')
    const model = models.find(m => m.id === selected)
    return model ? `${model.code} - ${model.name}` : selected
  }}
>
```

검사 공정 Select:
```tsx
<Select
  value={processId}
  onChange={(e: SelectChangeEvent) => setProcessId(e.target.value)}
  label={t('reports.process')}
  displayEmpty
  renderValue={(selected) => {
    if (!selected) return t('reports.allProcesses')
    const process = processes.find(p => p.id === selected)
    return process ? `${process.code} - ${process.name}` : selected
  }}
>
```

### Task 2: downloadReport()에서 실제 PDF/Excel 생성 함수 호출
**파일**: `src/services/reportService.ts` (193-229줄)

```typescript
import { generatePDFReport, generateExcelReport } from '@/utils/reportGenerators'

export async function downloadReport(id: string): Promise<Blob> {
  const report = await getReportById(id)
  if (!report) throw new Error('Report not found')

  const filters: ReportFilters = {
    dateRange: { from: new Date(report.date_from), to: new Date(report.date_to) },
    reportType: report.type,
    modelId: report.model_id,
    processId: report.process_id,
  }

  const summary = await getReportSummary(filters)

  if (report.format === 'pdf') {
    return generatePDFReport(summary, filters, report.title)
  } else {
    return generateExcelReport(summary, filters, report.title)
  }
}
```

## 수정 대상 파일

| 파일 | 변경 |
|------|------|
| `src/components/reports/ReportGenerator.tsx` | Select에 displayEmpty + renderValue 추가 |
| `src/services/reportService.ts` | downloadReport()에서 실제 PDF/Excel 생성 함수 호출 |

## 검증

1. `npm run build` 성공
2. 리포트 생성 페이지에서 드롭다운에 "전체 모델"/"전체 공정" 텍스트 표시
3. PDF 생성 → 실제 PDF 파일 다운로드
4. EXCEL 생성 → 실제 xlsx 파일 다운로드

## 수용 기준
- [ ] 모델/공정 드롭다운에 기본값으로 "전체 모델"/"전체 공정" 텍스트 표시
- [ ] 특정 모델/공정 선택 후 리포트 생성 가능
- [ ] 전체 선택 상태에서 리포트 생성 가능
- [ ] PDF 다운로드 시 실제 PDF 파일 생성
- [ ] EXCEL 다운로드 시 실제 xlsx 파일 생성
- [ ] 빌드 성공
