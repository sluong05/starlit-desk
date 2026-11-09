"use client";

import { useEffect, useState } from "react";
import { pick, type BoardProps, type GameDef } from "./core";
import { Flash, Rivals, Who, typingInField, useFlash, useRise } from "@/components/games/kit";
import { MoonPhase } from "@/components/games/art";
import { sfx } from "./sfx";

/* Guess the hidden five-letter word in six tries. */

type Mark = "hit" | "near" | "miss";
type P = { answer: string; valid: Set<string> };
type Guess = { word: string; by: string };
type S = { guesses: Guess[] };
type A = { type: "guess"; word: string };

const ROWS = 6;

export function marks(guess: string, answer: string): Mark[] {
  const out: Mark[] = Array(5).fill("miss");
  const left: Record<string, number> = {};
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) out[i] = "hit";
    else left[answer[i]] = (left[answer[i]] ?? 0) + 1;
  }
  for (let i = 0; i < 5; i++) {
    if (out[i] !== "hit" && left[guess[i]]) {
      out[i] = "near";
      left[guess[i]]--;
    }
  }
  return out;
}

const won = (s: S, p: P) => s.guesses.some((g) => g.word === p.answer);

function Board({ puzzle, state, states, act, locked, players, mode }: BoardProps<P, S, A>) {
  const [typed, setTyped] = useState("");
  const [msg, flash] = useFlash();
  const finished = won(state, puzzle) || state.guesses.length >= ROWS;

  const submit = () => {
    const nope = (m: string) => (sfx("bad"), flash(m));
    if (typed.length < 5) return nope("Not enough letters");
    if (!puzzle.valid.has(typed)) return nope("Not in the word list");
    if (state.guesses.some((g) => g.word === typed)) return nope("Already guessed");
    act({ type: "guess", word: typed });
    setTyped("");
  };

  const press = (k: string) => {
    if (locked || finished) return;
    if (k === "enter") submit();
    else if (k === "back") (sfx("back"), setTyped((t) => t.slice(0, -1)));
    else if (/^[a-z]$/.test(k)) (sfx("type"), setTyped((t) => (t.length < 5 ? t + k : t)));
  };

  useRise(state.guesses.length, () => sfx("flip"));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typingInField(e) || e.metaKey || e.ctrlKey) return;
      if (e.key === "Enter") press("enter");
      else if (e.key === "Backspace") press("back");
      else if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // best known status per letter for the keyboard
  const keyMark: Record<string, Mark> = {};
  for (const g of state.guesses) {
    marks(g.word, puzzle.answer).forEach((m, i) => {
      const l = g.word[i];
      if (keyMark[l] === "hit" || (keyMark[l] === "near" && m === "miss")) return;
      keyMark[l] = m;
    });
  }

  const rows = Array.from({ length: ROWS }, (_, r) => {
    const g = state.guesses[r];
    if (g) return { letters: g.word.split(""), m: marks(g.word, puzzle.answer), by: g.by, win: g.word === puzzle.answer };
    if (r === state.guesses.length && !finished) return { letters: typed.padEnd(5).split(""), m: null, by: "", win: false };
    return { letters: Array(5).fill(" "), m: null, by: "", win: false };
  });

  return (
    <div className="mw">
      <div className="mw-moon">
        <MoonPhase p={won(state, puzzle) ? 1 : state.guesses.length / ROWS} glow={won(state, puzzle)} />
        <p>
          <span className="key-hit" /> right spot <span className="key-near" /> wrong spot
        </p>
      </div>
      <div className="mw-grid">
        {rows.map((row, r) => (
          <div className={`mw-row ${row.win ? "won" : ""}`} key={r}>
            {row.letters.map((l, i) => (
              <div key={i} className={`mw-cell ${row.m ? `m-${row.m[i]}` : l.trim() ? "filled" : ""}`} style={{ animationDelay: `${i * 90}ms, ${500 + i * 80}ms` }}>
                {l.trim()}
              </div>
            ))}
            {mode === "coop" && row.by && <Who id={row.by} players={players} />}
          </div>
        ))}
      </div>

      <Flash msg={msg} />
      {finished && (
        <p className="game-note">
          {won(state, puzzle) ? "✦ Got it!" : "Out of guesses —"} the word was <strong>{puzzle.answer.toUpperCase()}</strong>
        </p>
      )}

      <div className="mw-keys" aria-label="Keyboard">
        {["qwertyuiop", "asdfghjkl", "+zxcvbnm-"].map((row, r) => (
          <div className="mw-krow" key={r}>
            {row.split("").map((k) => {
              const key = k === "+" ? "enter" : k === "-" ? "back" : k;
              return (
                <button
                  key={key}
                  type="button"
                  className={`mw-key ${keyMark[key] ? `m-${keyMark[key]}` : ""} ${key.length > 1 ? "wide" : ""}`}
                  onClick={() => press(key)}
                  disabled={locked || finished}
                >
                  {key === "enter" ? "Enter" : key === "back" ? "⌫" : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {mode === "race" && (
        <Rivals
          players={players}
          render={(p) => (
            <div className="mw-mini">
              {(states[p.id]?.guesses ?? []).map((g, r) => (
                <div className="mw-mini-row" key={r}>
                  {marks(g.word, puzzle.answer).map((m, i) => (
                    <span key={i} className={`m-${m}`} />
                  ))}
                </div>
              ))}
              {won(states[p.id] ?? { guesses: [] }, puzzle) && <small>solved!</small>}
            </div>
          )}
        />
      )}
    </div>
  );
}

export const moonword: GameDef<P, S, A> = {
  id: "moonword",
  name: "Moonword",
  icon: "🌙",
  tagline: "Find the hidden five-letter word in six guesses",
  minutes: 3,
  modes: ["coop", "race"],
  scope: (m) => (m === "coop" ? "shared" : "perPlayer"),
  load: () => import("./data/five.json").then((m) => m.default),
  puzzle: (rand, data: { answers: string[]; valid: string[] }) => ({
    answer: pick(data.answers, rand),
    valid: new Set([...data.valid, ...data.answers]),
  }),
  init: () => ({ guesses: [] }),
  reduce: (s, a, { p, by }) => {
    if (a.type !== "guess" || won(s, p) || s.guesses.length >= ROWS) return s;
    if (!p.valid.has(a.word) || s.guesses.some((g) => g.word === a.word)) return s;
    return { guesses: [...s.guesses, { word: a.word, by }] };
  },
  done: (s, p) => won(s, p) || s.guesses.length >= ROWS,
  score: (s, p) => {
    const ok = won(s, p);
    return ok ? { value: ROWS + 1 - s.guesses.length, text: `Solved in ${s.guesses.length}/${ROWS}` } : { value: 0, text: `X/${ROWS}` };
  },
  Board,
};
