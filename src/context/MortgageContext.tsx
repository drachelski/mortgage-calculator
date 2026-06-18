import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { Insurance, IrregularOverpayment, MortgageParams, Scenario, ScheduleRow } from '../types'
import { calculateRRSO, calculateSchedule } from '../lib/mortgageCalculator'
import { getScenarios } from '../services/storageService'

interface State {
  params: MortgageParams
  insurances: Insurance[]
  irregularOverpayments: IrregularOverpayment[]
  scenarios: Scenario[]
  currentScenarioId?: string
  currentScenarioName?: string
}

export type Action =
  | { type: 'SET_PARAMS'; payload: MortgageParams }
  | { type: 'SET_INSURANCES'; payload: Insurance[] }
  | { type: 'SET_IRREGULAR_OVERPAYMENTS'; payload: IrregularOverpayment[] }
  | { type: 'LOAD_SCENARIOS'; payload: Scenario[] }
  | { type: 'LOAD_SCENARIO'; payload: { params: MortgageParams; insurances: Insurance[]; irregularOverpayments?: IrregularOverpayment[]; id?: string; name?: string } }
  | { type: 'SET_CURRENT_SCENARIO'; payload: { id: string; name: string } | null }

const defaultParams: MortgageParams = {
  principal: 500000,
  annualRate: 7.5,
  termMonths: 360,
  startDate: new Date().toISOString().slice(0, 7),
  overpayment: 0,
  loanType: 'annuity',
  shortenTerm: false,
  shortenFrequency: 12,
}

const initialState: State = {
  params: defaultParams,
  insurances: [],
  irregularOverpayments: [],
  scenarios: [],
  currentScenarioId: undefined,
  currentScenarioName: undefined,
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_PARAMS':
      return { ...state, params: action.payload }
    case 'SET_INSURANCES':
      return { ...state, insurances: action.payload }
    case 'SET_IRREGULAR_OVERPAYMENTS':
      return { ...state, irregularOverpayments: action.payload }
    case 'LOAD_SCENARIOS':
      return { ...state, scenarios: action.payload }
    case 'LOAD_SCENARIO':
      return {
        ...state,
        params: action.payload.params,
        insurances: action.payload.insurances,
        irregularOverpayments: action.payload.irregularOverpayments ?? [],
        currentScenarioId: action.payload.id,
        currentScenarioName: action.payload.name,
      }
    case 'SET_CURRENT_SCENARIO':
      return {
        ...state,
        currentScenarioId: action.payload?.id,
        currentScenarioName: action.payload?.name,
      }
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
    () => calculateSchedule(state.params, state.insurances, state.irregularOverpayments),
    [state.params, state.insurances, state.irregularOverpayments],
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
      dispatch({
        type: 'LOAD_SCENARIO',
        payload: {
          params: latest.params,
          insurances: latest.insurances,
          irregularOverpayments: latest.irregularOverpayments ?? [],
          id: latest.id,
          name: latest.name,
        },
      })
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
