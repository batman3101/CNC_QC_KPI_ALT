// DataTable 컴포넌트 타입 정의

export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  key: string
  direction: SortDirection
}

export interface ColumnDef<T> {
  /** 컬럼 고유 키 (데이터 필드명) */
  id: keyof T | string
  /** 헤더 표시 텍스트 */
  header: string
  /** 정렬 가능 여부 (기본: true) */
  sortable?: boolean
  /** 컬럼 너비 */
  width?: string | number
  /** 정렬 방향 */
  align?: 'left' | 'center' | 'right'
  /** 커스텀 셀 렌더러 */
  cell?: (row: T, index: number) => React.ReactNode
  /** 필터 타입 */
  filterType?: 'text' | 'select' | 'date' | 'boolean'
  /** Select 필터 옵션 */
  filterOptions?: { label: string; value: string }[]
  /** 검색 가능 여부 (기본: true) */
  searchable?: boolean
}

export interface FilterValue {
  columnId: string
  value: string | boolean | null
}

/**
 * Server-driven paging/sorting.
 *
 * When supplied, `data` is treated as one already-paged, already-sorted slice:
 * DataTable stops filtering, sorting and slicing in memory and instead reports
 * every page/sort change back to the owner, which refetches. Required for
 * tables whose full row count is too large to ship to the browser.
 */
export interface ServerPagination {
  /** Rows matching the current filters across the whole table, not just this page. */
  totalCount: number
  /** Zero-based page index. */
  page: number
  rowsPerPage: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rowsPerPage: number) => void
  sort: SortConfig | null
  onSortChange: (sort: SortConfig | null) => void
}

export interface DataTableProps<T> {
  /** 테이블 데이터 */
  data: T[]
  /** 서버 페이지네이션 (제공 시 메모리 내 필터/정렬/페이징 비활성화) */
  serverPagination?: ServerPagination
  /** 컬럼 정의 */
  columns: ColumnDef<T>[]
  /** 로딩 상태 */
  loading?: boolean
  /** 데이터 없을 때 메시지 */
  emptyMessage?: string
  /** 검색 플레이스홀더 */
  searchPlaceholder?: string
  /** 페이지당 항목 수 (기본: 20) */
  pageSize?: number
  /** 검색 활성화 여부 (기본: true) */
  enableSearch?: boolean
  /** 필터 활성화 여부 (기본: true) */
  enableFilters?: boolean
  /** 정렬 활성화 여부 (기본: true) */
  enableSorting?: boolean
  /** 페이지네이션 활성화 여부 (기본: true) */
  enablePagination?: boolean
  /** 행 키 추출 함수 */
  getRowId: (row: T) => string
  /** 액션 버튼 렌더러 */
  renderActions?: (row: T) => React.ReactNode
  /** 툴바 추가 버튼 */
  toolbarActions?: React.ReactNode
  /** 테이블 제목 */
  title?: string
  /** 외부 검색어 (controlled) */
  externalSearch?: string
  /** 외부 검색어 변경 핸들러 */
  onExternalSearchChange?: (search: string) => void
  /** 모바일 카드 렌더러 (제공시 모바일에서 테이블 대신 카드 표시) */
  renderMobileCard?: (row: T, index: number) => React.ReactNode
}
