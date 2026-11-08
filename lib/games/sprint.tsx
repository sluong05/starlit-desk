"use client";

import { useState } from "react";
import { fmtTime, norm, pick, sample, type BoardProps, type GameDef, type Rand } from "./core";
import { SPRINT_CATEGORIES, SPRINT_LETTERS } from "./data/content";

/*
 * One letter, six categories, 90 seconds. Then you review each other's answers
 * and can veto anything that doesn't count. Co-op: different answers earn a
 * bonus. Race: most valid answers wins.
 */

const SECONDS = 90;
const CATS = 6;

type P = { letter: string; categories: string[] };
type S = {
  answers: Record<string, string[]>;
  submitted: string[];
  vetoes: Record<string, string[]>; // "pid:index" -> who vetoed
  finished: string[];
};
type A = { type: "write"; i: number; text: string } | { type: "submit" } | { type: "veto"; pid: string; i: number } | { type: "finish" };

const validFor = (s: S, p: P, pid: string, i: number) => {
  const a = s.answers[pid]?.[i] ?? "";
  return !!a.trim() && norm(a).startsWith(p.letter.toLowerCase()) && !(s.vetoes[`${pid}:${i}`]?.length);
};
const count = (s: S, p: P, pid: string) => p.categories.filter((_, i) => validFor(s, p, pid, i)).length;
const reviewing = (s: S, elapsed: number) => elapsed >= SECONDS * 1000 || (s.submitted.length >= 2 && s.submitted.length >= Object.keys(s.answers).length);

function Board({ puzzle, state, act, locked, players, me, elapsedMs, mode }: BoardProps<P, S, A>) {
  const [draft, setDraft] = useState<string[]>(() => state.answers[me.id] ?? Array(CATS).fill(""));
  const review = reviewing(state, elapsedMs);
  const iSubmitted = state.submitted.includes(me.id);

  if (!review) {
    return (
      <div className="sprint">
        <div className="sprint-head">
          <span className="sprint-letter">{puzzle.letter}</span>
          <span className={`sky-clock ${SECONDS * 1000 - elapsedMs < 15000 ? "low" : ""}`}>{fmtTime(SECONDS * 1000 - elapsedMs)}</span>
        </div>
        <p className="game-note">Everything must start with {puzzle.letter}. Unique answers are worth more together.</p>
        <ol className="sprint-list">
          {puzzle.categories.map((c, i) => (
            <li key={i}>
              <label>{c}</label>
              <input
                className="input"
                value={draft[i]}
                disabled={locked || iSubmitted}
                maxLength={40}
                placeholder={`${puzzle.letter}…`}
                onChange={(e) => {
                  const next = [...draft];
                  next[i] = e.target.value;
                  setDraft(next);
                }}
                onBlur={() => act({ type: "write", i, text: draft[i] })}
              />
            </li>
          ))}
        </ol>
        <button
          className="btn btn-lamp"
          disabled={locked || iSubmitted}
          onClick={() => {
            draft.forEach((text, i) => act({ type: "write", i, text }));
            act({ type: "submit" });
          }}
        >
          {iSubmitted ? "Waiting for your friend…" : "I'm done"}
        </button>
      </div>
    );
  }

  const pids = players.map((p) => p.id);
  return (
    <div className="sprint">
      <div className="sprint-head">
        <span className="sprint-letter">{puzzle.letter}</span>
        <span className="game-note" style={{ margin: 0 }}>
          Review time — tap ✕ on anything that doesn&apos;t count
        </span>
      </div>
      <table className="sky-table sprint-table">
        <thead>
          <tr>
            <th>Category</th>
            {players.map((p) => (
              <th key={p.id}>{p.isMe ? "You" : p.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {puzzle.categories.map((c, i) => {
            const vals = pids.map((pid) => norm(state.answers[pid]?.[i] ?? ""));
            return (
              <tr key={i}>
                <td>{c}</td>
                {players.map((p, k) => {
                  const a = state.answers[p.id]?.[i] ?? "";
                  const ok = validFor(state, puzzle, p.id, i);
                  const vetoed = !!state.vetoes[`${p.id}:${i}`]?.length;
                  const dupe = ok && vals.filter((v, j) => j !== k && v === vals[k]).length > 0;
                  return (
                    <td key={p.id} className={!a.trim() ? "miss" : ok ? (dupe ? "dupe" : "tier-1") : "vetoed"}>
                      {a || "—"}
                      {a.trim() && !vetoed && !p.isMe && !locked && (
                        <button className="veto" aria-label="Doesn't count" onClick={() => act({ type: "veto", pid: p.id, i })}>
                          ✕
                        </button>
                      )}
                      {vetoed && <small>vetoed</small>}
                      {dupe && mode === "coop" && <small>same answer</small>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!state.finished.includes(me.id) && !locked && (
        <button className="btn btn-lamp" onClick={() => act({ type: "finish" })}>
          Looks good — show scores
        </button>
      )}
    </div>
  );
}

export const sprint: GameDef<P, S, A> = {
  id: "sprint",
  name: "Alphabet Sprint",
  icon: "🔤",
  tagline: "One letter, six categories, ninety seconds",
  minutes: 3,
  modes: ["coop", "race"],
  scope: () => "shared",
  puzzle: (rand: Rand) => ({ letter: pick(SPRINT_LETTERS, rand), categories: sample(SPRINT_CATEGORIES, CATS, rand) }),
  init: () => ({ answers: {}, submitted: [], vetoes: {}, finished: [] }),
  reduce: (s, a, { by }) => {
    if (a.type === "write") {
      if (s.submitted.includes(by) || a.i < 0 || a.i >= CATS) return s;
      const mine = [...(s.answers[by] ?? Array(CATS).fill(""))];
      mine[a.i] = a.text.slice(0, 40);
      return { ...s, answers: { ...s.answers, [by]: mine } };
    }
    if (a.type === "submit") {
      const answers = s.answers[by] ? s.answers : { ...s.answers, [by]: Array(CATS).fill("") };
      return s.submitted.includes(by) ? s : { ...s, answers, submitted: [...s.submitted, by] };
    }
    if (a.type === "veto") {
      if (a.pid === by) return s;
      const k = `${a.pid}:${a.i}`;
      return (s.vetoes[k] ?? []).includes(by) ? s : { ...s, vetoes: { ...s.vetoes, [k]: [...(s.vetoes[k] ?? []), by] } };
    }
    return s.finished.includes(by) ? s : { ...s, finished: [...s.finished, by] };
  },
  done: (s) => s.finished.length > 0 && s.finished.length >= Math.max(2, Object.keys(s.answers).length),
  score: (s, p, pid) => {
    const n = count(s, p, pid);
    return { value: n, text: `${n}/${CATS} counted` };
  },
  teamScore: (states, p, pids) => {
    const s = states[0];
    let pts = 0;
    p.categories.forEach((_, i) => {
      const valid = pids.filter((pid) => validFor(s, p, pid, i)).map((pid) => norm(s.answers[pid][i]));
      pts += valid.length + (valid.length >= 2 && new Set(valid).size === valid.length ? 1 : 0);
    });
    return { value: pts, text: `${pts} points together (unique answers earn a bonus)` };
  },
  Board,
};
