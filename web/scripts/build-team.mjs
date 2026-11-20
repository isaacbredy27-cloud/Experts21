// Build-time step: read the expert team from this repo and generate data for the web app.
//
// Inputs (relative to the repo root, one level above web/):
//   .claude/agents/*.md              agent definitions (frontmatter + system prompt)
//   .claude/skills/<name>/SKILL.md   skills each agent preloads (frontmatter `skills:`)
//   knowledge/<agent>/ + shared/     documents each agent reads before answering
//   docs/*.md                        research files an agent's prompt tells it to read
//   CLAUDE.md                        team grouping (for the sidebar)
//
// Outputs:
//   src/generated/team.json          PUBLIC: names, personas, models, file lists (shipped to the browser)
//   server/generated/prompts.json    SERVER-ONLY: full system prompts + knowledge contents (bundled into
//                                    the Netlify Functions, never sent to the browser)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const here = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(here, "..");
const ROOT = path.resolve(WEB, "..");
const AGENTS_DIR = path.join(ROOT, ".claude", "agents");
const SKILLS_DIR = path.join(ROOT, ".claude", "skills");
const KNOWLEDGE_DIR = path.join(ROOT, "knowledge");
const DOCS_DIR = path.join(ROOT, "docs");

const TEXT_EXT = new Set([".md", ".markdown", ".txt", ".csv", ".tsv", ".json", ".yaml", ".yml", ".html", ".xml"]);
const IMAGE_EXT = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp" };
const MAX_TEXT_CHARS = 200_000; // per text file
const MAX_BINARY_BYTES = 10 * 1024 * 1024; // per PDF/image
const MAX_TOTAL_BINARY_BYTES = 25 * 1024 * 1024; // all PDFs/images together (request limit is 32 MB)

const MODEL_IDS = { opus: "claude-opus-5-5", sonnet: "claude-sonnet-5-5", haiku: "claude-haiku-5-5", inherit: "claude-opus-5-5" };

const warnings = [];
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

function readFrontmatter(file) {
  const text = fs.readFileSync(file, "utf8");
  if (!text.startsWith("---\n")) return { data: {}, body: text };
  const end = text.indexOf("\n---", 4);
  if (end === -1) return { data: {}, body: text };
  return { data: parseYaml(text.slice(4, end)) ?? {}, body: text.slice(end + 4).replace(/^\n+/, "") };
}

function resolveModel(model) {
  if (!model) return { alias: "inherit", id: MODEL_IDS.inherit };
  if (MODEL_IDS[model]) return { alias: model, id: MODEL_IDS[model] };
  if (String(model).startsWith("claude-")) return { alias: model, id: model };
  warnings.push(`Unknown model "${model}", using ${MODEL_IDS.inherit}`);
  return { alias: "inherit", id: MODEL_IDS.inherit };
}

// ---- documents (deduplicated: shared files are stored once) ----
const documents = {}; // path -> {kind, mediaType, data}
let totalBinary = 0;

function loadFolder(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "archive") continue; // superseded versions
        walk(full);
        continue;
      }
      const key = rel(full);
      const ext = path.extname(entry.name).toLowerCase();
      const size = fs.statSync(full).size;
      const info = { path: key, name: entry.name, size, status: "loaded" };
      if (!documents[key]) {
        if (TEXT_EXT.has(ext)) {
          let text = fs.readFileSync(full, "utf8");
          if (text.length > MAX_TEXT_CHARS) {
            text = text.slice(0, MAX_TEXT_CHARS);
            info.status = "truncated";
            warnings.push(`${key}: truncated to ${MAX_TEXT_CHARS} characters`);
          }
          documents[key] = { kind: "text", text };
        } else if (ext === ".pdf" || IMAGE_EXT[ext]) {
          if (size > MAX_BINARY_BYTES || totalBinary + size > MAX_TOTAL_BINARY_BYTES) {
            info.status = "skipped: too large";
            warnings.push(`${key}: skipped (too large for one request)`);
          } else {
            totalBinary += size;
            documents[key] = {
              kind: ext === ".pdf" ? "pdf" : "image",
              mediaType: ext === ".pdf" ? "application/pdf" : IMAGE_EXT[ext],
              data: fs.readFileSync(full).toString("base64"),
            };
          }
        } else {
          info.status = "skipped: unsupported type (convert to PDF, Markdown, or text)";
          warnings.push(`${key}: unsupported file type, not loaded`);
        }
      } else if (documents[key] === null) {
        info.status = "skipped";
      }
      if (info.status.startsWith("skipped") && !documents[key]) documents[key] = null;
      files.push(info);
    }
  };
  walk(dir);
  return files;
}

// ---- team grouping from CLAUDE.md ----
const groups = {};
const claudeMd = fs.existsSync(path.join(ROOT, "CLAUDE.md")) ? fs.readFileSync(path.join(ROOT, "CLAUDE.md"), "utf8") : "";
for (const line of claudeMd.split("\n")) {
  const m = line.match(/^\s*-\s+\*\*([^*]+):\*\*\s+(.+)$/);
  if (!m) continue;
  for (const name of m[2].matchAll(/`([a-z0-9-]+)`/g)) groups[name[1]] = m[1].trim();
}

// ---- skills ----
const skillCache = {};
function loadSkill(name) {
  if (skillCache[name] !== undefined) return skillCache[name];
  const file = path.join(SKILLS_DIR, name, "SKILL.md");
  if (!fs.existsSync(file)) {
    warnings.push(`skill "${name}" not found`);
    return (skillCache[name] = null);
  }
  return (skillCache[name] = readFrontmatter(file).body.trim());
}

// ---- agents ----
const sharedFiles = loadFolder(path.join(KNOWLEDGE_DIR, "shared"));
const decisionLog = path.join(DOCS_DIR, "decision-log.md");

const publicAgents = [];
const prompts = {};

for (const file of fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith(".md")).sort()) {
  const { data, body } = readFrontmatter(path.join(AGENTS_DIR, file));
  if (!data.name || !data.description) {
    warnings.push(`${file}: missing name or description, skipped`);
    continue;
  }
  const name = String(data.name);
  const model = resolveModel(data.model);
  const persona = {
    firstName: body.match(/Your name is \*\*(.+?)\*\*/)?.[1] ?? name,
    voice: body.match(/\*\*Voice:\*\*\s*(.+)/)?.[1]?.trim() ?? "",
    workingStyle: body.match(/\*\*Working style:\*\*\s*(.+)/)?.[1]?.trim() ?? "",
  };
  const skills = Array.isArray(data.skills) ? data.skills.map(String) : [];
  const ownFiles = loadFolder(path.join(KNOWLEDGE_DIR, name));
  const docRefs = [...new Set([...body.matchAll(/docs\/[A-Za-z0-9._-]+\.md/g)].map((m) => m[0]))].filter((d) =>
    fs.existsSync(path.join(ROOT, d)),
  );
  if (fs.existsSync(decisionLog) && !docRefs.includes("docs/decision-log.md")) docRefs.push("docs/decision-log.md");
  for (const d of docRefs) loadFolderFile(d);

  prompts[name] = {
    modelId: model.id,
    body,
    skills: skills.map((s) => ({ name: s, text: loadSkill(s) })).filter((s) => s.text),
    knowledge: ownFiles.map((f) => f.path),
    shared: sharedFiles.map((f) => f.path),
    docs: docRefs,
  };

  publicAgents.push({
    name,
    description: String(data.description),
    group: name === "orchestrator" || name === "agent-builder" ? "Coordination" : groups[name] ?? "Other",
    model: model.alias,
    modelId: model.id,
    color: data.color ?? null,
    persona,
    skills,
    knowledgeFiles: ownFiles,
  });
}

function loadFolderFile(relPath) {
  if (documents[relPath] !== undefined) return;
  const text = fs.readFileSync(path.join(ROOT, relPath), "utf8");
  documents[relPath] = { kind: "text", text: text.slice(0, MAX_TEXT_CHARS) };
}

const groupOrder = ["Coordination", "Leadership", "Market", "Product", "Real estate and build", "Technical", "Operations", "Finance", "Legal and risk", "Marketing and revenue", "Other"];
publicAgents.sort(
  (a, b) => groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group) || (a.name === "orchestrator" ? -1 : b.name === "orchestrator" ? 1 : 0) || a.name.localeCompare(b.name),
);

if (!prompts.orchestrator) throw new Error("No orchestrator agent found in .claude/agents/ - the 'Ask the whole team' mode needs it.");

const builtAt = new Date().toISOString();
const team = { builtAt, sharedFiles, agents: publicAgents, warnings };

fs.mkdirSync(path.join(WEB, "src", "generated"), { recursive: true });
fs.mkdirSync(path.join(WEB, "server", "generated"), { recursive: true });
fs.writeFileSync(path.join(WEB, "src", "generated", "team.json"), JSON.stringify(team, null, 2));
fs.writeFileSync(path.join(WEB, "server", "generated", "prompts.json"), JSON.stringify({ builtAt, prompts, documents }));

const loadedDocs = Object.values(documents).filter(Boolean).length;
console.log(`[build-team] ${publicAgents.length} agents, ${Object.keys(skillCache).length} skills, ${loadedDocs} documents (${(totalBinary / 1024).toFixed(0)} KB binary)`);
for (const w of warnings) console.warn(`[build-team] warning: ${w}`);
