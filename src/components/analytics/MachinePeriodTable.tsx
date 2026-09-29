import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'

import type { MachinePeriodRow } from '@/types/analytics'

const ROWS_PER_PAGE = 10

type SortKey = 'machineName' | 'inspectionQty' | 'defectQty' | 'defectRate'

interface MachinePeriodTableProps {
  rows: MachinePeriodRow[]
  loading: boolean
  selectedMachineId?: string
  onSelect: (row: MachinePeriodRow) => void
}

/**
 * Every machine inspected in the chosen period. Clicking a row loads that
 * machine into the cards and charts above, so the table doubles as a way to
 * find machines without knowing their number.
 */
export function MachinePeriodTable({
  rows,
  loading,
  selectedMachineId,
  onSelect,
}: MachinePeriodTableProps) {
  const { t } = useTranslation()
  // Worst first by default: the RPC already orders by defect quantity, and that
  // is the question people open this table to answer.
  const [sortKey, setSortKey] = useState<SortKey>('defectQty')
  const [sortDesc, setSortDesc] = useState(true)
  const [page, setPage] = useState(0)

  // A new period brings a new list, so start again from its first page rather
  // than landing on a page that may no longer exist. Adjusted during render,
  // not in an effect, so the stale page is never drawn.
  const [pagedRows, setPagedRows] = useState(rows)
  if (pagedRows !== rows) {
    setPagedRows(rows)
    setPage(0)
  }

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const diff =
        sortKey === 'machineName'
          ? a.machineName.localeCompare(b.machineName, undefined, {
              numeric: true,
            })
          : a[sortKey] - b[sortKey]
      return sortDesc ? -diff : diff
    })
    return copy
  }, [rows, sortKey, sortDesc])

  const pageRows = sorted.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE)

  const handleSort = (key: SortKey) => {
    setPage(0)
    if (key === sortKey) {
      setSortDesc(!sortDesc)
    } else {
      setSortKey(key)
      // Names read naturally A->Z; numbers are more useful largest first.
      setSortDesc(key !== 'machineName')
    }
  }

  const columns: { key: SortKey; label: string; numeric: boolean }[] = [
    {
      key: 'machineName',
      label: t('machineAnalysis.table.machine'),
      numeric: false,
    },
    {
      key: 'inspectionQty',
      label: t('machineAnalysis.inspectionQty'),
      numeric: true,
    },
    { key: 'defectQty', label: t('machineAnalysis.defectQty'), numeric: true },
    {
      key: 'defectRate',
      label: t('machineAnalysis.defectRate'),
      numeric: true,
    },
  ]

  return (
    <Card elevation={3} sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600}>
          {t('machineAnalysis.table.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {loading ? ' ' : t('machineAnalysis.table.subtitle', { count: rows.length })}
        </Typography>

        {loading ? (
          <Skeleton variant="rounded" height={240} />
        ) : rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            {t('machineAnalysis.table.empty')}
          </Typography>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        align={col.numeric ? 'right' : 'left'}
                        sortDirection={sortKey === col.key ? (sortDesc ? 'desc' : 'asc') : false}
                        sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
                      >
                        <TableSortLabel
                          active={sortKey === col.key}
                          direction={sortKey === col.key && !sortDesc ? 'asc' : 'desc'}
                          onClick={() => handleSort(col.key)}
                        >
                          {col.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                    <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {t('machineAnalysis.table.model')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageRows.map((row) => {
                    const selectable = row.machineId !== null
                    return (
                      <TableRow
                        key={row.machineId ?? row.machineName}
                        hover={selectable}
                        selected={selectable && row.machineId === selectedMachineId}
                        onClick={selectable ? () => onSelect(row) : undefined}
                        sx={{ cursor: selectable ? 'pointer' : 'default' }}
                      >
                        <TableCell sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {row.machineName}
                        </TableCell>
                        <TableCell align="right">{row.inspectionQty.toLocaleString()}</TableCell>
                        <TableCell align="right">{row.defectQty.toLocaleString()}</TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: row.defectQty > 0 ? 'error.main' : 'text.primary',
                          }}
                        >
                          {row.defectRate.toFixed(2)}%
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                          {row.machineModel}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={sorted.length}
              page={page}
              onPageChange={(_event, newPage) => setPage(newPage)}
              rowsPerPage={ROWS_PER_PAGE}
              rowsPerPageOptions={[]}
              labelDisplayedRows={({ from, to, count }) =>
                t('machineAnalysis.table.paginationInfo', { from, to, count })
              }
              showFirstButton
              showLastButton
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
