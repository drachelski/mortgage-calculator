import React from 'react'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

interface Props {
  label: string
  onEdit: () => void
  onDelete: () => void
  editLabel: string
  deleteLabel: string
}

// Compact one-line summary of an entered insurance / irregular overpayment,
// with edit and delete actions on the same line.
export const EntryRow: React.FC<Props> = ({ label, onEdit, onDelete, editLabel, deleteLabel }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 0.5,
      border: 1,
      borderColor: theme => alpha(theme.palette.primary.main, 0.15),
      borderRadius: 2,
      bgcolor: theme => alpha(theme.palette.primary.main, 0.05),
      pl: 1.5,
      pr: 0.5,
      py: 0.25,
    }}
  >
    <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0, fontWeight: 500 }}>
      {label}
    </Typography>
    <Tooltip title={editLabel}>
      <IconButton size="small" color="primary" onClick={onEdit} aria-label={editLabel}>
        <EditIcon fontSize="small" />
      </IconButton>
    </Tooltip>
    <Tooltip title={deleteLabel}>
      <IconButton size="small" color="error" onClick={onDelete} aria-label={deleteLabel}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  </Box>
)
