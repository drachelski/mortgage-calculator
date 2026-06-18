import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveScenario, getScenarios, deleteScenario } from '../services/storageService'
import type { Scenario } from '../types'

vi.useFakeTimers()

const makeScenario = (id: string, name: string): Scenario => ({
  id,
  name,
  savedAt: new Date().toISOString(),
  params: {
    principal: 500000,
    annualRate: 7.5,
    termMonths: 360,
    startDate: '2024-01',
    overpayment: 0,
  },
  insurances: [],
  irregularOverpayments: [],
})

beforeEach(() => {
  localStorage.clear()
})

describe('getScenarios', () => {
  it('returns empty array when nothing saved', async () => {
    const promise = getScenarios()
    vi.advanceTimersByTime(300)
    const result = await promise
    expect(result).toEqual([])
  })
})

describe('saveScenario', () => {
  it('saves a scenario and retrieves it', async () => {
    const scenario = makeScenario('1', 'Test')
    const savePromise = saveScenario(scenario)
    vi.advanceTimersByTime(300)
    await savePromise

    const getPromise = getScenarios()
    vi.advanceTimersByTime(300)
    const result = await getPromise

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Test')
  })

  it('replaces scenario with same id', async () => {
    const original = makeScenario('1', 'Original')
    const updated = makeScenario('1', 'Updated')

    let p = saveScenario(original)
    vi.advanceTimersByTime(300)
    await p

    p = saveScenario(updated)
    vi.advanceTimersByTime(300)
    await p

    const getPromise = getScenarios()
    vi.advanceTimersByTime(300)
    const result = await getPromise

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Updated')
  })
})

describe('deleteScenario', () => {
  it('removes scenario by id', async () => {
    const scenario = makeScenario('1', 'ToDelete')
    let p = saveScenario(scenario)
    vi.advanceTimersByTime(300)
    await p

    p = deleteScenario('1')
    vi.advanceTimersByTime(300)
    await p

    const getPromise = getScenarios()
    vi.advanceTimersByTime(300)
    const result = await getPromise

    expect(result).toHaveLength(0)
  })
})
