---
name: labor-scheduling-model
description: "Turn hours of operation and daypart traffic into staffing levels, weekly labor hours, and labor % of sales. Use for staffing plans, schedules, or labor cost questions."
---

# Labor scheduling model

## Baseline (docs/07, *est.*)
- Open 7am–6pm, 7 days. The 7–10am peak is about 40–50% of sales.
- Peak staffing: 3 on the floor (bar, register/handoff, support). Off-peak: 2. Plus open and close prep.
- About 230–280 labor hours/week, a team of 9–11, and a blended wage of about $17.50 + 10–12% taxes and workers' comp ≈ $22k/mo.

## Steps
1. Build hourly demand: transactions per hour by daypart (from the forecast or POS data).
2. Apply a productivity standard (for example, 25–35 drinks per barista-hour at peak, depending on the menu mix and equipment).
3. Lay out shifts by hour and day. Add prep, cleaning, ordering, and training time.
4. Compute weekly hours by role × wage, add taxes and workers' comp, and get the monthly cost and labor % of sales.
5. Check compliance with `florida-labor-law` (overtime, minors, breaks policy).
6. Make a summer version with reduced hours.

## Output
An hourly staffing grid, a weekly hours and cost table, labor % at base and conservative sales, and the levers to cut labor.
