export type LoanType = 'annuity' | 'declining'

export interface MortgageParams {
  principal: number
  annualRate: number
  termMonths: number
  startDate: string // YYYY-MM
  overpayment: number
  loanType?: LoanType       // default: 'annuity'
  shortenTerm?: boolean     // default: false (reduce installment mode)
  shortenFrequency?: number // default: 12; only used when shortenTerm=true
}

export interface Insurance {
  id: string
  name: string
  amount: number
  isTemporary: boolean
  endDate?: string // YYYY-MM, only when isTemporary = true
}

export interface ScheduleRow {
  month: number
  date: string // YYYY-MM
  remainingPrincipal: number
  totalPayment: number
  principalPart: number
  interestPart: number
  insuranceTotal: number
  overpayment: number
}

export type IrregularOverpaymentType = 'once' | 'semi-annual' | 'annual'

export interface IrregularOverpayment {
  id: string
  amount: number
  type: IrregularOverpaymentType
  startDate: string // YYYY-MM — for 'once': the specific month; for recurring: first occurrence
}

export interface Scenario {
  id: string
  name: string
  savedAt: string // ISO datetime string
  params: MortgageParams
  insurances: Insurance[]
  irregularOverpayments: IrregularOverpayment[]
}
