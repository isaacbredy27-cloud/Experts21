import { useEffect, useRef, useState } from "react";
import { PasswordRequiredError, routeQuestion, streamChat, type RoutedExpert } from "../api";
import { load, remove, save } from "../storage";
import { agentByName, displayName, orchestrator } from "../team";
import { Avatar, ModelBadge } from "./Avatar";
import { Composer } from "./Composer";
import { Markdown } from "./Markdown";

type ExpertStatus = "waiting" | "working" | "done" | "error";

interface ExpertRun extends RoutedExpert {
  status: ExpertStatus;
  text: string;
  error?: string;
}

interface Consultation {
  question: string;
  phase: "routing" | "experts" | "synthesis" | "done" | "error" | "stopped";
  framing?: string;
  experts: ExpertRun[];
  answer: string;
  error?: string;
}

const STORAGE_KEY = "experts21.team";
const MAX_EXPERT_CHARS = 15_000;

function priorContext(history: Consultation[]): string {
  return history
    .filter((c) => c.phase === "done" && c.answer)
    .slice(-2)
    .map((c) => `Q: ${c.question}\nTeam answer (summary): ${c.answer.slice(0, 6000)}`)
    .join("\n\n");
}

export function TeamChat({ onPasswordNeeded }: { onPasswordNeeded: () => void }) {
  const [history, setHistory] = useState<Consultation[]>(() =>
    load<Consultation[]>(STORAGE_KEY, []).map((c) => (c.phase === "done" || c.phase === "error" || c.phase === "stopped" ? c : { ...c, phase: "stopped" })),
  );
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    save(STORAGE_KEY, history);
  }, [history]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [history]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const update = (index: number, fn: (c: Consultation) => Consultation) =>
    setHistory((h) => h.map((c, i) => (i === index ? fn(c) : c)));

  const ask = async (question: string) => {
    const index = history.length;
    const context = priorContext(history);
    setHistory((h) => [...h, { question, phase: "routing", experts: [], answer: "" }]);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    try {
      // 1. Orchestrator picks experts and writes their briefs.
      const plan = await routeQuestion(question, context, signal);
      const experts: ExpertRun[] = plan.experts.map((e) => ({ ...e, status: "working", text: "" }));
      update(index, (c) => ({ ...c, phase: "experts", framing: plan.framing, experts }));

      // 2. Experts run in parallel, each streaming into its own card.
      const outputs = await Promise.all(
        plan.experts.map(async (e, i) => {
          const setExpert = (patch: Partial<ExpertRun>) =>
            update(index, (c) => ({ ...c, experts: c.experts.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
          const prompt = `Consultant's question:\n${question}\n\n${context ? `Earlier in this team conversation:\n${context}\n\n` : ""}Framing from ${orchestrator.persona.firstName} (orchestrator):\n${plan.framing}\n\nYour assignment:\n${e.brief}\n\nAnswer concisely (under 350 words) using your output contract. Sign your answer.`;
          try {
            const r = await streamChat(e.agent, [{ role: "user", content: prompt }], "team-expert", (t) => setExpert({ text: t }), signal);
            setExpert({ status: "done", text: r.text });
            return { agent: e.agent, text: r.text };
          } catch (err) {
            if (err instanceof PasswordRequiredError) throw err;
            const msg = err instanceof Error ? err.message : String(err);
            setExpert({ status: "error", error: msg });
            return { agent: e.agent, text: `(This expert failed: ${msg})` };
          }
        }),
      );
      if (signal.aborted) return;

      // 3. Orchestrator reconciles and writes one combined answer.
      update(index, (c) => ({ ...c, phase: "synthesis" }));
      const expertBlock = outputs
        .map((o) => `### ${displayName(o.agent)} (\`${o.agent}\`)\n\n${o.text.slice(0, MAX_EXPERT_CHARS)}`)
        .join("\n\n");
      const synthesisPrompt = `Consultant's question:\n${question}\n\n${context ? `Earlier in this team conversation:\n${context}\n\n` : ""}Your framing:\n${plan.framing}\n\nThe experts below already ran in parallel in this web app (round 1). Now do steps 4–5 of your orchestrate-experts procedure. Round 2 isn't available here, so reconcile conflicts yourself and state any disagreement that remains. Return ONE combined answer in the executive-briefing format. Credit experts by persona and agent name, end with "Experts consulted:", and sign it.\n\n## Expert outputs\n\n${expertBlock}`;
      const r = await streamChat("orchestrator", [{ role: "user", content: synthesisPrompt }], "synthesis", (t) => update(index, (c) => ({ ...c, answer: t })), signal);
      update(index, (c) => ({ ...c, phase: "done", answer: r.text }));
    } catch (err) {
      if (signal.aborted) {
        update(index, (c) => ({ ...c, phase: "stopped" }));
      } else if (err instanceof PasswordRequiredError) {
        setHistory((h) => h.slice(0, index));
        onPasswordNeeded();
      } else {
        update(index, (c) => ({ ...c, phase: "error", error: err instanceof Error ? err.message : String(err) }));
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="chat">
      <header className="chat-header">
        <span className="team-icon big" aria-hidden="true">
          ☕
        </span>
        <div className="chat-title">
          <h1>Ask the whole team</h1>
          <p className="description">
            {orchestrator.persona.firstName} (orchestrator, <ModelBadge model={orchestrator.model} />) picks the right experts for your question. They work in
            parallel, each with their own knowledge folder and model, and {orchestrator.persona.firstName} combines their answers into one recommendation.
          </p>
        </div>
        {history.length > 0 && !busy && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              setHistory([]);
              remove(STORAGE_KEY);
            }}
          >
            New consultation
          </button>
        )}
      </header>

      <div className="messages" aria-live="polite">
        {history.length === 0 && (
          <div className="empty">
            <p>Try a decision question, for example:</p>
            <ul className="examples">
              <li>Should we sign the 801 Brickell lease as offered? What should we negotiate?</li>
              <li>Brickell or Coral Way for our first location, with a $400k budget?</li>
              <li>Design our launch menu and prices and check we can hit about 30% cost of goods.</li>
            </ul>
          </div>
        )}
        {history.map((c, i) => (
          <ConsultationView key={i} c={c} />
        ))}
        <div ref={endRef} />
      </div>

      <Composer
        placeholder="Ask the whole team (Enter to send)"
        busy={busy}
        onSend={ask}
        onStop={() => abortRef.current?.abort()}
      />
    </div>
  );
}

function ConsultationView({ c }: { c: Consultation }) {
  const doneCount = c.experts.filter((e) => e.status === "done" || e.status === "error").length;
  return (
    <div className="consultation">
      <div className="msg msg-user">
        <div className="bubble">{c.question}</div>
      </div>

      <div className="steps">
        <Step active={c.phase === "routing"} done={c.phase !== "routing"}>
          {orchestrator.persona.firstName} is choosing experts
        </Step>
        {c.experts.length > 0 && (
          <Step active={c.phase === "experts"} done={["synthesis", "done"].includes(c.phase)}>
            {c.experts.length} expert{c.experts.length > 1 ? "s" : ""} working ({doneCount}/{c.experts.length} done)
          </Step>
        )}
        {["synthesis", "done"].includes(c.phase) && (
          <Step active={c.phase === "synthesis"} done={c.phase === "done"}>
            {orchestrator.persona.firstName} is combining their answers
          </Step>
        )}
      </div>

      {c.framing && <p className="framing">{c.framing}</p>}

      {c.experts.length > 0 && (
        <div className="expert-grid">
          {c.experts.map((e) => {
            const a = agentByName.get(e.agent);
            return (
              <details key={e.agent} className={`expert-card status-${e.status}`}>
                <summary>
                  {a && <Avatar agent={a} size={26} />}
                  <span className="expert-name">
                    <strong>{a?.persona.firstName ?? e.agent}</strong> <span className="muted">{e.agent}</span>
                  </span>
                  {a && <ModelBadge model={a.model} />}
                  <span className="expert-status">{e.status === "working" ? "working…" : e.status === "error" ? "failed" : e.status === "done" ? "done" : ""}</span>
                </summary>
                <p className="reason">
                  <em>Why:</em> {e.reason}
                </p>
                <p className="brief">
                  <em>Brief:</em> {e.brief}
                </p>
                {e.error ? <div className="error">⚠️ {e.error}</div> : <Markdown text={e.text || "…"} />}
              </details>
            );
          })}
        </div>
      )}

      {c.answer && (
        <div className="msg msg-agent answer">
          <Avatar agent={orchestrator} size={30} />
          <div className="bubble">
            <Markdown text={c.answer} />
          </div>
        </div>
      )}
      {c.phase === "error" && <div className="error">⚠️ {c.error}</div>}
      {c.phase === "stopped" && <div className="muted small">Stopped.</div>}
    </div>
  );
}

function Step({ active, done, children }: { active: boolean; done: boolean; children: React.ReactNode }) {
  return <div className={`step ${active ? "active" : ""} ${done ? "done" : ""}`}>{done ? "✓" : active ? <span className="spinner" /> : "•"} {children}</div>;
}
