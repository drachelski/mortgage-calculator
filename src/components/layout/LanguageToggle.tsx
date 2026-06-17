import React from 'react'
import { Button } from '@mui/material'
import { useTranslation } from 'react-i18next'

export const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation()
  const isPolish = i18n.language === 'pl'

  const toggle = () => {
    const next = isPolish ? 'en' : 'pl'
    i18n.changeLanguage(next)
    localStorage.setItem('language', next)
  }

  return (
    <Button color="inherit" onClick={toggle} size="small" sx={{ minWidth: 48 }}>
      {isPolish ? 'EN' : 'PL'}
    </Button>
  )
}
