# Mortgage Calculator

A React/TypeScript/MUI web application for simulating mortgage parameters with amortization schedules, insurance support, overpayment simulation, scenario persistence, and CSV export/import.

**Live:** https://drachelski.github.io/mortgage-calculator/

## Features

- Annuity amortization schedule with overpayment support (shortens term)
- Multiple insurances — permanent or time-limited
- Full / condensed schedule view
- Save and load named scenarios (persisted in LocalStorage)
- CSV export and import
- Light / dark theme
- Polish / English UI language switch

## Local Development

Prerequisites: Node.js 18+, pnpm

```bash
git clone https://github.com/drachelski/mortgage-calculator.git
cd mortgage-calculator
pnpm install
pnpm dev
```

Open http://localhost:5173/mortgage-calculator/

## Tests

```bash
pnpm test:run
```

## Link to GitHub and Deploy

```bash
# 1. Create a new repo on GitHub named "mortgage-calculator"

# 2. Link local project:
git init
git remote add origin https://github.com/drachelski/mortgage-calculator.git
git branch -M main
git push -u origin main

# 3. Publish to GitHub Pages:
pnpm deploy
```

After the first deploy, enable GitHub Pages in repo **Settings → Pages → Source: `gh-pages` branch**.
