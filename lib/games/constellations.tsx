"use client";

import { useState } from "react";
import { pick, shuffle, type BoardProps, type GameDef, type Rand } from "./core";
import { CONSTELLATION_PUZZLES, type ConGroup } from "./data/content";
import { Flash, Rivals, Who, useFlash, useRise } from "@/components/games/kit";
import { ConstellationFigure } from "@/components/games/art";
import { sfx } from "./sfx";

/* Sixteen stars, four hidden constellations. Find the groups of four. */

type P = { groups: ConGroup[]; order: string[] };
type S = { solved: Array<{ g: number; by: string }>; mistakes: number; tried: string[]; last: { kind: "ok" | "miss" | "close"; by: string } | null };
type A = { type: "guess"; words: string[] };

const MAX_MISTAKES = 4;
const key = (ws: string[]) => [...ws].sort().join(",");
const lost = (s: S) => s.mistakes >= MAX_MISTAKES;
const won = (s: S, p: P) => s.solved.length === p.groups.length;

function makePuzzle(rand: Rand): P {
  const groups = pick(CONSTELLATION_PUZZLES, rand);
  return { groups, order: shuffle(groups.flatMap((g) => g.words), rand) };
}

function Board({ puzzle, state, states, act, locked, players, mode }: BoardProps<P, S, A>) {
  const [sel, setSel] = useState<string[]>([]);
  const [msg, flash] = useFlash();
  const [order, setOrder] = useState(puzzle.order);
  const solvedWords = new Set(state.solved.flatMap((x) => puzzle.groups[x.g].words));
  const over = lost(state) || won(state, puzzle);
  const remaining = order.filter((w) => !solvedWords.has(w));

  const toggle = (w: string) => {
    if (locked || over) return;
    sfx("tap");
    setSel((s) => (s.includes(w) ? s.filter((x) => x !== w) : s.length < 4 ? [...s, w] : s));
  };

  useRise(state.solved.length, () => sfx("great"));
  useRise(state.mistakes, () => sfx("bad"));

  const submit = () => {
    if (sel.length !== 4) return;
    if (state.tried.includes(key(sel))) return flash("Already tried that one");
    const g = puzzle.groups.findIndex((gr) => gr.words.every((w) => sel.includes(w)));
    const close = puzzle.groups.some((gr) => gr.words.filter((w) => sel.includes(w)).length === 3);
    flash(g >= 0 ? "✦ Constellation found!" : close ? "One away…" : "Not quite");
    act({ type: "guess", words: sel });
    setSel([]);
  };

  // show leftover groups once the game is lost
  const shown = over && lost(state) ? puzzle.groups.map((_, g) => g).filter((g) => !state.solved.some((x) => x.g === g)) : [];

  return (
    <div className="cons">
      <p className="game-note">Find four groups of four. Watch out for stars that seem to fit twice.</p>
      <div className="cons-solved">
        {[...state.solved.map((x) => ({ g: x.g, by: x.by })), ...shown.map((g) => ({ g, by: "" }))].map(({ g, by }) => (
          <div key={g} className={`cons-group lvl-${puzzle.groups[g].level}`}>
            <ConstellationFigure level={puzzle.groups[g].level} />
            <strong>{puzzle.groups[g].name}</strong>
            <span>{puzzle.groups[g].words.join(", ")}</span>
            {mode === "coop" && by && <Who id={by} players={players} />}
          </div>
        ))}
      </div>
      {!over && (
        <div className="cons-grid">
          {remaining.map((w) => (
            <button key={w} type="button" className={`cons-star ${sel.includes(w) ? "sel" : ""}`} onClick={() => toggle(w)} disabled={locked}>
              {w}
            </button>
          ))}
        </div>
      )}
      <Flash msg={msg} />
      <div className="cons-foot">
        <span key={state.mistakes} className={`cons-lives ${state.mistakes ? "hit" : ""}`} aria-label={`${MAX_MISTAKES - state.mistakes} mistakes left`}>
          Mistakes left:{" "}
          {Array.from({ length: MAX_MISTAKES }, (_, i) => (
            <span key={i} className={i < MAX_MISTAKES - state.mistakes ? "life" : "life gone"}>
              ✦
            </span>
          ))}
        </span>
        {!over && (
          <div className="row">
            <button className="btn btn-ghost" onClick={() => (sfx("shuffle"), setOrder((o) => shuffle(o, Math.random)))} disabled={locked}>
              Shuffle
            </button>
            <button className="btn btn-ghost" onClick={() => setSel([])} disabled={locked || !sel.length}>
              Deselect
            </button>
            <button className="btn btn-lamp" onClick={submit} disabled={locked || sel.length !== 4}>
              Submit
            </button>
          </div>
        )}
      </div>
      {mode === "coop" && state.last && state.last.by && !players.find((p) => p.id === state.last!.by)?.isMe && (
        <p className="game-note">
          <Who id={state.last.by} players={players} /> guessed — {state.last.kind === "ok" ? "found one!" : state.last.kind === "close" ? "one away" : "miss"}
        </p>
      )}
      {mode === "race" && (
        <Rivals
          players={players}
          render={(p) => {
            const s = states[p.id];
            return (
              <span>
                {s?.solved.length ?? 0}/4 found · {s?.mistakes ?? 0} mistakes
              </span>
            );
          }}
        />
      )}
    </div>
  );
}

export const constellations: GameDef<P, S, A> = {
  id: "constellations",
  name: "Constellations",
  icon: "✨",
  tagline: "Sort sixteen stars into four hidden groups",
  minutes: 4,
  modes: ["coop", "race"],
  scope: (m) => (m === "coop" ? "shared" : "perPlayer"),
  puzzle: makePuzzle,
  init: () => ({ solved: [], mistakes: 0, tried: [], last: null }),
  reduce: (s, a, { p, by }) => {
    if (lost(s) || won(s, p) || a.words.length !== 4 || s.tried.includes(key(a.words))) return s;
    const tried = [...s.tried, key(a.words)];
    const g = p.groups.findIndex((gr) => gr.words.every((w) => a.words.includes(w)));
    if (g >= 0 && !s.solved.some((x) => x.g === g)) return { ...s, tried, solved: [...s.solved, { g, by }], last: { kind: "ok", by } };
    const close = p.groups.some((gr) => gr.words.filter((w) => a.words.includes(w)).length === 3);
    return { ...s, tried, mistakes: s.mistakes + 1, last: { kind: close ? "close" : "miss", by } };
  },
  done: (s, p) => lost(s) || won(s, p),
  score: (s, p) => ({
    value: s.solved.length * 10 - s.mistakes * 2,
    text: won(s, p) ? `All 4 · ${s.mistakes} mistake${s.mistakes === 1 ? "" : "s"}` : `${s.solved.length}/4 found`,
  }),
  Board,
};
