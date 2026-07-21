# Overpayment Mode Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a toggle switch to the overpayment section that switches between "Stała nadpłata" (fixed monthly overpayment) and "Nadpłata do" (top the full installment up to a target amount), with an info tooltip.

**Architecture:** Extend `MortgageParams` with `overpaymentMode` and `overpaymentTarget`. The calculator computes the per-month regular overpayment from the active mode; in target mode it tops the full installment (principal + interest + insurance) up to the target, floored at 0. The form renders a MUI `Switch` (two labels + info icon) that selects the mode and swaps the amount field between the two stored values.

**Tech Stack:** React 19, TypeScript, MUI v9, i18next, Vitest.

## Global Constraints

- `overpaymentMode` default is `'fixed'` when absent — backward compatible with saved scenarios and old CSV files.
- Target basis is the **full installment including insurance**: `overpaymentTarget − (principalPart + interest + insuranceTotal)`, floored at 0.
- Two separate stored fields: `overpayment` (fixed amount) and `overpaymentTarget` (target amount). Switching mode must NOT clobber the other field.
- Currency/number formatting stays `pl-PL` as in existing code.
- Follow existing MUI + i18n patterns in `MortgageForm.tsx`; all user-facing strings go through `t(...)` with keys in both `pl.json` and `en.json`.
- Tests run with `pnpm test:run` (Vitest).

---

### Task 1: Extend the data model

**Files:**
- Modify: `src/types/index.ts:3-12` (the `MortgageParams` interface)

**Interfaces:**
- Consumes: nothing.
- Produces: `MortgageParams.overpaymentMode?: 'fixed' | 'target'` and `MortgageParams.overpaymentTarget?: number`. Later tasks (calculator, form) rely on these exact names and types.

- [ ] **Step 1: Add the two optional fields to `MortgageParams`**

Edit `src/types/index.ts`. The interface currently ends with `shortenFrequency?: number`. Add the two new fields:

```ts
export interface MortgageParams {
  principal: number
  annualRate: number
  termMonths: number
  startDate: string // YYYY-MM
  overpayment: number
  overpaymentMode?: 'fixed' | 'target' // default: 'fixed'
  overpaymentTarget?: number // target total installment for 'target' mode
  loanType?: LoanType       // default: 'annuity'
  shortenTerm?: boolean     // default: false (reduce installment mode)
  shortenFrequency?: number // default: 12; only used when shortenTerm=true
}
```

- [ ] **Step 2: Verify the project still type-checks**

Run: `pnpm exec tsc -b`
Expected: exits 0, no errors (new fields are optional, nothing else changes yet).

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "add overpaymentMode and overpaymentTarget to MortgageParams"
```

---

### Task 2: Calculator — target-mode overpayment

**Files:**
- Modify: `src/lib/mortgageCalculator.ts:58-134` (`calculateSchedule`) and `:157-174` (`calculateRRSO`)
- Test: `src/__tests__/mortgageCalculator.test.ts`

**Interfaces:**
- Consumes: `MortgageParams.overpaymentMode`, `MortgageParams.overpaymentTarget` from Task 1.
- Produces: `calculateSchedule` behaviour — when `overpaymentMode === 'target'`, each row's `overpayment` equals `max(0, overpaymentTarget − (principalPart + interest + insuranceTotal))`, then capped to remaining principal and summed with irregular overpayments. `calculateRRSO` is unaffected by target-mode overpayment.

- [ ] **Step 1: Write the failing tests**

First read the top of `src/__tests__/mortgageCalculator.test.ts` to match the existing import style and any test helpers/`baseParams` object. Then add this describe block (adjust the params factory to match how the file builds params — the file already builds `MortgageParams` for other tests):

```ts
describe('overpayment target mode', () => {
  // No insurance, so the full installment equals principalPart + interest.
  const targetParams = {
    principal: 500000,
    annualRate: 7.5,
    termMonths: 360,
    startDate: '2026-01',
    overpayment: 0,
    overpaymentMode: 'target' as const,
    overpaymentTarget: 10000,
    loanType: 'annuity' as const,
    shortenTerm: false,
  }

  it('tops the installment up to the target in month 1', () => {
    const rows = calculateSchedule(targetParams, [])
    const first = rows[0]
    const installment = first.principalPart + first.interestPart
    expect(first.overpayment).toBeCloseTo(10000 - installment, 2)
    // full monthly payment reaches the target
    expect(first.principalPart + first.interestPart + first.overpayment).toBeCloseTo(10000, 2)
  })

  it('increases the overpayment as the base installment shrinks', () => {
    const rows = calculateSchedule(targetParams, [])
    // installment (principal+interest) decreases over time in reduce-installment mode,
    // so overpayment must grow to keep the total at the target
    expect(rows[12].overpayment).toBeGreaterThan(rows[0].overpayment)
  })

  it('includes insurance in the target basis', () => {
    const rows = calculateSchedule(targetParams, [
      { id: 'a', name: 'x', amount: 500, isTemporary: false },
    ])
    const first = rows[0]
    const total = first.principalPart + first.interestPart + first.insuranceTotal + first.overpayment
    expect(total).toBeCloseTo(10000, 2)
  })

  it('applies no overpayment when the target is below the installment', () => {
    const rows = calculateSchedule({ ...targetParams, overpaymentTarget: 100 }, [])
    expect(rows[0].overpayment).toBe(0)
  })

  it('does not overpay beyond the remaining principal near payoff', () => {
    const rows = calculateSchedule({ ...targetParams, overpaymentTarget: 1_000_000 }, [])
    const last = rows[rows.length - 1]
    expect(last.remainingPrincipal).toBeCloseTo(0, 2)
    // schedule ends well before the full term because of the large overpayment
    expect(rows.length).toBeLessThan(360)
  })

  it('leaves RRSO unaffected by target-mode overpayment', () => {
    const withTarget = calculateRRSO(targetParams, [])
    const noOverpay = calculateRRSO({ ...targetParams, overpaymentMode: 'fixed', overpaymentTarget: 0, overpayment: 0 }, [])
    expect(withTarget).toBeCloseTo(noOverpay, 6)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test:run src/__tests__/mortgageCalculator.test.ts`
Expected: the new "overpayment target mode" tests FAIL (target mode not implemented yet — overpayment stays 0 / RRSO differs is not the failure; the topping-up assertions fail because `overpayment` is computed from the fixed `overpayment: 0`).

- [ ] **Step 3: Implement target-mode overpayment in `calculateSchedule`**

In `src/lib/mortgageCalculator.ts`, inside `calculateSchedule`, just after the existing destructuring/defaults block (around line 63-66 where `shortenFrequency` is defined), add mode defaults:

```ts
  const overpaymentMode = params.overpaymentMode ?? 'fixed'
  const overpaymentTarget = params.overpaymentTarget ?? 0
  const hasRegularOverpayment =
    overpaymentMode === 'target' ? overpaymentTarget > 0 : overpayment > 0
```

Then inside the loop, replace the current line that computes `totalOvp` (currently `const totalOvp = Math.min(overpayment + irregularOvp, afterPrincipal)`) with a mode-aware regular overpayment. The loop already has `interest`, `principalPart`, `insuranceTotal`, `irregularOvp`, and `afterPrincipal` in scope:

```ts
    const irregularOvp = getIrregularOverpayment(irregularOverpayments, date)
    const regularOvp =
      overpaymentMode === 'target'
        ? Math.max(0, overpaymentTarget - (principalPart + interest + insuranceTotal))
        : overpayment
    const totalOvp = Math.min(regularOvp + irregularOvp, afterPrincipal)
```

Finally, update the shorten-term trigger guard. The current condition is
`if ((overpayment > 0 || irregularOverpayments.length > 0) && remaining > 0) {`.
Replace `overpayment > 0` with the new flag:

```ts
    if ((hasRegularOverpayment || irregularOverpayments.length > 0) && remaining > 0) {
```

- [ ] **Step 4: Guard `calculateRRSO` against target-mode leakage**

In `calculateRRSO` (around line 159), the base schedule is built with `{ ...params, overpayment: 0, shortenTerm: false }`. Add `overpaymentMode: 'fixed'` so a target-mode config does not apply overpayments to the interest-only base:

```ts
  const schedule = calculateSchedule(
    { ...params, overpayment: 0, overpaymentMode: 'fixed', shortenTerm: false },
    insurances,
  )
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test:run src/__tests__/mortgageCalculator.test.ts`
Expected: all tests PASS, including the existing suite (no regressions).

- [ ] **Step 6: Commit**

```bash
git add src/lib/mortgageCalculator.ts src/__tests__/mortgageCalculator.test.ts
git commit -m "support target-mode overpayment in schedule calculation"
```

---

### Task 3: i18n strings

**Files:**
- Modify: `src/i18n/locales/pl.json:3-39` (the `form` object)
- Modify: `src/i18n/locales/en.json` (the `form` object — mirror the same keys)

**Interfaces:**
- Consumes: nothing.
- Produces: `form.overpaymentTarget`, `form.overpaymentModeFixed`, `form.overpaymentModeTarget`, `form.overpaymentModeInfo` in both locales, used by Task 4.

- [ ] **Step 1: Add keys to `pl.json`**

In `src/i18n/locales/pl.json`, inside the `form` object, add these keys right after the existing `"overpayment"` line:

```json
    "overpaymentTarget": "Nadpłata do (PLN)",
    "overpaymentModeFixed": "Stała nadpłata",
    "overpaymentModeTarget": "Nadpłata do",
    "overpaymentModeInfo": "Stała nadpłata: co miesiąc dopłacasz tę samą kwotę. Nadpłata do: co miesiąc nadpłata dopełnia całą ratę (kapitał + odsetki + ubezpieczenia) do podanej kwoty, więc gdy rata maleje, nadpłata rośnie.",
```

- [ ] **Step 2: Add the mirrored keys to `en.json`**

First read `src/i18n/locales/en.json` to find the `overpayment` key inside `form`. Add the mirrored keys right after it:

```json
    "overpaymentTarget": "Overpay up to (PLN)",
    "overpaymentModeFixed": "Fixed overpayment",
    "overpaymentModeTarget": "Overpay up to",
    "overpaymentModeInfo": "Fixed overpayment: you add the same amount every month. Overpay up to: each month the overpayment tops the whole installment (principal + interest + insurance) up to the given amount, so as the installment shrinks the overpayment grows.",
```

- [ ] **Step 3: Verify both files are valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/i18n/locales/pl.json','utf8')); JSON.parse(require('fs').readFileSync('src/i18n/locales/en.json','utf8')); console.log('ok')"`
Expected: prints `ok`.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/pl.json src/i18n/locales/en.json
git commit -m "add i18n strings for overpayment mode toggle"
```

---

### Task 4: Form UI — mode switch and mode-aware amount field

**Files:**
- Modify: `src/components/form/MortgageForm.tsx` — the overpayment block (currently `:202-262`) and the base-schedule memo (`:51-54`).

**Interfaces:**
- Consumes: `params.overpaymentMode`, `params.overpaymentTarget` (Task 1); i18n keys (Task 3); calculator behaviour (Task 2).
- Produces: UI only; no exports.

- [ ] **Step 1: Force fixed mode in the base (no-overpayment) schedule memo**

In `MortgageForm.tsx`, the `baseSchedule` memo (around line 51) builds `calculateSchedule({ ...params, overpayment: 0, shortenTerm: false }, insurances)`. Add `overpaymentMode: 'fixed'` so the "bez nadpłat" comparison is truly overpayment-free in target mode:

```tsx
  const baseSchedule = useMemo(
    () =>
      calculateSchedule(
        { ...params, overpayment: 0, overpaymentMode: 'fixed', shortenTerm: false },
        insurances,
      ),
    [params, insurances],
  )
```

- [ ] **Step 2: Add a derived flag for the active overpayment value**

Just below the existing `const isCustomFrequency = ...` line (around line 140), add:

```tsx
  const overpaymentMode = params.overpaymentMode ?? 'fixed'
  const hasOverpayment =
    overpaymentMode === 'target'
      ? (params.overpaymentTarget ?? 0) > 0
      : params.overpayment > 0
```

- [ ] **Step 3: Replace the overpayment TextField and its shorten block with the mode switch + mode-aware field**

Replace the whole block that starts with `{/* Overpayment + shorten options */}` and the `<TextField label={t('form.overpayment')} ... />` through the closing of `{params.overpayment > 0 && ( ... )}` (currently lines 202-262) with:

```tsx
        {/* Overpayment mode switch */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography
              variant="body2"
              sx={{ color: overpaymentMode === 'fixed' ? 'text.primary' : 'text.secondary' }}
            >
              {t('form.overpaymentModeFixed')}
            </Typography>
            <Switch
              checked={overpaymentMode === 'target'}
              onChange={e => setParam('overpaymentMode', e.target.checked ? 'target' : 'fixed')}
              size="small"
            />
            <Typography
              variant="body2"
              sx={{ color: overpaymentMode === 'target' ? 'text.primary' : 'text.secondary' }}
            >
              {t('form.overpaymentModeTarget')}
            </Typography>
            <Tooltip arrow placement="top" title={t('form.overpaymentModeInfo')}>
              <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
            </Tooltip>
          </Box>

          {overpaymentMode === 'fixed' ? (
            <TextField
              label={t('form.overpayment')}
              type="number"
              value={params.overpayment}
              onChange={e => setParam('overpayment', Number(e.target.value))}
              slotProps={{ htmlInput: { min: 0, step: 100 } }}
              fullWidth
            />
          ) : (
            <TextField
              label={t('form.overpaymentTarget')}
              type="number"
              value={params.overpaymentTarget ?? 0}
              onChange={e => setParam('overpaymentTarget', Number(e.target.value))}
              slotProps={{ htmlInput: { min: 0, step: 100 } }}
              fullWidth
            />
          )}
        </Box>

        {hasOverpayment && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pl: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={params.shortenTerm ?? false}
                  onChange={e => setParam('shortenTerm', e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="body2">{t('form.shortenTerm')}</Typography>}
            />

            {params.shortenTerm && (
              <>
                <FormControl size="small" fullWidth>
                  <InputLabel>{t('form.shortenFrequency')}</InputLabel>
                  <Select
                    value={isCustomFrequency ? 'custom' : String(shortenFreq)}
                    label={t('form.shortenFrequency')}
                    onChange={e => {
                      const val = e.target.value
                      if (val !== 'custom') setParam('shortenFrequency', Number(val))
                      else setParam('shortenFrequency', 2)
                    }}
                  >
                    <MenuItem value="1">{t('form.shortenFrequencyMonthly')}</MenuItem>
                    <MenuItem value="3">{t('form.shortenFrequencyQuarterly')}</MenuItem>
                    <MenuItem value="6">{t('form.shortenFrequencySemiannual')}</MenuItem>
                    <MenuItem value="12">{t('form.shortenFrequencyAnnual')}</MenuItem>
                    <MenuItem value="custom">{t('form.shortenFrequencyCustom')}</MenuItem>
                  </Select>
                </FormControl>

                {isCustomFrequency && (
                  <TextField
                    label={t('form.shortenFrequencyCustomLabel')}
                    type="number"
                    value={shortenFreq}
                    onChange={e => setParam('shortenFrequency', Math.max(1, Number(e.target.value)))}
                    size="small"
                    slotProps={{ htmlInput: { min: 1, step: 1 } }}
                    fullWidth
                  />
                )}
              </>
            )}
          </Box>
        )}
```

Note: `Switch`, `TextField`, `Tooltip`, `InfoOutlinedIcon`, `Box`, `Typography`, `FormControlLabel`, `FormControl`, `InputLabel`, `Select`, `MenuItem` are all already imported at the top of the file — no new imports needed.

- [ ] **Step 4: Type-check and lint**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: both exit 0, no errors.

- [ ] **Step 5: Run the full test suite**

Run: `pnpm test:run`
Expected: all tests PASS.

- [ ] **Step 6: Manually verify in the dev server**

Run: `pnpm dev`, open the app. Confirm:
1. The overpayment section shows a switch labelled "Stała nadpłata" / "Nadpłata do" with an info icon whose tooltip explains both modes.
2. In fixed mode, entering an amount behaves as before (shorten options appear when > 0).
3. Flip to "Nadpłata do", enter e.g. 10000; the first schedule row's total monthly payment equals ~10000 and the overpayment column shows target − installment.
4. Flipping the switch back and forth preserves each field's separately-entered value.

- [ ] **Step 7: Commit**

```bash
git add src/components/form/MortgageForm.tsx
git commit -m "add overpayment mode toggle to mortgage form"
```

---

### Task 5: CSV round-trip verification

**Files:**
- Verify only: `src/hooks/useCsvIO.ts`; optionally add a test to `src/__tests__/useCsvIO.test.ts`.

**Interfaces:**
- Consumes: `overpaymentMode`, `overpaymentTarget` fields.
- Produces: confidence that export/import round-trips the new fields and that old CSVs (without the columns) still import.

- [ ] **Step 1: Read the existing CSV test to match its style**

Read `src/__tests__/useCsvIO.test.ts` and the `parseCsvContent`/`exportCsv` code in `src/hooks/useCsvIO.ts`. Confirm params are unparsed via `Papa.unparse([params])` (so new fields serialize automatically) and parsed via `Papa.parse(..., { dynamicTyping: true })`.

- [ ] **Step 2: Add a round-trip test for the new fields**

Append to `src/__tests__/useCsvIO.test.ts` a test that mirrors the existing round-trip test but sets target-mode params, then asserts `parseCsvContent(exported).params.overpaymentMode === 'target'` and `overpaymentTarget` matches. Use the existing test's helper for producing the CSV string (follow whatever pattern the file already uses — e.g. building an export string and feeding it to `parseCsvContent`). Example assertion body:

```ts
it('round-trips overpayment mode and target', () => {
  const content = [
    '# PARAMETERS',
    'principal,annualRate,termMonths,startDate,overpayment,overpaymentMode,overpaymentTarget,loanType,shortenTerm,shortenFrequency',
    '500000,7.5,360,2026-01,0,target,10000,annuity,false,12',
    '',
    '# INSURANCES',
    'name,amount,isTemporary,endDate',
    '',
    '# IRREGULAR_OVERPAYMENTS',
    'amount,type,startDate',
  ].join('\n')
  const result = parseCsvContent(content)
  expect(result.params.overpaymentMode).toBe('target')
  expect(result.params.overpaymentTarget).toBe(10000)
})

it('defaults old CSVs without the new columns to fixed mode', () => {
  const content = [
    '# PARAMETERS',
    'principal,annualRate,termMonths,startDate,overpayment,loanType,shortenTerm,shortenFrequency',
    '500000,7.5,360,2026-01,1000,annuity,false,12',
  ].join('\n')
  const result = parseCsvContent(content)
  expect(result.params.overpaymentMode).toBeUndefined()
  expect(result.params.overpayment).toBe(1000)
})
```

- [ ] **Step 3: Run the CSV tests**

Run: `pnpm test:run src/__tests__/useCsvIO.test.ts`
Expected: all PASS. (No production change needed — this task confirms the fields round-trip and old files stay valid. If `parseCsvContent` had a hard-coded column list that dropped unknown fields, add the two fields there; per the current code it spreads the parsed row, so no change is expected.)

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/useCsvIO.test.ts
git commit -m "verify overpayment mode fields round-trip through CSV"
```

---

## Self-Review

**Spec coverage:**
- Data model (`overpaymentMode`, `overpaymentTarget`) → Task 1. ✓
- Target-mode calculation incl. insurance basis + RRSO guard → Task 2. ✓
- UI switch + mode-aware field + info tooltip + shorten guard → Task 4. ✓
- i18n keys → Task 3. ✓
- CSV round-trip / backward compat → Task 5. ✓
- "Pierwsza rata" explicitly out of scope → no task. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code. Test steps contain concrete assertions. ✓

**Type consistency:** `overpaymentMode: 'fixed' | 'target'` and `overpaymentTarget: number` used identically across Tasks 1, 2, 4, 5. `hasRegularOverpayment` (calculator) and `hasOverpayment` (form) are distinct local variables in different files — intentional, not a mismatch. ✓

**Note for executor:** The repo has `commit.gpgsign=true`, so `git commit` prompts for a GPG passphrase and will hang in a non-interactive shell. Run commits in an interactive terminal (e.g. `! git commit ...` in the Claude Code prompt), or configure a GPG agent / `--no-gpg-sign` per the user's preference.
