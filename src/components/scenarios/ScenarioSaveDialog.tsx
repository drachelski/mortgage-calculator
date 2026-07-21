import React, { useEffect, useState } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMortgage } from '../../context/MortgageContext'
import { saveScenario } from '../../services/storageService'
import { DialogHeader } from '../common/DialogHeader'
import type { Scenario } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (message: string) => void
}

export const ScenarioSaveDialog: React.FC<Props> = ({ open, onClose, onSaved }) => {
  const { t } = useTranslation()
  const { state, dispatch } = useMortgage()
  const { currentScenarioId, currentScenarioName } = state
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'overwrite' | 'new'>('overwrite')

  useEffect(() => {
    if (open) {
      setMode('overwrite')
      setName('')
    }
  }, [open])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    const scenario: Scenario = {
      id: crypto.randomUUID(),
      name: name.trim(),
      savedAt: new Date().toISOString(),
      params: state.params,
      insurances: state.insurances,
      irregularOverpayments: state.irregularOverpayments,
    }
    await saveScenario(scenario)
    dispatch({ type: 'SET_CURRENT_SCENARIO', payload: { id: scenario.id, name: scenario.name } })
    setSaving(false)
    setName('')
    onClose()
    onSaved(t('snackbar.scenarioSaved'))
  }

  const handleOverwrite = async () => {
    if (!currentScenarioId || !currentScenarioName) return
    setSaving(true)
    const scenario: Scenario = {
      id: currentScenarioId,
      name: currentScenarioName,
      savedAt: new Date().toISOString(),
      params: state.params,
      insurances: state.insurances,
      irregularOverpayments: state.irregularOverpayments,
    }
    await saveScenario(scenario)
    dispatch({ type: 'SET_CURRENT_SCENARIO', payload: { id: scenario.id, name: scenario.name } })
    setSaving(false)
    onClose()
    onSaved(t('snackbar.scenarioSaved'))
  }

  const showOverwriteMode = !!currentScenarioId && mode === 'overwrite'

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogHeader
        title={t('scenarios.saveTitle')}
        subtitle={t('scenarios.saveSubtitle')}
        onClose={onClose}
        closeLabel={t('scenarios.close')}
      />
      {showOverwriteMode ? (
        <>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('scenarios.currentScenario')}: <strong>{currentScenarioName}</strong>
            </Typography>
            <Button size="small" variant="text" onClick={() => setMode('new')}>
              {t('scenarios.saveAsNew')}
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>{t('scenarios.cancel')}</Button>
            <Button
              onClick={handleOverwrite}
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} /> : undefined}
            >
              {t('scenarios.overwrite')}
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogContent>
            {mode === 'new' && currentScenarioId && (
              <Button size="small" variant="text" onClick={() => setMode('overwrite')} sx={{ mb: 1 }}>
                ← {t('scenarios.cancel')}
              </Button>
            )}
            <TextField
              autoFocus
              label={t('scenarios.nameLabel')}
              value={name}
              onChange={e => setName(e.target.value)}
              fullWidth
              margin="dense"
              onKeyDown={e => {
                if (e.key === 'Enter') handleSave()
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>{t('scenarios.cancel')}</Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={!name.trim() || saving}
              startIcon={saving ? <CircularProgress size={16} /> : undefined}
            >
              {t('scenarios.save')}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  )
}
