import type { Insurance, MortgageParams, ScheduleRow } from '../types'

const toMonthString = (year: number, month: number): string =>
  `${year}-${String(month).padStart(2, '0')}`

const addMonths = (startDate: string, offset: number): string => {
  const [y, m] = startDate.split('-').map(Number)
  const d = new Date(y, m - 1 + offset)
  return toMonthString(d.getFullYear(), d.getMonth() + 1)
}

const getInsuranceTotal = (insurances: Insurance[], currentDate: string): number =>
  insurances.reduce((sum, ins) => {
    if (!ins.isTemporary) return sum + ins.amount
    if (!ins.endDate) return sum + ins.amount
    return currentDate <= ins.endDate ? sum + ins.amount : sum
  }, 0)

export const calculateSchedule = (
  params: MortgageParams,
  insurances: Insurance[],
): ScheduleRow[] => {
  const { principal, annualRate, termMonths, startDate, overpayment } = params
  const r = annualRate / 12 / 100

  const basePayment =
    r === 0
      ? principal / termMonths
      : (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1)

  const rows: ScheduleRow[] = []
  let remaining = principal

  for (let month = 1; month <= termMonths && remaining > 0.005; month++) {
    const interest = remaining * r
    const rawPrincipalPart = basePayment - interest
    const principalPart = Math.min(rawPrincipalPart, remaining)

    const date = addMonths(startDate, month - 1)
    const insuranceTotal = getInsuranceTotal(insurances, date)

    const remainingAfterInstallment = remaining - principalPart
    const actualOverpayment = Math.min(overpayment, Math.max(0, remainingAfterInstallment))
    const newRemaining = Math.max(0, remainingAfterInstallment - actualOverpayment)

    rows.push({
      month,
      date,
      remainingPrincipal: newRemaining,
      totalPayment: principalPart + interest + insuranceTotal + actualOverpayment,
      principalPart,
      interestPart: interest,
      insuranceTotal,
      overpayment: actualOverpayment,
    })

    remaining = newRemaining
  }

  return rows
}

export const getCondensedSchedule = (rows: ScheduleRow[]): ScheduleRow[] => {
  if (rows.length === 0) return []
  const lastMonth = rows[rows.length - 1].month

  const transitionMonths = new Set<number>()
  for (let i = 1; i < rows.length; i++) {
    if (Math.abs(rows[i].insuranceTotal - rows[i - 1].insuranceTotal) > 0.001) {
      transitionMonths.add(rows[i - 1].month)
      transitionMonths.add(rows[i].month)
    }
  }

  return rows.filter(
    row =>
      row.month <= 10 ||
      (row.month - 1) % 12 === 0 ||
      row.month === lastMonth ||
      transitionMonths.has(row.month),
  )
}

export const calculateRRSO = (params: MortgageParams, insurances: Insurance[]): number => {
  if (params.principal <= 0 || params.termMonths <= 0) return 0
  const schedule = calculateSchedule({ ...params, overpayment: 0 }, insurances)
  if (schedule.length === 0) return 0
  const P = params.principal
  const cashFlows = schedule.map(row => row.principalPart + row.interestPart + row.insuranceTotal)
  const npv = (r: number): number =>
    cashFlows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + r, i + 1), 0) - P
  if (npv(0) <= 0) return 0
  let low = 0
  let high = 1
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2
    if (npv(mid) > 0) low = mid
    else high = mid
  }
  return Math.pow(1 + (low + high) / 2, 12) - 1
}
