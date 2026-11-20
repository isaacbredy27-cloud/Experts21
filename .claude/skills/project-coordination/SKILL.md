---
name: project-coordination
description: "Track tasks, owners, dependencies, and a decision log across the expert team. Use when planning multi-step work or handing off between agents."
---

# Project coordination

## Artifacts (all inside the project)
- `docs/decision-log.md`: append-only list of decisions (date, decision, rationale, owner, source memo). Create it if it's missing.
- `docs/consultations/`: saved combined answers, named `YYYY-MM-DD-<slug>.md`.

## Steps
1. Break the work into tasks. Each task has an **owner agent**, **inputs needed**, **output**, and **depends on**.
2. Order the tasks by dependency and mark which ones can run **in parallel**.
3. For each handoff, write a **self-contained brief**: goal, context (with file paths), constraints, output format. Agents don't see each other's conversations.
4. After each task, record the outcome. If it was a decision, append it to `docs/decision-log.md`.

## Task table format
| # | Task | Owner | Depends on | Parallel? | Status | Output |

## Guardrails
- One owner per task.
- Never mark a task done without its output.
