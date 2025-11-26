import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Box, Typography, Grid, Tabs, Tab } from '@mui/material'
import { subDays } from 'date-fns'
import { ReportGenerator } from '@/components/reports/ReportGenerator'
import { ReportList } from '@/components/reports/ReportList'
import { ReportSummaryCard } from '@/components/reports/ReportSummaryCard'
import type { ReportFilters } from '@/types/report'
import * as reportService from '@/ui_test/mockServices/mockReportService'

// Mock data for models and processes
const mockModels = [
  { id: 'model-001', name: 'BHB-002' },
  { id: 'model-002', name: 'SHA-001' },
  { id: 'model-003', name: 'FLC-003' },
  { id: 'model-004', name: 'GAD-004' },
  { id: 'model-005', name: 'CNE-005' },
]

const mockProcesses = [
  { id: 'process-1', name: 'IQC' },
  { id: 'process-2', name: 'PQC' },
  { id: 'process-3', name: 'OQC' },
  { id: 'process-4', name: 'FQC' },
]

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export function ReportsPage() {
  const { t } = useTranslation()
  const [tabValue, setTabValue] = useState(0)

  // Default filters for summary
  const [summaryFilters] = useState<ReportFilters>({
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
    reportType: 'monthly',
  })

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  // Fetch reports list
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportService.getReports(),
  })

  // Fetch report summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['report-summary', summaryFilters],
    queryFn: () => reportService.getReportSummary(summaryFilters),
  })

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          {t('reports.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('reports.description')}
        </Typography>
      </Box>

      <Box>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label={t('reports.generate')} />
          <Tab label={t('reports.reportList')} />
          <Tab label={t('reports.summary')} />
        </Tabs>

        {/* Generate Report Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <ReportGenerator models={mockModels} processes={mockProcesses} />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <ReportList
                reports={reports.slice(0, 3)}
                isLoading={reportsLoading}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Report List Tab */}
        <TabPanel value={tabValue} index={1}>
          <ReportList reports={reports} isLoading={reportsLoading} />
        </TabPanel>

        {/* Summary Tab */}
        <TabPanel value={tabValue} index={2}>
          <ReportSummaryCard summary={summary} isLoading={summaryLoading} />
        </TabPanel>
      </Box>
    </Box>
  )
}
