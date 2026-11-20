#!/usr/bin/env python3
"""Validate the project's subagents and skills.

Run from the repository root:
    python3 .claude/skills/agent-and-skill-authoring/scripts/validate_team.py
Exits non-zero if any error is found.
"""
import os
import re
import sys

try:
    import yaml
except ImportError:  # pragma: no cover
    sys.exit("PyYAML is required: pip install pyyaml")

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
AGENTS = os.path.join(ROOT, ".claude", "agents")
SKILLS = os.path.join(ROOT, ".claude", "skills")
ROUTING = os.path.join(SKILLS, "expert-routing", "SKILL.md")
NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
AGENT_FIELDS = {"name", "description", "tools", "disallowedTools", "model", "permissionMode", "maxTurns",
                "autoCompactWindow", "skills", "mcpServers", "hooks", "memory", "background", "omitClaudeMd",
                "effort", "isolation", "color", "initialPrompt", "experimental"}
SKILL_FIELDS = {"name", "description", "when_to_use", "argument-hint", "arguments", "disable-model-invocation",
                "user-invocable", "allowed-tools", "disallowed-tools", "model", "effort", "context", "agent",
                "background", "hooks", "paths", "shell", "metadata", "license", "compatibility"}
errors, warnings = [], []


def frontmatter(path):
    text = open(path, encoding="utf-8").read()
    if not text.startswith("---\n"):
        errors.append(f"{path}: frontmatter must start on line 1")
        return None, text
    end = text.find("\n---", 4)
    if end == -1:
        errors.append(f"{path}: unterminated frontmatter")
        return None, text
    try:
        data = yaml.safe_load(text[4:end]) or {}
    except yaml.YAMLError as exc:
        errors.append(f"{path}: YAML error: {exc}")
        return None, text
    return data, text[end + 4:]


skills = {}
for d in sorted(os.listdir(SKILLS)):
    p = os.path.join(SKILLS, d, "SKILL.md")
    if not os.path.isfile(p):
        continue
    fm, body = frontmatter(p)
    if fm is None:
        continue
    for k in fm:
        if k not in SKILL_FIELDS:
            errors.append(f"skill {d}: unknown field '{k}'")
    if fm.get("name", d) != d:
        errors.append(f"skill {d}: name '{fm.get('name')}' differs from folder")
    if not NAME_RE.match(d):
        errors.append(f"skill {d}: invalid name")
    desc = str(fm.get("description", ""))
    if not desc:
        errors.append(f"skill {d}: missing description")
    if len(desc) + len(str(fm.get("when_to_use", ""))) > 1536:
        errors.append(f"skill {d}: description + when_to_use over 1536 chars")
    if len(body.splitlines()) > 500:
        warnings.append(f"skill {d}: body over 500 lines")
    skills[d] = fm

agents, used = {}, set()
for f in sorted(os.listdir(AGENTS)):
    if not f.endswith(".md"):
        continue
    p = os.path.join(AGENTS, f)
    fm, body = frontmatter(p)
    if fm is None:
        continue
    name = fm.get("name")
    for k in fm:
        if k not in AGENT_FIELDS:
            errors.append(f"agent {f}: unknown field '{k}'")
    if not name or not NAME_RE.match(str(name)):
        errors.append(f"agent {f}: missing or invalid name")
        continue
    if name in agents:
        errors.append(f"agent {name}: duplicate name")
    if not fm.get("description"):
        errors.append(f"agent {name}: missing description")
    sk = fm.get("skills") or []
    if len(sk) > 32:
        errors.append(f"agent {name}: more than 32 preloaded skills")
    for s in sk:
        if s not in skills:
            errors.append(f"agent {name}: preloads unknown skill '{s}'")
        elif skills[s].get("disable-model-invocation") is True:
            errors.append(f"agent {name}: preloads '{s}', which sets disable-model-invocation")
        used.add(s)
    if len(body.strip()) < 200:
        warnings.append(f"agent {name}: very short system prompt")
    agents[name] = fm

for s, fm in skills.items():
    ag = fm.get("agent")
    if ag and ag not in agents and ag not in {"Explore", "Plan", "general-purpose"}:
        errors.append(f"skill {s}: context agent '{ag}' not found")
    if s not in used and not fm.get("context") and fm.get("disable-model-invocation") is not True:
        warnings.append(f"skill {s}: not preloaded by any agent")

if not 10 <= len(agents) <= 50:
    errors.append(f"agent count {len(agents)} outside 10-50")

if os.path.isfile(ROUTING):
    routing = open(ROUTING, encoding="utf-8").read()
    for name in agents:
        if name != "orchestrator" and name not in routing:
            errors.append(f"agent {name}: missing from expert-routing table")
    for ref in set(re.findall(r"\|\s*([a-z][a-z0-9-]*)\s*\|\s*$", routing, re.M)):
        if ref not in agents:
            errors.append(f"expert-routing references unknown agent '{ref}'")

print(f"agents: {len(agents)}  skills: {len(skills)}  preloaded skills in use: {len(used)}")
for w in warnings:
    print("WARN ", w)
for e in errors:
    print("ERROR", e)
print("OK" if not errors else f"{len(errors)} error(s)")
sys.exit(1 if errors else 0)
