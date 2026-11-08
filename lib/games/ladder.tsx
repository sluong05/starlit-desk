"use client";

import { pick, type BoardProps, type GameDef, type Rand } from "./core";
import { AnswerBox, Flash, Rivals, Who, useFlash } from "@/components/games/kit";

/* Turn one word into another, changing a single letter each step. */

type Data = { common: string[]; valid: string[] };
type P = { start: string; end: string; par: number; path: string[]; valid: Set<string> };
type S = { chain: string[]; by: string[] };
type A = { type: "step"; w: string } | { type: "undo" };

const oneOff = (a: string, b: string) => {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i] && ++d > 1) return false;
  return d === 1;
};

function neighbors(words: string[]) {
  // bucket by wildcard pattern: "c_at" etc.
  const buckets = new Map<string, string[]>();
  for (const w of words)
    for (let i = 0; i < w.length; i++) {
      const k = w.slice(0, i) + "_" + w.slice(i + 1);
      buckets.set(k, [...(buckets.get(k) ?? []), w]);
    }
  return (w: string) => {
    const out: string[] = [];
    for (let i = 0; i < w.length; i++) for (const x of buckets.get(w.slice(0, i) + "_" + w.slice(i + 1)) ?? []) if (x !== w) out.push(x);
    return out;
  };
}

function makePuzzle(rand: Rand, d: Data): P {
  const valid = new Set([...d.valid, ...d.common]);
  const next = neighbors([...valid]);
  const common = new Set(d.common);
  for (let tries = 0; tries < 300; tries++) {
    const start = pick(d.common, rand);
    // breadth-first search outward from the start word
    const prev = new Map<string, string | null>([[start, null]]);
    let frontier = [start];
    const byDist: string[][] = [];
    for (let dist = 1; dist <= 6 && frontier.length; dist++) {
      const nf: string[] = [];
      for (const w of frontier)
        for (const n of next(w))
          if (!prev.has(n)) {
            prev.set(n, w);
            nf.push(n);
          }
      byDist[dist] = nf.filter((w) => common.has(w));
      frontier = nf;
    }
    const pool = [...(byDist[4] ?? []), ...(byDist[5] ?? [])];
    if (!pool.length) continue;
    const end = pick(pool, rand);
    const path = [end];
    while (prev.get(path[0])) path.unshift(prev.get(path[0])!);
    return { start, end, par: path.length - 1, path, valid };
  }
  throw new Error("couldn't build a ladder");
}

const finished = (s: S, p: P) => s.chain[s.chain.length - 1] === p.end;

function Board({ puzzle, state, states, act, locked, players, mode }: BoardProps<P, S, A>) {
  const [msg, flash] = useFlash();
  const last = state.chain[state.chain.length - 1];
  const done = finished(state, puzzle);

  return (
    <div className="ladder">
      <p className="game-note">
        Change one letter at a time to get from <strong>{puzzle.start.toUpperCase()}</strong> to{" "}
        <strong>{puzzle.end.toUpperCase()}</strong>. Par is {puzzle.par} steps.
      </p>
      <ol className="ladder-rungs">
        {state.chain.map((w, i) => (
          <li key={i} className={i === 0 ? "start" : w === puzzle.end ? "end" : ""}>
            {w.split("").map((c, j) => (
              <span key={j} className={i > 0 && state.chain[i - 1][j] !== c ? "changed" : ""}>
                {c}
              </span>
            ))}
            {mode === "coop" && i > 0 && <Who id={state.by[i]} players={players} />}
          </li>
        ))}
        {!done && (
          <li className="end ghost">
            {puzzle.end.split("").map((c, j) => (
              <span key={j}>{c}</span>
            ))}
          </li>
        )}
      </ol>
      <Flash msg={msg} />
      {done ? (
        <p className="game-note">
          ✦ Made it in {state.chain.length - 1} steps {state.chain.length - 1 <= puzzle.par ? "— par or better!" : `(par ${puzzle.par})`}
        </p>
      ) : (
        <div className="row" style={{ alignItems: "stretch" }}>
          <div style={{ flex: 1 }}>
            <AnswerBox
              disabled={locked}
              placeholder={`next word after ${last.toUpperCase()}`}
              maxLength={4}
              onSubmit={(t) => {
                const w = t.toLowerCase();
                if (w.length !== 4) return flash("Four letters"), false;
                if (!oneOff(last, w)) return flash("Change exactly one letter"), false;
                if (!puzzle.valid.has(w)) return flash("Not in the word list"), false;
                if (state.chain.includes(w)) return flash("Already used"), false;
                act({ type: "step", w });
              }}
            />
          </div>
          <button className="btn btn-ghost" style={{ flex: "0 0 auto" }} disabled={locked || state.chain.length < 2} onClick={() => act({ type: "undo" })}>
            Undo
          </button>
        </div>
      )}
      {mode === "race" && (
        <Rivals
          players={players}
          render={(p) => {
            const s = states[p.id];
            return <span>{s ? (finished(s, puzzle) ? `done in ${s.chain.length - 1}` : `${s.chain.length - 1} steps so far`) : "starting…"}</span>;
          }}
        />
      )}
      {locked && !done && <p className="game-note">One route: {puzzle.path.join(" → ").toUpperCase()}</p>}
    </div>
  );
}

export const ladder: GameDef<P, S, A> = {
  id: "ladder",
  name: "Star Ladder",
  icon: "🪜",
  tagline: "Climb from one word to another, one letter at a time",
  minutes: 3,
  modes: ["coop", "race"],
  scope: (m) => (m === "coop" ? "shared" : "perPlayer"),
  load: () => import("./data/four.json").then((m) => m.default),
  puzzle: makePuzzle,
  init: (p) => ({ chain: [p.start], by: [""] }),
  reduce: (s, a, { p, by }) => {
    if (finished(s, p)) return s;
    if (a.type === "undo") return s.chain.length > 1 ? { chain: s.chain.slice(0, -1), by: s.by.slice(0, -1) } : s;
    const last = s.chain[s.chain.length - 1];
    if (!oneOff(last, a.w) || !p.valid.has(a.w) || s.chain.includes(a.w)) return s;
    return { chain: [...s.chain, a.w], by: [...s.by, by] };
  },
  done: finished,
  score: (s, p) => {
    if (!finished(s, p)) return { value: 0, text: "Didn't reach it" };
    const steps = s.chain.length - 1;
    return { value: Math.max(1, 10 - (steps - p.par) * 2), text: `${steps} steps (par ${p.par})` };
  },
  Board,
};
