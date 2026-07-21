import { alpha } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

// Frosted-glass surface: translucent paper + blur so the aurora backdrop
// subtly shows through the main panels. Kept opaque enough to keep dense
// numbers fully legible.
export const glassPaperSx = (theme: Theme) => ({
  backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.72 : 0.82),
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: `1px solid ${theme.palette.divider}`,
})
