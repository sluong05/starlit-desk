"use client";

import { useEffect, useState } from "react";
import { shuffle, type BoardProps, type GameDef, type Rand } from "./core";
import { Rivals, typingInField } from "@/components/games/kit";

/* A 6×6 sudoku: every row, column and 2×3 box holds 1–6 once. */

type P = { givens: number[]; solution: number[] };
type S = { cells: number[] };
type A = { type: "set"; i: number; v: number };

const N = 6;
const box = (i: number) => Math.floor(Math.floor(i / N) / 2) * 2 + Math.floor((i % N) / 3);
const peers = (i: number) =>
  [...Array(N * N).keys()].filter((j) => j !== i && (Math.floor(j / N) === Math.floor(i / N) || j % N === i % N || box(j) === box(i)));
const PEERS = [...Array(N * N).keys()].map(peers);

function solve(grid: number[], rand: Rand | null, limit: number): number {
  // counts solutions up to `limit`; fills `grid` with the first one found when rand is given
  const i = grid.indexOf(0);
  if (i < 0) return 1;
  let count = 0;
  const digits = rand ? shuffle([1, 2, 3, 4, 5, 6], rand) : [1, 2, 3, 4, 5, 6];
  for (const d of digits) {
    if (PEERS[i].some((j) => grid[j] === d)) continue;
    grid[i] = d;
    count += solve(grid, rand, limit - count);
    if (count >= limit) {
      if (rand) return count; // keep the filled grid
      grid[i] = 0;
      return count;
    }
    grid[i] = 0;
  }
  return count;
}

function makePuzzle(rand: Rand): P {
  const solution = Array(N * N).fill(0);
  solve(solution, rand, 1);
  const givens = [...solution];
  for (const i of shuffle([...givens.keys()], rand)) {
    const keep = givens[i];
    givens[i] = 0;
    if (solve([...givens], null, 2) !== 1) givens[i] = keep;
    if (givens.filter(Boolean).length <= 13) break;
  }
  return { givens, solution };
}

const value = (s: S, p: P, i: number) => p.givens[i] || s.cells[i];
const solved = (s: S, p: P) => p.solution.every((v, i) => value(s, p, i) === v);

function Board({ puzzle, state, states, act, locked, players, mode }: BoardProps<P, S, A>) {
  const [sel, setSel] = useState<number | null>(null);
  const done = solved(state, puzzle);

  const put = (v: number) => {
    if (sel === null || locked || done || puzzle.givens[sel]) return;
    act({ type: "set", i: sel, v });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typingInField(e) || sel === null) return;
      if (/^[1-6]$/.test(e.key)) put(Number(e.key));
      else if (e.key === "Backspace" || e.key === "0") put(0);
      else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const d = { ArrowUp: -N, ArrowDown: N, ArrowLeft: -1, ArrowRight: 1 }[e.key] ?? 0;
        setSel((s) => (s === null ? 0 : Math.min(N * N - 1, Math.max(0, s + d))));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const filled = puzzle.solution.filter((_, i) => value(state, puzzle, i)).length;

  return (
    <div className="sudoku">
      <div className="sudoku-grid" role="grid">
        {puzzle.solution.map((_, i) => {
          const v = value(state, puzzle, i);
          const clash = !!v && PEERS[i].some((j) => value(state, puzzle, j) === v);
          const related = sel !== null && (PEERS[sel].includes(i) || sel === i);
          return (
            <button
              key={i}
              type="button"
              className={[
                "sd-cell",
                puzzle.givens[i] ? "given" : "",
                sel === i ? "sel" : related ? "related" : "",
                clash ? "clash" : "",
                i % N === 2 ? "edge-r" : "",
                Math.floor(i / N) % 2 === 1 && Math.floor(i / N) < N - 1 ? "edge-b" : "",
              ].join(" ")}
              onClick={() => setSel(i)}
              disabled={locked}
            >
              {v || ""}
            </button>
          );
        })}
      </div>
      <div className="sudoku-pad">
        {[1, 2, 3, 4, 5, 6].map((d) => (
          <button key={d} type="button" className="btn btn-ghost" onClick={() => put(d)} disabled={locked || done}>
            {d}
          </button>
        ))}
        <button type="button" className="btn btn-ghost" onClick={() => put(0)} disabled={locked || done}>
          ⌫
        </button>
      </div>
      <p className="game-note">{done ? "✦ Solved!" : `${filled}/36 filled · red means a repeat`}</p>
      {mode === "race" && (
        <Rivals
          players={players}
          render={(p) => {
            const s = states[p.id];
            const n = s ? puzzle.solution.filter((_, i) => value(s, puzzle, i)).length : 0;
            return <span>{s && solved(s, puzzle) ? "solved!" : `${n}/36 filled`}</span>;
          }}
        />
      )}
    </div>
  );
}

export const sudoku: GameDef<P, S, A> = {
  id: "sudoku",
  name: "Mini Sudoku",
  icon: "🔲",
  tagline: "A quick 6×6 sudoku — fill every row, column and box",
  minutes: 4,
  modes: ["coop", "race"],
  scope: (m) => (m === "coop" ? "shared" : "perPlayer"),
  puzzle: makePuzzle,
  init: () => ({ cells: Array(N * N).fill(0) }),
  reduce: (s, a, { p }) => {
    if (p.givens[a.i] || a.v < 0 || a.v > 6 || solved(s, p)) return s;
    const cells = [...s.cells];
    cells[a.i] = a.v;
    return { cells };
  },
  done: solved,
  score: (s, p) => {
    const ok = solved(s, p);
    const right = p.solution.filter((v, i) => !p.givens[i] && s.cells[i] === v).length;
    return { value: ok ? 100 : right, text: ok ? "Solved!" : `${right} cells right` };
  },
  Board,
};
