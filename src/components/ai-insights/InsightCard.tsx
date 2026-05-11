import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Skeleton,
  Box,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import {
  Summarize,
  Warning,
  TrendingUp,
  NotificationsActive,
} from '@mui/icons-material'
import ReactMarkdown from 'react-markdown'
import type { InsightType } from '@/types/ai-insights'

interface InsightCardProps {
  type: InsightType
  title: string
  content: string
  isLoading: boolean
}

const INSIGHT_ICONS: Record<InsightType, React.ElementType> = {
  'daily-summary': Summarize,
  'key-issues': Warning,
  'performance': TrendingUp,
  'risk-alerts': NotificationsActive,
}

const INSIGHT_COLOR_KEYS: Record<InsightType, 'info' | 'warning' | 'success' | 'error'> = {
  'daily-summary': 'info',
  'key-issues': 'warning',
  'performance': 'success',
  'risk-alerts': 'error',
}

export function InsightCard({ type, title, content, isLoading }: InsightCardProps) {
  const theme = useTheme()
  const Icon = useMemo(() => INSIGHT_ICONS[type], [type])
  const color = useMemo(() => theme.palette[INSIGHT_COLOR_KEYS[type]].main, [theme, type])

  return (
    <Card
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s ease-out',
        '&:hover': {
          boxShadow: 4,
        },
      }}
    >
      <CardHeader
        avatar={
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: alpha(color, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ color, fontSize: 24 }} />
          </Box>
        }
        title={
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ flex: 1, pt: 1 }}>
        {isLoading ? (
          <Box>
            <Skeleton variant="text" width="100%" height={24} />
            <Skeleton variant="text" width="90%" height={24} />
            <Skeleton variant="text" width="80%" height={24} />
            <Skeleton variant="text" width="85%" height={24} />
            <Skeleton variant="text" width="70%" height={24} />
          </Box>
        ) : (
          <Box
            sx={{
              '& h2': {
                fontSize: '1rem',
                fontWeight: 600,
                mt: 0,
                mb: 1,
                color: 'text.primary',
              },
              '& p': {
                fontSize: '0.875rem',
                lineHeight: 1.6,
                color: 'text.secondary',
                mb: 1,
              },
              '& ul, & ol': {
                pl: 2,
                mb: 1,
              },
              '& li': {
                fontSize: '0.875rem',
                lineHeight: 1.6,
                color: 'text.secondary',
                mb: 0.5,
              },
              '& strong': {
                color: 'text.primary',
                fontWeight: 600,
              },
            }}
          >
            <ReactMarkdown>{content || '-'}</ReactMarkdown>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
