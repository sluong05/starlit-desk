"use client";

import { pick, shuffle, type BoardProps, type GameDef, type Rand } from "./core";
import { AnswerBox, Flash, Rivals, Who, useFlash } from "@/components/games/kit";

/* Unscramble five words, shortest to longest. */

type Item = { scrambled: string; answers: string[] };
type P = { items: Item[] };
type S = { solved: Array<{ w: string; by: string } | null>; hints: number[] };
type A = { type: "solve"; w: string } | { type: "hint"; i: number };

function makePuzzle(rand: Rand, d: { words: string[] }): P {
  const lengths = [5, 5, 6, 6, 7];
  const used = new Set<string>();
  const items = lengths.map((len) => {
    const pool = d.words.filter((e) => e.split("|")[0].length === len);
    let entry = pick(pool, rand);
    while (used.has(entry)) entry = pick(pool, rand);
    used.add(entry);
    const answers = entry.split("|");
    let scrambled = answers[0];
    for (let t = 0; t < 20 && answers.includes(scrambled); t++) scrambled = shuffle(answers[0].split(""), rand).join("");
    return { scrambled, answers };
  });
  return { items };
}

const matchIndex = (s: S, p: P, w: string) => p.items.findIndex((it, i) => !s.solved[i] && it.answers.includes(w));
const allSolved = (s: S) => s.solved.every(Boolean);

function Board({ puzzle, state, states, act, locked, players, mode }: BoardProps<P, S, A>) {
  const [msg, flash] = useFlash();
  return (
    <div className="scramble">
      <p className="game-note">Unscramble all five. Type any answer; it finds its row.</p>
      <ul className="scramble-rows">
        {puzzle.items.map((it, i) => {
          const solved = state.solved[i];
          const hints = state.hints[i];
          return (
            <li key={i} className={solved ? "solved" : ""}>
              <span className="tiles">
                {(solved ? solved.w : it.scrambled).split("").map((c, j) => (
                  <span key={j} className="tile-letter">
                    {c}
                  </span>
                ))}
              </span>
              {solved ? (
                mode === "coop" && <Who id={solved.by} players={players} />
              ) : (
                <>
                  {hints > 0 && <span className="hint">starts {it.answers[0].slice(0, hints).toUpperCase()}…</span>}
                  <button className="btn btn-ghost btn-sm" disabled={locked || hints >= 2} onClick={() => act({ type: "hint", i })}>
                    Hint
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <Flash msg={msg} />
      {!allSolved(state) && (
        <AnswerBox
          disabled={locked}
          placeholder="unscrambled word"
          maxLength={7}
          onSubmit={(t) => {
            const w = t.toLowerCase();
            if (matchIndex(state, puzzle, w) < 0) return flash("Not one of them"), false;
            act({ type: "solve", w });
          }}
        />
      )}
      {locked && !allSolved(state) && (
        <p className="game-note">Answers: {puzzle.items.map((it) => it.answers[0].toUpperCase()).join(", ")}</p>
      )}
      {mode === "race" && (
        <Rivals players={players} render={(p) => <span>{states[p.id]?.solved.filter(Boolean).length ?? 0}/5 solved</span>} />
      )}
    </div>
  );
}

export const scramble: GameDef<P, S, A> = {
  id: "scramble",
  name: "Scramble",
  icon: "🔀",
  tagline: "Unscramble five words before your break ends",
  minutes: 3,
  modes: ["coop", "race"],
  scope: (m) => (m === "coop" ? "shared" : "perPlayer"),
  load: () => import("./data/scramble.json").then((m) => m.default),
  puzzle: makePuzzle,
  init: (p) => ({ solved: p.items.map(() => null), hints: p.items.map(() => 0) }),
  reduce: (s, a, { p, by }) => {
    if (a.type === "hint") {
      if (s.solved[a.i] || s.hints[a.i] >= 2) return s;
      const hints = [...s.hints];
      hints[a.i]++;
      return { ...s, hints };
    }
    const i = matchIndex(s, p, a.w);
    if (i < 0) return s;
    const solved = [...s.solved];
    solved[i] = { w: a.w, by };
    return { ...s, solved };
  },
  done: allSolved,
  score: (s) => {
    const n = s.solved.filter(Boolean).length;
    const h = s.hints.reduce((a, b) => a + b, 0);
    return { value: n * 10 - h * 3, text: `${n}/5 solved${h ? ` · ${h} hint${h > 1 ? "s" : ""}` : ""}` };
  },
  Board,
};
