import { useEffect, useState } from "react";
import { setPassword } from "./api";
import { AgentChat } from "./components/AgentChat";
import { Sidebar, TEAM } from "./components/Sidebar";
import { TeamChat } from "./components/TeamChat";
import { load, save } from "./storage";
import { agentByName, team } from "./team";

export function App() {
  const [selected, setSelected] = useState<string>(() => {
    const saved = load<string>("experts21.selected", TEAM);
    return saved === TEAM || agentByName.has(saved) ? saved : TEAM;
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [askPassword, setAskPassword] = useState(false);

  useEffect(() => {
    save("experts21.selected", selected);
  }, [selected]);

  const agent = agentByName.get(selected);

  return (
    <div className="app">
      <div className="topbar">
        <button className="btn btn-ghost menu-button" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-label="Toggle expert list">
          ☰ Experts
        </button>
        <span className="brand">Experts21 · Miami coffee shop advisors</span>
      </div>

      <Sidebar
        selected={selected}
        open={menuOpen}
        onSelect={(name) => {
          setSelected(name);
          setMenuOpen(false);
        }}
      />

      <main className="main">
        {agent ? (
          <AgentChat key={agent.name} agent={agent} onPasswordNeeded={() => setAskPassword(true)} />
        ) : (
          <TeamChat onPasswordNeeded={() => setAskPassword(true)} />
        )}
        <footer className="footer">
          Team data built {new Date(team.builtAt).toLocaleString()}. Legal, tax and insurance answers are research, not professional advice.
        </footer>
      </main>

      {askPassword && <PasswordDialog onDone={() => setAskPassword(false)} />}
    </div>
  );
}

function PasswordDialog({ onDone }: { onDone: () => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="pw-title">
      <form
        className="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          setPassword(value);
          onDone();
        }}
      >
        <h2 id="pw-title">Password required</h2>
        <p>This site is protected. Enter the APP_PASSWORD set in Netlify, then send your message again.</p>
        <input type="password" value={value} onChange={(e) => setValue(e.target.value)} autoFocus aria-label="Password" />
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onDone}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!value}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
