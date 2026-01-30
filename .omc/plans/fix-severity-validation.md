# 심각도(severity) 검증 오류 수정 계획

## 문제 분석

### 현상
- 불량 유형 일괄 등록 시 20행 중 2행만 유효, 18행 심각도 오류
- 유효한 2행은 템플릿 샘플 데이터 (시스템 생성), 실패 18행은 사용자 수동 입력

### 근본 원인
`parseCellValue` 함수가 ExcelJS의 모든 셀 값 타입을 처리하지 못함.

ExcelJS `CellValue` 타입:
- `null`, `number`, `string`, `boolean` → 정상 처리됨
- `CellRichTextValue` (`richText` 속성) → 처리됨
- `CellFormulaValue` (`result` 속성) → 처리됨
- **`CellHyperlinkValue` (`text` + `hyperlink` 속성) → 미처리** ❌
- **기타 객체 타입 (`text` 속성만 있는 경우) → 미처리** ❌

사용자가 Excel에서 직접 입력한 셀은 ExcelJS가 `{ text: 'high' }` 형태의 객체로 반환할 수 있음. 현재 코드는 이를 `String({text:'high'})` = `"[object Object]"`로 변환 → `.trim().toLowerCase()` = `"[object object]"` → Zod `z.enum(['low','medium','high'])` 실패.

또한 사용자가 베트남어 키보드로 입력 시 보이지 않는 Unicode 문자(zero-width space 등)가 포함될 수 있음.

## 수정 사항

### Task 1: `parseCellValue`에 일반 객체 핸들러 추가
**파일**: `src/utils/excel/excelParser.ts` (126-129줄 사이)

formula 핸들러 뒤에 `text` 속성을 가진 일반 객체 핸들러 추가:
```typescript
// Handle formula results
if (typeof value === 'object' && 'result' in value) {
  return parseCellValue((value as ExcelJS.CellFormulaValue).result, dataType)
}

// Handle objects with text property (e.g., CellHyperlinkValue, etc.)
if (typeof value === 'object' && value !== null && 'text' in value) {
  return parseCellValue((value as { text: unknown }).text, dataType)
}
```

### Task 2: enum 파싱 강화
**파일**: `src/utils/excel/excelParser.ts` (153-154줄)

현재:
```typescript
case 'enum':
  return String(value).trim().toLowerCase()
```

변경:
```typescript
case 'enum':
  return String(value).trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
```

`replace(/[^a-z0-9_]/g, '')`: 알파벳, 숫자, 밑줄 외 모든 문자 제거. 이렇게 하면:
- `"high"` → `"high"` ✓
- `"medium"` → `"medium"` ✓
- `"ok_ng"` → `"ok_ng"` ✓ (검사항목 데이터유형도 안전)
- `"high\u200B"` (zero-width space 포함) → `"high"` ✓
- `"[object Object]"` → `"objectobject"` (여전히 실패하지만, Task 1에서 선처리)

## 영향 범위
- 모든 enum 타입 컬럼 (severity, data_type)에 적용
- 기존 동작에 영향 없음 (유효한 값은 변환 후에도 동일)

## 수정 대상 파일
| 파일 | 변경 |
|------|------|
| `src/utils/excel/excelParser.ts` | 일반 객체 핸들러 + enum 정규화 강화 |

## 검증
1. `npm run build` 성공
2. severity: "high", "medium", "low" 모두 통과
3. data_type: "numeric", "ok_ng" 모두 통과
