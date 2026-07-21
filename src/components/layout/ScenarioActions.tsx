import React, { useRef, useState } from 'react'
import { Alert, Box, IconButton, Snackbar, Tooltip } from '@mui/material'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import { useTranslation } from 'react-i18next'
import { useMortgage } from '../../context/MortgageContext'
import { useCsvIO } from '../../hooks/useCsvIO'

// CSV export / import, mounted in the top navigation bar.
export const ScenarioActions: React.FC = () => {
  const { t } = useTranslation()
  const { state, dispatch, schedule } = useMortgage()
  const { params, insurances, irregularOverpayments } = state
  const { exportCsv, importCsv } = useCsvIO()

  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showSnackbar = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity })

  const handleExport = () => {
    exportCsv({ params, insurances, irregularOverpayments, schedule })
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

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title={t('form.exportCsv')}>
          <IconButton color="inherit" onClick={handleExport} aria-label={t('form.exportCsv')}>
            <FileDownloadIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('form.importCsv')}>
          <IconButton color="inherit" onClick={handleImportClick} aria-label={t('form.importCsv')}>
            <FileUploadIcon />
          </IconButton>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}
