"use client";

import { closeEnough, sample, type BoardProps, type GameDef, type Rand } from "./core";
import { EMOJI_MOVIES, type EmojiMovie } from "./data/content";
import { AnswerBox, Flash, Rivals, Who, useFlash, useRise } from "@/components/games/kit";
import { sfx } from "./sfx";

/* Name the movie from its emoji. Hints cost a star. */

type P = { movies: EmojiMovie[] };
type Result = { ok: boolean; hints: number; by: string };
type S = { i: number; hints: number; results: Result[] };
type A = { type: "guess"; text: string } | { type: "hint" } | { type: "skip" };

const ROUND = 6;
const titles = (m: EmojiMovie) => m.title.split("|");
const shown = (m: EmojiMovie) => titles(m)[0];
const matches = (m: EmojiMovie, text: string) => titles(m).some((t) => closeEnough(text, t));
const letterHint = (t: string) =>
  t
    .split(" ")
    .map((w) => (w.length > 1 ? w[0] + "_".repeat(w.length - 1) : w))
    .join(" ");
const stars = (s: S) => s.results.reduce((n, r) => n + (r.ok ? 3 - r.hints : 0), 0);

function Board({ puzzle, state, states, act, locked, players, mode }: BoardProps<P, S, A>) {
  const [msg, flash] = useFlash();
  const done = state.i >= puzzle.movies.length;
  useRise(state.results.length, () => sfx(state.results[state.results.length - 1]?.ok ? "clap" : "whoosh"));
  useRise(state.hints, () => sfx("pop"));

  return (
    <div className="emoji">
      <div className="emoji-progress">
        {puzzle.movies.map((m, k) => {
          const r = state.results[k];
          return (
            <span key={k} className={r ? (r.ok ? "ok" : "skip") : k === state.i ? "cur" : ""} title={r ? shown(m) : undefined}>
              {r ? (r.ok ? "★".repeat(3 - r.hints) || "✓" : "✕") : k + 1}
            </span>
          );
        })}
      </div>

      {done ? (
        <>
          <p className="game-note">{stars(state)} ★ out of {ROUND * 3}</p>
          <ul className="emoji-recap">
            {puzzle.movies.map((m, k) => (
              <li key={k}>
                <span className="emoji-small">{m.emoji}</span> {shown(m)} ({m.year})
                {mode === "coop" && state.results[k]?.ok && <Who id={state.results[k].by} players={players} />}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <div className="cinema">
            <div className="marquee" aria-hidden="true">
              {Array.from({ length: 13 }, (_, k) => (
                <i key={k} style={{ animationDelay: `${(k % 3) * 0.3}s` }} />
              ))}
            </div>
            <div className="curtain curtain-l" aria-hidden="true" />
            <div className="curtain curtain-r" aria-hidden="true" />
            <div className="screen">
              <div className="emoji-clue" key={state.i} aria-label="Emoji clue">
                {puzzle.movies[state.i].emoji}
              </div>
            </div>
          </div>
          <div className="emoji-hints">
            {state.hints >= 1 && <span>Released {puzzle.movies[state.i].year}</span>}
            {state.hints >= 2 && <span className="letters">{letterHint(shown(puzzle.movies[state.i]))}</span>}
          </div>
          <Flash msg={msg} />
          <AnswerBox
            key={state.i}
            disabled={locked}
            placeholder="movie title"
            onSubmit={(text) => {
              if (!matches(puzzle.movies[state.i], text)) {
                flash("Nope — try again");
                return false;
              }
              flash(`✦ ${shown(puzzle.movies[state.i])}!`);
              act({ type: "guess", text });
            }}
          />
          <div className="row" style={{ marginTop: "0.5rem" }}>
            <button className="btn btn-ghost" disabled={locked || state.hints >= 2} onClick={() => act({ type: "hint" })}>
              Hint (−1★)
            </button>
            <button className="btn btn-ghost" disabled={locked} onClick={() => act({ type: "skip" })}>
              Skip
            </button>
          </div>
        </>
      )}

      {mode === "race" && (
        <Rivals players={players} render={(p) => <span>{states[p.id] ? `${states[p.id].results.length}/${ROUND} · ${stars(states[p.id])}★` : "0/6"}</span>} />
      )}
    </div>
  );
}

export const emoji: GameDef<P, S, A> = {
  id: "emoji",
  name: "Emoji Cinema",
  icon: "🍿",
  tagline: "Guess the movie from a few emoji",
  minutes: 3,
  modes: ["coop", "race"],
  scope: (m) => (m === "coop" ? "shared" : "perPlayer"),
  puzzle: (rand: Rand) => ({ movies: sample(EMOJI_MOVIES, ROUND, rand) }),
  init: () => ({ i: 0, hints: 0, results: [] }),
  reduce: (s, a, { p, by }) => {
    if (s.i >= p.movies.length) return s;
    if (a.type === "hint") return s.hints >= 2 ? s : { ...s, hints: s.hints + 1 };
    if (a.type === "guess" && !matches(p.movies[s.i], a.text)) return s;
    return { i: s.i + 1, hints: 0, results: [...s.results, { ok: a.type === "guess", hints: s.hints, by }] };
  },
  done: (s, p) => s.i >= p.movies.length,
  score: (s) => ({ value: stars(s), text: `${stars(s)}/${ROUND * 3} ★` }),
  Board,
};
