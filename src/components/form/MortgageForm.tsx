import React, { useState } from 'react'
import {
  Box,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { useTranslation } from 'react-i18next'
import { useMortgage } from '../../context/MortgageContext'
import { EntryRow } from './EntryRow'
import { InsuranceDialog } from './InsuranceDialog'
import { IrregularOverpaymentDialog } from './IrregularOverpaymentDialog'
import { ParameterActions } from './ParameterActions'
import { glassPaperSx } from '../../theme/glass'
import type { Insurance, IrregularOverpayment, LoanType } from '../../types'

const PRESET_FREQUENCIES = [1, 3, 6, 12]

export const MortgageForm: React.FC = () => {
  const { t } = useTranslation()
  const { state, dispatch } = useMortgage()
  const { params, insurances, irregularOverpayments } = state

  const [insuranceDialog, setInsuranceDialog] = useState<{ open: boolean; index: number | null }>({
    open: false,
    index: null,
  })
  const [irregularDialog, setIrregularDialog] = useState<{ open: boolean; index: number | null }>({
    open: false,
    index: null,
  })

  const setParam = <K extends keyof typeof params>(key: K, value: (typeof params)[K]) =>
    dispatch({ type: 'SET_PARAMS', payload: { ...params, [key]: value } })

  const setInsurances = (updated: Insurance[]) =>
    dispatch({ type: 'SET_INSURANCES', payload: updated })

  const saveInsurance = (ins: Insurance) =>
    setInsurances(
      insuranceDialog.index === null
        ? [...insurances, ins]
        : insurances.map((x, i) => (i === insuranceDialog.index ? ins : x)),
    )

  const removeInsurance = (index: number) =>
    setInsurances(insurances.filter((_, i) => i !== index))

  const setIrregularOverpayments = (updated: IrregularOverpayment[]) =>
    dispatch({ type: 'SET_IRREGULAR_OVERPAYMENTS', payload: updated })

  const saveIrregular = (entry: IrregularOverpayment) =>
    setIrregularOverpayments(
      irregularDialog.index === null
        ? [...irregularOverpayments, entry]
        : irregularOverpayments.map((x, i) => (i === irregularDialog.index ? entry : x)),
    )

  const removeIrregularOverpayment = (index: number) =>
    setIrregularOverpayments(irregularOverpayments.filter((_, i) => i !== index))

  const irregularTypeLabel: Record<IrregularOverpayment['type'], string> = {
    once: t('irregularOverpayment.typeOnce'),
    'semi-annual': t('irregularOverpayment.typeSemiAnnual'),
    annual: t('irregularOverpayment.typeAnnual'),
  }

  const insuranceLabel = (ins: Insurance): string => {
    const base = `${ins.name || t('insurance.unnamed')} · ${ins.amount} ${t('insurance.monthly')}`
    return ins.isTemporary && ins.endDate ? `${base} · ${t('insurance.until')} ${ins.endDate}` : base
  }

  const irregularLabel = (e: IrregularOverpayment): string =>
    `${e.amount} PLN · ${irregularTypeLabel[e.type]} · ${e.startDate}`

  const startDateValue = params.startDate ? new Date(params.startDate + '-01') : null

  const shortenFreq = params.shortenFrequency ?? 12
  const isCustomFrequency = !PRESET_FREQUENCIES.includes(shortenFreq)

  const overpaymentMode = params.overpaymentMode ?? 'fixed'
  const hasOverpayment =
    overpaymentMode === 'target'
      ? (params.overpaymentTarget ?? 0) > 0
      : params.overpayment > 0

  return (
    <Paper
      elevation={2}
      sx={[
        glassPaperSx,
        {
          p: 2,
          height: { lg: '100%' },
          display: { lg: 'flex' },
          flexDirection: { lg: 'column' },
          overflow: { lg: 'hidden' },
        },
      ]}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          flexWrap: 'wrap',
          mb: 2.5,
          flexShrink: 0,
        }}
      >
        <Typography variant="h6">{t('form.title')}</Typography>
        <ParameterActions />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flex: { lg: 1 },
          minHeight: { lg: 0 },
          overflowY: { lg: 'auto' },
          pr: { lg: 1 },
        }}
      >
        {/* Loan type */}
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
            {t('form.loanType')}
          </Typography>
          <ToggleButtonGroup
            value={params.loanType ?? 'annuity'}
            exclusive
            onChange={(_, value: LoanType | null) => value && setParam('loanType', value)}
            size="small"
            fullWidth
          >
            <ToggleButton value="annuity">{t('form.loanTypeAnnuity')}</ToggleButton>
            <ToggleButton value="declining">{t('form.loanTypeDeclining')}</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Core parameters — two rows of two */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            mt: 1.5,
          }}
        >
          <TextField
            label={t('form.principal')}
            type="number"
            value={params.principal}
            onChange={e => setParam('principal', Number(e.target.value))}
            slotProps={{ htmlInput: { min: 0, step: 1000 } }}
            fullWidth
          />
          <TextField
            label={t('form.annualRate')}
            type="number"
            value={params.annualRate}
            onChange={e => setParam('annualRate', Number(e.target.value))}
            slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }}
            fullWidth
          />
          <TextField
            label={t('form.termMonths')}
            type="number"
            value={params.termMonths}
            onChange={e => setParam('termMonths', Number(e.target.value))}
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
            fullWidth
          />
          <DatePicker
            label={t('form.startDate')}
            views={['year', 'month']}
            value={startDateValue}
            onChange={date => {
              if (!date) return
              const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
              setParam('startDate', formatted)
            }}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Box>

        <Divider sx={{ mt: 1 }} />

        {/* Overpayment section */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography
              variant="body2"
              sx={{ color: overpaymentMode === 'fixed' ? 'text.primary' : 'text.secondary' }}
            >
              {t('form.overpaymentModeFixed')}
            </Typography>
            <Switch
              checked={overpaymentMode === 'target'}
              onChange={e => setParam('overpaymentMode', e.target.checked ? 'target' : 'fixed')}
              size="small"
            />
            <Typography
              variant="body2"
              sx={{ color: overpaymentMode === 'target' ? 'text.primary' : 'text.secondary' }}
            >
              {t('form.overpaymentModeTarget')}
            </Typography>
            <Tooltip arrow placement="top" title={t('form.overpaymentModeInfo')}>
              <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
            </Tooltip>
          </Box>

          {overpaymentMode === 'fixed' ? (
            <TextField
              label={t('form.overpayment')}
              type="number"
              value={params.overpayment}
              onChange={e => setParam('overpayment', Number(e.target.value))}
              slotProps={{ htmlInput: { min: 0, step: 100 } }}
              fullWidth
            />
          ) : (
            <TextField
              label={t('form.overpaymentTarget')}
              type="number"
              value={params.overpaymentTarget ?? 0}
              onChange={e => setParam('overpaymentTarget', Number(e.target.value))}
              slotProps={{ htmlInput: { min: 0, step: 100 } }}
              fullWidth
            />
          )}
        </Box>

        {hasOverpayment && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pl: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={params.shortenTerm ?? false}
                  onChange={e => setParam('shortenTerm', e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">{t('form.shortenTerm')}</Typography>
              }
            />

            {params.shortenTerm && (
              <>
                <FormControl size="small" fullWidth>
                  <InputLabel>{t('form.shortenFrequency')}</InputLabel>
                  <Select
                    value={isCustomFrequency ? 'custom' : String(shortenFreq)}
                    label={t('form.shortenFrequency')}
                    onChange={e => {
                      const val = e.target.value
                      if (val !== 'custom') setParam('shortenFrequency', Number(val))
                      else setParam('shortenFrequency', 2)
                    }}
                  >
                    <MenuItem value="1">{t('form.shortenFrequencyMonthly')}</MenuItem>
                    <MenuItem value="3">{t('form.shortenFrequencyQuarterly')}</MenuItem>
                    <MenuItem value="6">{t('form.shortenFrequencySemiannual')}</MenuItem>
                    <MenuItem value="12">{t('form.shortenFrequencyAnnual')}</MenuItem>
                    <MenuItem value="custom">{t('form.shortenFrequencyCustom')}</MenuItem>
                  </Select>
                </FormControl>

                {isCustomFrequency && (
                  <TextField
                    label={t('form.shortenFrequencyCustomLabel')}
                    type="number"
                    value={shortenFreq}
                    onChange={e => setParam('shortenFrequency', Math.max(1, Number(e.target.value)))}
                    size="small"
                    slotProps={{ htmlInput: { min: 1, step: 1 } }}
                    fullWidth
                  />
                )}
              </>
            )}
          </Box>
        )}

        <Divider />

        {/* Irregular overpayments */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2">{t('form.irregularOverpayments')}</Typography>
          <Tooltip title={t('irregularOverpayment.addTitle')}>
            <IconButton
              onClick={() => setIrregularDialog({ open: true, index: null })}
              color="primary"
              size="small"
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {irregularOverpayments.map((entry, i) => (
          <EntryRow
            key={entry.id}
            label={irregularLabel(entry)}
            onEdit={() => setIrregularDialog({ open: true, index: i })}
            onDelete={() => removeIrregularOverpayment(i)}
            editLabel={t('irregularOverpayment.edit')}
            deleteLabel={t('irregularOverpayment.remove')}
          />
        ))}

        <Divider />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2">{t('form.insurances')}</Typography>
          <Tooltip title={t('insurance.addTitle')}>
            <IconButton
              onClick={() => setInsuranceDialog({ open: true, index: null })}
              color="primary"
              size="small"
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {insurances.map((ins, i) => (
          <EntryRow
            key={ins.id}
            label={insuranceLabel(ins)}
            onEdit={() => setInsuranceDialog({ open: true, index: i })}
            onDelete={() => removeInsurance(i)}
            editLabel={t('insurance.edit')}
            deleteLabel={t('insurance.remove')}
          />
        ))}
      </Box>

      <InsuranceDialog
        key={`ins-${insuranceDialog.open}-${insuranceDialog.index}`}
        open={insuranceDialog.open}
        value={insuranceDialog.index === null ? null : insurances[insuranceDialog.index]}
        onClose={() => setInsuranceDialog(s => ({ ...s, open: false }))}
        onSave={saveInsurance}
      />
      <IrregularOverpaymentDialog
        key={`irr-${irregularDialog.open}-${irregularDialog.index}`}
        open={irregularDialog.open}
        value={irregularDialog.index === null ? null : irregularOverpayments[irregularDialog.index]}
        defaultStartDate={params.startDate}
        onClose={() => setIrregularDialog(s => ({ ...s, open: false }))}
        onSave={saveIrregular}
      />
    </Paper>
  )
}
