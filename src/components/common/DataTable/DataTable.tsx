import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Paper,
  InputAdornment,
  IconButton,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material'
import type { DataTableProps, SortConfig, ColumnDef, FilterValue } from './types'

export function DataTable<T>({
  data,
  columns,
  loading = false,
  emptyMessage,
  searchPlaceholder,
  pageSize = 20,
  enableSearch = true,
  enableFilters = true,
  enableSorting = true,
  enablePagination = true,
  getRowId,
  renderActions,
  toolbarActions,
  title,
  externalSearch,
  onExternalSearchChange,
}: DataTableProps<T>) {
  const { t } = useTranslation()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(pageSize)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterValue[]>([])

  // Use external search if provided, otherwise use internal
  const currentSearch = externalSearch !== undefined ? externalSearch : searchQuery
  const handleSearchChange = onExternalSearchChange || setSearchQuery

  // Get searchable columns
  const searchableColumns = useMemo(
    () => columns.filter((col) => col.searchable !== false),
    [columns]
  )

  // Get filterable columns
  const filterableColumns = useMemo(
    () => columns.filter((col) => col.filterType),
    [columns]
  )

  // Filter data by search and filters
  const filteredData = useMemo(() => {
    let result = [...data]

    // Apply search
    if (currentSearch) {
      const searchLower = currentSearch.toLowerCase()
      result = result.filter((row) => {
        return searchableColumns.some((col) => {
          const value = row[col.id as keyof T]
          if (value == null) return false
          return String(value).toLowerCase().includes(searchLower)
        })
      })
    }

    // Apply filters
    filters.forEach((filter) => {
      if (filter.value !== null && filter.value !== '') {
        result = result.filter((row) => {
          const value = row[filter.columnId as keyof T]
          if (value == null) return false

          if (typeof filter.value === 'boolean') {
            return value === filter.value
          }

          return String(value).toLowerCase().includes(String(filter.value).toLowerCase())
        })
      }
    })

    return result
  }, [data, currentSearch, filters, searchableColumns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T]
      const bValue = b[sortConfig.key as keyof T]

      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1

      // Handle dates
      if (sortConfig.key.includes('date') || sortConfig.key.includes('_at')) {
        const aDate = new Date(String(aValue)).getTime()
        const bDate = new Date(String(bValue)).getTime()
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate
      }

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Handle strings
      const comparison = String(aValue).localeCompare(String(bValue), 'ko')
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortConfig])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!enablePagination) return sortedData
    const start = page * rowsPerPage
    return sortedData.slice(start, start + rowsPerPage)
  }, [sortedData, page, rowsPerPage, enablePagination])

  // Handlers
  const handleSort = useCallback((columnId: string) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== columnId) {
        return { key: columnId, direction: 'asc' }
      }
      if (prev.direction === 'asc') {
        return { key: columnId, direction: 'desc' }
      }
      return null
    })
  }, [])

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleFilterChange = (columnId: string, value: string | boolean | null) => {
    setFilters((prev) => {
      const existing = prev.find((f) => f.columnId === columnId)
      if (existing) {
        if (value === null || value === '') {
          return prev.filter((f) => f.columnId !== columnId)
        }
        return prev.map((f) => (f.columnId === columnId ? { ...f, value } : f))
      }
      if (value !== null && value !== '') {
        return [...prev, { columnId, value }]
      }
      return prev
    })
    setPage(0)
  }

  const clearAllFilters = () => {
    setFilters([])
    handleSearchChange('')
    setPage(0)
  }

  const hasActiveFilters = filters.length > 0 || currentSearch !== ''

  // Render filter value display
  const getFilterDisplayValue = (col: ColumnDef<T>, value: string | boolean | null) => {
    if (value === null) return ''
    if (col.filterType === 'select' && col.filterOptions) {
      const option = col.filterOptions.find((opt) => opt.value === String(value))
      return option?.label || String(value)
    }
    return String(value)
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        {(title || toolbarActions) && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            {title && (
              <Typography variant="h6" fontWeight={600}>
                {title}
              </Typography>
            )}
            {toolbarActions && <Box sx={{ display: 'flex', gap: 1 }}>{toolbarActions}</Box>}
          </Box>
        )}

        {/* Search and Filter Toggle */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {enableSearch && (
            <TextField
              placeholder={searchPlaceholder || t('common.search')}
              value={currentSearch}
              onChange={(e) => {
                handleSearchChange(e.target.value)
                setPage(0)
              }}
              size="small"
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: currentSearch && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => handleSearchChange('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
          {enableFilters && filterableColumns.length > 0 && (
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters || filters.length > 0 ? 'primary' : 'default'}
            >
              <FilterIcon />
            </IconButton>
          )}
        </Box>

        {/* Active Filters */}
        {hasActiveFilters && (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            {filters.map((filter) => {
              const col = columns.find((c) => c.id === filter.columnId)
              if (!col) return null
              return (
                <Chip
                  key={filter.columnId}
                  label={`${col.header}: ${getFilterDisplayValue(col, filter.value)}`}
                  onDelete={() => handleFilterChange(filter.columnId, null)}
                  size="small"
                />
              )
            })}
            {hasActiveFilters && (
              <Chip
                label={t('common.clearAll')}
                onClick={clearAllFilters}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        )}

        {/* Filters Panel */}
        <Collapse in={showFilters}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            {filterableColumns.map((col) => (
              <FormControl key={String(col.id)} size="small" sx={{ minWidth: 150 }}>
                <InputLabel>{col.header}</InputLabel>
                {col.filterType === 'select' ? (
                  <Select
                    value={filters.find((f) => f.columnId === col.id)?.value || ''}
                    onChange={(e) => handleFilterChange(String(col.id), e.target.value as string)}
                    label={col.header}
                  >
                    <MenuItem value="">
                      <em>{t('common.all')}</em>
                    </MenuItem>
                    {col.filterOptions?.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                ) : (
                  <TextField
                    value={filters.find((f) => f.columnId === col.id)?.value || ''}
                    onChange={(e) => handleFilterChange(String(col.id), e.target.value)}
                    label={col.header}
                    size="small"
                  />
                )}
              </FormControl>
            ))}
          </Box>
        </Collapse>

        {/* Table */}
        {loading ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('common.loading')}
            </Typography>
          </Box>
        ) : paginatedData.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {emptyMessage || t('common.noData')}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer component={Paper} variant="outlined">
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    {columns.map((col) => (
                      <TableCell
                        key={String(col.id)}
                        align={col.align || 'left'}
                        sx={{ width: col.width, fontWeight: 600 }}
                      >
                        {enableSorting && col.sortable !== false ? (
                          <TableSortLabel
                            active={sortConfig?.key === col.id}
                            direction={sortConfig?.key === col.id ? sortConfig.direction : 'asc'}
                            onClick={() => handleSort(String(col.id))}
                          >
                            {col.header}
                          </TableSortLabel>
                        ) : (
                          col.header
                        )}
                      </TableCell>
                    ))}
                    {renderActions && (
                      <TableCell align="right" sx={{ width: 180, minWidth: 180, fontWeight: 600 }}>
                        {t('common.actions')}
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((row, index) => (
                    <TableRow key={getRowId(row)} hover>
                      {columns.map((col) => (
                        <TableCell key={String(col.id)} align={col.align || 'left'}>
                          {col.cell
                            ? col.cell(row, index)
                            : String(row[col.id as keyof T] ?? '-')}
                        </TableCell>
                      ))}
                      {renderActions && (
                        <TableCell align="right" sx={{ width: 180, minWidth: 180 }}>{renderActions(row)}</TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {enablePagination && (
              <TablePagination
                component="div"
                count={sortedData.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 20, 50, 100]}
                labelRowsPerPage={t('common.rowsPerPage')}
                labelDisplayedRows={({ from, to, count }) =>
                  t('common.paginationInfo', { from, to, count })
                }
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
