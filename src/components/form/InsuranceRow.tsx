import React from 'react'
import { Box, Checkbox, FormControlLabel, TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { useTranslation } from 'react-i18next'
import type { Insurance } from '../../types'

interface Props {
  insurance: Insurance
  onChange: (updated: Insurance) => void
}

export const InsuranceRow: React.FC<Props> = ({ insurance, onChange }) => {
  const { t } = useTranslation()

  const endDateValue = insurance.endDate ? new Date(insurance.endDate + '-01') : null

  const handleEndDateChange = (date: Date | null) => {
    if (!date) return
    const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    onChange({ ...insurance, endDate: formatted })
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
      <TextField
        label={t('insurance.name')}
        value={insurance.name}
        onChange={e => onChange({ ...insurance, name: e.target.value })}
        size="small"
        sx={{ flex: '1 1 140px' }}
      />
      <TextField
        label={t('insurance.amount')}
        type="number"
        value={insurance.amount}
        onChange={e => onChange({ ...insurance, amount: Number(e.target.value) })}
        size="small"
        slotProps={{ htmlInput: { min: 0, step: 1 } }}
        sx={{ width: 120 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={insurance.isTemporary}
            onChange={e =>
              onChange({ ...insurance, isTemporary: e.target.checked, endDate: undefined })
            }
            size="small"
          />
        }
        label={t('insurance.temporary')}
        sx={{ m: 0 }}
      />
      {insurance.isTemporary && (
        <DatePicker
          label={t('insurance.endDate')}
          views={['year', 'month']}
          value={endDateValue}
          onChange={handleEndDateChange}
          slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
        />
      )}
    </Box>
  )
}
