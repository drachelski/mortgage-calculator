import React from 'react'
import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useTranslation } from 'react-i18next'

interface Props {
  value: 'full' | 'condensed'
  onChange: (value: 'full' | 'condensed') => void
}

export const ScheduleToggle: React.FC<Props> = ({ value, onChange }) => {
  const { t } = useTranslation()
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, v) => {
        if (v) onChange(v)
      }}
      size="small"
    >
      <ToggleButton value="full">{t('schedule.full')}</ToggleButton>
      <ToggleButton value="condensed">{t('schedule.condensed')}</ToggleButton>
    </ToggleButtonGroup>
  )
}
