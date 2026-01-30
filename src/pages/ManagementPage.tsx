import { useTranslation } from 'react-i18next'
import { Box, Typography, Tabs, Tab, useTheme, useMediaQuery } from '@mui/material'
import { useState } from 'react'
import { ProductModelManagement } from '@/components/management/ProductModelManagement'
import { InspectionItemManagement } from '@/components/management/InspectionItemManagement'
import { InspectionProcessManagement } from '@/components/management/InspectionProcessManagement'
import { DefectTypeManagement } from '@/components/management/DefectTypeManagement'

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
      id={`management-tabpanel-${index}`}
      aria-labelledby={`management-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export function ManagementPage() {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Box>
      <Box sx={{ mb: { xs: 2, md: 4 } }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" fontWeight={700} gutterBottom>
          {t('management.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          {t('management.description')}
        </Typography>
      </Box>

      <Box>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" aria-label="management tabs">
          <Tab label={t('management.productModels')} id="management-tab-0" />
          <Tab label={t('management.inspectionItems')} id="management-tab-1" />
          <Tab label={t('management.inspectionProcesses')} id="management-tab-2" />
          <Tab label={t('management.defectTypes')} id="management-tab-3" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <ProductModelManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <InspectionItemManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <InspectionProcessManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <DefectTypeManagement />
        </TabPanel>
      </Box>
    </Box>
  )
}
