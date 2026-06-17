import { createTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

export const getTheme = (mode: 'light' | 'dark'): Theme =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#546e7a' : '#78909c',
      },
      success: {
        main: mode === 'light' ? '#66bb6a' : '#81c784',
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
    },
    shape: {
      borderRadius: 8,
    },
  })
