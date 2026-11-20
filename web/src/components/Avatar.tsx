import type { Agent } from "../team";

const PALETTE: Record<string, string> = {
  purple: "var(--c-purple)",
  blue: "var(--c-blue)",
  green: "var(--c-green)",
  yellow: "var(--c-yellow)",
  orange: "var(--c-orange)",
  red: "var(--c-red)",
  pink: "var(--c-pink)",
  cyan: "var(--c-cyan)",
};

export function Avatar({ agent, size = 36 }: { agent: Agent; size?: number }) {
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 0.42, background: PALETTE[agent.color ?? ""] ?? "var(--c-blue)" }}
    >
      {agent.persona.firstName.slice(0, 1)}
    </span>
  );
}

export function ModelBadge({ model }: { model: string }) {
  return <span className={`badge badge-${model}`}>{model === "opus" ? "Opus" : model === "sonnet" ? "Sonnet" : model === "haiku" ? "Haiku" : model}</span>;
}
