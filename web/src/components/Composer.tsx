import { useState, type KeyboardEvent } from "react";

export function Composer({
  placeholder,
  busy,
  onSend,
  onStop,
}: {
  placeholder: string;
  busy: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}) {
  const [text, setText] = useState("");

  const send = () => {
    const t = text.trim();
    if (!t || busy) return;
    onSend(t);
    setText("");
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="composer">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        placeholder={placeholder}
        rows={2}
        aria-label="Message"
      />
      {busy ? (
        <button className="btn btn-stop" onClick={onStop}>
          Stop
        </button>
      ) : (
        <button className="btn btn-primary" onClick={send} disabled={!text.trim()}>
          Send
        </button>
      )}
    </div>
  );
}
