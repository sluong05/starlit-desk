"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Player } from "@/lib/games/core";
import { isMuted, sfx, subscribeMuted } from "@/lib/games/sfx";

/** A text box + button that hands the trimmed text to `onSubmit` and clears itself. */
export function AnswerBox({
  onSubmit,
  placeholder = "Type your answer…",
  disabled,
  button = "Enter",
  autoFocus = true,
  maxLength = 40,
}: {
  onSubmit: (text: string) => boolean | void;
  placeholder?: string;
  disabled?: boolean;
  button?: string;
  autoFocus?: boolean;
  maxLength?: number;
}) {
  const [text, setText] = useState("");
  const [shake, setShake] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus && !disabled) ref.current?.focus();
  }, [autoFocus, disabled]);
  return (
    <form
      className="game-answer"
      onSubmit={(e) => {
        e.preventDefault();
        const t = text.trim();
        if (!t || disabled) return;
        const ok = onSubmit(t);
        if (ok === false) {
          sfx("bad");
          setShake(true);
          setTimeout(() => setShake(false), 400);
        } else setText("");
      }}
    >
      <input
        ref={ref}
        className={`input ${shake ? "shake" : ""}`}
        value={text}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
      />
      <button className="btn btn-lamp" type="submit" disabled={disabled || !text.trim()}>
        {button}
      </button>
    </form>
  );
}

/** Small "who did this" initial bubble for co-op boards. */
export function Who({ id, players }: { id: string; players: Player[] }) {
  const p = players.find((x) => x.id === id);
  if (!p) return null;
  return (
    <span className={`who ${p.isMe ? "who-me" : ""}`} title={p.isMe ? "You" : p.name}>
      {p.isMe ? "you" : p.name.slice(0, 10)}
    </span>
  );
}

/** A transient message line (e.g. "Not in word list"). */
export function useFlash(): [string, (msg: string) => void] {
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flash = (m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 1800);
  };
  return [msg, flash];
}

export function Flash({ msg }: { msg: string }) {
  return (
    <div className="game-flash" role="status" aria-live="polite">
      {msg}
    </div>
  );
}

/** "Other players" strip used in race mode. */
export function Rivals({ players, render }: { players: Player[]; render: (p: Player) => ReactNode }) {
  const others = players.filter((p) => !p.isMe);
  if (!others.length) return null;
  return (
    <div className="rivals">
      {others.map((p) => (
        <div key={p.id} className="rival">
          <span className="rival-name">{p.name}</span>
          {render(p)}
        </div>
      ))}
    </div>
  );
}

/** Ignore global key handlers while the user is typing in a field (e.g. chat). */
export function typingInField(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
}

/** Runs `onRise` whenever a number goes up (a new guess, a solved row…), whoever caused it. */
export function useRise(value: number, onRise: (delta: number) => void) {
  const prev = useRef(value);
  const cb = useRef(onRise);
  cb.current = onRise;
  useEffect(() => {
    if (value > prev.current) cb.current(value - prev.current);
    prev.current = value;
  }, [value]);
}

export function useSfxMuted() {
  return useSyncExternalStore(subscribeMuted, isMuted, () => false);
}
