---
name: green-coffee-market-tracking
description: "Monitor arabica and robusta prices, tariffs, and supply news and estimate impact on caf\u00e9 COGS. Use for sourcing decisions, contract timing, or price-change questions."
---

# Green coffee market tracking

## Context (docs/09)
- Arabica hit record highs in 2024–25. U.S. tariffs on Brazil (up to 50%) cut imports about 46% in Aug 2025. The tariffs were removed in Nov 2025.
- Late 2026: arabica futures were about $2.70/lb, down about 32% year over year. USDA forecasts a record Brazil 2026/27 crop of about 72.5M bags.

## Steps
1. Get the current ICE arabica "C" price and its trend (1 month, 12 months) from a market data source. Note robusta as well.
2. Scan news for tariffs, Brazil, Colombia, and Central America weather, and freight or FX moves.
3. Translate to café cost: specialty roasted coffee costs C price + differential + import, roasting, and margin. Estimate the roasted $/lb range from roaster price lists.
4. Café impact: lbs per month (about 1 lb ≈ 22–25 double shots; at 275 transactions/day ≈ 300–400 lbs/mo *est.*) × the $/lb change = monthly COGS change.
5. Recommend: lock a fixed-price contract, buy spot, or adjust menu prices.

## Output
Current price and trend, drivers, the effect on monthly COGS, and a recommendation.

## Guardrails
- Futures prices aren't what a café pays. Always convert to roasted wholesale cost.
