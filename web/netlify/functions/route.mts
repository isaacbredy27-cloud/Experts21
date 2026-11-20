// POST /api/route — the orchestrator picks experts for a question and writes their briefs.
// Body: { question: string, context?: string }
// Returns: { framing, experts: [{ agent, reason, brief }], model }
import type { Config } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import teamData from "../../src/generated/team.json" with { type: "json" };
import {
  EXPERT_NAMES,
  buildSystem,
  checkRequest,
  client,
  errorMessage,
  fallbackParams,
  json,
  modelFor,
} from "../../server/lib.ts";

const MAX_EXPERTS = 6;
const FALLBACK_SQUAD = ["engagement-lead", "financial-modeler", "insurance-risk-advisor"];

const RoutingSchema = z.object({
  framing: z.string(),
  experts: z.array(
    z.object({
      agent: z.enum(EXPERT_NAMES as [string, ...string[]]),
      reason: z.string(),
      brief: z.string(),
    }),
  ),
});

const roster = teamData.agents
  .filter((a) => EXPERT_NAMES.includes(a.name))
  .map((a) => `- \`${a.name}\` (${a.persona.firstName}, ${a.group}): ${a.description}`)
  .join("\n");

export default async (req: Request): Promise<Response> => {
  const denied = checkRequest(req);
  if (denied) return denied;

  let payload: { question?: unknown; context?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }
  const question = typeof payload.question === "string" ? payload.question.trim() : "";
  if (!question) return json({ error: "question is required" }, 400);
  if (question.length > 20_000) return json({ error: "question is too long" }, 400);
  const context = typeof payload.context === "string" ? payload.context.slice(0, 30_000) : "";

  const model = modelFor("orchestrator");
  try {
    const response = await client.beta.messages.parse({
      model,
      max_tokens: 4000,
      system: buildSystem("orchestrator"),
      output_config: { effort: "low", format: betaZodOutputFormat(RoutingSchema) },
      ...fallbackParams(model),
      messages: [
        {
          role: "user",
          content: `You're planning a team consultation (steps 1–3 of your orchestrate-experts procedure). The experts will run in parallel in this web app after you reply, and you'll synthesize their answers afterwards.

Available experts:
${roster}

Choose the smallest set of experts (1–${MAX_EXPERTS}) that covers the question. Follow your routing rules: include financial-modeler when money is affected, insurance-risk-advisor for irreversible commitments, and engagement-lead for go/no-go or cross-domain trade-offs.

Return:
- framing: 2–4 sentences restating the question, the decision it serves, and the success criteria.
- experts: for each one, a one-line reason and a self-contained brief. The brief is the specific sub-question this expert must answer. Include every fact and constraint they need, because they won't see this conversation. Ask each expert for a concise answer, under 350 words.
${context ? `\nEarlier in this team conversation:\n${context}\n` : ""}
Consultant's question:
${question}`,
        },
      ],
    });

    let experts = response.parsed_output?.experts ?? [];
    let framing = response.parsed_output?.framing ?? question;
    if (response.stop_reason === "refusal" || experts.length === 0) {
      framing = question;
      experts = FALLBACK_SQUAD.map((agent) => ({ agent, reason: "Default squad (routing unavailable).", brief: question }));
    }
    const seen = new Set<string>();
    experts = experts.filter((e) => EXPERT_NAMES.includes(e.agent) && !seen.has(e.agent) && seen.add(e.agent)).slice(0, MAX_EXPERTS);

    return json({ framing, experts, model: response.model });
  } catch (err) {
    console.error(err);
    if (err instanceof Anthropic.APIError) return json({ error: errorMessage(err) }, 502);
    // The response arrived but couldn't be parsed: fall back to a sensible default squad.
    return json({ framing: question, experts: FALLBACK_SQUAD.map((agent) => ({ agent, reason: "Default squad (routing unavailable).", brief: question })), model });
  }
};

export const config: Config = { path: "/api/route" };
