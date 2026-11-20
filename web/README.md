# Experts21 Web: talk to your experts

A React web app for chatting with the Miami coffee shop expert team in this repository.

- **Sidebar.** Lists every agent with its persona name, voice, model (Opus, Sonnet, or Haiku), and a 📎 count of documents in its knowledge folder.
- **Chat with one expert.** Pick an agent and chat. Each agent answers with its own system prompt, preloaded skills, model, and knowledge folder.
- **Ask the whole team.** Marisol (`orchestrator`) picks the right experts and writes each one a brief. The experts answer in parallel, and Marisol combines their answers into one recommendation. You can open each expert's card to see their individual answer.

Your Anthropic API key stays on the server. The browser only talks to two Netlify Functions (`/api/chat`, `/api/route`). Those functions call the Claude API using the `ANTHROPIC_API_KEY` environment variable you set in Netlify.

---

## Deploy to Netlify (step by step)

You need a GitHub account with access to this repository, a free Netlify account, and an Anthropic API key.

### 1. Get an Anthropic API key
1. Sign in at **https://console.anthropic.com** (Claude Console) and open **API Keys**.
2. Click **Create Key**, name it `experts21-netlify`, and copy it. It starts with `sk-ant-`.
3. Recommended: under **Limits** (or **Billing**), set a monthly spend limit for the workspace.

### 2. Create the Netlify site from GitHub
1. Sign in at **https://app.netlify.com**.
2. Click **Add new project** (called **Add new site** on some accounts), then **Import an existing project**.
3. Choose **GitHub**, authorize Netlify, and select the **`Experts21`** repository.
4. **Branch to deploy:** `main`.
5. Leave every build setting as Netlify fills it in. The `netlify.toml` at the repo root already sets everything:
   - Base directory `web`
   - Build command `npm ci && npm run build`
   - Publish directory `dist`
   - Functions directory `netlify/functions`
   - Node 22
6. Don't click Deploy yet. First add the key (step 3). If you already deployed, that's fine: add the key, then redeploy (step 4).

### 3. Add your API key as an environment variable
1. In the new site, go to **Project configuration → Environment variables** (called **Site configuration** on older accounts).
2. Click **Add a variable → Add a single variable**:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** your `sk-ant-...` key
   - **Scopes:** at least **Functions**
   - Tick **Contains secret values** if offered.
3. **Strongly recommended:** add a second variable, **`APP_PASSWORD`**, set to any password you choose. Without it, anyone who finds your site URL can use your API credits. With it, the app asks for the password once per browser before any expert answers.

### 4. Deploy
1. Go to **Deploys → Trigger deploy → Deploy project** (or **Deploy site**).
2. Wait for **Published** (about a minute). The build log should include a line like `[build-team] 29 agents, 42 skills, 43 documents`.
3. Open the site URL (for example `https://your-name.netlify.app`). Pick an expert, or use **Ask the whole team**.

### 5. Updating the team
Netlify rebuilds automatically on every push to `main`. The build reads the repository each time, so these all show up after the next deploy:
- new or edited agents in `.claude/agents/`
- skills in `.claude/skills/`
- documents you drop into `knowledge/<agent-name>/` or `knowledge/shared/`
- research in `docs/`

Environment-variable changes need a redeploy (step 4).

---

## How it works

| Piece | What it does |
|---|---|
| `scripts/build-team.mjs` | Runs at build time. Reads `../.claude/agents/*.md`, the skills each agent preloads, `../knowledge/<agent>/` + `../knowledge/shared/`, and the `docs/*.md` files each agent's prompt points to. Writes `src/generated/team.json` (public: names, personas, models, file lists) and `server/generated/prompts.json` (**server-only**: full prompts and document contents). |
| `netlify/functions/chat.mts` → `/api/chat` | Streams one agent's answer. It builds the agent's system prompt (prompt + skills + knowledge + docs, with prompt caching). PDFs and images from knowledge folders are attached as document or image blocks. Uses the agent's own model. |
| `netlify/functions/route.mts` → `/api/route` | The orchestrator picks 1–6 experts and writes a brief for each (structured output). |
| `src/` | React UI. "Ask the whole team" calls `/api/route`, then `/api/chat` for each expert in parallel, then `/api/chat` with the orchestrator in synthesis mode. |

**Models.** These come from each agent's `model:` field: opus → `claude-opus-5-5`, sonnet → `claude-sonnet-5-5`, haiku → `claude-haiku-5-5`. Opus and Sonnet requests turn on Anthropic's **server-side refusal fallback** (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`). If a model declines a request, it's retried on a fallback model instead of failing. To turn this off, remove `fallbackParams(...)` in `server/lib.ts`.

**Knowledge files.** Markdown, text, CSV, JSON, and YAML are inlined. PDFs and images (PNG, JPEG, GIF, WebP) are attached. Each file can be up to 10 MB, and all of them together up to 25 MB. Other formats (for example `.docx`, `.xlsx`) are skipped with a warning in the build log, so convert them to PDF or Markdown. Files in an `archive/` subfolder are ignored.

---

## Good to know

- **Time limit.** Netlify Functions stop after 60 seconds, so each answer is capped at about 50 seconds of streaming. If an answer is cut off, you'll see a note. Reply "continue", or ask a narrower question. Team mode keeps each call short (experts are asked for under 350 words).
- **No web browsing or file tools in the app.** Agents answer from what was loaded at build time. They'll flag figures that need a live refresh. For web research, or for agents that write files, use the team in Claude Code (see the repo's `CLAUDE.md`).
- **Privacy.** Knowledge documents are bundled into the server functions, never into the browser bundle. They're sent to the Anthropic API when you chat with an agent who reads them. They're also committed to git, so if the repository is public, so are they. Conversations are stored only in your browser (localStorage). Use **New chat** or **New consultation** to clear them.
- **Cost.** Every message is a Claude API call billed to your key. Team questions make several calls: one route, one per expert, and one synthesis. Prompt caching cuts the cost of the large system prompts on repeat messages. Current per-million-token prices are on Anthropic's pricing page.
- **Legal, tax, and insurance answers** are research, not professional advice.

---

## Run it locally (optional)

```bash
cd web
npm install
```

```bash
npm run build
```

The app needs the functions, so use the Netlify CLI from the **repository root** (where `netlify.toml` is):

```bash
ANTHROPIC_API_KEY=sk-ant-your-key npx netlify-cli dev
```

Then open http://localhost:8888. For UI-only work, `npm run dev` inside `web/` serves the interface without the API.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "ANTHROPIC_API_KEY is not set" | Add the variable (step 3) with the **Functions** scope, then redeploy. |
| "The Anthropic API key was rejected" | The key is wrong or revoked. Create a new one and update the variable. |
| "API not found" / 404 on `/api/...` | The functions didn't deploy. Check the deploy log for "Functions bundling" and confirm the base directory is `web`. |
| Password prompt keeps coming back | The password doesn't match `APP_PASSWORD`. Variables are case-sensitive. |
| An expert says "knowledge folder: no documents yet" | Add files to `knowledge/<agent-name>/`, push to `main`, and wait for the redeploy. |
| Build fails at `npm run typecheck` | An agent file changed in a way the app can't read. Run `python3 .claude/skills/agent-and-skill-authoring/scripts/validate_team.py` from the repo root. |
