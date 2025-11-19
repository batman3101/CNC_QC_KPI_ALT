import { useTranslation } from 'react-i18next'
import { Card, CardContent, Grid, Typography, Box } from '@mui/material'
import { BarChart, CheckCircle, Cancel, AccessTime } from '@mui/icons-material'

export function DashboardPage() {
  const { t } = useTranslation()

  const stats = [
    {
      title: t('dashboard.todayInspections'),
      value: '245',
      subtitle: '금일 기준',
      icon: BarChart,
      color: 'text.secondary',
    },
    {
      title: t('dashboard.passRate'),
      value: '96.8%',
      subtitle: '+2.1% 전일 대비',
      icon: CheckCircle,
      color: 'success.main',
    },
    {
      title: t('dashboard.defectRate'),
      value: '8',
      subtitle: '금일 기준',
      icon: Cancel,
      color: 'error.main',
    },
    {
      title: '평균 검사 시간',
      value: '4.2분',
      subtitle: '-0.3분 전일 대비',
      icon: AccessTime,
      color: 'text.secondary',
    },
  ]

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          {t('dashboard.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('dashboard.description')}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {stat.title}
                    </Typography>
                    <Icon sx={{ color: stat.color, fontSize: 20 }} />
                  </Box>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stat.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {t('dashboard.recentInspections')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            검사 내역이 여기에 표시됩니다.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
