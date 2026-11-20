import { agents, orchestrator, userDocs } from "../team";
import { Avatar, ModelBadge } from "./Avatar";

export const TEAM = "__team__";

export function Sidebar({ selected, onSelect, open }: { selected: string; onSelect: (name: string) => void; open: boolean }) {
  const groups: [string, typeof agents][] = [];
  for (const a of agents) {
    let g = groups.find(([name]) => name === a.group);
    if (!g) groups.push((g = [a.group, []]));
    g[1].push(a);
  }

  return (
    <nav className={`sidebar ${open ? "open" : ""}`} aria-label="Experts">
      <button className={`team-button ${selected === TEAM ? "active" : ""}`} onClick={() => onSelect(TEAM)}>
        <span className="team-icon" aria-hidden="true">
          ☕
        </span>
        <span>
          <strong>Ask the whole team</strong>
          <small>{orchestrator.persona.firstName} routes your question to the right experts and combines their answers</small>
        </span>
      </button>

      {groups.map(([group, list]) => (
        <section key={group} className="group">
          <h2>{group}</h2>
          <ul>
            {list.map((a) => {
              const docs = userDocs(a.knowledgeFiles).length;
              return (
                <li key={a.name}>
                  <button className={`agent-item ${selected === a.name ? "active" : ""}`} onClick={() => onSelect(a.name)} title={a.description}>
                    <Avatar agent={a} />
                    <span className="agent-text">
                      <span className="agent-line">
                        <strong>{a.persona.firstName}</strong>
                        <ModelBadge model={a.model} />
                        {docs > 0 && (
                          <span className="doc-count" title={`${docs} document(s) in knowledge/${a.name}/`}>
                            📎{docs}
                          </span>
                        )}
                      </span>
                      <span className="agent-name">{a.name}</span>
                      <span className="agent-voice">{a.persona.voice}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
