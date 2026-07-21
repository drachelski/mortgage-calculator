import React, { useMemo, useState } from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff'
import { useTranslation } from 'react-i18next'
import { useMortgage } from '../../context/MortgageContext'
import { getCondensedSchedule } from '../../lib/mortgageCalculator'
import { ScheduleToggle } from './ScheduleToggle'
import { glassPaperSx } from '../../theme/glass'
import type { ScheduleRow } from '../../types'

const fmt = (n: number): string =>
  n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface TransitionInfo {
  expiredNames: string[]
  removedNames: string[]
}

export const ScheduleTable: React.FC = () => {
  const { t } = useTranslation()
  const { schedule, state } = useMortgage()
  const [view, setView] = useState<'full' | 'condensed'>('condensed')

  const rows: ScheduleRow[] = view === 'full' ? schedule : getCondensedSchedule(schedule)
  const showOverpayment = schedule.some(r => r.overpayment > 0)

  const transitionRows = useMemo(() => {
    const map = new Map<number, TransitionInfo>()
    const tempIns = state.insurances.filter(ins => ins.isTemporary && ins.endDate)

    for (const ins of tempIns) {
      const name = ins.name || '—'
      const lastIdx = schedule.findIndex(r => r.date === ins.endDate)
      if (lastIdx < 0) continue

      const lastMonth = schedule[lastIdx].month
      const entry = map.get(lastMonth) ?? { expiredNames: [], removedNames: [] }
      entry.expiredNames.push(name)
      map.set(lastMonth, entry)

      if (lastIdx + 1 < schedule.length) {
        const nextMonth = schedule[lastIdx + 1].month
        const nextEntry = map.get(nextMonth) ?? { expiredNames: [], removedNames: [] }
        nextEntry.removedNames.push(name)
        map.set(nextMonth, nextEntry)
      }
    }

    return map
  }, [schedule, state.insurances])

  if (schedule.length === 0) {
    return (
      <Paper sx={[glassPaperSx, { p: 3 }]} elevation={2}>
        <Typography color="text.secondary">{t('schedule.noData')}</Typography>
      </Paper>
    )
  }

  return (
    <Paper
      elevation={2}
      sx={[
        glassPaperSx,
        {
          p: 2,
          flex: { lg: 1 },
          minHeight: { lg: 0 },
          display: 'flex',
          flexDirection: 'column',
        },
      ]}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          flexShrink: 0,
        }}
      >
        <Typography variant="h6">{t('schedule.title')}</Typography>
        <ScheduleToggle value={view} onChange={setView} />
      </Box>

      <TableContainer sx={{ flex: { lg: 1 }, minHeight: { lg: 0 }, maxHeight: { xs: '70vh', lg: 'none' } }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('schedule.month')}</TableCell>
              <TableCell>{t('schedule.date')}</TableCell>
              <TableCell align="right">{t('schedule.remainingPrincipal')}</TableCell>
              <TableCell align="right">{t('schedule.totalPayment')}</TableCell>
              <TableCell align="right">{t('schedule.principalPart')}</TableCell>
              <TableCell align="right">{t('schedule.interestPart')}</TableCell>
              {showOverpayment && (
                <TableCell align="right">{t('schedule.overpayment')}</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(row => {
              const transition = transitionRows.get(row.month)

              return (
                <TableRow
                  key={row.month}
                  hover
                  sx={
                    transition
                      ? theme => ({
                          bgcolor: alpha(theme.palette.info.main, 0.15),
                          '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.28) },
                        })
                      : undefined
                  }
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {row.month}
                      {transition && (
                        <Tooltip
                          arrow
                          title={
                            <>
                              {transition.expiredNames.length > 0 && (
                                <div>
                                  {t('schedule.insuranceLastRow')}: {transition.expiredNames.join(', ')}
                                </div>
                              )}
                              {transition.removedNames.length > 0 && (
                                <div>
                                  {t('schedule.insuranceFirstRow')}: {transition.removedNames.join(', ')}
                                </div>
                              )}
                            </>
                          }
                        >
                          <NotificationsOffIcon sx={{ fontSize: 14, color: 'info.main' }} />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell align="right">{fmt(row.remainingPrincipal)}</TableCell>
                  <TableCell align="right">{fmt(row.totalPayment)}</TableCell>
                  <TableCell align="right">{fmt(row.principalPart)}</TableCell>
                  <TableCell align="right">{fmt(row.interestPart)}</TableCell>
                  {showOverpayment && (
                    <TableCell align="right">{fmt(row.overpayment)}</TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
