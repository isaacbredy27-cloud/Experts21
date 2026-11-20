---
name: rent-and-occupancy-analysis
description: "Compare retail rent comps (base + NNN/CAM) by Miami submarket and test occupancy cost as a percent of forecast sales. Use when evaluating any site or lease."
---

# Rent and occupancy analysis

## Benchmarks (Cushman & Wakefield Q2 2025 asking, $/sf/yr; refresh)
Miami Beach $99.64 · Aventura $89.86 · Brickell $89.13 · Wynwood–Design District $70.94 · Coconut Grove $67.17 · Coral Gables $56.78 · Kendall $49.85 · Coral Way $49.59 · Biscayne Corridor $47.58 · Downtown $45.71 (9.6% vacancy) · Market $49.93, vacancy 3.1%.

## Steps
1. Get or estimate **base rent**, **NNN/CAM** (often about $12–25/sf in Miami *est.*), and **square footage**.
2. All-in annual occupancy = (base + NNN) × sf. Monthly = annual ÷ 12.
3. Get the sales forecast from `financial-modeling` (or use the docs/05 scenarios: $48.5k, $70k, or $100k/mo).
4. **Occupancy % = monthly occupancy ÷ monthly sales.** Target 10% or less. 12% is the hard ceiling.
5. Solve backward: the sales needed to hit 10%, then transactions per day needed at an $8.50 ticket.
6. Note escalations (typically 3%/yr), free rent, TI, and how they change the effective rent.

## Output
A table per site: sf, base, NNN, all-in/mo, sales needed at 10%, transactions/day needed, and a verdict (pass / stretch / fail).

## Guardrails
- Asking rent isn't deal rent. Label which one you're using.
- Confirm whether a quote is NNN or gross.
