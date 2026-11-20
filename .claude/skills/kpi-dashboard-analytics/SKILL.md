---
name: kpi-dashboard-analytics
description: "Define caf\u00e9 KPIs, build dashboards from POS data, and flag trends and anomalies. Use for performance reviews, forecasting, or diagnosing sales or cost changes."
---

# KPI dashboard and analytics

## Core KPIs
| KPI | Target / note |
|---|---|
| Transactions per day, by hour and daypart | Forecast 275 base |
| Average ticket | $8.50 base |
| Net sales (week, month), same-period comparison | |
| COGS % | 28–32% |
| Labor % | 30–35% |
| Prime cost (COGS + labor) % | ≤ 65% |
| Occupancy % | ≤ 10% |
| Ticket time at peak | under 3 min espresso drinks |
| Mobile order % | |
| Loyalty members, repeat rate | |
| Google rating and review count | 4.6+ |
| Waste % | |
| Catering and wholesale share | |
| Summer vs. peak season ratio | |

## Steps
1. Get the data (POS exports as CSV, labor reports, invoices). Clean it and document the definitions.
2. Compute the KPIs over time with Bash/python. Store scripts and outputs under `docs/models/` or `docs/reports/`.
3. Compare to target and to the prior period. Flag anomalies (more than 2 standard deviations, or more than 10% off target).
4. Diagnose the causes (weather, events, staffing, price changes, competitor openings).
5. Recommend actions with an owner.

## Output
A KPI table (actual, target, prior period, delta, status), 3–5 insights, and the actions.
