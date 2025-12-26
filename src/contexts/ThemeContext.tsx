import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
  mode: ThemeMode
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeMode() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('theme-mode')
    return (stored as ThemeMode) || 'light'
  })

  useEffect(() => {
    localStorage.setItem('theme-mode', mode)
    
    // Add/remove 'dark' class to HTML element for Tailwind dark mode
    if (mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [mode])

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#6366f1',
      },
      secondary: {
        main: '#ec4899',
      },
    },
    components: {
      // Touch-friendly button styles
      MuiButton: {
        styleOverrides: {
          root: {
            minHeight: 44, // Apple's recommended touch target
            '@media (max-width: 600px)': {
              minHeight: 48,
            },
          },
          sizeLarge: {
            minHeight: 52,
          },
        },
      },
      // Touch-friendly input styles
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiInputBase-input': {
              fontSize: '16px', // Prevents iOS zoom on focus
              '@media (max-width: 600px)': {
                fontSize: '16px',
              },
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '@media (max-width: 600px)': {
              minHeight: 48,
            },
          },
          input: {
            fontSize: '16px', // Prevents iOS zoom on focus
          },
        },
      },
      // Touch-friendly icon button
      MuiIconButton: {
        styleOverrides: {
          root: {
            '@media (max-width: 600px)': {
              padding: 12,
            },
          },
        },
      },
      // Touch-friendly list items
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '@media (max-width: 600px)': {
              minHeight: 48,
            },
          },
        },
      },
      // Touch-friendly chips
      MuiChip: {
        styleOverrides: {
          root: {
            '@media (max-width: 600px)': {
              height: 32,
            },
          },
        },
      },
    },
  })

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}

