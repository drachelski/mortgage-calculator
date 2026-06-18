import { describe, expect, it } from 'vitest'
import { parseCsvContent } from '../hooks/useCsvIO'

const sampleCsv = `# PARAMETERS
principal,annualRate,termMonths,startDate,overpayment
500000,7.5,360,2024-01,0

# INSURANCES
name,amount,isTemporary,endDate
"Ubezpieczenie",150,false,

# IRREGULAR_OVERPAYMENTS
amount,type,startDate
5000,once,2025-03
1000,annual,2024-06

# SCHEDULE
month,date,remainingPrincipal,totalPayment,principalPart,interestPart,insuranceTotal,overpayment
1,2024-01,498500,3500,1500,2000,150,0`

const legacyCsv = `# PARAMETERS
principal,annualRate,termMonths,startDate,overpayment
300000,6,240,2023-01,0

# INSURANCES
name,amount,isTemporary,endDate
"OC",100,false,

# SCHEDULE
month,date,remainingPrincipal,totalPayment,principalPart,interestPart,insuranceTotal,overpayment
1,2023-01,298750,2250,1250,1500,100,0`

describe('parseCsvContent', () => {
  it('extracts principal from PARAMETERS section', () => {
    const result = parseCsvContent(sampleCsv)
    expect(result.params.principal).toBe(500000)
  })

  it('extracts annualRate from PARAMETERS section', () => {
    const result = parseCsvContent(sampleCsv)
    expect(result.params.annualRate).toBe(7.5)
  })

  it('extracts termMonths from PARAMETERS section', () => {
    const result = parseCsvContent(sampleCsv)
    expect(result.params.termMonths).toBe(360)
  })

  it('extracts insurances from INSURANCES section', () => {
    const result = parseCsvContent(sampleCsv)
    expect(result.insurances).toHaveLength(1)
    expect(result.insurances[0].name).toBe('Ubezpieczenie')
    expect(result.insurances[0].amount).toBe(150)
    expect(result.insurances[0].isTemporary).toBe(false)
  })

  it('extracts irregular overpayments from IRREGULAR_OVERPAYMENTS section', () => {
    const result = parseCsvContent(sampleCsv)
    expect(result.irregularOverpayments).toHaveLength(2)
    expect(result.irregularOverpayments[0].amount).toBe(5000)
    expect(result.irregularOverpayments[0].type).toBe('once')
    expect(result.irregularOverpayments[0].startDate).toBe('2025-03')
    expect(result.irregularOverpayments[1].type).toBe('annual')
  })

  it('returns empty irregularOverpayments for legacy CSV without the section', () => {
    const result = parseCsvContent(legacyCsv)
    expect(result.irregularOverpayments).toEqual([])
  })

  it('throws on malformed content', () => {
    expect(() => parseCsvContent('garbage')).toThrow()
  })
})
