export interface MortgageParams {
  principal: number
  annualRate: number
  termMonths: number
  startDate: string // YYYY-MM
  overpayment: number
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

export interface Scenario {
  id: string
  name: string
  savedAt: string // ISO datetime string
  params: MortgageParams
  insurances: Insurance[]
}
