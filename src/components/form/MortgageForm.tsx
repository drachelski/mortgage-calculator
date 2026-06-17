import React, { useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  TextField,
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
import { calculateRRSO } from '../../lib/mortgageCalculator'
import { InsuranceRow } from './InsuranceRow'
import { ScenarioSaveDialog } from '../scenarios/ScenarioSaveDialog'
import { ScenarioList } from '../scenarios/ScenarioList'
import { useCsvIO } from '../../hooks/useCsvIO'
import type { Insurance } from '../../types'

export const MortgageForm: React.FC = () => {
  const { t } = useTranslation()
  const { state, dispatch, schedule, rrso } = useMortgage()
  const { params, insurances } = state
  const rrsoBase = useMemo(() => calculateRRSO(params, []), [params])
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

  return (
    <Paper sx={{ p: 2 }} elevation={2}>
      <Typography variant="h6" sx={{ mb: 2.5 }}>
        {t('form.title')}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
        <TextField
          label={t('form.overpayment')}
          type="number"
          value={params.overpayment}
          onChange={e => setParam('overpayment', Number(e.target.value))}
          slotProps={{ htmlInput: { min: 0, step: 100 } }}
          fullWidth
        />

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
                sx={{ position: 'absolute', top: -2, right: -2 }}
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
