# 불량 유형 Excel 일괄 등록 검증 오류 수정 계획 (v3)

## 문제 분석

### DB 스키마
- `defect_types` 테이블: `UNIQUE (code)` 제약조건 존재
- `defects.defect_type`: string 타입 (불량 유형 ID 참조)
- **code는 반드시 고유해야 함**

### 근본 원인
사용자의 Excel에서 DIM, SUR, SHA를 카테고리 코드로 사용하여 여러 항목에 반복 입력 → `findDuplicates()`가 모든 중복 행을 오류로 표시 → 20개 전체 오류.

### 심각도 오류
`parseCellValue`의 enum 처리(`String(value).trim().toLowerCase()`)가 정상이므로, 심각도 값 자체는 올바르게 파싱됨. 스크린샷의 심각도 오류는 중복 코드 오류와 함께 누적 표시되는 것.

## 해결 방안

중복 code에 자동 순번 부여 (DIM → DIM-001, DIM-002). 기존 파일 내 리터럴 코드 및 DB 기존 코드와의 충돌을 모두 방지하는 로직 포함.

## 구체적 수정 사항

### Task 1: 불량 유형 code 중복 시 자동 순번 부여
**파일**: `src/utils/excel/excelParser.ts`
**위치**: 312-359줄 (중복 검사 + DB 검사 블록)

```typescript
if (entityType === 'defectType') {
  // 1단계: 파일 내 코드별 출현 횟수 계산
  const codeCount = new Map<string, number>()
  allData.forEach((row) => {
    const code = String(row.code || '')
    if (code) codeCount.set(code, (codeCount.get(code) || 0) + 1)
  })

  // 2단계: 중복 코드 식별 (2회 이상 출현)
  const duplicatedCodes = new Set<string>()
  codeCount.forEach((count, code) => {
    if (count > 1) duplicatedCodes.add(code)
  })

  // 3단계: 중복 코드에 순번 부여 (기존 코드와 충돌 방지)
  if (duplicatedCodes.size > 0) {
    // 파일 내 모든 기존 코드 + DB 기존 코드를 수집 (충돌 방지용)
    const reservedCodes = new Set<string>(
      allData
        .filter((row) => !duplicatedCodes.has(String(row.code || '')))
        .map((row) => String(row.code || '').toLowerCase())
    )
    if (options?.existingCodes) {
      options.existingCodes.forEach((c) => reservedCodes.add(c.toLowerCase()))
    }

    const codeSeq = new Map<string, number>()
    allData.forEach((row, index) => {
      const code = String(row.code || '')
      if (duplicatedCodes.has(code)) {
        let seq = (codeSeq.get(code) || 0) + 1
        let newCode: string
        // 충돌이 없을 때까지 순번 증가
        do {
          newCode = `${code}-${String(seq).padStart(3, '0')}`
          if (reservedCodes.has(newCode.toLowerCase())) {
            seq++
          } else {
            break
          }
        } while (true)
        codeSeq.set(code, seq)
        reservedCodes.add(newCode.toLowerCase()) // 새로 생성된 코드도 예약

        row.code = newCode
        const parsedRow = parsedRows[index]
        if (parsedRow) {
          (parsedRow.data as Record<string, unknown>).code = newCode
        }
      }
    })
  }

  // 4단계: DB 기존 코드 충돌 검사 (비중복 코드 대상)
  if (options?.existingCodes) {
    const existingSet = new Set(options.existingCodes.map((c) => c.toLowerCase()))
    allData.forEach((row, index) => {
      const code = String(row.code || '')
      if (existingSet.has(code.toLowerCase())) {
        const parsedRow = parsedRows[index]
        if (parsedRow) {
          parsedRow.isValid = false
          parsedRow.errors.push({
            row: parsedRow.rowNumber,
            field: 'code',
            fieldLabel:
              language === 'ko'
                ? mappings.find((m) => m.field === 'code')?.koHeader || 'code'
                : mappings.find((m) => m.field === 'code')?.viHeader || 'code',
            message: `${t('bulkImport.codeExists')}: ${code}`,
          })
        }
      }
    })
  }
} else if (entityType !== 'inspectionItem') {
  // 기존 로직 유지 (productModel, inspectionProcess)
  const duplicates = findDuplicates(allData, codeField)
  duplicates.forEach((rows, code) => {
    rows.forEach((rowNum) => {
      const parsedRow = parsedRows.find((r) => r.rowNumber === rowNum)
      if (parsedRow) {
        parsedRow.isValid = false
        parsedRow.errors.push({
          row: rowNum,
          field: codeField,
          fieldLabel:
            language === 'ko'
              ? mappings.find((m) => m.field === codeField)?.koHeader || codeField
              : mappings.find((m) => m.field === codeField)?.viHeader || codeField,
          message: `${t('bulkImport.duplicateCode')}: ${code} (${t('bulkImport.rowNumber')} ${rows.join(', ')})`,
        })
      }
    })
  })
}

// DB 기존 코드 검사 (defectType은 위에서 처리)
if (options?.existingCodes && entityType !== 'inspectionItem' && entityType !== 'defectType') {
  // ... 기존 로직 유지
}
```

**충돌 방지 로직 상세:**
- `reservedCodes`에 파일 내 비중복 리터럴 코드 + DB 기존 코드 모두 포함
- 순번 생성 시 `reservedCodes`와 충돌하면 다음 순번으로 건너뜀
- 새로 생성된 코드도 `reservedCodes`에 추가하여 이후 행과의 충돌 방지

**예시:**
```
DB 기존: ["SUR-001"]
파일:
  Row 2: DIM-001 (리터럴, 고유) → 그대로 유지
  Row 3: DIM (중복) → DIM-002 (DIM-001은 Row 2와 충돌하므로 건너뜀)
  Row 4: DIM (중복) → DIM-003
  Row 5: SUR (중복) → SUR-002 (SUR-001은 DB에 존재하므로 건너뜀)
  Row 6: SUR (중복) → SUR-003
```

### Task 2: 컬럼 설명 업데이트
**파일**: `src/utils/excel/columnMappings.ts` (175-186줄)

```typescript
{
  field: 'code',
  koHeader: '불량 코드',
  viHeader: 'Ma loi',
  required: true,
  dataType: 'string',
  description: {
    ko: '불량 분류 코드 (예: DIM, SUR, SHA). 중복 시 자동 순번 부여 (DIM-001, DIM-002)',
    vi: 'Ma phan loai loi (VD: DIM, SUR, SHA). Tu dong danh so khi trung (DIM-001, DIM-002)',
  },
},
```

### Task 3: 샘플 데이터 개선
**파일**: `src/utils/excel/columnMappings.ts` (298-301줄)

```typescript
defectType: [
  { code: 'DIM', name: '치수 불량 / Loi kich thuoc', description: 'Dimension defect', severity: 'high', is_active: true },
  { code: 'SUR', name: '표면 불량 / Loi be mat', description: 'Surface defect', severity: 'medium', is_active: true },
  { code: 'SUR', name: 'ATN CRACK', description: 'Surface defect', severity: 'medium', is_active: true },
],
```

### Task 4: 번역 키 추가
**파일**: `src/locales/ko/translation.json`, `src/locales/vi/translation.json`

한국어:
```json
"autoCodeGenerated": "중복 코드가 자동 변환되었습니다 (예: DIM → DIM-001)"
```

베트남어:
```json
"autoCodeGenerated": "Ma trung lap da duoc tu dong chuyen doi (VD: DIM → DIM-001)"
```

### Task 5: 검증 결과 UI에 자동 변환 안내 표시
**파일**: `src/components/excel-import/ExcelValidationResults.tsx`

자동 코드 변환이 발생한 경우 validRows 위에 info Alert 추가:
```tsx
{result.autoCodeGenerated && (
  <Alert>
    <Info className="h-4 w-4" />
    <AlertDescription>{t('bulkImport.autoCodeGenerated')}</AlertDescription>
  </Alert>
)}
```

이를 위해 `ParseResult` 타입에 `autoCodeGenerated?: boolean` 필드 추가:
- **파일**: `src/types/excel-import.ts` — `ParseResult` 인터페이스에 필드 추가
- **파일**: `src/utils/excel/excelParser.ts` — 자동 변환 발생 시 `true` 설정

## 수정 대상 파일 요약

| 파일 | 변경 내용 |
|------|---------|
| `src/utils/excel/excelParser.ts` | defectType 중복 code 자동 순번 부여 (충돌 방지 포함) + DB 검사 분리 |
| `src/utils/excel/columnMappings.ts` | code 설명 + 샘플 데이터 |
| `src/types/excel-import.ts` | `ParseResult`에 `autoCodeGenerated` 필드 추가 |
| `src/components/excel-import/ExcelValidationResults.tsx` | 자동 변환 안내 Alert |
| `src/locales/ko/translation.json` | `autoCodeGenerated` 키 추가 |
| `src/locales/vi/translation.json` | `autoCodeGenerated` 키 추가 |

## 검증 계획

1. `npm run build` — TypeScript 컴파일 확인
2. 테스트 케이스:
   - 같은 code(SUR) 3개 → SUR-001, SUR-002, SUR-003 자동 생성
   - 고유 code(SHA 1개만) → SHA 그대로 유지
   - 파일에 리터럴 "DIM-001" + 중복 "DIM" 2개 → DIM-002, DIM-003 생성 (DIM-001 건너뜀)
   - DB에 "SUR-001" 존재 + 파일에 "SUR" 3개 → SUR-002, SUR-003, SUR-004 생성
   - severity(high, medium, low) 정상 파싱
3. 기존 entityType(productModel, inspectionProcess) 동작 불변 확인
