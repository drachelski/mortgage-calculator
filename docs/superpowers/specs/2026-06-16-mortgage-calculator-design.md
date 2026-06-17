# Mortgage Calculator — Design Spec

**Date:** 2026-06-16  
**Author:** drachelski  
**Status:** Approved

---

## Overview

A React/TypeScript/MUI web application for managing and simulating mortgage parameters. Hosted on GitHub Pages at `https://drachelski.github.io/mortgage-calculator/`.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Language | TypeScript |
| UI Library | Material-UI (MUI) v5 |
| State | React Context + useReducer |
| i18n | react-i18next (PL default, EN available) |
| Storage | LocalStorage via async service (300ms simulated delay) |
| CSV | papaparse |
| Date Picker | @mui/x-date-pickers + date-fns |
| Deploy | gh-pages |

**Code language:** English (code, comments, variable names). UI language: switchable PL/EN.

---

## Architecture

### Directory Structure

```
mortgage-calculator/
├── src/
│   ├── context/
│   │   └── MortgageContext.tsx       # Context + useReducer, global state
│   ├── services/
│   │   └── storageService.ts         # async LocalStorage (300ms delay)
│   ├── lib/
│   │   └── mortgageCalculator.ts     # pure financial math, no React deps
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── LanguageToggle.tsx
│   │   ├── form/
│   │   │   ├── MortgageForm.tsx
│   │   │   ├── InsuranceRow.tsx
│   │   │   └── OverpaymentField.tsx
│   │   ├── schedule/
│   │   │   ├── ScheduleTable.tsx
│   │   │   └── ScheduleToggle.tsx
│   │   └── scenarios/
│   │       ├── ScenarioSaveDialog.tsx
│   │       └── ScenarioList.tsx
│   ├── hooks/
│   │   └── useCsvIO.ts               # CSV export/import using papaparse
│   ├── i18n/
│   │   ├── index.ts                  # i18next configuration
│   │   └── locales/
│   │       ├── pl.json
│   │       └── en.json
│   ├── theme/
│   │   └── theme.ts                  # MUI light/dark palettes
│   ├── types/
│   │   └── index.ts                  # shared TypeScript interfaces
│   └── App.tsx
├── vite.config.ts                    # base: '/mortgage-calculator/'
├── package.json                      # homepage + predeploy/deploy scripts
└── README.md
```

### Data Flow

```
MortgageContext (state + dispatch)
  ├── MortgageForm     → dispatch({ type: 'SET_PARAMS' })
  ├── ScheduleTable    ← reads computed schedule from context (useMemo)
  ├── ScenarioSaveDialog → storageService.save() → dispatch('LOAD_SCENARIOS')
  └── useCsvIO         → CSV import → dispatch('SET_PARAMS') + dispatch('SET_INSURANCES')
```

The schedule is computed inside the context via `useMemo` calling `mortgageCalculator.ts`. Components never perform calculations directly.

---

## Data Types

```typescript
interface MortgageParams {
  principal: number;        // loan amount
  annualRate: number;       // annual interest rate %
  termMonths: number;       // term in months
  startDate: string;        // ISO YYYY-MM, loan start
  overpayment: number;      // fixed monthly overpayment
}

interface Insurance {
  id: string;
  name: string;
  amount: number;
  isTemporary: boolean;
  endDate?: string;         // YYYY-MM, only when isTemporary = true
}

interface ScheduleRow {
  month: number;
  date: string;             // YYYY-MM
  remainingPrincipal: number;
  totalPayment: number;     // installment + insurances + overpayment
  principalPart: number;
  interestPart: number;
  insuranceTotal: number;
  overpayment: number;
}

interface Scenario {
  id: string;
  name: string;
  savedAt: string;
  params: MortgageParams;
  insurances: Insurance[];
}
```

---

## Financial Logic (mortgageCalculator.ts)

### Base installment (annuity method)

```
r = annualRate / 12 / 100
M = principal × r × (1+r)^n / ((1+r)^n − 1)
```

### Monthly loop

For each month until `remainingPrincipal ≤ 0`:
1. `interest = remainingPrincipal × r`
2. `principalPart = M − interest`
3. `overpayment` reduces `remainingPrincipal` before next month → shortens term
4. Insurances: check `isTemporary` + `endDate` vs current month → add to `totalPayment`
5. Loop terminates when `remainingPrincipal ≤ 0`

**Overpayment strategy:** shorten term (default), not reduce installment.

---

## Components

### AppLayout
- MUI AppBar with app title, `ThemeToggle`, `LanguageToggle`
- Two-panel layout: left = form, right = schedule (or stacked on mobile)

### MortgageForm
- Fields: principal, annual rate %, term (months), start date, overpayment
- Insurance section: list of `InsuranceRow` components, MUI IconButton "+" to add rows
- Buttons: Save Scenario, Load Scenarios, Export CSV, Import CSV

### InsuranceRow
- TextField: name
- TextField: amount
- Checkbox: isTemporary → reveals DatePicker (month/year) for endDate
- IconButton: remove row

### ScheduleTable
- MUI Table (not DataGrid — no extra dep)
- `ScheduleToggle` (MUI ToggleButtonGroup): Full / Condensed
- Condensed: rows 1–10, then first row of each subsequent full year
- Columns: Date, Remaining Principal, Total Payment, Principal Part, Interest Part

### ScenarioSaveDialog
- MUI Dialog with TextField for scenario name
- Save button → calls `storageService.saveScenario()` with 300ms delay → Snackbar confirmation

### ScenarioList
- MUI Drawer or Dialog listing saved scenarios
- Each row: name, savedAt, Load button, Delete button

---

## Theme

- **Light:** background `#f5f5f5`, primary `#546e7a` (muted blue-grey), accent `#66bb6a` (muted green)
- **Dark:** background `#121212`, primary `#78909c`, accent `#81c784`
- `ThemeProvider` wraps entire app; mode stored in localStorage (no delay)

---

## i18n

- **Library:** react-i18next
- **Default:** Polish (`pl`)
- **Available:** Polish, English
- `LanguageToggle` in AppBar: `PL | EN` button
- Language preference stored in localStorage (no delay)
- All UI strings in `pl.json` / `en.json`; code/comments always in English

---

## Storage Service (storageService.ts)

All methods are `async` and simulate 300ms network delay:

```typescript
saveScenario(scenario: Scenario): Promise<void>
getScenarios(): Promise<Scenario[]>
deleteScenario(id: string): Promise<void>
```

Language and theme preferences bypass the service (direct localStorage, synchronous).

---

## CSV Format

### Export structure

```
# PARAMETERS
principal,annualRate,termMonths,startDate,overpayment
500000,7.5,360,2024-01,2000

# INSURANCES
name,amount,isTemporary,endDate
"Property insurance",150,false,
"Life insurance",80,true,2026-06

# SCHEDULE
month,date,remainingPrincipal,totalPayment,principalPart,interestPart,insuranceTotal,overpayment
1,2024-01,498234,...
```

### Import flow

1. User picks `.csv` file (hidden `<input type="file">` triggered by Button)
2. `papaparse.parse()` detects sections by `# PARAMETERS` / `# INSURANCES` / `# SCHEDULE` markers
3. `dispatch('SET_PARAMS')` + `dispatch('SET_INSURANCES')`
4. Schedule recomputes automatically via `useMemo`
5. MUI Snackbar: success or error message

---

## GitHub Pages Configuration

- `vite.config.ts`: `base: '/mortgage-calculator/'`
- `package.json`:
  - `"homepage": "https://drachelski.github.io/mortgage-calculator/"`
  - `"predeploy": "npm run build"`
  - `"deploy": "gh-pages -d dist"`
- `gh-pages` installed as devDependency

---

## README

Includes:
- Project description
- Local development setup
- Git init + remote add instructions
- `npm run deploy` reminder for GitHub Pages publish
