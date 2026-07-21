import { createTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

export const getTheme = (mode: 'light' | 'dark'): Theme =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#4f46e5' : '#818cf8', // indigo
      },
      secondary: {
        main: mode === 'light' ? '#7c3aed' : '#a78bfa', // violet
      },
      warning: {
        main: '#f59e0b', // gold (coin accent)
      },
      success: {
        main: mode === 'light' ? '#22c55e' : '#4ade80', // green (savings)
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
