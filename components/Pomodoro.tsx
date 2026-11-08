"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDataChannel } from "@livekit/components-react";
import { chime } from "@/lib/sound/engine";

/**
 * A Pomodoro timer shared by everyone in the room.
 *
 * Sync model: the whole timer state is broadcast on the "timer" data topic
 * whenever someone changes it (last write wins). A running timer is stored as
 * an absolute `endsAt` timestamp, so both clients count down independently and
 * stay in step without sending a message every second. When someone joins, they
 * send "hello" and whoever is already there replies with the current state.
 */

type Mode = "focus" | "break";

type TimerState = {
  mode: Mode;
  focusMin: number;
  breakMin: number;
  endsAt: number | null; // epoch ms while running
  remainingMs: number; // used while paused
  sessions: number; // completed focus blocks
  rev: number; // bumps on every change, used to ignore stale echoes
};

type Message = { type: "state"; state: TimerState } | { type: "hello" };

const PRESETS: Array<[number, number]> = [
  [25, 5],
  [50, 10],
  [90, 15],
];

const initial: TimerState = {
  mode: "focus",
  focusMin: 25,
  breakMin: 5,
  endsAt: null,
  remainingMs: 25 * 60_000,
  sessions: 0,
  rev: 0,
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function msLeft(s: TimerState, now: number) {
  return s.endsAt ? Math.max(0, s.endsAt - now) : s.remainingMs;
}

function fmt(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function Pomodoro() {
  const [state, setState] = useState<TimerState>(initial);
  const [now, setNow] = useState(() => Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;

  const { send } = useDataChannel("timer", (msg) => {
    let parsed: Message;
    try {
      parsed = JSON.parse(decoder.decode(msg.payload));
    } catch {
      return;
    }
    if (parsed.type === "hello") {
      // Someone new arrived; tell them where we are.
      broadcast(stateRef.current);
    } else if (parsed.type === "state" && parsed.state.rev >= stateRef.current.rev) {
      setState(parsed.state);
    }
  });

  const broadcast = useCallback(
    (s: TimerState) => {
      const msg: Message = { type: "state", state: s };
      send(encoder.encode(JSON.stringify(msg)), { reliable: true, topic: "timer" }).catch(() => {
        /* not connected yet; the next change will sync */
      });
    },
    [send],
  );

  const update = useCallback(
    (fn: (s: TimerState) => TimerState) => {
      const next = { ...fn(stateRef.current), rev: stateRef.current.rev + 1 };
      setState(next);
      broadcast(next);
    },
    [broadcast],
  );

  // Ask for the current state shortly after joining.
  useEffect(() => {
    const t = setTimeout(() => {
      const hello: Message = { type: "hello" };
      send(encoder.encode(JSON.stringify(hello)), { reliable: true, topic: "timer" }).catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [send]);

  // Tick, and flip focus <-> break when time runs out. Every client computes
  // the same flip from the same shared state, so no message is needed here.
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const s = stateRef.current;
      if (s.endsAt && t >= s.endsAt) {
        chime();
        const nextMode: Mode = s.mode === "focus" ? "break" : "focus";
        const durMs = (nextMode === "focus" ? s.focusMin : s.breakMin) * 60_000;
        setState({
          ...s,
          mode: nextMode,
          sessions: s.mode === "focus" ? s.sessions + 1 : s.sessions,
          endsAt: s.endsAt + durMs,
          remainingMs: durMs,
          rev: s.rev + 1,
        });
      }
    }, 250);
    return () => clearInterval(id);
  }, []);

  const left = msLeft(state, now);
  const total = (state.mode === "focus" ? state.focusMin : state.breakMin) * 60_000;
  const pct = Math.min(100, Math.max(0, ((total - left) / total) * 100));
  const running = state.endsAt !== null;

  useEffect(() => {
    document.title = running ? `${fmt(left)} · ${state.mode === "focus" ? "Focus" : "Break"} · Starlit Desk` : "Starlit Desk";
  }, [left, running, state.mode]);

  const start = () => update((s) => ({ ...s, endsAt: Date.now() + s.remainingMs }));
  const pause = () => update((s) => ({ ...s, remainingMs: msLeft(s, Date.now()), endsAt: null }));
  const reset = () =>
    update((s) => ({ ...s, mode: "focus", endsAt: null, remainingMs: s.focusMin * 60_000 }));
  const skip = () =>
    update((s) => {
      const nextMode: Mode = s.mode === "focus" ? "break" : "focus";
      const durMs = (nextMode === "focus" ? s.focusMin : s.breakMin) * 60_000;
      return { ...s, mode: nextMode, endsAt: s.endsAt ? Date.now() + durMs : null, remainingMs: durMs };
    });
  const preset = (f: number, b: number) =>
    update((s) => ({ ...s, focusMin: f, breakMin: b, mode: "focus", endsAt: null, remainingMs: f * 60_000 }));

  return (
    <section className="glass panel" aria-label="Shared study timer">
      <h2>Shared timer</h2>

      <div className="seg" role="group" aria-label="Timer length">
        {PRESETS.map(([f, b]) => (
          <button
            key={f}
            className="btn btn-ghost"
            aria-pressed={state.focusMin === f && state.breakMin === b}
            onClick={() => preset(f, b)}
          >
            {f}/{b}
          </button>
        ))}
      </div>

      <div className="timer-face" aria-live="off">
        {fmt(left)}
      </div>
      <div className={`timer-mode ${state.mode}`}>{state.mode === "focus" ? "✦ Focus time" : "☾ Stretch & sip some tea"}</div>
      <div className="timer-progress" aria-hidden="true">
        <div style={{ width: `${pct}%` }} />
      </div>

      <div className="row">
        {running ? (
          <button className="btn btn-ghost" onClick={pause}>
            Pause
          </button>
        ) : (
          <button className="btn btn-lamp" onClick={start}>
            Start
          </button>
        )}
        <button className="btn btn-ghost" onClick={skip}>
          Skip
        </button>
        <button className="btn btn-ghost" onClick={reset}>
          Reset
        </button>
      </div>

      <p className="sessions">
        {state.sessions === 0
          ? "No focus blocks finished yet tonight"
          : `${state.sessions} focus block${state.sessions === 1 ? "" : "s"} finished together ✦`}
      </p>
    </section>
  );
}
