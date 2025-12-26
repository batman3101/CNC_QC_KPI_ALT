import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material'
import { Send, SmartToy, Person } from '@mui/icons-material'
import ReactMarkdown from 'react-markdown'
import type { ChatMessage, AnalyticsDataForAI } from '@/types/ai-insights'
import { chatWithAI } from '@/services/geminiService'

interface AIChatbotProps {
  analyticsData: AnalyticsDataForAI | null
}

export function AIChatbot({ analyticsData }: AIChatbotProps) {
  const { t, i18n } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading || !analyticsData) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await chatWithAI({
        message: userMessage.content,
        context: analyticsData,
        history: messages,
        language: i18n.language === 'vi' ? 'vi' : 'ko',
      })

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: i18n.language === 'vi'
          ? 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.'
          : '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
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
              backgroundColor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SmartToy sx={{ color: 'primary.main', fontSize: 24 }} />
          </Box>
        }
        title={
          <Typography variant="subtitle1" fontWeight={600}>
            {t('aiInsights.chatbot.title')}
          </Typography>
        }
        sx={{ pb: 0 }}
      />
      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          pt: 1,
        }}
      >
        {/* Messages Container */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            mb: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            minHeight: 200,
          }}
        >
          {messages.length === 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 2,
                px: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {t('aiInsights.chatbot.placeholder')}
              </Typography>

              {/* 추천 질문 섹션 */}
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: 'center', mb: 0.5 }}
                >
                  {t('aiInsights.chatbot.suggestedQuestions')}
                </Typography>
                {['q1', 'q2', 'q3', 'q4', 'q5'].map((key) => (
                  <Paper
                    key={key}
                    elevation={0}
                    onClick={() => {
                      const question = t(`aiInsights.chatbot.suggestions.${key}`)
                      setInput(question)
                    }}
                    sx={{
                      p: 1.5,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'primary.50',
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.primary',
                        fontSize: '0.8rem',
                      }}
                    >
                      {t(`aiInsights.chatbot.suggestions.${key}`)}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}

          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 1,
              }}
            >
              {message.role === 'assistant' && (
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <SmartToy sx={{ fontSize: 16, color: 'primary.main' }} />
                </Box>
              )}
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  maxWidth: '80%',
                  backgroundColor: message.role === 'user' ? 'primary.main' : 'background.paper',
                  color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 2,
                  '& p': {
                    m: 0,
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                  },
                  '& strong': {
                    fontWeight: 600,
                  },
                }}
              >
                {message.role === 'assistant' ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  <Typography variant="body2">{message.content}</Typography>
                )}
              </Paper>
              {message.role === 'user' && (
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: 'grey.300',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Person sx={{ fontSize: 16, color: 'grey.700' }} />
                </Box>
              )}
            </Box>
          ))}

          {isLoading && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SmartToy sx={{ fontSize: 16, color: 'primary.main' }} />
              </Box>
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  borderRadius: 2,
                }}
              >
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  {t('aiInsights.chatbot.thinking')}
                </Typography>
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Input Container */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={t('aiInsights.chatbot.placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading || !analyticsData}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !analyticsData}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '&:disabled': {
                backgroundColor: 'grey.300',
                color: 'grey.500',
              },
            }}
          >
            <Send />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  )
}
