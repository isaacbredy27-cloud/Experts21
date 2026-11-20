---
name: agent-and-skill-authoring
description: "Conventions and checklist for creating or improving this project's subagents (.claude/agents) and skills (.claude/skills), including the validator script. Use when adding, editing, or auditing agents or skills."
---

# Agent and skill authoring (project conventions)

Based on the official Claude Code docs: https://code.claude.com/docs/en/sub-agents and https://code.claude.com/docs/en/skills. Re-read them when unsure, because fields change.

## Subagent files: `.claude/agents/<name>.md`
- Frontmatter between `---` lines, which must be the **first line** of the file. Required: `name` (lowercase-hyphen, no `:`), `description` (says *when to delegate*).
- Fields used in this project: `name`, `description`, `skills` (YAML list, preloads full skill content, max 32), `disallowedTools`, `tools`, `model`, `memory`, `color`.
- **Experts** use `disallowedTools: Agent` (they can't spawn agents) and inherit all other tools, including web and MCP research tools.
- Only the **orchestrator** may spawn agents (`tools` includes `Agent`). Nesting goes up to 3 levels by default, and at most 20 subagents can run at once.
- Body = the system prompt. Expert body sections: Identity, Mission, Responsibilities, Start by reading, Ask other experts about, Output contract, Guardrails.
- Every expert uses the shared **output contract**: Answer · Key numbers (with sources) · Assumptions · Risks · Handoffs · Open questions.

## Skill files: `.claude/skills/<skill-name>/SKILL.md`
- Folder name = skill name (lowercase-hyphen). Frontmatter: `name`, `description` (key use case first; the combined listing is truncated at 1,536 chars, so keep it under about 250).
- Don't set `disable-model-invocation: true` on a skill that agents preload, because preloading would break.
- Body: concise. Sections: purpose, Steps, Output, Guardrails. Keep it under 500 lines and put long references in sibling files.
- Use `context: fork` + `agent:` only for self-contained task skills. Orchestration skills (`consult`) run inline because a forked subagent may not be allowed to spawn experts (nesting depth). The project sets `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=2` in `.claude/settings.json`.

## When adding or changing an agent
1. Check that no existing agent already covers it (`expert-routing`). Prefer extending over duplicating.
2. Write the file and reference only existing skills, or create the new skills first.
3. Update: the `expert-routing` table, `docs/expert-roster.md` (roster + skills mapping), and the agent and skill counts in `CLAUDE.md`.
4. Keep the total agent count between 10 and 50.
5. Run the validator:
```bash
python3 .claude/skills/agent-and-skill-authoring/scripts/validate_team.py
```
6. Smoke-test by delegating one realistic question to the new agent.

## When improving
- Read the agent's or skill's recent outputs or the user's feedback. Change the smallest thing that fixes the problem (description wording for routing, body for behavior). Note the change in the commit message.
