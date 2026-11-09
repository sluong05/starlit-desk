"use client";

import { shuffle, type BoardProps, type GameDef, type Rand } from "./core";
import { TIMELINE_EVENTS, type TimelineEvent } from "./data/content";
import { Rivals, useRise } from "@/components/games/kit";
import { Hourglass } from "@/components/games/art";
import { sfx } from "./sfx";

/* Put five events in order, oldest first. Three rounds. */

type P = { rounds: TimelineEvent[][] };
type S = { r: number; order: number[][]; locked: boolean[] };
type A = { type: "move"; from: number; to: number } | { type: "lock" } | { type: "next" };

const ROUNDS = 3;
const PER = 5;

function makePuzzle(rand: Rand): P {
  // distinct years only, and no event reused between rounds
  const pool = shuffle(TIMELINE_EVENTS, rand);
  const rounds: TimelineEvent[][] = [];
  for (let r = 0; r < ROUNDS; r++) {
    const round: TimelineEvent[] = [];
    while (round.length < PER && pool.length) {
      const e = pool.pop()!;
      if (!round.some((x) => x.year === e.year)) round.push(e);
    }
    rounds.push(round);
  }
  return { rounds };
}

const correctCount = (events: TimelineEvent[], order: number[]) => {
  const sorted = [...events].map((e, i) => ({ e, i })).sort((a, b) => a.e.year - b.e.year);
  return order.filter((idx, pos) => sorted[pos].i === idx).length;
};
const totalScore = (s: S, p: P) => p.rounds.reduce((n, ev, r) => n + (s.locked[r] ? correctCount(ev, s.order[r]) : 0), 0);

function Board({ puzzle, state, states, act, locked, players, mode }: BoardProps<P, S, A>) {
  const done = state.r >= puzzle.rounds.length;
  useRise(state.locked.filter(Boolean).length, () => sfx("stamp"));
  useRise(state.r, () => sfx("whoosh"));
  if (done)
    return (
      <div className="timeline">
        <p className="game-note">
          {totalScore(state, puzzle)} of {ROUNDS * PER} in the right spot ✦
        </p>
        {mode === "race" && <Rivals players={players} render={(p) => <span>{states[p.id] ? totalScore(states[p.id], puzzle) : 0} right</span>} />}
      </div>
    );

  const events = puzzle.rounds[state.r];
  const order = state.order[state.r];
  const isLocked = state.locked[state.r];
  const sortedYears = [...events].map((e) => e.year).sort((a, b) => a - b);

  return (
    <div className="timeline">
      <div className="timeline-head">
        <span>
          Round {state.r + 1}/{ROUNDS}
        </span>
        <Hourglass turn={state.r} />
        <span>Oldest at the top ↑</span>
      </div>
      <ol className="timeline-list">
        {order.map((idx, pos) => {
          const e = events[idx];
          const right = isLocked && e.year === sortedYears[pos];
          return (
            <li key={idx} className={isLocked ? (right ? "right" : "wrong") : ""} style={{ animationDelay: `${pos * 0.09}s` }}>
              <span className="tl-text">{e.text}</span>
              {isLocked ? (
                <span className="tl-year" style={{ animationDelay: `${pos * 0.09}s` }}>
                  {e.year}
                </span>
              ) : (
                <span className="tl-moves">
                  <button className="btn btn-ghost btn-sm" aria-label="Move up" disabled={locked || pos === 0} onClick={() => (sfx("tap"), act({ type: "move", from: pos, to: pos - 1 }))}>
                    ↑
                  </button>
                  <button className="btn btn-ghost btn-sm" aria-label="Move down" disabled={locked || pos === order.length - 1} onClick={() => (sfx("tap"), act({ type: "move", from: pos, to: pos + 1 }))}>
                    ↓
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="row">
        {isLocked ? (
          <>
            <span className="game-note" style={{ margin: 0, flex: 1 }}>
              {correctCount(events, order)}/{PER} in the right spot
            </span>
            <button className="btn btn-lamp" disabled={locked} onClick={() => act({ type: "next" })}>
              {state.r === ROUNDS - 1 ? "Finish" : "Next round"}
            </button>
          </>
        ) : (
          <button className="btn btn-lamp" disabled={locked} onClick={() => act({ type: "lock" })}>
            Lock it in
          </button>
        )}
      </div>
      {mode === "race" && (
        <Rivals players={players} render={(p) => <span>{states[p.id] ? `round ${Math.min(ROUNDS, states[p.id].r + 1)} · ${totalScore(states[p.id], puzzle)} right` : "starting…"}</span>} />
      )}
    </div>
  );
}

export const timeline: GameDef<P, S, A> = {
  id: "timeline",
  name: "Timeline",
  icon: "⏳",
  tagline: "Put history in order — moon landings to iPhones",
  minutes: 3,
  modes: ["coop", "race"],
  scope: (m) => (m === "coop" ? "shared" : "perPlayer"),
  puzzle: makePuzzle,
  init: (p) => ({ r: 0, order: p.rounds.map((ev) => ev.map((_, i) => i)), locked: p.rounds.map(() => false) }),
  reduce: (s, a, { p }) => {
    if (s.r >= p.rounds.length) return s;
    if (a.type === "next") return s.locked[s.r] ? { ...s, r: s.r + 1 } : s;
    if (s.locked[s.r]) return s;
    if (a.type === "lock") {
      const lockedArr = [...s.locked];
      lockedArr[s.r] = true;
      return { ...s, locked: lockedArr };
    }
    const cur = [...s.order[s.r]];
    if (a.to < 0 || a.to >= cur.length || a.from < 0 || a.from >= cur.length) return s;
    const [x] = cur.splice(a.from, 1);
    cur.splice(a.to, 0, x);
    const order = [...s.order];
    order[s.r] = cur;
    return { ...s, order };
  },
  done: (s, p) => s.r >= p.rounds.length,
  score: (s, p) => ({ value: totalScore(s, p), text: `${totalScore(s, p)}/${ROUNDS * PER} in order` }),
  Board,
};
