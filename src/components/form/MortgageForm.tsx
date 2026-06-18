import React, { useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SaveIcon from '@mui/icons-material/Save'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { useTranslation } from 'react-i18next'
import { useMortgage } from '../../context/MortgageContext'
import { calculateRRSO, calculateSchedule } from '../../lib/mortgageCalculator'
import { InsuranceRow } from './InsuranceRow'
import { IrregularOverpaymentRow } from './IrregularOverpaymentRow'
import { ScenarioSaveDialog } from '../scenarios/ScenarioSaveDialog'
import { ScenarioList } from '../scenarios/ScenarioList'
import { useCsvIO } from '../../hooks/useCsvIO'
import type { Insurance, IrregularOverpayment, LoanType } from '../../types'

const PRESET_FREQUENCIES = [1, 3, 6, 12]

export const MortgageForm: React.FC = () => {
  const { t } = useTranslation()
  const { state, dispatch, schedule, rrso } = useMortgage()
  const { params, insurances, irregularOverpayments } = state
  const rrsoBase = useMemo(() => calculateRRSO(params, []), [params])
  const totalRepayment = useMemo(
    () => schedule.reduce((sum, row) => sum + row.totalPayment, 0),
    [schedule],
  )
  const baseSchedule = useMemo(
    () => calculateSchedule({ ...params, overpayment: 0, shortenTerm: false }, insurances),
    [params, insurances],
  )
  const totalBase = useMemo(
    () => baseSchedule.reduce((sum, row) => sum + row.totalPayment, 0),
    [baseSchedule],
  )
  const { exportCsv, importCsv } = useCsvIO()

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [scenarioListOpen, setScenarioListOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const setParam = <K extends keyof typeof params>(key: K, value: (typeof params)[K]) =>
    dispatch({ type: 'SET_PARAMS', payload: { ...params, [key]: value } })

  const setInsurances = (updated: Insurance[]) =>
    dispatch({ type: 'SET_INSURANCES', payload: updated })

  const addInsurance = () =>
    setInsurances([
      ...insurances,
      { id: crypto.randomUUID(), name: '', amount: 0, isTemporary: false },
    ])

  const updateInsurance = (index: number, updated: Insurance) => {
    const next = [...insurances]
    next[index] = updated
    setInsurances(next)
  }

  const removeInsurance = (index: number) =>
    setInsurances(insurances.filter((_, i) => i !== index))

  const setIrregularOverpayments = (updated: IrregularOverpayment[]) =>
    dispatch({ type: 'SET_IRREGULAR_OVERPAYMENTS', payload: updated })

  const addIrregularOverpayment = () =>
    setIrregularOverpayments([
      ...irregularOverpayments,
      {
        id: crypto.randomUUID(),
        amount: 0,
        type: 'once',
        startDate: params.startDate,
      },
    ])

  const updateIrregularOverpayment = (index: number, updated: IrregularOverpayment) => {
    const next = [...irregularOverpayments]
    next[index] = updated
    setIrregularOverpayments(next)
  }

  const removeIrregularOverpayment = (index: number) =>
    setIrregularOverpayments(irregularOverpayments.filter((_, i) => i !== index))

  const handleExport = () => {
    exportCsv({ params, insurances, schedule })
    showSnackbar(t('snackbar.exportSuccess'), 'success')
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await importCsv(file)
      dispatch({ type: 'LOAD_SCENARIO', payload: result })
      showSnackbar(t('snackbar.importSuccess'), 'success')
    } catch {
      showSnackbar(t('snackbar.importError'), 'error')
    }
    e.target.value = ''
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity })

  const startDateValue = params.startDate ? new Date(params.startDate + '-01') : null

  const shortenFreq = params.shortenFrequency ?? 12
  const isCustomFrequency = !PRESET_FREQUENCIES.includes(shortenFreq)

  return (
    <Paper sx={{ p: 2 }} elevation={2}>
      <Typography variant="h6" sx={{ mb: 2.5 }}>
        {t('form.title')}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

        {/* Overpayment + shorten options */}
        <TextField
          label={t('form.overpayment')}
          type="number"
          value={params.overpayment}
          onChange={e => setParam('overpayment', Number(e.target.value))}
          slotProps={{ htmlInput: { min: 0, step: 100 } }}
          fullWidth
        />

        {params.overpayment > 0 && (
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

        {/* Irregular overpayments */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2">{t('form.irregularOverpayments')}</Typography>
          <Tooltip title={t('form.addIrregularOverpayment')}>
            <IconButton onClick={addIrregularOverpayment} color="primary" size="small">
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {irregularOverpayments.map((entry, i) => (
          <Box
            key={entry.id}
            sx={{
              position: 'relative',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 1.5,
              pt: 4,
              bgcolor: 'action.hover',
            }}
          >
            <Tooltip title={t('irregularOverpayment.remove')}>
              <IconButton
                aria-label={t('irregularOverpayment.remove')}
                onClick={() => removeIrregularOverpayment(i)}
                color="error"
                size="small"
                sx={{ position: 'absolute', top: 4, right: 4 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IrregularOverpaymentRow
              entry={entry}
              onChange={updated => updateIrregularOverpayment(i, updated)}
            />
          </Box>
        ))}

        {schedule.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              flexWrap: 'wrap',
              bgcolor: 'action.hover',
              borderRadius: 1,
              p: 1.5,
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                {t('form.monthlyInstallment')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {schedule[0].totalPayment.toLocaleString('pl-PL', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                PLN
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                {t('form.loanEndDate')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {schedule[schedule.length - 1].date}
              </Typography>
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('form.rrso')}
                </Typography>
                <Tooltip
                  arrow
                  placement="top"
                  title={
                    <Box>
                      <Box sx={{ fontWeight: 600, mb: 0.5 }}>
                        {t('form.rrso')}: {(rrso * 100).toFixed(2)}%
                      </Box>
                      <Box>• {(rrsoBase * 100).toFixed(2)}% – {t('form.rrsoInterestPart')}</Box>
                      <Box>• {((rrso - rrsoBase) * 100).toFixed(2)}% – {t('form.rrsoInsurancePart')}</Box>
                      <Box sx={{ mt: 0.5, opacity: 0.75, fontSize: '0.8em' }}>
                        {t('form.rrsoNote')}
                      </Box>
                    </Box>
                  }
                >
                  <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary', cursor: 'help' }} />
                </Tooltip>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                {(rrso * 100).toFixed(2)}%
              </Typography>
            </Box>
            <Box sx={{ flexBasis: '100%' }}>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                {t('form.totalRepayment')}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {totalRepayment.toLocaleString('pl-PL', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                PLN
              </Typography>
            </Box>
            {totalRepayment < totalBase && (
              <>
                <Box sx={{ flexBasis: '100%' }}>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                    {t('form.totalRepaymentBase')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {totalBase.toLocaleString('pl-PL', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    PLN
                  </Typography>
                </Box>
                <Box sx={{ flexBasis: '100%' }}>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                    {t('form.savings')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                    +{(totalBase - totalRepayment).toLocaleString('pl-PL', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    PLN
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        )}

        <Divider />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2">{t('form.insurances')}</Typography>
          <Tooltip title={t('form.addInsurance')}>
            <IconButton onClick={addInsurance} color="primary" size="small">
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {insurances.map((ins, i) => (
          <Box
            key={ins.id}
            sx={{
              position: 'relative',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 1.5,
              pt: 4,
              bgcolor: 'action.hover',
            }}
          >
            <Tooltip title={t('insurance.remove')}>
              <IconButton
                aria-label={t('insurance.remove')}
                onClick={() => removeInsurance(i)}
                color="error"
                size="small"
                sx={{ position: 'absolute', top: 4, right: 4 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <InsuranceRow
              insurance={ins}
              onChange={updated => updateInsurance(i, updated)}
            />
          </Box>
        ))}

        <Divider />

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={() => setSaveDialogOpen(true)}
            size="small"
          >
            {t('form.saveScenario')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FolderOpenIcon />}
            onClick={() => setScenarioListOpen(true)}
            size="small"
          >
            {t('form.loadScenarios')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            size="small"
          >
            {t('form.exportCsv')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={handleImportClick}
            size="small"
          >
            {t('form.importCsv')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </Box>
      </Box>

      <ScenarioSaveDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSaved={msg => showSnackbar(msg, 'success')}
      />
      <ScenarioList
        open={scenarioListOpen}
        onClose={() => setScenarioListOpen(false)}
        onLoaded={msg => showSnackbar(msg, 'success')}
        onDeleted={msg => showSnackbar(msg, 'success')}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  )
}
