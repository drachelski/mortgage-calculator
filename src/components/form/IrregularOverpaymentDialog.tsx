import React, { useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { DialogHeader } from '../common/DialogHeader'
import { IrregularOverpaymentRow } from './IrregularOverpaymentRow'
import type { IrregularOverpayment } from '../../types'

interface Props {
  open: boolean
  value: IrregularOverpayment | null // null → add mode
  defaultStartDate: string
  onClose: () => void
  onSave: (entry: IrregularOverpayment) => void
}

// Note: the parent passes a `key` that changes on each open, so this component
// remounts and re-initialises `draft` — no syncing effect needed.
export const IrregularOverpaymentDialog: React.FC<Props> = ({
  open,
  value,
  defaultStartDate,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<IrregularOverpayment>(
    () =>
      value ?? {
        id: crypto.randomUUID(),
        amount: 0,
        type: 'once',
        startDate: defaultStartDate,
      },
  )

  const isEdit = value !== null

  const handleSave = () => {
    onSave(draft)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogHeader
        title={isEdit ? t('irregularOverpayment.editTitle') : t('irregularOverpayment.addTitle')}
        subtitle={t('irregularOverpayment.subtitle')}
        onClose={onClose}
        closeLabel={t('common.close')}
      />
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <IrregularOverpaymentRow entry={draft} onChange={setDraft} />
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
