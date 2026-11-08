"use client";

import { useState } from "react";
import { pick, shuffle, type BoardProps, type GameDef, type Rand } from "./core";
import { Rivals } from "@/components/games/kit";

/* Combine six numbers with + − × ÷ to hit the target. Three rounds. */

type Op = "+" | "-" | "*" | "/";
type Round = { nums: number[]; target: number };
type P = { rounds: Round[] };
type RS = { nums: number[]; history: number[][]; best: number | null };
type S = { r: number; rounds: RS[] };
type A = { type: "op"; i: number; j: number; op: Op } | { type: "undo" } | { type: "reset" } | { type: "next" };

const apply = (a: number, b: number, op: Op): number | null => {
  if (op === "+") return a + b;
  if (op === "*") return a * b;
  if (op === "-") return a - b > 0 ? a - b : null;
  return b !== 0 && a % b === 0 ? a / b : null;
};

function makeRound(rand: Rand, small: number, ranges: [number, number]): Round {
  for (let tries = 0; tries < 500; tries++) {
    const nums = [
      ...Array.from({ length: small }, () => 1 + Math.floor(rand() * 10)),
      ...shuffle([15, 20, 25, 50, 75, 100], rand).slice(0, 6 - small),
    ].sort((a, b) => a - b);
    // play a random game forward to find a reachable target
    let pool = [...nums];
    const steps = 3 + Math.floor(rand() * 2);
    let last = 0;
    for (let s = 0; s < steps && pool.length > 1; s++) {
      const [i, j] = shuffle([...pool.keys()], rand);
      const op = pick<Op>(["+", "-", "*", "/", "+", "*"], rand);
      const [a, b] = pool[i] >= pool[j] ? [pool[i], pool[j]] : [pool[j], pool[i]];
      const r = apply(a, b, op);
      if (r === null || r === a || r === b) continue;
      pool = pool.filter((_, k) => k !== i && k !== j).concat(r);
      last = r;
    }
    if (last >= ranges[0] && last <= ranges[1] && !nums.includes(last)) return { nums, target: last };
  }
  return { nums: [1, 2, 3, 4, 10, 25], target: 100 };
}

const makePuzzle = (rand: Rand): P => ({
  rounds: [makeRound(rand, 4, [30, 150]), makeRound(rand, 4, [100, 400]), makeRound(rand, 3, [200, 800])],
});

const stars = (best: number | null, target: number) => {
  if (best === null) return 0;
  const off = Math.abs(best - target);
  return off === 0 ? 3 : off <= 5 ? 2 : off <= 15 ? 1 : 0;
};
const closer = (best: number | null, v: number, target: number) => (best === null || Math.abs(v - target) < Math.abs(best - target) ? v : best);

function Board({ puzzle, state, states, act, locked, players, mode }: BoardProps<P, S, A>) {
  const [sel, setSel] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const done = state.r >= puzzle.rounds.length;
  if (done)
    return (
      <div className="digits">
        <p className="game-note">All three rounds played ✦</p>
        <ul className="digits-summary">
          {puzzle.rounds.map((r, i) => (
            <li key={i}>
              Target {r.target}: best {state.rounds[i].best ?? "—"} {"★".repeat(stars(state.rounds[i].best, r.target))}
            </li>
          ))}
        </ul>
      </div>
    );

  const round = puzzle.rounds[state.r];
  const rs = state.rounds[state.r];
  const hit = rs.nums.includes(round.target);

  const tap = (i: number) => {
    if (locked || hit) return;
    if (sel === null || op === null) {
      setSel(i === sel ? null : i);
      return;
    }
    if (i === sel) return;
    const [a, b] = [rs.nums[sel], rs.nums[i]];
    if (apply(a, b, op) === null) {
      setOp(null);
      return;
    }
    act({ type: "op", i: sel, j: i, op });
    setSel(null);
    setOp(null);
  };

  return (
    <div className="digits">
      <div className="digits-head">
        <span>
          Round {state.r + 1}/3
        </span>
        <span className="digits-target">{round.target}</span>
        <span>best {rs.best ?? "—"} {"★".repeat(stars(rs.best, round.target))}</span>
      </div>
      <div className="digits-nums">
        {rs.nums.map((n, i) => (
          <button key={`${i}-${n}`} type="button" className={`digit ${sel === i ? "sel" : ""} ${n === round.target ? "hit" : ""}`} onClick={() => tap(i)} disabled={locked}>
            {n}
          </button>
        ))}
      </div>
      <div className="digits-ops">
        {(["+", "-", "*", "/"] as Op[]).map((o) => (
          <button key={o} type="button" className={`btn btn-ghost op ${op === o ? "on" : ""}`} disabled={locked || sel === null || hit} onClick={() => setOp(o)}>
            {o === "*" ? "×" : o === "/" ? "÷" : o === "-" ? "−" : "+"}
          </button>
        ))}
      </div>
      <p className="game-note">{hit ? "✦ Exact! Nice." : sel === null ? "Tap a number, an operation, then another number." : op ? "Now tap the second number." : "Pick an operation."}</p>
      <div className="row">
        <button className="btn btn-ghost" disabled={locked || !rs.history.length} onClick={() => act({ type: "undo" })}>
          Undo
        </button>
        <button className="btn btn-ghost" disabled={locked || !rs.history.length} onClick={() => act({ type: "reset" })}>
          Reset
        </button>
        <button className="btn btn-lamp" disabled={locked} onClick={() => act({ type: "next" })}>
          {state.r === 2 ? "Finish" : hit ? "Next round" : "Skip round"}
        </button>
      </div>
      {mode === "race" && (
        <Rivals
          players={players}
          render={(p) => {
            const s = states[p.id];
            const st = s ? s.rounds.reduce((n, x, i) => n + stars(x.best, puzzle.rounds[i].target), 0) : 0;
            return <span>round {Math.min(3, (s?.r ?? 0) + 1)} · {"★".repeat(st) || "no stars yet"}</span>;
          }}
        />
      )}
    </div>
  );
}

export const digits: GameDef<P, S, A> = {
  id: "digits",
  name: "Star Math",
  icon: "🔢",
  tagline: "Combine numbers with + − × ÷ to hit the target",
  minutes: 4,
  modes: ["coop", "race"],
  scope: (m) => (m === "coop" ? "shared" : "perPlayer"),
  puzzle: makePuzzle,
  init: (p) => ({ r: 0, rounds: p.rounds.map((r) => ({ nums: [...r.nums], history: [], best: null })) }),
  reduce: (s, a, { p }) => {
    if (s.r >= p.rounds.length) return s;
    const rounds = [...s.rounds];
    const rs = rounds[s.r];
    const target = p.rounds[s.r].target;
    if (a.type === "next") return { ...s, r: s.r + 1 };
    if (a.type === "undo") {
      if (!rs.history.length) return s;
      rounds[s.r] = { ...rs, nums: rs.history[rs.history.length - 1], history: rs.history.slice(0, -1) };
      return { ...s, rounds };
    }
    if (a.type === "reset") {
      rounds[s.r] = { ...rs, nums: [...p.rounds[s.r].nums], history: [] };
      return { ...s, rounds };
    }
    const x = rs.nums[a.i],
      y = rs.nums[a.j];
    if (a.i === a.j || x === undefined || y === undefined || rs.nums.includes(target)) return s;
    const r = apply(x, y, a.op);
    if (r === null) return s;
    const nums = rs.nums.filter((_, k) => k !== a.i && k !== a.j).concat(r);
    rounds[s.r] = { nums, history: [...rs.history, rs.nums], best: closer(rs.best, r, target) };
    return { ...s, rounds };
  },
  done: (s, p) => s.r >= p.rounds.length,
  score: (s, p) => {
    const st = s.rounds.reduce((n, x, i) => n + stars(x.best, p.rounds[i].target), 0);
    return { value: st, text: `${st}/9 ★` };
  },
  Board,
};
