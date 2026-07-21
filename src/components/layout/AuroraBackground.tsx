import React from 'react'
import { Box } from '@mui/material'
import { keyframes } from '@emotion/react'

// Minimalist aurora: a single teal/emerald colour family, concentrated on the
// left side, drifting gently (translate only — no scaling, so it doesn't look
// like it radiates from the centre). Colours come from the theme palette.
const drift1 = keyframes`
  0%   { transform: translate(0, 0); }
  100% { transform: translate(5vmax, 6vmax); }
`
const drift2 = keyframes`
  0%   { transform: translate(0, 0); }
  100% { transform: translate(6vmax, -4vmax); }
`

const blobBase = {
  position: 'absolute' as const,
  borderRadius: '50%',
  filter: 'blur(80px)',
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
}

export const AuroraBackground: React.FC = () => (
  <Box
    aria-hidden
    sx={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
    }}
  >
    {/* upper-left */}
    <Box
      sx={{
        ...blobBase,
        width: '55vmax',
        height: '55vmax',
        left: '-16%',
        top: '-12%',
        bgcolor: 'primary.main',
        opacity: theme => (theme.palette.mode === 'dark' ? 0.34 : 0.42),
        animation: `${drift1} 30s ease-in-out infinite alternate`,
      }}
    />
    {/* lower-left, overlaps the first to blend into a teal→emerald gradient */}
    <Box
      sx={{
        ...blobBase,
        width: '42vmax',
        height: '42vmax',
        left: '-8%',
        top: '38%',
        bgcolor: 'secondary.main',
        opacity: theme => (theme.palette.mode === 'dark' ? 0.28 : 0.36),
        animation: `${drift2} 36s ease-in-out infinite alternate`,
      }}
    />
  </Box>
)
