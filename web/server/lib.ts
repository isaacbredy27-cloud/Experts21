// Shared server-side logic for the Netlify Functions. Never imported by the browser bundle.
import Anthropic from "@anthropic-ai/sdk";
import { timingSafeEqual } from "node:crypto";
import data from "./generated/prompts.json" with { type: "json" };

type DocEntry =
  | { kind: "text"; text: string }
  | { kind: "pdf" | "image"; mediaType: string; data: string }
  | null;

interface AgentPrompt {
  modelId: string;
  body: string;
  skills: { name: string; text: string }[];
  knowledge: string[];
  shared: string[];
  docs: string[];
}

const PROMPTS = data.prompts as Record<string, AgentPrompt>;
const DOCUMENTS = data.documents as Record<string, DocEntry>;
export const BUILT_AT = data.builtAt as string;
export const AGENT_NAMES = Object.keys(PROMPTS);
export const EXPERT_NAMES = AGENT_NAMES.filter((n) => n !== "orchestrator" && n !== "agent-builder");

// Models that support server-side refusal fallback (`fallbacks: "default"`).
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-sonnet-5-5"]);
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

/** Netlify functions have a 60 s execution limit; stop streaming a little before it. */
export const TIME_BUDGET_MS = 52_000;

export const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the Netlify environment

// ---------- auth & validation ----------

export function checkRequest(req: Request): Response | null {
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: "ANTHROPIC_API_KEY is not set. Add it in Netlify: Site configuration → Environment variables, then redeploy." }, 500);
  }
  const required = process.env.APP_PASSWORD;
  if (required) {
    const given = req.headers.get("x-app-password") ?? "";
    const a = Buffer.from(given);
    const b = Buffer.from(required);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return json({ error: "Password required." }, 401);
  }
  return null;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const MAX_TURNS = 40;
const MAX_CHARS_PER_TURN = 120_000;
const MAX_TOTAL_CHARS = 250_000;

export function validateTurns(value: unknown): ChatTurn[] | string {
  if (!Array.isArray(value) || value.length === 0) return "messages must be a non-empty array";
  if (value.length > MAX_TURNS) return `Too many messages (max ${MAX_TURNS}). Start a new chat.`;
  let total = 0;
  const turns: ChatTurn[] = [];
  for (const m of value) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string" || !m.content.trim()) {
      return "Each message needs role 'user' or 'assistant' and non-empty string content.";
    }
    if (m.content.length > MAX_CHARS_PER_TURN) return "A message is too long.";
    total += m.content.length;
    turns.push({ role: m.role, content: m.content });
  }
  if (total > MAX_TOTAL_CHARS) return "This conversation is too long. Start a new chat.";
  if (turns[0].role !== "user" || turns[turns.length - 1].role !== "user") return "The conversation must start and end with a user message.";
  return turns;
}

// ---------- prompt construction ----------

const WEB_PREAMBLE = `# Running in the Experts21 web app
You are answering inside a web chat app, not inside Claude Code. In this app you have **no tools**: you can't read or write files, browse the web, save memory, or call other agents.

Everything your instructions tell you to read has already been loaded for you below, as it was in the repository when the app was built: your preloaded skills, your knowledge folder, \`knowledge/shared/\`, and the \`docs/\` files your instructions point to. PDFs and images from those folders are attached at the start of the conversation. Treat these loaded copies as the files themselves. When your instructions say "list" or "read" a file, use these copies. Never claim to have read a file that isn't included here. If a figure needs a live web check, say which figure and why, and mark it as needing a refresh.

Ignore instructions about spawning agents, writing files, or updating memory. Instead, tell the consultant what should be saved and where.`;

function header(title: string, body: string) {
  return `\n\n---\n## ${title}\n\n${body.trim()}`;
}

const systemCache = new Map<string, Anthropic.Beta.BetaTextBlockParam[]>();

/** Deterministic, byte-stable system prompt per agent (so prompt caching hits on every turn). */
export function buildSystem(agent: string): Anthropic.Beta.BetaTextBlockParam[] {
  const cached = systemCache.get(agent);
  if (cached) return cached;
  const p = PROMPTS[agent];
  const binary = [...p.knowledge, ...p.shared].filter((path) => {
    const d = DOCUMENTS[path];
    return d && d.kind !== "text";
  });
  const textFiles = (paths: string[]) =>
    paths
      .map((path) => {
        const d = DOCUMENTS[path];
        if (!d) return `### \`${path}\`\n(not loaded: unsupported or too large)`;
        if (d.kind !== "text") return `### \`${path}\`\n(attached as a ${d.kind === "pdf" ? "PDF" : "image"} at the start of the conversation)`;
        return `### \`${path}\`\n\n${d.text.trim()}`;
      })
      .join("\n\n");

  let text = WEB_PREAMBLE + "\n\n---\n\n" + p.body.trim();
  if (p.skills.length) text += header("Your preloaded skills", p.skills.map((s) => `### Skill: ${s.name}\n\n${s.text}`).join("\n\n"));
  text += header(
    `Your knowledge folder (\`knowledge/${agent}/\`), loaded at build time`,
    p.knowledge.length ? textFiles(p.knowledge) : "(folder is empty)",
  );
  text += header("Shared knowledge folder (`knowledge/shared/`)", p.shared.length ? textFiles(p.shared) : "(folder is empty)");
  if (p.docs.length) text += header("Research files your instructions point to", textFiles(p.docs));
  if (binary.length) text += header("Attached files", binary.map((b) => `- \`${b}\``).join("\n"));
  text += `\n\n(Team data built ${BUILT_AT}.)`;

  const blocks: Anthropic.Beta.BetaTextBlockParam[] = [{ type: "text", text, cache_control: { type: "ephemeral" } }];
  systemCache.set(agent, blocks);
  return blocks;
}

/** PDFs and images from the agent's knowledge folders, prepended to the first user message. */
function attachmentBlocks(agent: string): Anthropic.Beta.BetaContentBlockParam[] {
  const p = PROMPTS[agent];
  const blocks: Anthropic.Beta.BetaContentBlockParam[] = [];
  for (const path of [...p.knowledge, ...p.shared]) {
    const d = DOCUMENTS[path];
    if (!d || d.kind === "text") continue;
    if (d.kind === "pdf") {
      blocks.push({ type: "document", title: path, source: { type: "base64", media_type: "application/pdf", data: d.data } });
    } else {
      blocks.push({ type: "text", text: `Image file: ${path}` });
      blocks.push({
        type: "image",
        source: { type: "base64", media_type: d.mediaType as "image/png" | "image/jpeg" | "image/gif" | "image/webp", data: d.data },
      });
    }
  }
  if (blocks.length) {
    const last = blocks[blocks.length - 1] as { cache_control?: Anthropic.Beta.BetaCacheControlEphemeral };
    last.cache_control = { type: "ephemeral" };
  }
  return blocks;
}

export function buildMessages(agent: string, turns: ChatTurn[]): Anthropic.Beta.BetaMessageParam[] {
  const attachments = attachmentBlocks(agent);
  return turns.map((t, i) => {
    if (i === 0 && attachments.length) {
      return { role: "user", content: [...attachments, { type: "text", text: t.content }] };
    }
    return { role: t.role, content: t.content };
  });
}

export function modelFor(agent: string): string {
  return PROMPTS[agent].modelId;
}

export function fallbackParams(modelId: string): { betas?: string[]; fallbacks?: "default" } {
  return FALLBACK_MODELS.has(modelId) ? { betas: [FALLBACK_BETA], fallbacks: "default" } : {};
}

// ---------- streaming to the browser (newline-delimited JSON events) ----------

export type StreamEvent =
  | { t: "meta"; agent: string; model: string }
  | { t: "text"; v: string }
  | { t: "done"; stop: string | null; model: string; usage?: unknown }
  | { t: "error"; v: string };

export function errorMessage(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "The Anthropic API key was rejected. Check ANTHROPIC_API_KEY in Netlify.";
  if (err instanceof Anthropic.PermissionDeniedError) return "This API key doesn't have access to that model.";
  if (err instanceof Anthropic.NotFoundError) return "Model not found for this API key.";
  if (err instanceof Anthropic.RateLimitError) return "Rate limited by the Anthropic API. Wait a moment and try again.";
  if (err instanceof Anthropic.BadRequestError) return `The API rejected the request: ${err.message}`;
  if (err instanceof Anthropic.APIError) return `Anthropic API error ${err.status ?? ""}: ${err.message}`;
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export function streamAgent(params: {
  agent: string;
  turns: ChatTurn[];
  maxTokens: number;
  effort: "low" | "medium" | "high";
}): Response {
  const { agent, turns, maxTokens, effort } = params;
  const model = modelFor(agent);
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      send({ t: "meta", agent, model });
      let timedOut = false;
      const stream = client.beta.messages.stream({
        model,
        max_tokens: maxTokens,
        system: buildSystem(agent),
        messages: buildMessages(agent, turns),
        output_config: { effort },
        ...fallbackParams(model),
      });
      const timer = setTimeout(() => {
        timedOut = true;
        stream.abort();
      }, TIME_BUDGET_MS);
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") send({ t: "text", v: event.delta.text });
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          send({ t: "error", v: "The model declined to answer this request (safety refusal). Try rephrasing the question." });
        } else if (final.stop_reason === "max_tokens") {
          send({ t: "text", v: "\n\n*[Answer cut off at the length limit. Ask me to continue.]*" });
        }
        send({ t: "done", stop: final.stop_reason, model: final.model, usage: final.usage });
      } catch (err) {
        if (timedOut) {
          send({ t: "text", v: "\n\n*[Stopped at the hosting time limit (about 50 seconds). Ask me to continue, or ask a narrower question.]*" });
          send({ t: "done", stop: "time_limit", model });
        } else {
          console.error(err);
          send({ t: "error", v: errorMessage(err) });
        }
      } finally {
        clearTimeout(timer);
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}
