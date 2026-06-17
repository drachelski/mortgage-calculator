import React from 'react'
import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material'
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {t('app.title')}
          </Typography>
          <LanguageToggle />
          <ThemeToggle mode={mode} onToggle={onToggleTheme} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '460px 1fr' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          <MortgageForm />
          <ScheduleTable />
        </Box>
      </Container>
    </Box>
  )
}
