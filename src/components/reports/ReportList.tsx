import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Chip,
  IconButton,
  Typography,
  Tooltip,
} from '@mui/material'
import {
  Download,
  Delete,
  PictureAsPdf,
  TableChart,
  HourglassEmpty,
  CheckCircle,
  Error,
} from '@mui/icons-material'
import { DataTable, type ColumnDef } from '@/components/common/DataTable'
import type { Report } from '@/types/report'
import * as reportService from '@/ui_test/mockServices/mockReportService'

interface ReportListProps {
  reports: Report[]
  isLoading: boolean
}

export function ReportList({ reports, isLoading }: ReportListProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportService.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })

  const downloadMutation = useMutation({
    mutationFn: (id: string) => reportService.downloadReport(id),
    onSuccess: (blob, id) => {
      // Find report to get the format
      const report = reports.find((r) => r.id === id)
      const extension = report?.format === 'excel' ? 'xlsx' : 'pdf'

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `report-${id}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
  })

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'daily':
        return t('reports.daily')
      case 'weekly':
        return t('reports.weekly')
      case 'monthly':
        return t('reports.monthly')
      case 'custom':
        return t('reports.custom')
      default:
        return type
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle fontSize="small" />
      case 'generating':
        return <HourglassEmpty fontSize="small" />
      case 'failed':
        return <Error fontSize="small" />
      default:
        return undefined
    }
  }

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'generating':
        return 'warning'
      case 'failed':
        return 'error'
      default:
        return 'default'
    }
  }

  // Column definitions
  const columns: ColumnDef<Report>[] = useMemo(
    () => [
      {
        id: 'title',
        header: t('reports.reportTitle'),
        cell: (row) => (
          <Typography variant="body2" fontWeight={500}>
            {row.title}
          </Typography>
        ),
      },
      {
        id: 'type',
        header: t('reports.type'),
        cell: (row) => (
          <Chip
            label={getReportTypeLabel(row.type)}
            size="small"
            variant="outlined"
          />
        ),
        filterType: 'select',
        filterOptions: [
          { label: t('reports.daily'), value: 'daily' },
          { label: t('reports.weekly'), value: 'weekly' },
          { label: t('reports.monthly'), value: 'monthly' },
          { label: t('reports.custom'), value: 'custom' },
        ],
      },
      {
        id: 'format',
        header: t('reports.format'),
        cell: (row) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {row.format === 'pdf' ? (
              <PictureAsPdf fontSize="small" color="error" />
            ) : (
              <TableChart fontSize="small" color="success" />
            )}
            <Typography variant="body2">
              {row.format.toUpperCase()}
            </Typography>
          </Box>
        ),
        filterType: 'select',
        filterOptions: [
          { label: 'PDF', value: 'pdf' },
          { label: 'Excel', value: 'excel' },
        ],
      },
      {
        id: 'date_from',
        header: t('reports.dateRange'),
        sortable: false,
        cell: (row) => (
          <Typography variant="body2">
            {new Date(row.date_from).toLocaleDateString('ko-KR')} ~{' '}
            {new Date(row.date_to).toLocaleDateString('ko-KR')}
          </Typography>
        ),
        searchable: false,
      },
      {
        id: 'status',
        header: t('reports.status'),
        cell: (row) => (
          <Chip
            icon={getStatusIcon(row.status)}
            label={t(`reports.status_${row.status}`)}
            color={getStatusColor(row.status)}
            size="small"
          />
        ),
        filterType: 'select',
        filterOptions: [
          { label: t('reports.status_completed'), value: 'completed' },
          { label: t('reports.status_generating'), value: 'generating' },
          { label: t('reports.status_failed'), value: 'failed' },
        ],
      },
      {
        id: 'created_at',
        header: t('reports.createdAt'),
        cell: (row) => (
          <Typography variant="body2">
            {new Date(row.created_at).toLocaleString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>
        ),
        searchable: false,
      },
    ],
    [t]
  )

  // Render actions for each row
  const renderActions = (report: Report) => (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
      <Tooltip title={t('reports.download')}>
        <span>
          <IconButton
            size="small"
            color="primary"
            disabled={
              report.status !== 'completed' ||
              downloadMutation.isPending
            }
            onClick={() => downloadMutation.mutate(report.id)}
          >
            <Download fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t('common.delete')}>
        <span>
          <IconButton
            size="small"
            color="error"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(report.id)}
          >
            <Delete fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  )

  return (
    <DataTable
      data={reports}
      columns={columns}
      loading={isLoading}
      title={t('reports.reportList')}
      getRowId={(row) => row.id}
      renderActions={renderActions}
      searchPlaceholder={t('reports.reportTitle')}
      pageSize={20}
      enableFilters={true}
    />
  )
}
