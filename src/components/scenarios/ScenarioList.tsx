import React, { useEffect, useState } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useTranslation } from 'react-i18next'
import { useMortgage } from '../../context/MortgageContext'
import { deleteScenario, getScenarios } from '../../services/storageService'
import { DialogHeader } from '../common/DialogHeader'
import type { Scenario } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onLoaded: (message: string) => void
  onDeleted: (message: string) => void
}

export const ScenarioList: React.FC<Props> = ({ open, onClose, onLoaded, onDeleted }) => {
  const { t } = useTranslation()
  const { dispatch } = useMortgage()
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getScenarios().then(data => {
      setScenarios(data)
      setLoading(false)
    })
  }, [open])

  const handleLoad = (scenario: Scenario) => {
    dispatch({
      type: 'LOAD_SCENARIO',
      payload: {
        params: scenario.params,
        insurances: scenario.insurances,
        irregularOverpayments: scenario.irregularOverpayments ?? [],
        id: scenario.id,
        name: scenario.name,
      },
    })
    onClose()
    onLoaded(t('snackbar.scenarioLoaded'))
  }

  const handleDelete = async (id: string) => {
    await deleteScenario(id)
    setScenarios(prev => prev.filter(s => s.id !== id))
    onDeleted(t('snackbar.scenarioDeleted'))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogHeader
        title={t('scenarios.loadTitle')}
        subtitle={t('scenarios.loadSubtitle')}
        onClose={onClose}
        closeLabel={t('scenarios.close')}
      />
      <DialogContent>
        {loading && <CircularProgress />}
        {!loading && scenarios.length === 0 && (
          <Typography color="text.secondary">{t('scenarios.empty')}</Typography>
        )}
        <List dense>
          {scenarios.map(s => (
            <ListItem
              key={s.id}
              secondaryAction={
                <IconButton
                  edge="end"
                  onClick={() => handleDelete(s.id)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemText
                primary={s.name}
                secondary={`${t('scenarios.savedAt')}: ${new Date(s.savedAt).toLocaleString()}`}
              />
              <Button size="small" onClick={() => handleLoad(s)} sx={{ mr: 1 }}>
                {t('scenarios.load')}
              </Button>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('scenarios.close')}</Button>
      </DialogActions>
    </Dialog>
  )
}
