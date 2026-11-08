"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@livekit/components-react";

/** Text chat for the room, sent over LiveKit's built-in chat channel. */
export default function Chat() {
  const { chatMessages, send, isSending } = useChat();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLOListElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMessages.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;
    setDraft("");
    try {
      await send(text);
    } catch {
      setDraft(text); // put it back so nothing is lost
    }
  };

  return (
    <section className="glass panel chat" aria-label="Chat">
      <h2>Chat</h2>

      <ol className="chat-list" ref={listRef} aria-live="polite">
        {chatMessages.length === 0 && <li className="chat-empty">Say hi, or drop a link to your notes ✦</li>}
        {chatMessages.map((m) => {
          const mine = m.from?.isLocal ?? false;
          const name = m.from?.name || m.from?.identity || "Someone";
          const time = new Date(m.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
          return (
            <li key={m.id} className={`chat-msg ${mine ? "mine" : ""}`}>
              <span className="chat-meta">
                {mine ? "You" : name} · {time}
              </span>
              <span className="chat-bubble">{m.message}</span>
            </li>
          );
        })}
      </ol>

      <form className="chat-form" onSubmit={submit}>
        <input
          className="input"
          value={draft}
          maxLength={500}
          placeholder="Message…"
          aria-label="Message"
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn btn-lamp" type="submit" disabled={!draft.trim() || isSending}>
          Send
        </button>
      </form>
    </section>
  );
}
