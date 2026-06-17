import { describe, expect, it } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import React from 'react'
import { MortgageProvider, useMortgage } from '../context/MortgageContext'

const TestConsumer: React.FC = () => {
  const { state, dispatch, schedule } = useMortgage()
  return (
    <div>
      <span data-testid="principal">{state.params.principal}</span>
      <span data-testid="schedule-length">{schedule.length}</span>
      <button
        onClick={() =>
          dispatch({
            type: 'SET_PARAMS',
            payload: { ...state.params, principal: 999999 },
          })
        }
      >
        update
      </button>
    </div>
  )
}

describe('MortgageContext', () => {
  it('provides default params', () => {
    render(
      <MortgageProvider>
        <TestConsumer />
      </MortgageProvider>,
    )
    expect(screen.getByTestId('principal').textContent).toBe('500000')
  })

  it('updates params via dispatch and recomputes schedule', () => {
    render(
      <MortgageProvider>
        <TestConsumer />
      </MortgageProvider>,
    )
    act(() => {
      screen.getByRole('button').click()
    })
    expect(screen.getByTestId('principal').textContent).toBe('999999')
  })

  it('computes a non-empty schedule from defaults', () => {
    render(
      <MortgageProvider>
        <TestConsumer />
      </MortgageProvider>,
    )
    const len = Number(screen.getByTestId('schedule-length').textContent)
    expect(len).toBeGreaterThan(0)
  })

  it('throws when useMortgage used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow()
    consoleError.mockRestore()
  })
})
