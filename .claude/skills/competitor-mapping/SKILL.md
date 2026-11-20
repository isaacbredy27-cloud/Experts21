---
name: competitor-mapping
description: "Map and profile every coffee competitor around a site (specialty, chains, Cuban ventanitas) with ratings, hours, and density. Use for site scoring and positioning."
---

# Competitor mapping

## Steps
1. Define the radius: a 0.5-mile walk for urban sites (Brickell, Wynwood, Downtown) or 1 mile for car-oriented areas.
2. Search the map and business listings for "coffee shop", "café", "cafetería", "ventanita", "bakery", and known brands (Panther, La Colombe, Allpress, Starbucks, Dunkin', Raccoon, Zak the Baker, Sant Ambroeus). Use any maps or business-search tool available; otherwise use web search.
3. Record each competitor: name, address, distance, type (specialty / chain / ventanita / bakery-café), rating, review count, hours, price tier, notable features (seating, drive-thru, roasting).
4. Compute density: total count, specialty count, and chain count within the radius. Note gaps in dayparts or categories.
5. Compare against the known Miami landscape in `docs/03-competitors.md`.

## Output
- A competitor table sorted by distance.
- A summary covering density, the strongest direct competitor, gaps (for example, "no specialty open before 7am", "no seating within 3 blocks"), and the implication for the concept.

## Guardrails
- Note the data date. Listings and hours change.
- Don't count permanently closed businesses.
