import React from 'react'
import { Box, Checkbox, FormControlLabel, TextField, Tooltip, Typography } from '@mui/material'
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

  const temporaryLabel = t('insurance.temporary')
  const endDateLabel = t('insurance.endDate')

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
      <Tooltip title={t('insurance.name')} placement="top" arrow>
        <TextField
          label={t('insurance.name')}
          value={insurance.name}
          onChange={e => onChange({ ...insurance, name: e.target.value })}
          size="small"
          fullWidth
          slotProps={{ input: { sx: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } } }}
        />
      </Tooltip>

      <Tooltip title={t('insurance.amount')} placement="top" arrow>
        <TextField
          label={t('insurance.amount')}
          type="number"
          value={insurance.amount}
          onChange={e => onChange({ ...insurance, amount: Number(e.target.value) })}
          size="small"
          fullWidth
          slotProps={{ htmlInput: { min: 0, step: 1 } }}
        />
      </Tooltip>

      <Tooltip title={temporaryLabel} placement="top" arrow>
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
          label={
            <Typography variant="body2" noWrap>
              {temporaryLabel}
            </Typography>
          }
          sx={{ m: 0, overflow: 'hidden' }}
        />
      </Tooltip>

      {insurance.isTemporary ? (
        <Tooltip title={endDateLabel} placement="top" arrow>
          <Box sx={{ minWidth: 0 }}>
            <DatePicker
              label={endDateLabel}
              views={['year', 'month']}
              value={endDateValue}
              onChange={handleEndDateChange}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Box>
        </Tooltip>
      ) : (
        <Box />
      )}
    </Box>
  )
}
