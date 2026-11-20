// Browser-side API client. Talks only to this site's Netlify Functions (/api/*), never to Anthropic directly.

export interface Turn {
  role: "user" | "assistant";
  content: string;
}

export interface RoutedExpert {
  agent: string;
  reason: string;
  brief: string;
}

export interface RoutePlan {
  framing: string;
  experts: RoutedExpert[];
  model?: string;
}

export class PasswordRequiredError extends Error {}

const PASSWORD_KEY = "experts21.password";

export function getPassword(): string {
  try {
    return localStorage.getItem(PASSWORD_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setPassword(value: string) {
  try {
    localStorage.setItem(PASSWORD_KEY, value);
  } catch {
    /* storage unavailable: password lasts for this page only */
  }
  memoryPassword = value;
}

let memoryPassword = "";

function headers(): HeadersInit {
  const pw = getPassword() || memoryPassword;
  return { "content-type": "application/json", ...(pw ? { "x-app-password": pw } : {}) };
}

async function errorFrom(res: Response): Promise<Error> {
  if (res.status === 401) return new PasswordRequiredError("Password required");
  let message = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    if (body?.error) message = body.error;
  } catch {
    if (res.status === 404) message = "API not found. Are the Netlify Functions deployed? (Locally, use `netlify dev`.)";
  }
  return new Error(message);
}

export async function routeQuestion(question: string, context: string, signal?: AbortSignal): Promise<RoutePlan> {
  const res = await fetch("/api/route", { method: "POST", headers: headers(), body: JSON.stringify({ question, context }), signal });
  if (!res.ok) throw await errorFrom(res);
  return res.json();
}

export interface StreamResult {
  text: string;
  model?: string;
  stop?: string | null;
}

/** Stream one agent's answer. `onText` receives the full text so far. */
export async function streamChat(
  agent: string,
  messages: Turn[],
  mode: "chat" | "team-expert" | "synthesis",
  onText: (text: string) => void,
  signal?: AbortSignal,
): Promise<StreamResult> {
  const res = await fetch("/api/chat", { method: "POST", headers: headers(), body: JSON.stringify({ agent, mode, messages }), signal });
  if (!res.ok || !res.body) throw await errorFrom(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const result: StreamResult = { text: "" };

  const handle = (line: string) => {
    if (!line.trim()) return;
    let event: { t: string; v?: string; model?: string; stop?: string | null };
    try {
      event = JSON.parse(line);
    } catch {
      return;
    }
    if (event.t === "meta") result.model = event.model;
    else if (event.t === "text" && event.v) {
      result.text += event.v;
      onText(result.text);
    } else if (event.t === "done") {
      result.model = event.model ?? result.model;
      result.stop = event.stop;
    } else if (event.t === "error") throw new Error(event.v ?? "Unknown error");
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      handle(buffer.slice(0, nl));
      buffer = buffer.slice(nl + 1);
    }
  }
  handle(buffer + decoder.decode());
  return result;
}
