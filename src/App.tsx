import React, { useState } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { pl as plLocale, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { MortgageProvider } from './context/MortgageContext'
import { AppLayout } from './components/layout/AppLayout'
import { getTheme } from './theme/theme'
import './i18n'

const App: React.FC = () => {
  const [mode, setMode] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light',
  )
  const { i18n } = useTranslation()
  const dateLocale = i18n.language === 'pl' ? plLocale : enUS

  const toggleTheme = () => {
    const next: 'light' | 'dark' = mode === 'light' ? 'dark' : 'light'
    setMode(next)
    localStorage.setItem('theme', next)
  }

  return (
    <ThemeProvider theme={getTheme(mode)}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
        <MortgageProvider>
          <AppLayout mode={mode} onToggleTheme={toggleTheme} />
        </MortgageProvider>
      </LocalizationProvider>
    </ThemeProvider>
  )
}

export default App
