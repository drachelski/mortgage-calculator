import React, { useState } from 'react'
import { Alert, Box, IconButton, Snackbar, Tooltip } from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import { useTranslation } from 'react-i18next'
import { ScenarioSaveDialog } from '../scenarios/ScenarioSaveDialog'
import { ScenarioList } from '../scenarios/ScenarioList'

// Save / load the current loan parameters (persisted scenarios). Lives next to
// the "Parametry kredytu" section title.
export const ParameterActions: React.FC = () => {
  const { t } = useTranslation()
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [scenarioListOpen, setScenarioListOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  })

  const showSnackbar = (message: string) => setSnackbar({ open: true, message })

  return (
    <>
      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
        <Tooltip title={t('form.saveParams')}>
          <IconButton
            color="primary"
            size="small"
            onClick={() => setSaveDialogOpen(true)}
            aria-label={t('form.saveParams')}
          >
            <SaveIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('form.loadParams')}>
          <IconButton
            color="primary"
            size="small"
            onClick={() => setScenarioListOpen(true)}
            aria-label={t('form.loadParams')}
          >
            <FolderOpenIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <ScenarioSaveDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSaved={showSnackbar}
      />
      <ScenarioList
        open={scenarioListOpen}
        onClose={() => setScenarioListOpen(false)}
        onLoaded={showSnackbar}
        onDeleted={showSnackbar}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      >
        <Alert severity="success" onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}
