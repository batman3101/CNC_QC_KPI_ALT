# 이미지 첨부 기능 완성 계획 (v2)

## 요약
웹/모바일 환경에서 불량 사진 업로드가 Supabase Storage에 저장되도록 전체 흐름을 완성한다.

## 현황 분석 (Gap)

| 항목 | 현재 상태 | 문제점 |
|------|-----------|--------|
| `uploadDefectPhoto()` | `inspectionService.ts:384-399` 존재 | **미호출** |
| InspectionRecordForm 제출 | `photo_url: photoPreview` (Base64) | DB에 MB급 Base64 직접 저장 |
| Supabase `defect-photos` 버킷 | `storage.buckets` rows=0 | **버킷 미생성** |
| Storage RLS 정책 | 없음 | 업로드/조회 불가 |
| 이미지 압축 | 없음 | 모바일 사진 3-10MB |
| DefectEditDialog 사진 | 읽기 전용 | 변경 불가 |
| 에러 메시지 | `InspectionRecordForm.tsx:149,155` 하드코딩 | i18n 미적용 |
| Mock mode | **제거됨** (USE_MOCK_MODE 없음) | N/A — Supabase 전용 |

## 수용 기준

1. `defect-photos` public 버킷 생성됨
2. Storage RLS: authenticated INSERT/UPDATE/DELETE, public SELECT
3. 사진 선택 → 클라이언트 압축 → Supabase Storage 업로드 → URL만 DB 저장
4. DefectEditDialog에서 사진 변경(재업로드) 가능
5. 하드코딩 에러 메시지 i18n 처리

## 핵심 아키텍처 결정

### 업로드 순서: Photo First
사진을 **먼저 업로드**한 후 반환된 URL로 inspection/defect을 생성한다.

**이유**: `uploadDefectPhoto`는 `inspectionId`를 파일 경로에 사용하지만, inspection이 아직 없으므로 **`crypto.randomUUID()`로 클라이언트에서 contextId를 생성**하여 파일 경로로 사용한다. 이 contextId는 inspection record와는 무관하며 Storage 내 폴더 구분용일 뿐이다.

**흐름**:
```
1. 사용자 사진 선택 → handlePhotoChange에서 File 보관
2. 폼 제출 시:
   a. photoFile이 있으면 → compressAndUploadPhoto(file) → URL 획득
   b. URL을 photo_url에 설정
   c. createInspectionRecord({ ...data, photo_url: url }) 호출
```

### File 객체 전달 방식
`InspectionRecordInput` 타입은 변경하지 않는다. `photo_url?: string | null`을 그대로 유지한다.
- `InspectionRecordForm`의 `onSubmit` 콜백에 두 번째 파라미터로 `photoFile`을 전달: `onSubmit(data, photoFile)`
- `InspectionPage.handleSubmit`에서 photoFile을 받아 업로드 후 `data.photo_url`에 URL 설정
- `createInspectionRecord`에는 기존대로 URL 문자열만 전달 → Supabase insert에 영향 없음

### DefectEditDialog 호출 체인
```
DefectsList.tsx
  └─ handleEditSave(id, data: Record<string, string>)
       └─ editDefectMutation.mutate({ id, data })
            └─ inspectionService.updateDefect(id, data)
  └─ <DefectEditDialog onSave={handleEditSave} />
```
**변경**: `onSave` 시그니처에 `photo_url`을 포함하면 된다. `Record<string, string>`이므로 이미 `{ photo_url: 'url' }`을 포함할 수 있다. `DefectEditDialog` 내부에서 사진 업로드 후 `onSave(id, { ...formData, photo_url: newUrl })`로 호출한다.

## 구현 단계

### 단계 1: Supabase Storage 버킷 생성

```sql
-- 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'defect-photos',
  'defect-photos',
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

-- RLS 정책: 인증 사용자 INSERT
CREATE POLICY "Authenticated users can upload defect photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'defect-photos');

-- RLS 정책: Public SELECT (public 버킷)
CREATE POLICY "Public read access for defect photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'defect-photos');

-- RLS 정책: 인증 사용자 UPDATE
CREATE POLICY "Authenticated users can update defect photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'defect-photos');

-- RLS 정책: 인증 사용자 DELETE
CREATE POLICY "Authenticated users can delete defect photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'defect-photos');
```

### 단계 2: 이미지 압축 라이브러리 설치
- `npm install browser-image-compression`

### 단계 3: inspectionService.ts 수정
- **유지**: `uploadDefectPhoto(file, contextId)` (line 384-399)
- **추가**: `compressAndUploadPhoto(file: File): Promise<string>`
  ```typescript
  import imageCompression from 'browser-image-compression'

  export async function compressAndUploadPhoto(file: File): Promise<string> {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    })
    const contextId = crypto.randomUUID()
    return uploadDefectPhoto(compressed, contextId)
  }
  ```

### 단계 4: InspectionRecordForm.tsx 수정
- `onSubmit` prop 타입 변경: `(data: Omit<InspectionRecordInput, 'photo_url'>, photoFile: File | null) => Promise<void>`
- `handleFormSubmit` (line 195-211): `photoPreview` 대신 `photoFile`을 두 번째 인자로 전달
  ```typescript
  const handleFormSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      await onSubmit({
        model_id: modelId,
        inspection_process: inspectionProcess,
        defect_type_id: values.defectTypeId || null,
        machine_id: selectedMachine?.id || null,
        machine_number: selectedMachine?.name || null,
        inspector_id: values.inspectorId,
        inspection_quantity: values.inspectionQuantity,
        defect_quantity: values.defectQuantity,
      }, photoFile)
    } finally {
      setIsSubmitting(false)
    }
  }
  ```
- **i18n 수정** (line 149, 155):
  - `'사진 크기는 10MB를 초과할 수 없습니다'` → `t('inspection.photoSizeError')`
  - `'이미지 파일만 업로드 가능합니다'` → `t('inspection.photoTypeError')`

### 단계 5: InspectionPage.tsx 수정
- `handleSubmit` 시그니처 변경: `(data, photoFile: File | null)`
  ```typescript
  const handleSubmit = async (data: InspectionRecordInput, photoFile: File | null) => {
    let photoUrl: string | null = null
    if (photoFile) {
      photoUrl = await compressAndUploadPhoto(photoFile)
    }
    await inspectionService.createInspectionRecord({
      ...data,
      photo_url: photoUrl,
      factory_id: activeFactoryId || undefined,
    })
    // ... invalidate queries, show snackbar
  }
  ```

### 단계 6: DefectEditDialog.tsx 사진 업로드 추가
- 사진 영역에 "사진 변경" 버튼 + hidden file input 추가
- 파일 선택 시 → `compressAndUploadPhoto(file)` → URL을 form state에 반영
- `onSave` 호출 시 `photo_url: newPhotoUrl` 포함
- `onSave` 시그니처는 변경 불필요 (`Record<string, string>`이므로 photo_url 키 포함 가능)

### 단계 7: 번역 키 추가
- `ko/translation.json`:
  - `inspection.photoSizeError`: "사진 크기는 10MB를 초과할 수 없습니다"
  - `inspection.photoTypeError`: "이미지 파일만 업로드 가능합니다"
  - `inspection.uploading`: "업로드 중..."
  - `defects.changePhoto`: "사진 변경"
  - `defects.uploadPhoto`: "사진 업로드"
- `vi/translation.json`:
  - `inspection.photoSizeError`: "Kích thước ảnh không được vượt quá 10MB"
  - `inspection.photoTypeError`: "Chỉ chấp nhận tệp hình ảnh"
  - `inspection.uploading`: "Đang tải lên..."
  - `defects.changePhoto`: "Thay đổi ảnh"
  - `defects.uploadPhoto`: "Tải ảnh lên"

### 단계 8: 빌드 검증
- `npx tsc --noEmit`
- `npm run build`

## 파일 변경 목록

| 파일 | 변경 유형 | 상세 |
|------|----------|------|
| Supabase (SQL) | DDL | 버킷 + RLS 4개 정책 |
| `package.json` | 의존성 | `browser-image-compression` |
| `src/services/inspectionService.ts` | 함수 추가 | `compressAndUploadPhoto` |
| `src/components/inspection/InspectionRecordForm.tsx` | 수정 | onSubmit 시그니처, i18n 에러 |
| `src/pages/InspectionPage.tsx` | 수정 | 업로드 → URL → 레코드 생성 |
| `src/components/defects/DefectEditDialog.tsx` | 수정 | 사진 변경 UI + 업로드 |
| `src/locales/ko/translation.json` | 번역 추가 | 5개 키 |
| `src/locales/vi/translation.json` | 번역 추가 | 5개 키 |

## 리스크 및 완화

| 리스크 | 완화 |
|--------|------|
| 업로드 실패 | try/catch + 에러 스낵바, inspection은 photo 없이도 생성 가능 |
| 기존 Base64 photo_url | `<img src>` 는 Base64/URL 모두 렌더링 가능, 마이그레이션 불필요 |
| 네트워크 느린 환경 | 압축으로 500KB 이하, 업로드 중 로딩 표시 |
