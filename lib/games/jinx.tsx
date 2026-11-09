"use client";

import { norm, type BoardProps, type GameDef } from "./core";
import { AnswerBox, useRise } from "@/components/games/kit";
import { Minds } from "@/components/games/art";
import { sfx } from "./sfx";

/*
 * Mind meld: you both say a word at the same time. Then each of you says the
 * word that connects your last two words, again and again, until you say the
 * SAME word. No puzzle data needed — just two brains.
 */

const MAX_ROUNDS = 10;
type P = Record<string, never>;
type S = { rounds: Array<Record<string, string>> };
type A = { type: "say"; word: string };

const complete = (r: Record<string, string>) => Object.keys(r).length >= 2;
const isMatch = (r: Record<string, string>) => complete(r) && new Set(Object.values(r).map(norm)).size === 1;
const won = (s: S) => s.rounds.some(isMatch);
const doneRounds = (s: S) => s.rounds.filter(complete).length;

function Board({ state, act, locked, players, me }: BoardProps<P, S, A>) {
  const others = players.filter((p) => !p.isMe);
  const current = state.rounds.find((r) => !complete(r)) ?? {};
  const said = current[me.id];
  const finishedRounds = state.rounds.filter(complete);
  const last = finishedRounds[finishedRounds.length - 1];
  const over = won(state) || finishedRounds.length >= MAX_ROUNDS;
  useRise(finishedRounds.length, () => sfx(won(state) ? "great" : "zap"));
  useRise(Object.keys(current).length, () => sfx("blip"));

  if (!others.length)
    return (
      <div className="jinx">
        <p className="game-note">Jinx needs both of you — invite your friend first!</p>
      </div>
    );

  return (
    <div className="jinx">
      <Minds left="You" right={others[0].name} state={won(state) ? "match" : Object.keys(current).length > 0 ? "thinking" : "idle"} />
      <p className="game-note">
        {finishedRounds.length === 0
          ? "Round 1: both of you type ANY word. Don't plan it!"
          : over
            ? won(state)
              ? `✦ Mind meld in ${finishedRounds.length} rounds!`
              : "Out of rounds — so close."
            : "Now type the word that connects your last two words. Try to land on the same one!"}
      </p>

      <ol className="jinx-rounds">
        {finishedRounds.map((r, k) => (
          <li key={k} className={isMatch(r) ? "match" : ""}>
            {players.map((p) => (
              <span key={p.id} className="jinx-word">
                <small>{p.isMe ? "you" : p.name}</small>
                {r[p.id] ?? "…"}
              </span>
            ))}
          </li>
        ))}
      </ol>

      {!over && (
        <>
          {last && (
            <p className="jinx-bridge">
              {Object.values(last).join("  +  ")}  =  ?
            </p>
          )}
          {said ? (
            <p className="game-note">You said “{said}” — waiting for {others[0].name}…</p>
          ) : (
            <AnswerBox disabled={locked} placeholder="one word" button="Say it" maxLength={30} onSubmit={(t) => act({ type: "say", word: t.split(/\s+/)[0] })} />
          )}
          {!said && Object.keys(current).length > 0 && <p className="game-note">{others[0].name} is ready ✓</p>}
        </>
      )}
    </div>
  );
}

export const jinx: GameDef<P, S, A> = {
  id: "jinx",
  name: "Jinx",
  icon: "🧠",
  tagline: "Keep saying words until you both say the same one",
  minutes: 3,
  modes: ["coop"],
  scope: () => "shared",
  puzzle: () => ({}),
  init: () => ({ rounds: [] }),
  reduce: (s, a, { by }) => {
    if (won(s) || doneRounds(s) >= MAX_ROUNDS) return s;
    const rounds = [...s.rounds];
    let idx = rounds.findIndex((r) => !complete(r));
    if (idx < 0) {
      rounds.push({});
      idx = rounds.length - 1;
    }
    if (rounds[idx][by]) return s;
    rounds[idx] = { ...rounds[idx], [by]: a.word.slice(0, 30) };
    return { rounds };
  },
  done: (s) => won(s) || doneRounds(s) >= MAX_ROUNDS,
  score: (s) => {
    const n = s.rounds.filter(complete).length;
    return won(s) ? { value: MAX_ROUNDS + 1 - n, text: `Mind meld in ${n} rounds` } : { value: 0, text: "No match this time" };
  },
  Board,
};
