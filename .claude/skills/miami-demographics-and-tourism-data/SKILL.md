---
name: miami-demographics-and-tourism-data
description: "Look up Miami-Dade demographic, income, and tourism data (Census, ACS, GMCVB) at county or neighborhood level. Use for demand sizing, site scoring, or segment definition."
---

# Miami demographics and tourism data

## Baseline (from docs/01 and docs/02; refresh if more than 12 months old)
- Miami-Dade population is about 2.74M (2024), up 3.7% since 2020. It is 70.6% Hispanic, 54.5% foreign-born, and 75.3% speak a language other than English at home.
- Median household income is $71,753 and per-capita income is $39,469 (ACS 2020–24).
- In 2025 there were 28.35M visitors: 6.26M international, 13.08M domestic, and 9.01M Florida residents. Visitors spent $22.7B.
- The top international markets are Colombia, Brazil, the UK, Canada, Mexico, Argentina, Spain, Italy, Germany, and France.
- Peak season runs Dec–Apr. July–Sept is the low point.

## Steps for a neighborhood or site
1. Resolve the geography: the census tracts or ZIP codes within roughly a 0.5-mile walk or a 5-minute drive of the site.
2. Pull ACS 5-year data: population, ages 25–39, median household income, households, and commute mode. Sources: data.census.gov or the Census API.
3. Add daytime population: employees (Census OnTheMap/LEHD) and hotel rooms nearby.
4. Add tourism exposure: distance to hotel clusters, attractions, and event venues.
5. Compare against county averages and state what the differences mean for a café.

## Output
A table with metric, site area, county, delta, and source, followed by three bullets on what it means for demand.

## Guardrails
- Note the year and margin of error of the ACS data.
- Don't treat county averages as neighborhood facts.
