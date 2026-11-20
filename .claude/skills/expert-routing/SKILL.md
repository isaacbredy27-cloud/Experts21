---
name: expert-routing
description: "Routing table of the Miami coffee shop expert team: which agent to call for which question, with handoff patterns. Use when deciding which experts to involve."
user-invocable: false
---

# Expert routing

All agents live in `.claude/agents/`. Pick the **smallest set** of experts that covers the question, usually 2–6. Always include `financial-modeler` when money changes, and `insurance-risk-advisor` when a commitment is irreversible.

## Routing table
| Question is about… | Call |
|---|---|
| Strategy, go/no-go, trade-offs across domains | engagement-lead |
| Demand, segments, demographics, tourism | market-research-analyst |
| Competitors, prices, saturation | competitive-intelligence-analyst |
| Cuban and Latin culture fit, bilingual approach | hispanic-market-cultural-advisor |
| Coffee menu, recipes, quality, barista standards | head-of-coffee |
| Food, pastry, grab-and-go | food-pastry-advisor |
| Where to open, site scoring, rent comps | site-selection-advisor |
| Layout, design, ADA, drawings | cafe-designer-architect |
| Buildout cost, contractors, schedule | buildout-project-manager |
| Zoning, permits, CU, DBPR license, BTR | permitting-zoning-expediter |
| Espresso machine, grinders, ice, water, equipment | coffee-equipment-specialist |
| POS, mobile ordering, loyalty, Wi-Fi, payroll software | restaurant-tech-specialist |
| KPIs, dashboards, sales data analysis | data-analytics-analyst |
| SOPs, service speed, scheduling, daily operations | cafe-operations-manager |
| Roaster or green coffee, coffee prices, supply | coffee-sourcing-specialist |
| Food code, inspections, certifications | food-safety-specialist |
| Hiring, pay, tips, training, retention, labor law | hr-talent-advisor |
| P&L, break-even, budget, scenarios | financial-modeler |
| Loans, investors, SBA, capital stack | funding-capital-advisor |
| Taxes, bookkeeping, filings | accountant-tax-advisor |
| Entity, contracts, trademark | corporate-attorney |
| LOI or lease terms and negotiation | lease-attorney |
| Risk register, insurance, hurricanes, flood | insurance-risk-advisor |
| Name, positioning, brand identity | brand-strategist |
| Instagram/TikTok, Google profile, reviews, SEO | digital-social-marketer |
| Press, events, creators, community partners | pr-partnerships-manager |
| Catering, office coffee, wholesale, hotels | b2b-sales-lead |
| Create or improve agents and skills | agent-builder |

## Standard squads
- **Site decision:** site-selection-advisor, competitive-intelligence-analyst, permitting-zoning-expediter, insurance-risk-advisor, financial-modeler, lease-attorney, then engagement-lead.
- **Concept and menu:** market-research-analyst, hispanic-market-cultural-advisor, brand-strategist, head-of-coffee, food-pastry-advisor, financial-modeler.
- **Budget and funding:** financial-modeler, buildout-project-manager, coffee-equipment-specialist, funding-capital-advisor, accountant-tax-advisor.
- **Launch plan:** buildout-project-manager, permitting-zoning-expediter, hr-talent-advisor, cafe-operations-manager, restaurant-tech-specialist, brand-strategist, digital-social-marketer, pr-partnerships-manager.
- **Operating performance:** data-analytics-analyst, cafe-operations-manager, financial-modeler, head-of-coffee.
- **Staffing and pay:** hr-talent-advisor, cafe-operations-manager, financial-modeler, accountant-tax-advisor.
