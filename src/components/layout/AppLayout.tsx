import React from 'react'
import { AppBar, Box, GlobalStyles, Toolbar, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ThemeToggle } from './ThemeToggle'
import { LanguageToggle } from './LanguageToggle'
import { MortgageForm } from '../form/MortgageForm'
import { ScheduleTable } from '../schedule/ScheduleTable'

interface Props {
  mode: 'light' | 'dark'
  onToggleTheme: () => void
}

export const AppLayout: React.FC<Props> = ({ mode, onToggleTheme }) => {
  const { t } = useTranslation()

  return (
    <>
      {/* Prevent browser-level scrollbar on large screens */}
      <GlobalStyles styles={{ '@media (min-width: 1200px)': { 'html, body': { overflow: 'hidden', height: '100%' } } }} />

      <Box
        sx={{
          bgcolor: 'background.default',
          // Large screens: fixed viewport height, no browser scroll
          height: { lg: '100vh' },
          minHeight: { xs: '100vh', lg: 'unset' },
          display: 'flex',
          flexDirection: 'column',
          overflow: { lg: 'hidden' },
        }}
      >
        <AppBar position="static" elevation={1} sx={{ flexShrink: 0 }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              {t('app.title')}
            </Typography>
            <LanguageToggle />
            <ThemeToggle mode={mode} onToggle={onToggleTheme} />
          </Toolbar>
        </AppBar>

        {/* Content area — fills remaining height on lg, normal flow on mobile */}
        <Box
          sx={{
            flex: { lg: 1 },
            minHeight: { xs: 0, lg: 'unset' },
            overflow: { lg: 'hidden' },
            px: { xs: 2, sm: 3 },
            py: 3,
            boxSizing: 'border-box',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '460px 1fr' },
              gap: 3,
              height: { lg: '100%' },
              maxWidth: '1536px',
              mx: 'auto',
            }}
          >
            {/* Form panel — own scrollbar on lg */}
            <Box sx={{ overflowY: { lg: 'auto' }, height: { lg: '100%' } }}>
              <MortgageForm />
            </Box>

            {/* Schedule panel — own scrollbar on lg */}
            <Box sx={{ overflowY: { lg: 'auto' }, height: { lg: '100%' } }}>
              <ScheduleTable />
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  )
}
