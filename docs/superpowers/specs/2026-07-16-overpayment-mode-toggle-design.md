# Overpayment mode toggle — design

**Date:** 2026-07-16
**Status:** Approved

## Goal

Make the overpayment section configurable with two modes, switched by a toggle switch:

1. **Stała nadpłata** (fixed) — a constant monthly overpayment for the whole loan (current behaviour).
2. **Nadpłata do** (target) — the user enters a target amount; each month the overpayment tops the full installment up to that target. E.g. target = 10000: if the installment is 7500 → overpayment 2500; next month if the installment is 7450 → overpayment 2550.

An info icon with a tooltip explains both modes.

The originally-requested "Pierwsza rata" (first-installment date) field is **out of scope** — the existing `startDate` already defines the first installment month.

## Decisions

- **Target basis:** "Nadpłata do" subtracts from the **full installment including insurance** — `target − (principalPart + interest + insuranceTotal)`, floored at 0.
- **Switch component:** a MUI `Switch` flanked by two labels ("Stała nadpłata" ↔ "Nadpłata do"), i.e. a literal toggle switch (not a segmented ToggleButtonGroup).

## Data model (`src/types/index.ts`)

Add to `MortgageParams`:

```ts
overpaymentMode?: 'fixed' | 'target'  // default: 'fixed'
overpaymentTarget?: number            // target total installment for 'target' mode
```

`overpayment` keeps its meaning as the fixed monthly amount. Two separate fields so switching modes does not clobber the other mode's value. Both optional → backward compatible with saved scenarios and old CSV files (absent → `'fixed'`).

## Calculator (`src/lib/mortgageCalculator.ts`)

In `calculateSchedule`, compute the regular (non-irregular) overpayment per month:

```
regularOvp = overpaymentMode === 'target'
  ? Math.max(0, overpaymentTarget − (principalPart + interest + insuranceTotal))
  : overpayment
```

- `totalOvp = Math.min(regularOvp + irregularOvp, afterPrincipal)` (unchanged shape).
- Shorten-term trigger guard changes from `overpayment > 0` to "the active mode has a positive value":
  `hasRegularOverpayment = overpaymentMode === 'target' ? overpaymentTarget > 0 : overpayment > 0`.
- In `calculateRRSO`, force `overpaymentMode: 'fixed', overpayment: 0` (in addition to the existing overrides) so target mode does not leak into the interest-only base calculation.

## UI (`src/components/form/MortgageForm.tsx`)

- Above the amount field, render a row containing:
  - `Switch` with left label "Stała nadpłata" and right label "Nadpłata do"; `checked` maps to `overpaymentMode === 'target'`.
  - `InfoOutlinedIcon` inside a `Tooltip` explaining both modes.
- The amount `TextField`:
  - `fixed` mode → label `form.overpayment`, bound to `params.overpayment`.
  - `target` mode → label `form.overpaymentTarget`, bound to `params.overpaymentTarget`.
- The base (no-overpayment) schedule used for the savings comparison forces `overpaymentMode: 'fixed', overpayment: 0`.
- Shorten-term options block shows when the active mode's value > 0 (replacing the current `params.overpayment > 0` guard).

## i18n (`src/i18n/locales/pl.json`, `en.json`)

New `form.*` keys:
- `overpaymentTarget` — "Nadpłata do (PLN)" / "Overpay up to (PLN)"
- `overpaymentModeFixed` — "Stała nadpłata" / "Fixed overpayment"
- `overpaymentModeTarget` — "Nadpłata do" / "Overpay up to"
- `overpaymentModeInfo` — tooltip text explaining both modes.

## CSV (`src/hooks/useCsvIO.ts`)

No code change required — params are spread on export and parsed with `dynamicTyping` on import. New columns round-trip automatically; old files without the columns default to `'fixed'` in the calculator.

## Testing

Add unit tests to `src/__tests__/mortgageCalculator.test.ts`:
- Target mode: installment 7500, target 10000 → overpayment 2500 in month 1.
- Target mode: overpayment varies as the installment shrinks over subsequent months.
- Target below the installment → overpayment 0.
- Target mode caps at remaining principal near payoff.
- RRSO unaffected by target-mode overpayment.

## Out of scope

- "Pierwsza rata" (first-installment date) field.
- Any change to irregular overpayments.
