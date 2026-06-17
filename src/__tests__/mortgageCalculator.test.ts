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

describe('calculateSchedule', () => {
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

  it('overpayment shortens the loan term', () => {
    const params = { ...baseParams, overpayment: 500 }
    const rows = calculateSchedule(params, [])
    expect(rows.length).toBeLessThan(120)
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
    expect(rows[0].insuranceTotal).toBe(100) // 2024-01
    expect(rows[2].insuranceTotal).toBe(100) // 2024-03
    expect(rows[3].insuranceTotal).toBe(0) // 2024-04 — expired
  })

  it('handles 0% interest rate without crashing', () => {
    const params = { ...baseParams, annualRate: 0 }
    const rows = calculateSchedule(params, [])
    expect(rows.length).toBe(120)
    expect(rows[0].interestPart).toBeCloseTo(0)
  })
})

describe('getCondensedSchedule', () => {
  it('returns first 10 rows plus first row of each subsequent year', () => {
    const rows = calculateSchedule(baseParams, [])
    const condensed = getCondensedSchedule(rows)
    expect(condensed[0].month).toBe(1)
    expect(condensed[9].month).toBe(10)
    // first row of year 2 = month 13
    expect(condensed[10].month).toBe(13)
    // first row of year 3 = month 25
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
    // baseParams starts 2024-01, so month 18 = 2025-06, month 19 = 2025-07
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
    expect(months).toContain(18) // last row with insurance
    expect(months).toContain(19) // first row without insurance
  })
})

describe('calculateRRSO', () => {
  it('returns 0 for zero principal', () => {
    const params = { ...baseParams, principal: 0 }
    expect(calculateRRSO(params, [])).toBe(0)
  })

  it('approximates the effective annual rate when no insurance', () => {
    const rrso = calculateRRSO(baseParams, [])
    // 6% nominal compounded monthly ≈ 6.17% effective annual
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
