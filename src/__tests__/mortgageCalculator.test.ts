import { describe, expect, it } from 'vitest'
import { calculateRRSO, calculateSchedule, getCondensedSchedule } from '../lib/mortgageCalculator'
import type { MortgageParams } from '../types'

const baseParams: MortgageParams = {
  principal: 120000,
  annualRate: 6,
  termMonths: 120,
  startDate: '2024-01',
  overpayment: 0,
}

describe('calculateSchedule — annuity (default)', () => {
  it('returns 120 rows for a 10-year loan', () => {
    const rows = calculateSchedule(baseParams, [])
    expect(rows.length).toBe(120)
  })

  it('first row has correct date', () => {
    const rows = calculateSchedule(baseParams, [])
    expect(rows[0].date).toBe('2024-01')
  })

  it('last row remainingPrincipal is 0', () => {
    const rows = calculateSchedule(baseParams, [])
    expect(rows[rows.length - 1].remainingPrincipal).toBeCloseTo(0, 0)
  })

  it('interest decreases monotonically', () => {
    const rows = calculateSchedule(baseParams, [])
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].interestPart).toBeLessThanOrEqual(rows[i - 1].interestPart + 0.01)
    }
  })

  it('overpayment in reduce-installment mode still ends the loan early', () => {
    const params = { ...baseParams, overpayment: 500 }
    const rows = calculateSchedule(params, [])
    expect(rows.length).toBeLessThan(120)
  })

  it('reduce-installment mode: payment decreases after overpayment', () => {
    const params = { ...baseParams, overpayment: 500, shortenTerm: false }
    const rows = calculateSchedule(params, [])
    const mid = Math.floor(rows.length / 2)
    expect(rows[mid].totalPayment).toBeLessThan(rows[0].totalPayment)
  })

  it('shorten-term mode ends sooner than reduce-installment mode', () => {
    const paramsReduce = { ...baseParams, overpayment: 500, shortenTerm: false }
    const paramsShorten = { ...baseParams, overpayment: 500, shortenTerm: true, shortenFrequency: 12 }
    const rowsReduce = calculateSchedule(paramsReduce, [])
    const rowsShorten = calculateSchedule(paramsShorten, [])
    expect(rowsShorten.length).toBeLessThanOrEqual(rowsReduce.length)
  })

  it('shorten-term mode: payment resets close to base level after shortening', () => {
    const params = { ...baseParams, overpayment: 500, shortenTerm: true, shortenFrequency: 12 }
    const rows = calculateSchedule(params, [])
    const basePayment = rows[0].principalPart + rows[0].interestPart
    // After first shortening at month 12, next month's payment should reset close to basePayment.
    // Integer-month rounding in calcShortenedTerm causes a few-PLN difference — within 1% is correct.
    if (rows.length > 13) {
      const afterShorten = rows[12].principalPart + rows[12].interestPart
      expect(Math.abs(afterShorten - basePayment)).toBeLessThan(basePayment * 0.01)
    }
  })

  it('permanent insurance adds to every payment', () => {
    const insurance = { id: '1', name: 'Test', amount: 100, isTemporary: false }
    const rows = calculateSchedule(baseParams, [insurance])
    expect(rows[0].insuranceTotal).toBe(100)
    expect(rows[119].insuranceTotal).toBe(100)
  })

  it('temporary insurance stops after endDate', () => {
    const insurance = {
      id: '1',
      name: 'Test',
      amount: 100,
      isTemporary: true,
      endDate: '2024-03',
    }
    const rows = calculateSchedule(baseParams, [insurance])
    expect(rows[0].insuranceTotal).toBe(100)
    expect(rows[2].insuranceTotal).toBe(100)
    expect(rows[3].insuranceTotal).toBe(0)
  })

  it('handles 0% interest rate without crashing', () => {
    const params = { ...baseParams, annualRate: 0 }
    const rows = calculateSchedule(params, [])
    expect(rows.length).toBe(120)
    expect(rows[0].interestPart).toBeCloseTo(0)
  })
})

describe('calculateSchedule — declining', () => {
  const decParams: MortgageParams = { ...baseParams, loanType: 'declining' }

  it('returns 120 rows without overpayment', () => {
    const rows = calculateSchedule(decParams, [])
    expect(rows.length).toBe(120)
  })

  it('principalPart is constant without overpayment', () => {
    const rows = calculateSchedule(decParams, [])
    const expected = baseParams.principal / baseParams.termMonths
    rows.forEach(row => expect(row.principalPart).toBeCloseTo(expected, 1))
  })

  it('total payment decreases each month', () => {
    const rows = calculateSchedule(decParams, [])
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].totalPayment).toBeLessThanOrEqual(rows[i - 1].totalPayment + 0.01)
    }
  })

  it('last row remainingPrincipal is 0', () => {
    const rows = calculateSchedule(decParams, [])
    expect(rows[rows.length - 1].remainingPrincipal).toBeCloseTo(0, 0)
  })

  it('overpayment ends the loan early', () => {
    const params = { ...decParams, overpayment: 500 }
    const rows = calculateSchedule(params, [])
    expect(rows.length).toBeLessThan(120)
  })
})

describe('getCondensedSchedule', () => {
  it('returns first 10 rows plus first row of each subsequent year', () => {
    const rows = calculateSchedule(baseParams, [])
    const condensed = getCondensedSchedule(rows)
    expect(condensed[0].month).toBe(1)
    expect(condensed[9].month).toBe(10)
    expect(condensed[10].month).toBe(13)
    expect(condensed[11].month).toBe(25)
  })

  it('condensed has fewer rows than full for long loans', () => {
    const rows = calculateSchedule(baseParams, [])
    const condensed = getCondensedSchedule(rows)
    expect(condensed.length).toBeLessThan(rows.length)
  })

  it('condensed always includes the last row', () => {
    const rows = calculateSchedule(baseParams, [])
    const condensed = getCondensedSchedule(rows)
    expect(condensed[condensed.length - 1].month).toBe(120)
  })

  it('returns empty array for empty input', () => {
    expect(getCondensedSchedule([])).toEqual([])
  })

  it('includes insurance transition rows in condensed view', () => {
    const insurance = {
      id: '1',
      name: 'Test',
      amount: 200,
      isTemporary: true,
      endDate: '2025-06',
    }
    const rows = calculateSchedule(baseParams, [insurance])
    const condensed = getCondensedSchedule(rows)
    const months = condensed.map(r => r.month)
    expect(months).toContain(18)
    expect(months).toContain(19)
  })
})

describe('calculateRRSO', () => {
  it('returns 0 for zero principal', () => {
    const params = { ...baseParams, principal: 0 }
    expect(calculateRRSO(params, [])).toBe(0)
  })

  it('approximates the effective annual rate when no insurance', () => {
    const rrso = calculateRRSO(baseParams, [])
    expect(rrso).toBeGreaterThan(0.05)
    expect(rrso).toBeLessThan(0.08)
  })

  it('is higher when insurance is present', () => {
    const noIns = calculateRRSO(baseParams, [])
    const insurance = { id: '1', name: 'Test', amount: 200, isTemporary: false }
    const withIns = calculateRRSO(baseParams, [insurance])
    expect(withIns).toBeGreaterThan(noIns)
  })
})

describe('overpayment target mode', () => {
  // No insurance, so the full installment equals principalPart + interest.
  const targetParams: MortgageParams = {
    principal: 500000,
    annualRate: 7.5,
    termMonths: 360,
    startDate: '2026-01',
    overpayment: 0,
    overpaymentMode: 'target',
    overpaymentTarget: 10000,
    loanType: 'annuity',
    shortenTerm: false,
  }

  it('tops the installment up to the target in month 1', () => {
    const rows = calculateSchedule(targetParams, [])
    const first = rows[0]
    const installment = first.principalPart + first.interestPart
    expect(first.overpayment).toBeCloseTo(10000 - installment, 2)
    // full monthly payment reaches the target
    expect(first.principalPart + first.interestPart + first.overpayment).toBeCloseTo(10000, 2)
  })

  it('increases the overpayment as the base installment shrinks', () => {
    const rows = calculateSchedule(targetParams, [])
    // installment (principal+interest) decreases over time in reduce-installment mode,
    // so overpayment must grow to keep the total at the target
    expect(rows[12].overpayment).toBeGreaterThan(rows[0].overpayment)
  })

  it('includes insurance in the target basis', () => {
    const rows = calculateSchedule(targetParams, [
      { id: 'a', name: 'x', amount: 500, isTemporary: false },
    ])
    const first = rows[0]
    const total = first.principalPart + first.interestPart + first.insuranceTotal + first.overpayment
    expect(total).toBeCloseTo(10000, 2)
  })

  it('applies no overpayment when the target is below the installment', () => {
    const rows = calculateSchedule({ ...targetParams, overpaymentTarget: 100 }, [])
    expect(rows[0].overpayment).toBe(0)
  })

  it('does not overpay beyond the remaining principal near payoff', () => {
    const rows = calculateSchedule({ ...targetParams, overpaymentTarget: 1_000_000 }, [])
    const last = rows[rows.length - 1]
    expect(last.remainingPrincipal).toBeCloseTo(0, 2)
    // schedule ends well before the full term because of the large overpayment
    expect(rows.length).toBeLessThan(360)
  })

  it('leaves RRSO unaffected by target-mode overpayment', () => {
    const withTarget = calculateRRSO(targetParams, [])
    const noOverpay = calculateRRSO(
      { ...targetParams, overpaymentMode: 'fixed', overpaymentTarget: 0, overpayment: 0 },
      [],
    )
    expect(withTarget).toBeCloseTo(noOverpay, 6)
  })
})
