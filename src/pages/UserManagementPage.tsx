import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography, Tabs, Tab, useTheme, useMediaQuery } from '@mui/material'
import { UserList, RolePermissions } from '@/components/user-management'

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
      id={`user-management-tabpanel-${index}`}
      aria-labelledby={`user-management-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export function UserManagementPage() {
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
          {t('userManagement.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          {t('userManagement.description')}
        </Typography>
      </Box>

      <Box>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="user management tabs"
        >
          <Tab label={t('userManagement.userList')} id="user-management-tab-0" />
          <Tab label={t('userManagement.permissions')} id="user-management-tab-1" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <UserList />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <RolePermissions />
        </TabPanel>
      </Box>
    </Box>
  )
}
