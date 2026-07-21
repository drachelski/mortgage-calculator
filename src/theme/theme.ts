import { alpha, createTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

const gradient = (theme: Theme): string =>
  `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`

export const getTheme = (mode: 'light' | 'dark'): Theme =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#0d9488' : '#2dd4bf', // teal
      },
      secondary: {
        main: mode === 'light' ? '#10b981' : '#34d399', // emerald
      },
      warning: {
        main: '#f59e0b', // gold (coin accent)
      },
      success: {
        main: mode === 'light' ? '#10b981' : '#34d399', // emerald (savings)
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      button: { textTransform: 'none', fontWeight: 600 },
      h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    },
    components: {
      // Native form controls don't inherit font-family — force them to
      MuiCssBaseline: {
        styleOverrides: {
          'input, textarea, select, button, optgroup': { fontFamily: 'inherit' },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none', borderRadius: 16 },
        },
      },
      // Header carries the brand gradient
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: gradient(theme),
            borderRadius: 0,
          }),
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 10 },
          contained: ({ theme }) => ({
            backgroundImage: gradient(theme),
            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
            '&:hover': { boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}` },
          }),
          outlined: ({ theme }) => ({
            borderWidth: 1.5,
            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`,
            '&:hover': {
              borderWidth: 1.5,
              boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.12)}`,
            },
          }),
        },
      },
      // Segmented toggles (loan type, schedule view): selected segment gets the gradient
      MuiToggleButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            textTransform: 'none',
            fontWeight: 600,
            '&.Mui-selected': {
              color: theme.palette.primary.contrastText,
              backgroundImage: gradient(theme),
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
              '&:hover': { backgroundImage: gradient(theme) },
            },
          }),
        },
      },
      // Table header: no gray default — tinted, bold, brand-coloured
      MuiTableCell: {
        styleOverrides: {
          head: ({ theme }) => ({
            fontWeight: 700,
            color: theme.palette.primary.main,
            backgroundColor: theme.palette.background.paper,
            borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.25)}`,
          }),
        },
      },
      // Switches: gradient track when on
      MuiSwitch: {
        styleOverrides: {
          switchBase: ({ theme }) => ({
            '&.Mui-checked + .MuiSwitch-track': {
              backgroundImage: gradient(theme),
              opacity: 1,
            },
          }),
        },
      },
      // Inputs: rounded with a soft primary focus ring
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 10,
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}`,
            },
          }),
        },
      },
    },
  })
