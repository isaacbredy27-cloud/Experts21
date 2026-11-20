# How to Talk to Your Experts

A practical guide to asking the Miami coffee shop expert team for help in Claude Code. For how the team is set up, see [`CLAUDE.md`](../CLAUDE.md) and [`expert-roster.md`](expert-roster.md).

There are three ways to ask:

| You want… | Use | What happens |
|---|---|---|
| One combined answer from several experts | `/consult …` or "Use the orchestrator to …" | Experts are picked and run in parallel, review each other if needed, and their work is combined into one answer |
| One expert's view | "Use the `<agent-name>` subagent to …" or `@<agent-name>` | Only that expert runs |
| The whole team to weigh in | `/consult` with an explicit "involve every area" instruction | All 27 experts run in batches, and one combined answer comes back |

---

## 1. Example prompts that make several experts work together

Each prompt below names a real decision, gives the constraints, and asks for one answer. That pushes the orchestrator to bring in several experts and reconcile them. The expected squad is listed under each prompt so you know what to look for in the "Experts consulted" line at the end of the answer.

### Example A: Choose between two sites
```text
/consult We're choosing between two 1,000 sq ft spaces: one in Brickell at about $89/sf and a former café on Coral Way at about $50/sf. Budget is $400k total. Which should we pursue, and what lease terms should we ask for? Give one recommendation with the break-even for each site.
```
**Expected experts:** `site-selection-advisor`, `competitive-intelligence-analyst`, `permitting-zoning-expediter`, `insurance-risk-advisor`, `financial-modeler`, `lease-attorney`, `engagement-lead`.
**Why they collaborate:** the site advisor's rent and foot-traffic numbers feed the financial model. The zoning and flood checks can rule out a site. The lease attorney turns the result into the terms to ask the landlord for.

### Example B: Concept, menu, and prices
```text
Use the orchestrator to design our launch concept: who our primary customer is, how we position against Cuban ventanitas and Wynwood specialty cafés, a 12-item drink menu with prices, and whether we can hit about 30% cost of goods. I want one combined recommendation.
```
**Expected experts:** `market-research-analyst`, `hispanic-market-cultural-advisor`, `competitive-intelligence-analyst`, `brand-strategist`, `head-of-coffee`, `food-pastry-advisor`, `financial-modeler`.
**Why they collaborate:** positioning sets the menu, the menu sets the cost of goods, and the cultural advisor checks that the Cuban-style drinks feel authentic.

### Example C: The plan from signing a lease to opening
```text
/consult Assume we sign a lease on a former café space on March 1. Build the plan to open: permits, buildout, equipment, hiring and training, tech setup, and pre-launch marketing, with the critical path and a realistic opening date. Flag what could push us into hurricane season.
```
**Expected experts:** `buildout-project-manager`, `permitting-zoning-expediter`, `cafe-designer-architect`, `coffee-equipment-specialist`, `hr-talent-advisor`, `restaurant-tech-specialist`, `cafe-operations-manager`, `digital-social-marketer`, `pr-partnerships-manager`, `insurance-risk-advisor`.
**Why they collaborate:** the permit timeline drives the buildout schedule, and the buildout schedule drives when hiring and marketing start. The risk advisor stress-tests the opening date against the June–November hurricane season.

### Example D: Funding and go/no-go
```text
Use the orchestrator to tell me whether this business is fundable and worth doing. I can invest $120k of my own money. Recommend a funding mix (SBA, equipment financing, landlord allowance), show the debt coverage in the base and conservative cases, list the top 3 risks, and give a clear go/no-go.
```
**Expected experts:** `financial-modeler`, `funding-capital-advisor`, `accountant-tax-advisor`, `insurance-risk-advisor`, `b2b-sales-lead`, `engagement-lead`.
**Why they collaborate:** the funding advisor's loan structure changes the financial model, the B2B lead can add catering and wholesale revenue to the conservative case, and the engagement lead weighs everything into one go/no-go.

### Tips for prompts that coordinate well
- **Ask for a decision, not a topic.** "Which site should we pursue?" works better than "Tell me about sites."
- **Give your constraints:** budget, size, neighborhoods, dates, risk appetite.
- **Ask for one answer:** "one recommendation", "one combined plan".
- **Name experts if you want them included:** "…and make sure the lease-attorney weighs in."
- **Ask it to save the result** for big decisions: "…and save it to docs/consultations." The orchestrator also logs decisions in `docs/decision-log.md`.
- Follow up in the same session: "Now rerun Example A assuming the Coral Way landlord offers 4 months free rent."

---

## 2. Ask one specific expert

Use this when the question clearly belongs to one area. It's faster and cheaper than a full consultation.

**Plain language (Claude delegates to that subagent):**
```text
Use the financial-modeler subagent to rebuild the monthly P&L for a 900 sq ft café at $55/sf plus $18/sf in building charges, with a $9 average ticket. Show break-even transactions per day.
```

**@-mention (forces that exact agent):**
```text
@lease-attorney Review this LOI clause and tell me what to push back on: "Rent commences 60 days after lease execution regardless of permit status."
```

**More single-expert examples:**
```text
Use the permitting-zoning-expediter subagent to list every permit and license we need for a café at an address in the City of Miami, in order, with typical timelines.
```
```text
Use the head-of-coffee subagent to create a specialty version of a colada and a cortadito, with recipes and target cost.
```
```text
Use the digital-social-marketer subagent to draft a 4-week bilingual Instagram/TikTok calendar for our pre-launch.
```

**Agent names you can use:** `engagement-lead`, `market-research-analyst`, `competitive-intelligence-analyst`, `hispanic-market-cultural-advisor`, `head-of-coffee`, `food-pastry-advisor`, `site-selection-advisor`, `cafe-designer-architect`, `buildout-project-manager`, `permitting-zoning-expediter`, `coffee-equipment-specialist`, `restaurant-tech-specialist`, `data-analytics-analyst`, `cafe-operations-manager`, `coffee-sourcing-specialist`, `food-safety-specialist`, `hr-talent-advisor`, `financial-modeler`, `funding-capital-advisor`, `accountant-tax-advisor`, `corporate-attorney`, `lease-attorney`, `insurance-risk-advisor`, `brand-strategist`, `digital-social-marketer`, `pr-partnerships-manager`, `b2b-sales-lead`. Plus `orchestrator` and `agent-builder`.

Every expert answers in the same format: **Answer · Details · Key numbers (with sources) · Assumptions · Risks · Handoffs · Open questions**. If the answer lists **Handoffs**, you can pass those questions to the experts it names, or to the orchestrator.

---

## 3. Ask the whole team

**Normal case:** let the orchestrator choose the right experts. Use `/consult`:
```text
/consult Should we open our first location in Brickell, Coral Way, or Downtown?
```
`/consult` runs the orchestration in your main conversation, so it can always bring in experts.

**Every expert, on purpose:** use this for a full review, such as a business plan check before you meet a lender. It runs all 27 experts in batches, so it's slower and more expensive.
```text
/consult Do a full-team review of our business plan in docs/ — involve every expert area (all 27 experts, in batches of up to 10), have each flag the biggest issue in their area, reconcile conflicts, and give me one combined go/no-go memo with a prioritized fix list. Save it to docs/consultations.
```

**Run a whole session as the orchestrator:** every question you type goes through the team.
```bash
claude --agent orchestrator
```

---

## 4. Grow or fix the team
```text
Use the agent-builder subagent to add a roastery advisor for in-house roasting (equipment, air permits, wholesale), wire it into routing, and validate the team.
```
```text
Use the agent-builder subagent to audit the team and fix any routing gaps.
```

## Troubleshooting
- **The answer came from one voice, not the experts.** Check the "Experts consulted" line. If it's missing, rerun with `/consult`, which runs in the main conversation.
- **The orchestrator returned a "DISPATCH PLAN".** It wasn't allowed to start experts in this environment. Reply "run that plan", and the main session will run the experts and send their outputs back for synthesis.
- **Numbers look stale.** The research is dated November 2026. Ask: "…and refresh rents, wages, and fees before answering."
- **Legal, tax, or insurance answers** are research, not professional advice. Confirm them with a licensed Florida attorney, CPA, or broker.
