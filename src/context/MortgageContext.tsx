import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { Insurance, MortgageParams, Scenario, ScheduleRow } from '../types'
import { calculateRRSO, calculateSchedule } from '../lib/mortgageCalculator'
import { getScenarios } from '../services/storageService'

interface State {
  params: MortgageParams
  insurances: Insurance[]
  scenarios: Scenario[]
}

export type Action =
  | { type: 'SET_PARAMS'; payload: MortgageParams }
  | { type: 'SET_INSURANCES'; payload: Insurance[] }
  | { type: 'LOAD_SCENARIOS'; payload: Scenario[] }
  | { type: 'LOAD_SCENARIO'; payload: { params: MortgageParams; insurances: Insurance[] } }

const defaultParams: MortgageParams = {
  principal: 500000,
  annualRate: 7.5,
  termMonths: 360,
  startDate: new Date().toISOString().slice(0, 7),
  overpayment: 0,
}

const initialState: State = {
  params: defaultParams,
  insurances: [],
  scenarios: [],
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_PARAMS':
      return { ...state, params: action.payload }
    case 'SET_INSURANCES':
      return { ...state, insurances: action.payload }
    case 'LOAD_SCENARIOS':
      return { ...state, scenarios: action.payload }
    case 'LOAD_SCENARIO':
      return { ...state, params: action.payload.params, insurances: action.payload.insurances }
    default:
      return state
  }
}

interface ContextValue {
  state: State
  dispatch: React.Dispatch<Action>
  schedule: ScheduleRow[]
  rrso: number
}

const MortgageContext = createContext<ContextValue | null>(null)

export const MortgageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const schedule = useMemo(
    () => calculateSchedule(state.params, state.insurances),
    [state.params, state.insurances],
  )

  const rrso = useMemo(
    () => calculateRRSO(state.params, state.insurances),
    [state.params, state.insurances],
  )

  useEffect(() => {
    getScenarios().then(scenarios => {
      if (scenarios.length === 0) return
      dispatch({ type: 'LOAD_SCENARIOS', payload: scenarios })
      const latest = [...scenarios].sort(
        (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
      )[0]
      dispatch({ type: 'LOAD_SCENARIO', payload: { params: latest.params, insurances: latest.insurances } })
    })
  }, [])

  return (
    <MortgageContext.Provider value={{ state, dispatch, schedule, rrso }}>
      {children}
    </MortgageContext.Provider>
  )
}

export const useMortgage = (): ContextValue => {
  const ctx = useContext(MortgageContext)
  if (!ctx) throw new Error('useMortgage must be used within MortgageProvider')
  return ctx
}
