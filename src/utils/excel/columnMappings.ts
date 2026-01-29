/**
 * Excel Column Mappings for Bilingual Support (Korean/Vietnamese)
 */

import type { ColumnMapping, EntityType } from '@/types/excel-import'

// Column mappings for each entity type
export const COLUMN_MAPPINGS: Record<EntityType, ColumnMapping[]> = {
  productModel: [
    {
      field: 'code',
      koHeader: '모델 코드',
      viHeader: 'Ma mau',
      required: true,
      dataType: 'string',
      description: {
        ko: '고유한 모델 코드 (예: PM-001, A1000)',
        vi: 'Ma mau duy nhat (VD: PM-001, A1000)',
      },
    },
    {
      field: 'name',
      koHeader: '모델명',
      viHeader: 'Ten mau',
      required: true,
      dataType: 'string',
      description: {
        ko: '제품 모델 이름 (예: CNC-A1000)',
        vi: 'Ten mau san pham (VD: CNC-A1000)',
      },
    },
  ],

  inspectionItem: [
    {
      field: 'model_code',
      koHeader: '모델 코드',
      viHeader: 'Ma mau',
      required: true,
      dataType: 'string',
      description: {
        ko: '모델 코드 또는 모델-공정 (예: M1, B7 MMW-CNC2). "-CNC1", "-CNC2" 형식 자동 분리',
        vi: 'Ma mau hoac mau-quy trinh (VD: M1, B7 MMW-CNC2). Tu dong tach "-CNC1", "-CNC2"',
      },
    },
    {
      field: 'process_code',
      koHeader: '공정 코드',
      viHeader: 'Ma quy trinh',
      required: false,
      dataType: 'string',
      description: {
        ko: '공정 코드 (선택사항). 모델 코드에 "-CNC1/-CNC2" 포함 시 자동 설정됨',
        vi: 'Ma quy trinh (tuy chon). Tu dong neu ma mau co "-CNC1/-CNC2"',
      },
    },
    {
      field: 'name',
      koHeader: '항목명',
      viHeader: 'Ten hang muc',
      required: true,
      dataType: 'string',
      description: {
        ko: '검사 항목 이름 (예: 외경, 내경, 표면 거칠기)',
        vi: 'Ten hang muc kiem tra (VD: Duong kinh ngoai)',
      },
    },
    {
      field: 'data_type',
      koHeader: '데이터 유형',
      viHeader: 'Loai du lieu',
      required: true,
      dataType: 'enum',
      enumValues: ['numeric', 'ok_ng'],
      description: {
        ko: 'numeric (수치형) 또는 ok_ng (합격/불합격)',
        vi: 'numeric (so) hoac ok_ng (Dat/Khong dat)',
      },
    },
    {
      field: 'standard_value',
      koHeader: '기준값',
      viHeader: 'Gia tri chuan',
      required: false,
      dataType: 'number',
      description: {
        ko: '수치형일 경우 필수 입력 (예: 10.5)',
        vi: 'Bat buoc neu la so (VD: 10.5)',
      },
    },
    {
      field: 'tolerance_min',
      koHeader: '최소 공차',
      viHeader: 'Dung sai toi thieu',
      required: false,
      dataType: 'number',
      description: {
        ko: '허용 최소값 (예: 10.0)',
        vi: 'Gia tri toi thieu (VD: 10.0)',
      },
    },
    {
      field: 'tolerance_max',
      koHeader: '최대 공차',
      viHeader: 'Dung sai toi da',
      required: false,
      dataType: 'number',
      description: {
        ko: '허용 최대값 (예: 11.0)',
        vi: 'Gia tri toi da (VD: 11.0)',
      },
    },
    {
      field: 'unit',
      koHeader: '단위',
      viHeader: 'Don vi',
      required: false,
      dataType: 'string',
      defaultValue: 'mm',
      description: {
        ko: '측정 단위 (예: mm, kg, N)',
        vi: 'Don vi do (VD: mm, kg, N)',
      },
    },
  ],

  inspectionProcess: [
    {
      field: 'code',
      koHeader: '공정 코드',
      viHeader: 'Ma quy trinh',
      required: true,
      dataType: 'string',
      description: {
        ko: '고유한 공정 코드 (예: IQC, PQC, OQC)',
        vi: 'Ma quy trinh duy nhat (VD: IQC, PQC, OQC)',
      },
    },
    {
      field: 'name',
      koHeader: '공정명',
      viHeader: 'Ten quy trinh',
      required: true,
      dataType: 'string',
      description: {
        ko: '공정 이름 (예: 입고 검사, 공정 검사)',
        vi: 'Ten quy trinh (VD: Kiem tra dau vao)',
      },
    },
    {
      field: 'description',
      koHeader: '설명',
      viHeader: 'Mo ta',
      required: false,
      dataType: 'string',
      description: {
        ko: '공정에 대한 설명 (선택사항)',
        vi: 'Mo ta quy trinh (tuy chon)',
      },
    },
    {
      field: 'is_active',
      koHeader: '활성 상태',
      viHeader: 'Trang thai',
      required: false,
      dataType: 'boolean',
      defaultValue: true,
      description: {
        ko: 'TRUE 또는 FALSE (기본값: TRUE)',
        vi: 'TRUE hoac FALSE (mac dinh: TRUE)',
      },
    },
  ],

  defectType: [
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
    {
      field: 'name',
      koHeader: '불량명',
      viHeader: 'Ten loi',
      required: true,
      dataType: 'string',
      description: {
        ko: '불량 유형 이름 (예: 치수 불량, 표면 불량)',
        vi: 'Ten loai loi (VD: Loi kich thuoc)',
      },
    },
    {
      field: 'description',
      koHeader: '설명',
      viHeader: 'Mo ta',
      required: false,
      dataType: 'string',
      description: {
        ko: '불량에 대한 설명 (선택사항)',
        vi: 'Mo ta loi (tuy chon)',
      },
    },
    {
      field: 'severity',
      koHeader: '심각도',
      viHeader: 'Muc do',
      required: true,
      dataType: 'enum',
      enumValues: ['low', 'medium', 'high'],
      description: {
        ko: 'low (낮음), medium (중간), high (높음)',
        vi: 'low (Thap), medium (Trung binh), high (Cao)',
      },
    },
    {
      field: 'is_active',
      koHeader: '활성 상태',
      viHeader: 'Trang thai',
      required: false,
      dataType: 'boolean',
      defaultValue: true,
      description: {
        ko: 'TRUE 또는 FALSE (기본값: TRUE)',
        vi: 'TRUE hoac FALSE (mac dinh: TRUE)',
      },
    },
  ],
}

// Entity type display names for UI
export const ENTITY_TYPE_NAMES: Record<EntityType, { ko: string; vi: string }> = {
  productModel: {
    ko: '제품 모델',
    vi: 'Mau san pham',
  },
  inspectionItem: {
    ko: '검사 항목',
    vi: 'Hang muc kiem tra',
  },
  inspectionProcess: {
    ko: '검사 공정',
    vi: 'Quy trinh kiem tra',
  },
  defectType: {
    ko: '불량 유형',
    vi: 'Loai loi',
  },
}

// Sample data for templates
export const SAMPLE_DATA: Record<EntityType, Record<string, unknown>[]> = {
  productModel: [
    { code: 'PM-001', name: 'CNC-A1000' },
    { code: 'PM-002', name: 'CNC-B2000' },
  ],
  inspectionItem: [
    {
      model_code: 'B7 MMW-CNC1',
      process_code: '',
      name: 'CTQ-01',
      data_type: 'numeric',
      standard_value: 10.5,
      tolerance_min: 10.0,
      tolerance_max: 11.0,
      unit: 'mm',
    },
    {
      model_code: 'B7 MMW-CNC2',
      process_code: '',
      name: 'CTQ-02',
      data_type: 'ok_ng',
      standard_value: '',
      tolerance_min: '',
      tolerance_max: '',
      unit: '',
    },
    {
      model_code: 'M1',
      process_code: '',
      name: 'CTQ-03 (All Process)',
      data_type: 'ok_ng',
      standard_value: '',
      tolerance_min: '',
      tolerance_max: '',
      unit: '',
    },
  ],
  inspectionProcess: [
    { code: 'IQC', name: '입고 검사 / Kiem tra dau vao', description: 'Incoming Quality Control', is_active: true },
    { code: 'PQC', name: '공정 검사 / Kiem tra quy trinh', description: 'Process Quality Control', is_active: true },
  ],
  defectType: [
    { code: 'DIM', name: '치수 불량 / Loi kich thuoc', description: 'Dimension defect', severity: 'high', is_active: true },
    { code: 'SUR', name: '표면 불량 / Loi be mat', description: 'Surface defect', severity: 'medium', is_active: true },
    { code: 'SUR', name: 'ATN CRACK', description: 'Surface defect', severity: 'medium', is_active: true },
  ],
}

/**
 * Get headers for a specific language
 */
export function getHeaders(entityType: EntityType, language: 'ko' | 'vi'): string[] {
  return COLUMN_MAPPINGS[entityType].map((col) =>
    language === 'ko' ? col.koHeader : col.viHeader
  )
}

/**
 * Get column mapping by header (supports both languages)
 */
export function getColumnByHeader(
  entityType: EntityType,
  header: string
): ColumnMapping | undefined {
  const normalizedHeader = header.trim().toLowerCase()
  return COLUMN_MAPPINGS[entityType].find(
    (col) =>
      col.koHeader.toLowerCase() === normalizedHeader ||
      col.viHeader.toLowerCase() === normalizedHeader
  )
}

/**
 * Detect language from headers
 */
export function detectLanguage(headers: string[]): 'ko' | 'vi' {
  const koPatterns = ['모델', '코드', '항목', '공정', '불량', '설명', '기준', '공차', '단위', '활성']
  const viPatterns = ['Ma', 'Ten', 'Mo ta', 'Dung sai', 'Muc do', 'Gia tri', 'Don vi', 'Trang thai']

  let koScore = 0
  let viScore = 0

  headers.forEach((header) => {
    koPatterns.forEach((pattern) => {
      if (header.includes(pattern)) koScore++
    })
    viPatterns.forEach((pattern) => {
      if (header.toLowerCase().includes(pattern.toLowerCase())) viScore++
    })
  })

  return koScore >= viScore ? 'ko' : 'vi'
}

/**
 * Validate headers match the expected structure
 */
export function validateHeaders(
  entityType: EntityType,
  headers: string[]
): { valid: boolean; missingRequired: string[]; language: 'ko' | 'vi' } {
  const language = detectLanguage(headers)
  const mappings = COLUMN_MAPPINGS[entityType]
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase())

  const missingRequired: string[] = []

  mappings.forEach((mapping) => {
    if (mapping.required) {
      const expectedHeader = language === 'ko' ? mapping.koHeader : mapping.viHeader
      const found = normalizedHeaders.some(
        (h) =>
          h === mapping.koHeader.toLowerCase() ||
          h === mapping.viHeader.toLowerCase()
      )
      if (!found) {
        missingRequired.push(expectedHeader)
      }
    }
  })

  return {
    valid: missingRequired.length === 0,
    missingRequired,
    language,
  }
}
