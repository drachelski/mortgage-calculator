import { describe, expect, it } from 'vitest'
import { parseCsvContent } from '../hooks/useCsvIO'

const sampleCsv = `# PARAMETERS
principal,annualRate,termMonths,startDate,overpayment
500000,7.5,360,2024-01,0

# INSURANCES
name,amount,isTemporary,endDate
"Ubezpieczenie",150,false,

# SCHEDULE
month,date,remainingPrincipal,totalPayment,principalPart,interestPart,insuranceTotal,overpayment
1,2024-01,498500,3500,1500,2000,150,0`

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

  it('throws on malformed content', () => {
    expect(() => parseCsvContent('garbage')).toThrow()
  })
})
