import type { Scenario } from '../types'

const STORAGE_KEY = 'mortgage_scenarios'
const DELAY_MS = 300

const delay = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, DELAY_MS))

const readRaw = (): Scenario[] => {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw) as Scenario[]) : []
}

export const getScenarios = async (): Promise<Scenario[]> => {
  await delay()
  return readRaw()
}

export const saveScenario = async (scenario: Scenario): Promise<void> => {
  await delay()
  const existing = readRaw()
  const updated = [...existing.filter(s => s.id !== scenario.id), scenario]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export const deleteScenario = async (id: string): Promise<void> => {
  await delay()
  const existing = readRaw()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.filter(s => s.id !== id)))
}
