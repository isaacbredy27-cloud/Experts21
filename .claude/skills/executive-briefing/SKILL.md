---
name: executive-briefing
description: "Combine input from several experts into a one-page decision memo with options, recommendation, risks, and next steps. Use when a question spans multiple domains or needs a decision."
---

# Executive briefing

Turn several expert inputs into one decision-ready memo for the consultant.

## Steps
1. Restate the **decision or question** in one sentence, plus the constraint that matters most (budget, date, risk appetite).
2. List the **inputs received**: which expert said what, in one line each.
3. **Reconcile.** Find where experts agree and where they conflict. For each conflict, name the underlying assumption that differs and resolve it or flag it.
4. Lay out **2–3 options** with cost, upside, key risk, and reversibility.
5. Make **one recommendation** with the reason in one or two sentences. State the confidence (high, medium, or low).
6. List **next steps**, each with an owner (agent name) and what it unblocks.

## Output template
```
## Decision: <one line>
**Recommendation:** ... (confidence: H/M/L)
**Why:** ...
### Options
| Option | Cost | Upside | Key risk | Reversible? |
### Where experts disagreed
### Risks & mitigations
### Next steps (owner → action)
### Sources
```

## Guardrails
- Put the recommendation at the top. Keep the memo to one page or less.
- Keep every number traceable to an expert's cited source.
- Don't hide disagreement. Show it and resolve it.
