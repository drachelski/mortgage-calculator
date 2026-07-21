import React from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface Props {
  title: string
  subtitle?: string
  onClose: () => void
  closeLabel?: string
}

// Shared modal header styled like the top navigation bar: brand gradient
// background, white bold h2 title, an optional subtitle beneath it, and a
// close-without-action button.
export const DialogHeader: React.FC<Props> = ({ title, subtitle, onClose, closeLabel }) => (
  <Box
    sx={{
      position: 'relative',
      px: 3,
      py: 2,
      color: 'common.white',
      backgroundImage: theme =>
        `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    }}
  >
    <Typography variant="h6" component="h2" sx={{ fontWeight: 700, pr: 5 }}>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="body2" sx={{ mt: 0.5, pr: 5, opacity: 0.85 }}>
        {subtitle}
      </Typography>
    )}
    <IconButton
      aria-label={closeLabel}
      onClick={onClose}
      sx={{ position: 'absolute', right: 8, top: 8, color: 'common.white' }}
    >
      <CloseIcon />
    </IconButton>
  </Box>
)
