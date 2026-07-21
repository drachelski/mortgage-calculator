import type { Insurance, IrregularOverpayment, MortgageParams, ScheduleRow } from '../types'

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

const getIrregularOverpayment = (
  irregulars: IrregularOverpayment[],
  currentDate: string,
): number =>
  irregulars.reduce((sum, irr) => {
    if (currentDate < irr.startDate) return sum
    if (irr.type === 'once') return currentDate === irr.startDate ? sum + irr.amount : sum
    const [sy, sm] = irr.startDate.split('-').map(Number)
    const [cy, cm] = currentDate.split('-').map(Number)
    const diff = (cy - sy) * 12 + (cm - sm)
    if (diff < 0) return sum
    if (irr.type === 'semi-annual') return diff % 6 === 0 ? sum + irr.amount : sum
    return diff % 12 === 0 ? sum + irr.amount : sum
  }, 0)

const annuityPayment = (P: number, r: number, n: number): number => {
  if (n <= 0) return P
  if (r === 0) return P / n
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

// Find remaining term n such that annuityPayment(remaining, r, n) === basePayment (annuity)
// or remaining / n === basePrincipalPart (declining)
const calcShortenedTerm = (
  remaining: number,
  baseRef: number, // annuity: basePayment; declining: principal/termMonths
  r: number,
  loanType: string,
): number => {
  if (loanType === 'declining') {
    return Math.max(1, Math.ceil(remaining / baseRef))
  }
  // Annuity: solve n = -log(1 - remaining*r/basePayment) / log(1+r)
  if (r === 0) return Math.max(1, Math.ceil(remaining / baseRef))
  const ratio = (remaining * r) / baseRef
  if (ratio >= 1) return 1 // interest already exceeds payment — can't solve, use 1 month
  return Math.max(1, Math.ceil(-Math.log(1 - ratio) / Math.log(1 + r)))
}

export const calculateSchedule = (
  params: MortgageParams,
  insurances: Insurance[],
  irregularOverpayments: IrregularOverpayment[] = [],
): ScheduleRow[] => {
  const { principal, annualRate, termMonths, startDate, overpayment } = params
  const loanType = params.loanType ?? 'annuity'
  const shortenTerm = params.shortenTerm ?? false
  const shortenFrequency = Math.max(1, params.shortenFrequency ?? 12)
  const overpaymentMode = params.overpaymentMode ?? 'fixed'
  const overpaymentTarget = params.overpaymentTarget ?? 0
  const hasRegularOverpayment =
    overpaymentMode === 'target' ? overpaymentTarget > 0 : overpayment > 0

  const r = annualRate / 12 / 100

  // baseRef: annuity → original monthly payment; declining → original principal-per-month
  const baseRef =
    loanType === 'annuity' ? annuityPayment(principal, r, termMonths) : principal / termMonths

  const rows: ScheduleRow[] = []
  let remaining = principal
  let currentPayment = loanType === 'annuity' ? baseRef : 0 // declining recalculates each month
  let loopEnd = termMonths

  for (let month = 1; month <= loopEnd && remaining > 0.005; month++) {
    const date = addMonths(startDate, month - 1)
    const insuranceTotal = getInsuranceTotal(insurances, date)
    const interest = remaining * r

    let principalPart: number

    if (loanType === 'annuity') {
      const pay = Math.min(currentPayment, remaining + interest)
      principalPart = Math.min(pay - interest, remaining)
    } else {
      // Declining: principal part = remaining / months left
      // In shorten-term mode, loopEnd shortens at frequency events, which naturally resets
      // principalPart back toward baseRef (sawtooth pattern)
      const monthsLeft = loopEnd - month + 1
      principalPart = remaining / monthsLeft
    }

    const afterPrincipal = Math.max(0, remaining - principalPart)
    const irregularOvp = getIrregularOverpayment(irregularOverpayments, date)
    const regularOvp =
      overpaymentMode === 'target'
        ? Math.max(0, overpaymentTarget - (principalPart + interest + insuranceTotal))
        : overpayment
    const totalOvp = Math.min(regularOvp + irregularOvp, afterPrincipal)
    const newRemaining = Math.max(0, afterPrincipal - totalOvp)

    rows.push({
      month,
      date,
      remainingPrincipal: newRemaining,
      totalPayment: principalPart + interest + insuranceTotal + totalOvp,
      principalPart,
      interestPart: interest,
      insuranceTotal,
      overpayment: totalOvp,
    })

    remaining = newRemaining

    if ((hasRegularOverpayment || irregularOverpayments.length > 0) && remaining > 0) {
      if (shortenTerm && month % shortenFrequency === 0) {
        // Shorten event: recalculate term, then reset payment to baseRef.
        // At frequency=1 this keeps payment constant; at frequency=N it creates a sawtooth.
        const newN = calcShortenedTerm(remaining, baseRef, r, loanType)
        loopEnd = month + newN
        if (loanType === 'annuity') currentPayment = baseRef
      } else if (loanType === 'annuity') {
        // Between shorten events (or in reduce-installment mode): payment decreases naturally
        const monthsLeft = loopEnd - month
        if (monthsLeft > 0) {
          currentPayment = annuityPayment(remaining, r, monthsLeft)
        }
      }
      // Declining: principalPart = remaining/monthsLeft recalculates naturally each iteration
    }
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
  const schedule = calculateSchedule(
    { ...params, overpayment: 0, overpaymentMode: 'fixed', shortenTerm: false },
    insurances,
  )
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
