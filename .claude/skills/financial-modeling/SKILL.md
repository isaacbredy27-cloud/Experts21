---
name: financial-modeling
description: "Build and maintain the caf\u00e9 P&L, break-even, cash-flow, and sensitivity models (traffic, ticket, rent, wages, green coffee). Use for any question about profitability, viability, or what-if scenarios."
---

# Financial modeling

## Base assumptions (docs/05; replace with site-specific data)
- Average ticket $8.50. Base case 275 transactions/day (conservative 190). 30 days/month.
- COGS 28–32% · labor incl. taxes 30–35% · card fees about 3% · utilities $1.5–3k · insurance $0.6–1.5k · marketing 2–4% · R&M/admin $1.5–3k.
- Occupancy target 10% or less of sales. Debt: $300k over 10 years at about 10% ≈ $4k/mo.
- Florida minimum wage $15.00 (from 9/30/2026, CPI-indexed from 2027).
- Break-even is about $54k/mo (non-prime) or $61k/mo (prime). Contribution margin about 67%.

## Steps
1. List the inputs with their source (doc or expert) and mark estimates.
2. Build the monthly P&L: revenue = transactions × ticket × days. Subtract variable costs (COGS, card fees) and fixed costs (labor floor, occupancy, utilities, insurance, admin, marketing, debt).
3. Compute EBITDA, pre-tax cash flow, break-even revenue and transactions/day, and payback on startup capital.
4. Build a 24-month cash flow with a ramp (for example months 1–3 at 60–75% of steady state) and **seasonality** (tourist areas Dec–Apr +10–20%, July–Sept –15–30% *est.*).
5. Run a **sensitivity table**: ±10–20% transactions, ±$0.50 ticket, ±$10/sf rent, +$1/hr wage, ±$1/lb green coffee.
6. Save calculations as a CSV or script under `docs/models/` when they're durable. Use Bash/python for the arithmetic.

## Output
Key outputs table, P&L table, sensitivity grid, and three bullets on what drives the result.

## Guardrails
- Show the formulas and inputs, not only the results.
- Use the conservative case for go/no-go decisions.
