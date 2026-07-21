import React, { useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { DialogHeader } from '../common/DialogHeader'
import { InsuranceRow } from './InsuranceRow'
import type { Insurance } from '../../types'

const emptyInsurance = (): Insurance => ({
  id: crypto.randomUUID(),
  name: '',
  amount: 0,
  isTemporary: false,
})

interface Props {
  open: boolean
  value: Insurance | null // null → add mode
  onClose: () => void
  onSave: (insurance: Insurance) => void
}

// Note: the parent passes a `key` that changes on each open, so this component
// remounts and re-initialises `draft` from `value` — no syncing effect needed.
export const InsuranceDialog: React.FC<Props> = ({ open, value, onClose, onSave }) => {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<Insurance>(() => value ?? emptyInsurance())

  const isEdit = value !== null

  const handleSave = () => {
    onSave(draft)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogHeader
        title={isEdit ? t('insurance.editTitle') : t('insurance.addTitle')}
        subtitle={t('insurance.subtitle')}
        onClose={onClose}
        closeLabel={t('common.close')}
      />
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <InsuranceRow insurance={draft} onChange={setDraft} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={handleSave}>
          {isEdit ? t('common.save') : t('common.add')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
