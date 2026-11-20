# Knowledge folder: orchestrator (Marisol)

`orchestrator` reads **every file in this folder before answering**, and treats it as its primary, most specific source. These documents override the general research in `docs/` when they conflict.

## What belongs here
Past consultation briefs, routing notes, the consultant's standing preferences and constraints (budget, risk appetite, timelines).

## Guidelines
- Use Markdown, plain text, CSV, or PDF. Give files descriptive, dated names, e.g. `2026-12-03-loi-coral-way-v1.pdf`.
- Keep it current. Move superseded versions to an `archive/` subfolder, or delete them.
- Documents several agents need (a lease, the address, the budget) go in `knowledge/shared/` instead.
- Don't store passwords, bank credentials, or full ID numbers here. This folder is committed to git.
