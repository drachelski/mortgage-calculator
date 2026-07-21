import React, { useMemo } from 'react'
import { Box, Paper, Tooltip, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { useTranslation } from 'react-i18next'
import { useMortgage } from '../../context/MortgageContext'
import { calculateRRSO, calculateSchedule } from '../../lib/mortgageCalculator'
import { glassPaperSx } from '../../theme/glass'

const fmt = (n: number): string =>
  n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const Stat: React.FC<{ label: React.ReactNode; children: React.ReactNode; color?: string }> = ({
  label,
  children,
  color,
}) => (
  <Box>
    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 700, color }}>
      {children}
    </Typography>
  </Box>
)

export const LoanSummary: React.FC = () => {
  const { t } = useTranslation()
  const { state, schedule, rrso } = useMortgage()
  const { params, insurances } = state

  const rrsoBase = useMemo(() => calculateRRSO(params, []), [params])
  const totalRepayment = useMemo(
    () => schedule.reduce((sum, row) => sum + row.totalPayment, 0),
    [schedule],
  )
  const baseSchedule = useMemo(
    () =>
      calculateSchedule(
        { ...params, overpayment: 0, overpaymentMode: 'fixed', shortenTerm: false },
        insurances,
      ),
    [params, insurances],
  )
  const totalBase = useMemo(
    () => baseSchedule.reduce((sum, row) => sum + row.totalPayment, 0),
    [baseSchedule],
  )

  if (schedule.length === 0) return null

  return (
    <Paper elevation={2} sx={[glassPaperSx, { p: 2, flexShrink: 0 }]}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        {t('form.summary')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', rowGap: 1.5 }}>
        <Stat label={t('form.monthlyInstallment')} color="primary.main">
          {fmt(schedule[0].totalPayment)} PLN
        </Stat>
        <Stat label={t('form.loanEndDate')}>{schedule[schedule.length - 1].date}</Stat>
        <Stat
          label={
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              {t('form.rrso')}
              <Tooltip
                arrow
                placement="top"
                title={
                  <Box>
                    <Box sx={{ fontWeight: 600, mb: 0.5 }}>
                      {t('form.rrso')}: {(rrso * 100).toFixed(2)}%
                    </Box>
                    <Box>• {(rrsoBase * 100).toFixed(2)}% – {t('form.rrsoInterestPart')}</Box>
                    <Box>• {((rrso - rrsoBase) * 100).toFixed(2)}% – {t('form.rrsoInsurancePart')}</Box>
                    <Box sx={{ mt: 0.5, opacity: 0.75, fontSize: '0.8em' }}>{t('form.rrsoNote')}</Box>
                  </Box>
                }
              >
                <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary', cursor: 'help' }} />
              </Tooltip>
            </Box>
          }
          color="success.main"
        >
          {(rrso * 100).toFixed(2)}%
        </Stat>
        <Stat label={t('form.totalRepayment')}>{fmt(totalRepayment)} PLN</Stat>
        {totalRepayment < totalBase && (
          <>
            <Stat label={t('form.totalRepaymentBase')}>{fmt(totalBase)} PLN</Stat>
            <Stat label={t('form.savings')} color="success.main">
              +{fmt(totalBase - totalRepayment)} PLN
            </Stat>
          </>
        )}
      </Box>
    </Paper>
  )
}
