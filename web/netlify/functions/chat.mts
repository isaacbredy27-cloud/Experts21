// POST /api/chat — stream one agent's answer.
// Body: { agent: string, mode?: "chat" | "team-expert" | "synthesis", messages: {role, content}[] }
import type { Config } from "@netlify/functions";
import { AGENT_NAMES, checkRequest, json, streamAgent, validateTurns } from "../../server/lib.ts";

const MODES = {
  chat: { maxTokens: 8000, effort: "medium" },
  "team-expert": { maxTokens: 3000, effort: "low" },
  synthesis: { maxTokens: 6000, effort: "medium" },
} as const;

export default async (req: Request): Promise<Response> => {
  const denied = checkRequest(req);
  if (denied) return denied;

  let payload: { agent?: unknown; mode?: unknown; messages?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }

  const agent = typeof payload.agent === "string" ? payload.agent : "";
  if (!AGENT_NAMES.includes(agent)) return json({ error: `Unknown agent "${agent}".` }, 400);

  const mode = (typeof payload.mode === "string" && payload.mode in MODES ? payload.mode : "chat") as keyof typeof MODES;
  if (mode === "synthesis" && agent !== "orchestrator") return json({ error: "Only the orchestrator synthesizes." }, 400);

  const turns = validateTurns(payload.messages);
  if (typeof turns === "string") return json({ error: turns }, 400);

  return streamAgent({ agent, turns, ...MODES[mode] });
};

export const config: Config = { path: "/api/chat" };
