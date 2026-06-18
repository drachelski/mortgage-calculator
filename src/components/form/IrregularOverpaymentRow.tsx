import React from 'react'
import { Box, FormControl, InputLabel, MenuItem, Select, TextField, Tooltip, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { useTranslation } from 'react-i18next'
import type { IrregularOverpayment } from '../../types'

interface Props {
  entry: IrregularOverpayment
  onChange: (updated: IrregularOverpayment) => void
}

export const IrregularOverpaymentRow: React.FC<Props> = ({ entry, onChange }) => {
  const { t } = useTranslation()

  const dateValue = entry.startDate ? new Date(entry.startDate + '-01') : null

  const handleDateChange = (date: Date | null) => {
    if (!date) return
    const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    onChange({ ...entry, startDate: formatted })
  }

  const typeLabels: Record<IrregularOverpayment['type'], string> = {
    once: t('irregularOverpayment.typeOnce'),
    'semi-annual': t('irregularOverpayment.typeSemiAnnual'),
    annual: t('irregularOverpayment.typeAnnual'),
  }

  const dateLabel = entry.type === 'once'
    ? t('irregularOverpayment.date')
    : t('irregularOverpayment.startDate')

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
      <Tooltip title={t('irregularOverpayment.amount')} placement="top" arrow>
        <TextField
          label={t('irregularOverpayment.amount')}
          type="number"
          value={entry.amount}
          onChange={e => onChange({ ...entry, amount: Number(e.target.value) })}
          size="small"
          fullWidth
          slotProps={{ htmlInput: { min: 0, step: 100 } }}
        />
      </Tooltip>

      <Tooltip title={typeLabels[entry.type]} placement="top" arrow>
        <FormControl size="small" fullWidth>
          <InputLabel>{t('irregularOverpayment.type')}</InputLabel>
          <Select
            value={entry.type}
            label={t('irregularOverpayment.type')}
            onChange={e => onChange({ ...entry, type: e.target.value as IrregularOverpayment['type'] })}
            renderValue={val => (
              <Typography noWrap variant="inherit" component="span">
                {typeLabels[val as IrregularOverpayment['type']]}
              </Typography>
            )}
          >
            <MenuItem value="once">{t('irregularOverpayment.typeOnce')}</MenuItem>
            <MenuItem value="semi-annual">{t('irregularOverpayment.typeSemiAnnual')}</MenuItem>
            <MenuItem value="annual">{t('irregularOverpayment.typeAnnual')}</MenuItem>
          </Select>
        </FormControl>
      </Tooltip>

      <Tooltip title={dateLabel} placement="top" arrow>
        <Box sx={{ minWidth: 0 }}>
          <DatePicker
            label={dateLabel}
            views={['year', 'month']}
            value={dateValue}
            onChange={handleDateChange}
            slotProps={{ textField: { size: 'small', fullWidth: true } }}
          />
        </Box>
      </Tooltip>

      {/* Empty cell to complete the 2×2 grid */}
      <Box />
    </Box>
  )
}
