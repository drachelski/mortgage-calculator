# Mortgage Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React/TypeScript/MUI mortgage calculator SPA with amortization schedules, insurance support, overpayment simulation, scenario persistence, and CSV export/import — deployable to GitHub Pages.

**Architecture:** Global state via `MortgageContext` (useReducer), schedule computed in `useMemo` by `mortgageCalculator.ts`. Storage layer is fully async (300ms simulated delay). UI is MUI v5 with light/dark theme and PL/EN i18n.

**Tech Stack:** React 18, Vite, TypeScript, MUI v5, @mui/x-date-pickers, date-fns, react-i18next, papaparse, vitest, @testing-library/react, gh-pages

---

## File Map

| File | Responsibility |
|---|---|
| `src/types/index.ts` | All shared TypeScript interfaces |
| `src/theme/theme.ts` | MUI theme factory (light/dark) |
| `src/i18n/index.ts` | i18next configuration |
| `src/i18n/locales/pl.json` | Polish translations |
| `src/i18n/locales/en.json` | English translations |
| `src/services/storageService.ts` | Async LocalStorage CRUD for scenarios |
| `src/lib/mortgageCalculator.ts` | Pure annuity math, schedule generation, condensed view filter |
| `src/context/MortgageContext.tsx` | Context + useReducer + useMemo schedule |
| `src/components/layout/AppLayout.tsx` | AppBar + two-panel layout |
| `src/components/layout/ThemeToggle.tsx` | Light/dark icon button |
| `src/components/layout/LanguageToggle.tsx` | PL/EN toggle button |
| `src/components/form/InsuranceRow.tsx` | Single insurance row (name, amount, temp checkbox, end date) |
| `src/components/form/MortgageForm.tsx` | Full left-panel form |
| `src/components/schedule/ScheduleTable.tsx` | MUI Table with full/condensed rows |
| `src/components/schedule/ScheduleToggle.tsx` | Full/Condensed toggle button group |
| `src/components/scenarios/ScenarioSaveDialog.tsx` | Save scenario MUI Dialog |
| `src/components/scenarios/ScenarioList.tsx` | List of saved scenarios (load/delete) |
| `src/hooks/useCsvIO.ts` | CSV export/import via papaparse |
| `src/App.tsx` | Root: ThemeProvider + MortgageProvider + AppLayout |
| `src/__tests__/storageService.test.ts` | Storage service tests |
| `src/__tests__/mortgageCalculator.test.ts` | Calculator unit tests |
| `src/__tests__/MortgageContext.test.tsx` | Context reducer tests |
| `src/__tests__/useCsvIO.test.ts` | CSV parsing tests |
| `vite.config.ts` | Vite + vitest config, base = '/mortgage-calculator/' |
| `README.md` | Setup + deploy instructions |

---

## Task 1: Project scaffolding and configuration

**Files:**
- Create: `vite.config.ts`
- Modify: `package.json`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Scaffold Vite project**

Run inside `/Users/dawid.rachelski/PRIVATE/drachelski/mortgage-calculator`:
```bash
npm create vite@latest . -- --template react-ts
```
Answer "y" when asked to proceed in existing directory.

- [ ] **Step 2: Install all dependencies**

```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled \
  @mui/x-date-pickers date-fns \
  react-i18next i18next \
  papaparse

npm install --save-dev \
  vitest @vitest/ui \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  jsdom \
  @types/papaparse \
  gh-pages
```

- [ ] **Step 3: Replace `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/mortgage-calculator/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 4: Update `package.json`**

Add `"homepage"` field and update `"scripts"` (keep existing dev/build/preview, add the rest):
```json
{
  "homepage": "https://drachelski.github.io/mortgage-calculator/",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

- [ ] **Step 5: Add `"types"` to `tsconfig.app.json`**

In `compilerOptions` add:
```json
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

- [ ] **Step 6: Create test setup file**

`src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Remove Vite boilerplate**

Delete `src/App.css`, `src/assets/react.svg`, `public/vite.svg`.
Replace `src/index.css` with empty file (MUI CssBaseline handles reset).

- [ ] **Step 8: Verify tests run**

```bash
npm run test:run
```
Expected: "No test files found" (0 failures).

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Vite project with MUI, i18n, vitest, gh-pages"
```

---

## Task 2: TypeScript types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create types**

`src/types/index.ts`:
```typescript
export interface MortgageParams {
  principal: number
  annualRate: number
  termMonths: number
  startDate: string    // YYYY-MM
  overpayment: number
}

export interface Insurance {
  id: string
  name: string
  amount: number
  isTemporary: boolean
  endDate?: string     // YYYY-MM, only when isTemporary = true
}

export interface ScheduleRow {
  month: number
  date: string         // YYYY-MM
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
  savedAt: string      // ISO datetime string
  params: MortgageParams
  insurances: Insurance[]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add shared TypeScript interfaces"
```

---

## Task 3: Theme

**Files:**
- Create: `src/theme/theme.ts`

- [ ] **Step 1: Create theme factory**

`src/theme/theme.ts`:
```typescript
import { createTheme, Theme } from '@mui/material/styles'

export const getTheme = (mode: 'light' | 'dark'): Theme =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#546e7a' : '#78909c',
      },
      success: {
        main: mode === 'light' ? '#66bb6a' : '#81c784',
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
    },
    shape: {
      borderRadius: 8,
    },
  })
```

- [ ] **Step 2: Commit**

```bash
git add src/theme/theme.ts
git commit -m "feat: add MUI light/dark theme with muted palette"
```

---

## Task 4: i18n setup

**Files:**
- Create: `src/i18n/index.ts`
- Create: `src/i18n/locales/pl.json`
- Create: `src/i18n/locales/en.json`

- [ ] **Step 1: Create Polish translations**

`src/i18n/locales/pl.json`:
```json
{
  "app": { "title": "Kalkulator Hipoteczny" },
  "form": {
    "title": "Parametry kredytu",
    "principal": "Kwota kapitału (PLN)",
    "annualRate": "Oprocentowanie roczne (%)",
    "termMonths": "Okres kredytowania (miesiące)",
    "startDate": "Data uruchomienia kredytu",
    "overpayment": "Stała nadpłata miesięczna (PLN)",
    "insurances": "Ubezpieczenia",
    "addInsurance": "Dodaj ubezpieczenie",
    "saveScenario": "Zapisz scenariusz",
    "loadScenarios": "Wczytaj scenariusz",
    "exportCsv": "Eksportuj CSV",
    "importCsv": "Importuj CSV",
    "calculate": "Oblicz"
  },
  "insurance": {
    "name": "Nazwa ubezpieczenia",
    "amount": "Kwota (PLN/mies.)",
    "temporary": "Ubezpieczenie czasowe",
    "endDate": "Data zakończenia",
    "remove": "Usuń"
  },
  "schedule": {
    "title": "Harmonogram spłat",
    "full": "Pełny",
    "condensed": "Skrócony",
    "month": "Miesiąc",
    "date": "Data",
    "remainingPrincipal": "Pozostały kapitał",
    "totalPayment": "Całkowita rata",
    "principalPart": "Część kapitałowa",
    "interestPart": "Część odsetkowa",
    "noData": "Uzupełnij parametry, aby zobaczyć harmonogram."
  },
  "scenarios": {
    "title": "Scenariusze",
    "dialogTitle": "Zapisz scenariusz",
    "nameLabel": "Nazwa scenariusza",
    "save": "Zapisz",
    "cancel": "Anuluj",
    "load": "Wczytaj",
    "delete": "Usuń",
    "empty": "Brak zapisanych scenariuszy",
    "savedAt": "Zapisano"
  },
  "snackbar": {
    "scenarioSaved": "Scenariusz zapisany",
    "scenarioLoaded": "Scenariusz wczytany",
    "scenarioDeleted": "Scenariusz usunięty",
    "exportSuccess": "Eksport zakończony pomyślnie",
    "importSuccess": "Import zakończony pomyślnie",
    "importError": "Błąd podczas importu pliku CSV"
  }
}
```

- [ ] **Step 2: Create English translations**

`src/i18n/locales/en.json`:
```json
{
  "app": { "title": "Mortgage Calculator" },
  "form": {
    "title": "Loan Parameters",
    "principal": "Principal Amount (PLN)",
    "annualRate": "Annual Interest Rate (%)",
    "termMonths": "Loan Term (months)",
    "startDate": "Loan Start Date",
    "overpayment": "Fixed Monthly Overpayment (PLN)",
    "insurances": "Insurances",
    "addInsurance": "Add Insurance",
    "saveScenario": "Save Scenario",
    "loadScenarios": "Load Scenario",
    "exportCsv": "Export CSV",
    "importCsv": "Import CSV",
    "calculate": "Calculate"
  },
  "insurance": {
    "name": "Insurance Name",
    "amount": "Amount (PLN/mo.)",
    "temporary": "Temporary Insurance",
    "endDate": "End Date",
    "remove": "Remove"
  },
  "schedule": {
    "title": "Payment Schedule",
    "full": "Full",
    "condensed": "Condensed",
    "month": "Month",
    "date": "Date",
    "remainingPrincipal": "Remaining Principal",
    "totalPayment": "Total Payment",
    "principalPart": "Principal Part",
    "interestPart": "Interest Part",
    "noData": "Fill in parameters to see the schedule."
  },
  "scenarios": {
    "title": "Scenarios",
    "dialogTitle": "Save Scenario",
    "nameLabel": "Scenario Name",
    "save": "Save",
    "cancel": "Cancel",
    "load": "Load",
    "delete": "Delete",
    "empty": "No saved scenarios",
    "savedAt": "Saved"
  },
  "snackbar": {
    "scenarioSaved": "Scenario saved",
    "scenarioLoaded": "Scenario loaded",
    "scenarioDeleted": "Scenario deleted",
    "exportSuccess": "Export completed successfully",
    "importSuccess": "Import completed successfully",
    "importError": "Error importing CSV file"
  }
}
```

- [ ] **Step 3: Create i18n configuration**

`src/i18n/index.ts`:
```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import pl from './locales/pl.json'
import en from './locales/en.json'

i18n.use(initReactI18next).init({
  resources: {
    pl: { translation: pl },
    en: { translation: en },
  },
  lng: localStorage.getItem('language') ?? 'pl',
  fallbackLng: 'pl',
  interpolation: { escapeValue: false },
})

export default i18n
```

- [ ] **Step 4: Commit**

```bash
git add src/i18n/
git commit -m "feat: add react-i18next with PL/EN translations"
```

---

## Task 5: Storage service (TDD)

**Files:**
- Create: `src/services/storageService.ts`
- Create: `src/__tests__/storageService.test.ts`

- [ ] **Step 1: Write failing tests**

`src/__tests__/storageService.test.ts`:
```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveScenario, getScenarios, deleteScenario } from '../services/storageService'
import { Scenario } from '../types'

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
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm run test:run -- src/__tests__/storageService.test.ts
```
Expected: FAIL — "Cannot find module '../services/storageService'"

- [ ] **Step 3: Implement storageService**

`src/services/storageService.ts`:
```typescript
import { Scenario } from '../types'

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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/__tests__/storageService.test.ts
```
Expected: PASS — all 4 tests green

- [ ] **Step 5: Commit**

```bash
git add src/services/storageService.ts src/__tests__/storageService.test.ts
git commit -m "feat: add async storage service with 300ms simulated delay"
```

---

## Task 6: Financial calculator (TDD)

**Files:**
- Create: `src/lib/mortgageCalculator.ts`
- Create: `src/__tests__/mortgageCalculator.test.ts`

- [ ] **Step 1: Write failing tests**

`src/__tests__/mortgageCalculator.test.ts`:
```typescript
import { describe, expect, it } from 'vitest'
import { calculateSchedule, getCondensedSchedule } from '../lib/mortgageCalculator'
import { MortgageParams } from '../types'

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
      id: '1', name: 'Test', amount: 100,
      isTemporary: true, endDate: '2024-03',
    }
    const rows = calculateSchedule(baseParams, [insurance])
    expect(rows[0].insuranceTotal).toBe(100)  // 2024-01
    expect(rows[2].insuranceTotal).toBe(100)  // 2024-03
    expect(rows[3].insuranceTotal).toBe(0)    // 2024-04 — expired
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
    // rows 1-10 always present
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
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm run test:run -- src/__tests__/mortgageCalculator.test.ts
```
Expected: FAIL — "Cannot find module '../lib/mortgageCalculator'"

- [ ] **Step 3: Implement mortgageCalculator**

`src/lib/mortgageCalculator.ts`:
```typescript
import { Insurance, MortgageParams, ScheduleRow } from '../types'

const toMonthString = (year: number, month: number): string =>
  `${year}-${String(month).padStart(2, '0')}`

const addMonths = (startDate: string, offset: number): string => {
  const [y, m] = startDate.split('-').map(Number)
  const d = new Date(y, m - 1 + offset)
  return toMonthString(d.getFullYear(), d.getMonth() + 1)
}

const getInsuranceTotal = (insurances: Insurance[], currentDate: string): number =>
  insurances.reduce((sum, ins) => {
    if (!ins.isTemporary) return sum + ins.amount
    if (!ins.endDate) return sum + ins.amount
    return currentDate <= ins.endDate ? sum + ins.amount : sum
  }, 0)

export const calculateSchedule = (
  params: MortgageParams,
  insurances: Insurance[],
): ScheduleRow[] => {
  const { principal, annualRate, termMonths, startDate, overpayment } = params
  const r = annualRate / 12 / 100

  const basePayment =
    r === 0
      ? principal / termMonths
      : (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1)

  const rows: ScheduleRow[] = []
  let remaining = principal

  for (let month = 1; month <= termMonths && remaining > 0.005; month++) {
    const interest = remaining * r
    const rawPrincipalPart = basePayment - interest
    const principalPart = Math.min(rawPrincipalPart, remaining)

    const date = addMonths(startDate, month - 1)
    const insuranceTotal = getInsuranceTotal(insurances, date)

    const remainingAfterInstallment = remaining - principalPart
    const actualOverpayment = Math.min(overpayment, Math.max(0, remainingAfterInstallment))
    const newRemaining = Math.max(0, remainingAfterInstallment - actualOverpayment)

    rows.push({
      month,
      date,
      remainingPrincipal: newRemaining,
      totalPayment: principalPart + interest + insuranceTotal + actualOverpayment,
      principalPart,
      interestPart: interest,
      insuranceTotal,
      overpayment: actualOverpayment,
    })

    remaining = newRemaining
  }

  return rows
}

export const getCondensedSchedule = (rows: ScheduleRow[]): ScheduleRow[] =>
  rows.filter(row => row.month <= 10 || (row.month - 1) % 12 === 0)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/__tests__/mortgageCalculator.test.ts
```
Expected: PASS — all 10 tests green

- [ ] **Step 5: Commit**

```bash
git add src/lib/mortgageCalculator.ts src/__tests__/mortgageCalculator.test.ts
git commit -m "feat: add annuity mortgage calculator with overpayment and insurance support"
```

---

## Task 7: MortgageContext (TDD)

**Files:**
- Create: `src/context/MortgageContext.tsx`
- Create: `src/__tests__/MortgageContext.test.tsx`

- [ ] **Step 1: Write failing tests**

`src/__tests__/MortgageContext.test.tsx`:
```typescript
import { describe, expect, it } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import React from 'react'
import { MortgageProvider, useMortgage } from '../context/MortgageContext'
import { MortgageParams } from '../types'

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
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm run test:run -- src/__tests__/MortgageContext.test.tsx
```
Expected: FAIL — "Cannot find module '../context/MortgageContext'"

- [ ] **Step 3: Implement MortgageContext**

`src/context/MortgageContext.tsx`:
```typescript
import React, { createContext, useContext, useMemo, useReducer } from 'react'
import { Insurance, MortgageParams, Scenario, ScheduleRow } from '../types'
import { calculateSchedule } from '../lib/mortgageCalculator'

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
}

const MortgageContext = createContext<ContextValue | null>(null)

export const MortgageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const schedule = useMemo(
    () => calculateSchedule(state.params, state.insurances),
    [state.params, state.insurances],
  )

  return (
    <MortgageContext.Provider value={{ state, dispatch, schedule }}>
      {children}
    </MortgageContext.Provider>
  )
}

export const useMortgage = (): ContextValue => {
  const ctx = useContext(MortgageContext)
  if (!ctx) throw new Error('useMortgage must be used within MortgageProvider')
  return ctx
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/__tests__/MortgageContext.test.tsx
```
Expected: PASS — all 4 tests green

- [ ] **Step 5: Commit**

```bash
git add src/context/MortgageContext.tsx src/__tests__/MortgageContext.test.tsx
git commit -m "feat: add MortgageContext with useReducer and useMemo schedule"
```

---

## Task 8: Layout components

**Files:**
- Create: `src/components/layout/ThemeToggle.tsx`
- Create: `src/components/layout/LanguageToggle.tsx`
- Create: `src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Create ThemeToggle**

`src/components/layout/ThemeToggle.tsx`:
```typescript
import React from 'react'
import { IconButton, Tooltip } from '@mui/material'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import { useTranslation } from 'react-i18next'

interface Props {
  mode: 'light' | 'dark'
  onToggle: () => void
}

export const ThemeToggle: React.FC<Props> = ({ mode, onToggle }) => {
  const { t } = useTranslation()
  return (
    <Tooltip title={mode === 'light' ? t('theme.dark') : t('theme.light')}>
      <IconButton color="inherit" onClick={onToggle} aria-label="toggle theme">
        {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  )
}
```

Add missing keys to translation files. In `pl.json` add inside root:
```json
"theme": { "light": "Jasny motyw", "dark": "Ciemny motyw" }
```
In `en.json` add:
```json
"theme": { "light": "Light theme", "dark": "Dark theme" }
```

- [ ] **Step 2: Create LanguageToggle**

`src/components/layout/LanguageToggle.tsx`:
```typescript
import React from 'react'
import { Button } from '@mui/material'
import { useTranslation } from 'react-i18next'

export const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation()
  const isPolish = i18n.language === 'pl'

  const toggle = () => {
    const next = isPolish ? 'en' : 'pl'
    i18n.changeLanguage(next)
    localStorage.setItem('language', next)
  }

  return (
    <Button color="inherit" onClick={toggle} size="small" sx={{ minWidth: 48 }}>
      {isPolish ? 'EN' : 'PL'}
    </Button>
  )
}
```

- [ ] **Step 3: Create AppLayout**

`src/components/layout/AppLayout.tsx`:
```typescript
import React from 'react'
import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ThemeToggle } from './ThemeToggle'
import { LanguageToggle } from './LanguageToggle'
import { MortgageForm } from '../form/MortgageForm'
import { ScheduleTable } from '../schedule/ScheduleTable'

interface Props {
  mode: 'light' | 'dark'
  onToggleTheme: () => void
}

export const AppLayout: React.FC<Props> = ({ mode, onToggleTheme }) => {
  const { t } = useTranslation()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {t('app.title')}
          </Typography>
          <LanguageToggle />
          <ThemeToggle mode={mode} onToggle={onToggleTheme} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '420px 1fr' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          <MortgageForm />
          <ScheduleTable />
        </Box>
      </Container>
    </Box>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add AppLayout with AppBar, ThemeToggle, LanguageToggle"
```

---

## Task 9: Form components

**Files:**
- Create: `src/components/form/InsuranceRow.tsx`
- Create: `src/components/form/MortgageForm.tsx`

- [ ] **Step 1: Create InsuranceRow**

`src/components/form/InsuranceRow.tsx`:
```typescript
import React from 'react'
import { Box, Checkbox, FormControlLabel, IconButton, TextField } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { useTranslation } from 'react-i18next'
import { Insurance } from '../../types'

interface Props {
  insurance: Insurance
  onChange: (updated: Insurance) => void
  onRemove: () => void
}

export const InsuranceRow: React.FC<Props> = ({ insurance, onChange, onRemove }) => {
  const { t } = useTranslation()

  const endDateValue = insurance.endDate
    ? new Date(insurance.endDate + '-01')
    : null

  const handleEndDateChange = (date: Date | null) => {
    if (!date) return
    const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    onChange({ ...insurance, endDate: formatted })
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
      <TextField
        label={t('insurance.name')}
        value={insurance.name}
        onChange={e => onChange({ ...insurance, name: e.target.value })}
        size="small"
        sx={{ flex: '1 1 140px' }}
      />
      <TextField
        label={t('insurance.amount')}
        type="number"
        value={insurance.amount}
        onChange={e => onChange({ ...insurance, amount: Number(e.target.value) })}
        size="small"
        inputProps={{ min: 0, step: 1 }}
        sx={{ width: 120 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={insurance.isTemporary}
            onChange={e =>
              onChange({ ...insurance, isTemporary: e.target.checked, endDate: undefined })
            }
            size="small"
          />
        }
        label={t('insurance.temporary')}
        sx={{ m: 0 }}
      />
      {insurance.isTemporary && (
        <DatePicker
          label={t('insurance.endDate')}
          views={['year', 'month']}
          value={endDateValue}
          onChange={handleEndDateChange}
          slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
        />
      )}
      <IconButton
        aria-label={t('insurance.remove')}
        onClick={onRemove}
        color="error"
        size="small"
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  )
}
```

- [ ] **Step 2: Create MortgageForm**

`src/components/form/MortgageForm.tsx`:
```typescript
import React, { useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SaveIcon from '@mui/icons-material/Save'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import { useMortgage } from '../../context/MortgageContext'
import { InsuranceRow } from './InsuranceRow'
import { ScenarioSaveDialog } from '../scenarios/ScenarioSaveDialog'
import { ScenarioList } from '../scenarios/ScenarioList'
import { useCsvIO } from '../../hooks/useCsvIO'
import { Insurance } from '../../types'

export const MortgageForm: React.FC = () => {
  const { t } = useTranslation()
  const { state, dispatch, schedule } = useMortgage()
  const { params, insurances } = state
  const { exportCsv, importCsv } = useCsvIO()

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [scenarioListOpen, setScenarioListOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const setParam = <K extends keyof typeof params>(key: K, value: typeof params[K]) =>
    dispatch({ type: 'SET_PARAMS', payload: { ...params, [key]: value } })

  const setInsurances = (updated: Insurance[]) =>
    dispatch({ type: 'SET_INSURANCES', payload: updated })

  const addInsurance = () =>
    setInsurances([
      ...insurances,
      { id: uuidv4(), name: '', amount: 0, isTemporary: false },
    ])

  const updateInsurance = (index: number, updated: Insurance) => {
    const next = [...insurances]
    next[index] = updated
    setInsurances(next)
  }

  const removeInsurance = (index: number) =>
    setInsurances(insurances.filter((_, i) => i !== index))

  const handleExport = () => {
    exportCsv({ params, insurances, schedule })
    showSnackbar(t('snackbar.exportSuccess'), 'success')
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await importCsv(file)
      dispatch({ type: 'LOAD_SCENARIO', payload: result })
      showSnackbar(t('snackbar.importSuccess'), 'success')
    } catch {
      showSnackbar(t('snackbar.importError'), 'error')
    }
    e.target.value = ''
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity })

  const startDateValue = params.startDate ? new Date(params.startDate + '-01') : null

  return (
    <Paper sx={{ p: 2 }} elevation={2}>
      <Typography variant="h6" gutterBottom>
        {t('form.title')}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label={t('form.principal')}
          type="number"
          value={params.principal}
          onChange={e => setParam('principal', Number(e.target.value))}
          inputProps={{ min: 0, step: 1000 }}
          fullWidth
        />
        <TextField
          label={t('form.annualRate')}
          type="number"
          value={params.annualRate}
          onChange={e => setParam('annualRate', Number(e.target.value))}
          inputProps={{ min: 0, max: 100, step: 0.01 }}
          fullWidth
        />
        <TextField
          label={t('form.termMonths')}
          type="number"
          value={params.termMonths}
          onChange={e => setParam('termMonths', Number(e.target.value))}
          inputProps={{ min: 1, step: 1 }}
          fullWidth
        />
        <DatePicker
          label={t('form.startDate')}
          views={['year', 'month']}
          value={startDateValue}
          onChange={date => {
            if (!date) return
            const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            setParam('startDate', formatted)
          }}
          slotProps={{ textField: { fullWidth: true } }}
        />
        <TextField
          label={t('form.overpayment')}
          type="number"
          value={params.overpayment}
          onChange={e => setParam('overpayment', Number(e.target.value))}
          inputProps={{ min: 0, step: 100 }}
          fullWidth
        />

        <Divider />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2">{t('form.insurances')}</Typography>
          <Tooltip title={t('form.addInsurance')}>
            <IconButton onClick={addInsurance} color="primary" size="small">
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {insurances.map((ins, i) => (
          <InsuranceRow
            key={ins.id}
            insurance={ins}
            onChange={updated => updateInsurance(i, updated)}
            onRemove={() => removeInsurance(i)}
          />
        ))}

        <Divider />

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={() => setSaveDialogOpen(true)}
            size="small"
          >
            {t('form.saveScenario')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FolderOpenIcon />}
            onClick={() => setScenarioListOpen(true)}
            size="small"
          >
            {t('form.loadScenarios')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            size="small"
          >
            {t('form.exportCsv')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={handleImportClick}
            size="small"
          >
            {t('form.importCsv')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </Box>
      </Box>

      <ScenarioSaveDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSaved={msg => showSnackbar(msg, 'success')}
      />
      <ScenarioList
        open={scenarioListOpen}
        onClose={() => setScenarioListOpen(false)}
        onLoaded={msg => showSnackbar(msg, 'success')}
        onDeleted={msg => showSnackbar(msg, 'success')}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  )
}
```

Note: `uuid` package is needed. Install it:
```bash
npm install uuid && npm install --save-dev @types/uuid
```

- [ ] **Step 3: Commit**

```bash
git add src/components/form/
git commit -m "feat: add MortgageForm with InsuranceRow and DatePicker"
```

---

## Task 10: Schedule components

**Files:**
- Create: `src/components/schedule/ScheduleToggle.tsx`
- Create: `src/components/schedule/ScheduleTable.tsx`

- [ ] **Step 1: Create ScheduleToggle**

`src/components/schedule/ScheduleToggle.tsx`:
```typescript
import React from 'react'
import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useTranslation } from 'react-i18next'

interface Props {
  value: 'full' | 'condensed'
  onChange: (value: 'full' | 'condensed') => void
}

export const ScheduleToggle: React.FC<Props> = ({ value, onChange }) => {
  const { t } = useTranslation()
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, v) => { if (v) onChange(v) }}
      size="small"
    >
      <ToggleButton value="full">{t('schedule.full')}</ToggleButton>
      <ToggleButton value="condensed">{t('schedule.condensed')}</ToggleButton>
    </ToggleButtonGroup>
  )
}
```

- [ ] **Step 2: Create ScheduleTable**

`src/components/schedule/ScheduleTable.tsx`:
```typescript
import React, { useState } from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMortgage } from '../../context/MortgageContext'
import { getCondensedSchedule } from '../../lib/mortgageCalculator'
import { ScheduleToggle } from './ScheduleToggle'
import { ScheduleRow } from '../../types'

const fmt = (n: number): string =>
  n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const ScheduleTable: React.FC = () => {
  const { t } = useTranslation()
  const { schedule } = useMortgage()
  const [view, setView] = useState<'full' | 'condensed'>('condensed')

  const rows: ScheduleRow[] = view === 'full' ? schedule : getCondensedSchedule(schedule)

  if (schedule.length === 0) {
    return (
      <Paper sx={{ p: 3 }} elevation={2}>
        <Typography color="text.secondary">{t('schedule.noData')}</Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 2 }} elevation={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">{t('schedule.title')}</Typography>
        <ScheduleToggle value={view} onChange={setView} />
      </Box>

      <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('schedule.month')}</TableCell>
              <TableCell>{t('schedule.date')}</TableCell>
              <TableCell align="right">{t('schedule.remainingPrincipal')}</TableCell>
              <TableCell align="right">{t('schedule.totalPayment')}</TableCell>
              <TableCell align="right">{t('schedule.principalPart')}</TableCell>
              <TableCell align="right">{t('schedule.interestPart')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(row => (
              <TableRow key={row.month} hover>
                <TableCell>{row.month}</TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell align="right">{fmt(row.remainingPrincipal)}</TableCell>
                <TableCell align="right">{fmt(row.totalPayment)}</TableCell>
                <TableCell align="right">{fmt(row.principalPart)}</TableCell>
                <TableCell align="right">{fmt(row.interestPart)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/schedule/
git commit -m "feat: add ScheduleTable with full/condensed toggle"
```

---

## Task 11: Scenario management components

**Files:**
- Create: `src/components/scenarios/ScenarioSaveDialog.tsx`
- Create: `src/components/scenarios/ScenarioList.tsx`

- [ ] **Step 1: Create ScenarioSaveDialog**

`src/components/scenarios/ScenarioSaveDialog.tsx`:
```typescript
import React, { useState } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import { useMortgage } from '../../context/MortgageContext'
import { saveScenario } from '../../services/storageService'
import { Scenario } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (message: string) => void
}

export const ScenarioSaveDialog: React.FC<Props> = ({ open, onClose, onSaved }) => {
  const { t } = useTranslation()
  const { state } = useMortgage()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    const scenario: Scenario = {
      id: uuidv4(),
      name: name.trim(),
      savedAt: new Date().toISOString(),
      params: state.params,
      insurances: state.insurances,
    }
    await saveScenario(scenario)
    setSaving(false)
    setName('')
    onClose()
    onSaved(t('snackbar.scenarioSaved'))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('scenarios.dialogTitle')}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label={t('scenarios.nameLabel')}
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          margin="dense"
          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('scenarios.cancel')}</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!name.trim() || saving}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          {t('scenarios.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
```

- [ ] **Step 2: Create ScenarioList**

`src/components/scenarios/ScenarioList.tsx`:
```typescript
import React, { useEffect, useState } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useTranslation } from 'react-i18next'
import { useMortgage } from '../../context/MortgageContext'
import { deleteScenario, getScenarios } from '../../services/storageService'
import { Scenario } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onLoaded: (message: string) => void
  onDeleted: (message: string) => void
}

export const ScenarioList: React.FC<Props> = ({ open, onClose, onLoaded, onDeleted }) => {
  const { t } = useTranslation()
  const { dispatch } = useMortgage()
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getScenarios().then(data => {
      setScenarios(data)
      setLoading(false)
    })
  }, [open])

  const handleLoad = (scenario: Scenario) => {
    dispatch({ type: 'LOAD_SCENARIO', payload: { params: scenario.params, insurances: scenario.insurances } })
    onClose()
    onLoaded(t('snackbar.scenarioLoaded'))
  }

  const handleDelete = async (id: string) => {
    await deleteScenario(id)
    setScenarios(prev => prev.filter(s => s.id !== id))
    onDeleted(t('snackbar.scenarioDeleted'))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('scenarios.title')}</DialogTitle>
      <DialogContent>
        {loading && <CircularProgress />}
        {!loading && scenarios.length === 0 && (
          <Typography color="text.secondary">{t('scenarios.empty')}</Typography>
        )}
        <List dense>
          {scenarios.map(s => (
            <ListItem
              key={s.id}
              secondaryAction={
                <IconButton edge="end" onClick={() => handleDelete(s.id)} color="error" size="small">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemText
                primary={s.name}
                secondary={`${t('scenarios.savedAt')}: ${new Date(s.savedAt).toLocaleString()}`}
              />
              <Button size="small" onClick={() => handleLoad(s)} sx={{ mr: 1 }}>
                {t('scenarios.load')}
              </Button>
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/scenarios/
git commit -m "feat: add ScenarioSaveDialog and ScenarioList with async storage"
```

---

## Task 12: useCsvIO hook (TDD)

**Files:**
- Create: `src/hooks/useCsvIO.ts`
- Create: `src/__tests__/useCsvIO.test.ts`

- [ ] **Step 1: Write failing tests**

`src/__tests__/useCsvIO.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm run test:run -- src/__tests__/useCsvIO.test.ts
```
Expected: FAIL — "Cannot find module '../hooks/useCsvIO'"

- [ ] **Step 3: Implement useCsvIO**

`src/hooks/useCsvIO.ts`:
```typescript
import { useCallback } from 'react'
import Papa from 'papaparse'
import { Insurance, MortgageParams, ScheduleRow } from '../types'
import { v4 as uuidv4 } from 'uuid'

interface ExportData {
  params: MortgageParams
  insurances: Insurance[]
  schedule: ScheduleRow[]
}

interface ImportResult {
  params: MortgageParams
  insurances: Insurance[]
}

const splitSections = (content: string): Record<string, string> => {
  const sections: Record<string, string[]> = {}
  let current = ''
  for (const line of content.split('\n')) {
    if (line.startsWith('# ')) {
      current = line.slice(2).trim().toUpperCase()
      sections[current] = []
    } else if (current && line.trim()) {
      sections[current].push(line)
    }
  }
  return Object.fromEntries(
    Object.entries(sections).map(([k, v]) => [k, v.join('\n')])
  )
}

export const parseCsvContent = (content: string): ImportResult => {
  const sections = splitSections(content)

  if (!sections['PARAMETERS']) throw new Error('Missing PARAMETERS section')

  const paramsResult = Papa.parse<MortgageParams>(sections['PARAMETERS'], {
    header: true,
    dynamicTyping: true,
  })
  const params = paramsResult.data[0]
  if (!params?.principal) throw new Error('Invalid PARAMETERS data')

  const insurancesRaw = sections['INSURANCES']
    ? Papa.parse<Record<string, string>>(sections['INSURANCES'], {
        header: true,
        dynamicTyping: true,
      }).data
    : []

  const insurances: Insurance[] = insurancesRaw
    .filter(row => row.name)
    .map(row => ({
      id: uuidv4(),
      name: String(row.name ?? ''),
      amount: Number(row.amount ?? 0),
      isTemporary: String(row.isTemporary) === 'true',
      endDate: row.endDate ? String(row.endDate) : undefined,
    }))

  return { params, insurances }
}

export const useCsvIO = () => {
  const exportCsv = useCallback(({ params, insurances, schedule }: ExportData) => {
    const paramsSection = ['# PARAMETERS', Papa.unparse([params], { header: true })]
    const insSection = ['# INSURANCES', Papa.unparse(insurances.map(({ id: _id, ...rest }) => rest), { header: true })]
    const schedSection = ['# SCHEDULE', Papa.unparse(schedule, { header: true })]

    const content = [...paramsSection, '', ...insSection, '', ...schedSection].join('\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mortgage-${params.startDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const importCsv = useCallback((file: File): Promise<ImportResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        try {
          resolve(parseCsvContent(e.target?.result as string))
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

  return { exportCsv, importCsv }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- src/__tests__/useCsvIO.test.ts
```
Expected: PASS — all 5 tests green

- [ ] **Step 5: Run all tests**

```bash
npm run test:run
```
Expected: all tests green across all test files

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useCsvIO.ts src/__tests__/useCsvIO.test.ts
git commit -m "feat: add useCsvIO hook for CSV export/import with papaparse"
```

---

## Task 13: Wire App.tsx and LocalizationProvider

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Replace App.tsx**

`src/App.tsx`:
```typescript
import React, { useState } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { MortgageProvider } from './context/MortgageContext'
import { AppLayout } from './components/layout/AppLayout'
import { getTheme } from './theme/theme'
import './i18n'

const App: React.FC = () => {
  const [mode, setMode] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light',
  )

  const toggleTheme = () => {
    const next: 'light' | 'dark' = mode === 'light' ? 'dark' : 'light'
    setMode(next)
    localStorage.setItem('theme', next)
  }

  return (
    <ThemeProvider theme={getTheme(mode)}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <MortgageProvider>
          <AppLayout mode={mode} onToggleTheme={toggleTheme} />
        </MortgageProvider>
      </LocalizationProvider>
    </ThemeProvider>
  )
}

export default App
```

- [ ] **Step 2: Verify main.tsx is standard**

`src/main.tsx` should be:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 3: Build to check for TypeScript errors**

```bash
npm run build
```
Expected: no TypeScript errors, `dist/` folder created.
If any errors, fix them before committing.

- [ ] **Step 4: Start dev server and smoke test**

```bash
npm run dev
```
Open `http://localhost:5173/mortgage-calculator/` in browser. Verify:
- AppBar renders with title, language toggle (shows EN/PL), theme toggle
- Form shows all fields with default values
- Schedule table renders with data
- Toggling Full/Condensed changes row count
- Adding insurance row works
- Theme toggle switches light/dark

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: wire App.tsx with ThemeProvider, LocalizationProvider, MortgageProvider"
```

---

## Task 14: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

`README.md`:
```markdown
# Mortgage Calculator

A React/TypeScript/MUI web application for simulating mortgage parameters.
Live at: https://drachelski.github.io/mortgage-calculator/

## Features
- Annuity amortization schedule with overpayment support
- Multiple insurances (permanent or time-limited)
- Full/condensed schedule view
- Save/load named scenarios to LocalStorage
- CSV export and import
- Light/dark theme
- Polish/English language switch

## Local Development

Prerequisites: Node.js 18+

```bash
git clone https://github.com/drachelski/mortgage-calculator.git
cd mortgage-calculator
npm install
npm run dev
```

Open http://localhost:5173/mortgage-calculator/

## Tests

```bash
npm run test:run
```

## Link to GitHub and Deploy

```bash
# 1. Create a new repo on GitHub named "mortgage-calculator"
# 2. Link local project:
git remote add origin https://github.com/drachelski/mortgage-calculator.git
git branch -M main
git push -u origin main

# 3. Publish to GitHub Pages:
npm run deploy
```

After deploy, enable GitHub Pages in repo Settings → Pages → Source: `gh-pages` branch.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup, test, and deploy instructions"
```

---

## Self-Review Against Spec

**Spec coverage check:**
- [x] Vite + React + TypeScript + MUI → Task 1
- [x] Light/dark ThemeProvider → Tasks 3, 8, 13
- [x] Async storageService with 300ms delay → Task 5
- [x] Pure math in mortgageCalculator.ts → Task 6
- [x] MortgageContext (React Context + useReducer) → Task 7
- [x] Principal, rate, term, start date, overpayment fields → Task 9
- [x] Insurance rows with +/- buttons, isTemporary checkbox, endDate → Task 9
- [x] Overpayment shortens term → Task 6 (algorithm)
- [x] Full / Condensed schedule toggle → Task 10
- [x] Columns: date, remaining, total, principal part, interest part → Task 10
- [x] Save/load named scenarios → Task 11
- [x] CSV export with parameters + insurances header + full schedule → Task 12
- [x] CSV import restores form state → Task 12
- [x] base: '/mortgage-calculator/' in vite.config → Task 1
- [x] gh-pages scripts in package.json → Task 1
- [x] README with git init + deploy instructions → Task 14
- [x] PL/EN language toggle, default PL → Tasks 4, 8
- [x] Code and comments in English → all tasks
