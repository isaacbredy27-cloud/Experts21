import { useEffect, useRef, useState } from "react";
import { PasswordRequiredError, streamChat, type Turn } from "../api";
import { load, remove, save } from "../storage";
import { type Agent, team, userDocs } from "../team";
import { Avatar, ModelBadge } from "./Avatar";
import { Composer } from "./Composer";
import { Markdown } from "./Markdown";

const MAX_HISTORY_TURNS = 30;

export function AgentChat({ agent, onPasswordNeeded }: { agent: Agent; onPasswordNeeded: () => void }) {
  const storageKey = `experts21.chat.${agent.name}`;
  const [turns, setTurns] = useState<Turn[]>(() => load<Turn[]>(storageKey, []));
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    save(storageKey, turns);
  }, [storageKey, turns]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns, streaming]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (text: string) => {
    setError(null);
    const history = [...turns, { role: "user" as const, content: text }];
    setTurns(history);
    setStreaming("");
    const controller = new AbortController();
    abortRef.current = controller;
    let partial = "";
    try {
      const result = await streamChat(agent.name, history.slice(-MAX_HISTORY_TURNS), "chat", (t) => setStreaming((partial = t)), controller.signal);
      setTurns([...history, { role: "assistant", content: result.text || "_(no answer)_" }]);
    } catch (err) {
      if (controller.signal.aborted) {
        setTurns(partial ? [...history, { role: "assistant", content: partial + "\n\n*[Stopped]*" }] : history.slice(0, -1));
      } else if (err instanceof PasswordRequiredError) {
        setTurns(turns);
        onPasswordNeeded();
      } else {
        setTurns(partial ? [...history, { role: "assistant", content: partial }] : history);
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setStreaming(null);
      abortRef.current = null;
    }
  };

  const docs = userDocs(agent.knowledgeFiles);
  const shared = userDocs(team.sharedFiles);

  return (
    <div className="chat">
      <header className="chat-header">
        <Avatar agent={agent} size={48} />
        <div className="chat-title">
          <h1>
            {agent.persona.firstName} <span className="muted">· {agent.name}</span> <ModelBadge model={agent.model} />
          </h1>
          <p className="description">{agent.description}</p>
          <details className="persona">
            <summary>Personality, knowledge &amp; skills</summary>
            <dl>
              <dt>Voice</dt>
              <dd>{agent.persona.voice}</dd>
              <dt>Working style</dt>
              <dd>{agent.persona.workingStyle}</dd>
              <dt>Model</dt>
              <dd>
                <code>{agent.modelId}</code>
              </dd>
              <dt>Knowledge folder</dt>
              <dd>
                {docs.length ? (
                  <ul>
                    {docs.map((f) => (
                      <li key={f.path}>
                        <code>{f.name}</code> {f.status !== "loaded" && <em className="warn">({f.status})</em>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="muted">No documents yet. Add files to <code>knowledge/{agent.name}/</code> and redeploy.</span>
                )}
                {shared.length > 0 && <span className="muted">Also reads {shared.length} shared document(s).</span>}
              </dd>
              <dt>Skills</dt>
              <dd>{agent.skills.length ? agent.skills.map((s) => <code key={s} className="chip">{s}</code>) : <span className="muted">none</span>}</dd>
            </dl>
          </details>
        </div>
        {turns.length > 0 && !streaming && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              setTurns([]);
              remove(storageKey);
              setError(null);
            }}
          >
            New chat
          </button>
        )}
      </header>

      <div className="messages" aria-live="polite">
        {turns.length === 0 && streaming === null && (
          <div className="empty">
            <p>
              Ask {agent.persona.firstName} anything in their area. {agent.persona.firstName} reads their knowledge folder before every answer
              {docs.length ? ` (${docs.length} document${docs.length > 1 ? "s" : ""} loaded)` : ""}.
            </p>
          </div>
        )}
        {turns.map((t, i) => (
          <Message key={i} turn={t} agent={agent} />
        ))}
        {streaming !== null && <Message turn={{ role: "assistant", content: streaming || "…" }} agent={agent} live />}
        {error && <div className="error">⚠️ {error}</div>}
        <div ref={endRef} />
      </div>

      <Composer
        placeholder={`Message ${agent.persona.firstName} (Enter to send, Shift+Enter for a new line)`}
        busy={streaming !== null}
        onSend={send}
        onStop={() => abortRef.current?.abort()}
      />
    </div>
  );
}

function Message({ turn, agent, live }: { turn: Turn; agent: Agent; live?: boolean }) {
  if (turn.role === "user") {
    return (
      <div className="msg msg-user">
        <div className="bubble">{turn.content}</div>
      </div>
    );
  }
  return (
    <div className={`msg msg-agent ${live ? "live" : ""}`}>
      <Avatar agent={agent} size={30} />
      <div className="bubble">
        <Markdown text={turn.content} />
      </div>
    </div>
  );
}
