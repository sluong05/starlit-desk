"use client";

import { useEffect, useMemo, useState } from "react";
import { pick, shuffle, type BoardProps, type GameDef, type Rand } from "./core";
import { Flash, Rivals, Who, typingInField, useFlash } from "@/components/games/kit";

/* Make words from seven letters; every word must use the center letter. */

type Data = { pangrams: string[]; common: string[]; extra: string[] };
type P = { letters: string[]; center: string; answers: Set<string>; bonus: Set<string>; max: number };
type Found = { w: string; by: string };
type S = { found: Found[]; finished: string[] };
type A = { type: "word"; w: string } | { type: "finish" };

const RANKS: Array<[number, string]> = [
  [0, "Stardust"],
  [0.03, "Spark"],
  [0.08, "Glow"],
  [0.15, "Shine"],
  [0.25, "Comet"],
  [0.4, "Star"],
  [0.55, "Nova"],
  [0.75, "Supernova"],
];

export const points = (w: string, p: Pick<P, "letters">) => {
  const base = w.length === 4 ? 1 : w.length;
  return new Set(w).size === 7 && p.letters.every((l) => w.includes(l)) ? base + 7 : base;
};
const total = (s: S, p: P) => s.found.reduce((n, f) => n + (p.answers.has(f.w) || p.bonus.has(f.w) ? points(f.w, p) : 0), 0);
const rank = (score: number, p: P) => [...RANKS].reverse().find(([f]) => score >= f * p.max)?.[1] ?? "Stardust";

function makePuzzle(rand: Rand, d: Data): P {
  const fits = (w: string, set: Set<string>, center: string) => w.includes(center) && [...w].every((c) => set.has(c));
  for (let tries = 0; tries < 400; tries++) {
    const pangram = pick(d.pangrams, rand);
    const letters = [...new Set(pangram)];
    const center = pick(letters, rand);
    const set = new Set(letters);
    const answers = d.common.filter((w) => fits(w, set, center));
    if (answers.length < 18 || answers.length > 60) continue;
    const bonus = d.extra.filter((w) => fits(w, set, center));
    const p = { letters: [center, ...shuffle(letters.filter((l) => l !== center), rand)], center, answers: new Set(answers), bonus: new Set(bonus), max: 0 };
    p.max = answers.reduce((n, w) => n + points(w, p), 0);
    return p;
  }
  throw new Error("couldn't build a hive");
}

function Board({ puzzle, state, states, act, locked, players, mode, me }: BoardProps<P, S, A>) {
  const [typed, setTyped] = useState("");
  const [outer, setOuter] = useState(puzzle.letters.slice(1));
  const [msg, flash] = useFlash();
  const score = total(state, puzzle);
  const iFinished = state.finished.includes(me.id);

  const submit = () => {
    const w = typed;
    setTyped("");
    if (w.length < 4) return flash("Too short");
    if (!w.includes(puzzle.center)) return flash(`Needs ${puzzle.center.toUpperCase()}`);
    if ([...w].some((c) => !puzzle.letters.includes(c))) return flash("Bad letters");
    if (state.found.some((f) => f.w === w)) return flash("Already found");
    if (!puzzle.answers.has(w) && !puzzle.bonus.has(w)) return flash("Not in the word list");
    const pts = points(w, puzzle);
    flash(pts > w.length ? `✦ Pangram! +${pts}` : puzzle.bonus.has(w) ? `Bonus word! +${pts}` : `+${pts}`);
    act({ type: "word", w });
  };

  const press = (k: string) => {
    if (locked || iFinished) return;
    if (k === "enter") submit();
    else if (k === "back") setTyped((t) => t.slice(0, -1));
    else if (puzzle.letters.includes(k)) setTyped((t) => (t.length < 19 ? t + k : t));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typingInField(e) || e.metaKey || e.ctrlKey) return;
      if (e.key === "Enter") press("enter");
      else if (e.key === "Backspace") press("back");
      else if (e.key === " ") {
        e.preventDefault();
        setOuter((o) => shuffle(o, Math.random));
      } else if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const found = useMemo(() => [...state.found].sort((a, b) => a.w.localeCompare(b.w)), [state.found]);
  const pct = Math.min(100, (score / puzzle.max) * 100);

  return (
    <div className="hive">
      <div className="hive-status">
        <strong>{rank(score, puzzle)}</strong>
        <div className="timer-progress" style={{ flex: 1, margin: 0 }}>
          <div style={{ width: `${pct}%` }} />
        </div>
        <span>{score} pts</span>
      </div>

      <div className="hive-typed" aria-live="polite">
        {typed ? (
          typed.split("").map((c, i) => (
            <span key={i} className={c === puzzle.center ? "center" : ""}>
              {c}
            </span>
          ))
        ) : (
          <span className="placeholder">type or tap letters</span>
        )}
      </div>
      <Flash msg={msg} />

      <div className="hive-comb">
        {[puzzle.center, ...outer].map((l, i) => (
          <button key={l} type="button" className={`hex hex-${i} ${i === 0 ? "hex-center" : ""}`} onClick={() => press(l)} disabled={locked}>
            {l}
          </button>
        ))}
      </div>

      <div className="row hive-actions">
        <button className="btn btn-ghost" onClick={() => press("back")} disabled={locked}>
          Delete
        </button>
        <button className="btn btn-ghost" onClick={() => setOuter((o) => shuffle(o, Math.random))} disabled={locked}>
          ⟳ Shuffle
        </button>
        <button className="btn btn-lamp" onClick={() => press("enter")} disabled={locked}>
          Enter
        </button>
      </div>

      <div className="hive-found">
        <div className="hive-found-head">
          <span>
            {found.length} {found.length === 1 ? "word" : "words"} of {puzzle.answers.size}
          </span>
          {!iFinished && !locked && (
            <button className="btn btn-ghost btn-sm" onClick={() => act({ type: "finish" })}>
              I&apos;m done
            </button>
          )}
        </div>
        <ul>
          {found.map((f) => (
            <li key={f.w} className={points(f.w, puzzle) > f.w.length ? "pangram" : puzzle.bonus.has(f.w) ? "bonus" : ""}>
              {f.w}
              {mode === "coop" && <Who id={f.by} players={players} />}
            </li>
          ))}
        </ul>
      </div>

      {mode === "race" && (
        <Rivals
          players={players}
          render={(p) => {
            const s = states[p.id];
            const sc = s ? total(s, puzzle) : 0;
            return (
              <span>
                {s?.found.length ?? 0} words · {sc} pts · {rank(sc, puzzle)}
                {s?.finished.length ? " · done" : ""}
              </span>
            );
          }}
        />
      )}
    </div>
  );
}

export const hive: GameDef<P, S, A> = {
  id: "hive",
  name: "Hive",
  icon: "🐝",
  tagline: "Build words from seven letters, always using the center",
  minutes: 5,
  modes: ["coop", "race"],
  scope: (m) => (m === "coop" ? "shared" : "perPlayer"),
  load: () => import("./data/hive.json").then((m) => m.default),
  puzzle: makePuzzle,
  init: () => ({ found: [], finished: [] }),
  reduce: (s, a, { p, by }) => {
    if (a.type === "finish") return s.finished.includes(by) ? s : { ...s, finished: [...s.finished, by] };
    if (s.found.some((f) => f.w === a.w) || !(p.answers.has(a.w) || p.bonus.has(a.w))) return s;
    return { ...s, found: [...s.found, { w: a.w, by }] };
  },
  // Co-op ends when someone calls it (or everything's found); race when you call it.
  done: (s, p) => s.finished.length > 0 || s.found.filter((f) => p.answers.has(f.w)).length >= p.answers.size,
  score: (s, p) => {
    const sc = total(s, p);
    return { value: sc, text: `${sc} pts · ${rank(sc, p)} · ${s.found.length} words` };
  },
  Board,
};
