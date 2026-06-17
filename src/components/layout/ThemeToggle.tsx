import React from 'react'
import { IconButton, Tooltip } from '@mui/material'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import { useTranslation } from 'react-i18next'

interface Props {
  mode: 'light' | 'dark'
  onToggle: () => void
}

export const ThemeToggle: React.FC<Props> = ({ mode, onToggle }) => {
  const { t } = useTranslation()
  return (
    <Tooltip title={mode === 'light' ? t('theme.dark') : t('theme.light')}>
      <IconButton color="inherit" onClick={onToggle} aria-label="toggle theme">
        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  )
}
