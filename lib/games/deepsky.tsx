"use client";

import { useEffect } from "react";
import { closeEnough, norm, sample, type BoardProps, type GameDef, type Rand } from "./core";
import { DEEP_SKY } from "./data/content";
import { AnswerBox, Flash, useFlash } from "@/components/games/kit";

/*
 * Name something in the category before time runs out — the rarer your answer,
 * the more light-years you travel. Both players answer every prompt; afterwards
 * you see each other's answers. In co-op, matching answers only count once.
 */

const SECONDS = 25;
const POINTS = [10, 30, 60, 100];
const TIER_NAMES = ["Moon", "Planet", "Nebula", "Deep Sky"];

type Entry = { name: string; aliases: string[]; tier: number };
type Prompt = { q: string; entries: Entry[] };
type P = { prompts: Prompt[] };
type Ans = { name: string; tier: number; points: number } | null;
type S = { i: number; startedAt: number[]; answers: Ans[]; misses: number[] };
type A = { type: "start"; i: number } | { type: "answer"; i: number; text: string } | { type: "pass"; i: number };

function makePuzzle(rand: Rand): P {
  return {
    prompts: sample(DEEP_SKY, 5, rand).map((p) => ({
      q: p.q,
      entries: p.tiers.flatMap((list, tier) =>
        list.map((raw) => {
          const [name, ...aliases] = raw.split("|");
          return { name, aliases, tier };
        }),
      ),
    })),
  };
}

export function findEntry(prompt: Prompt, text: string): Entry | null {
  const n = norm(text);
  // exact (incl. aliases) first, then typo-tolerant
  for (const e of prompt.entries) if ([e.name, ...e.aliases].some((x) => norm(x) === n)) return e;
  for (const e of prompt.entries) if ([e.name, ...e.aliases].some((x) => closeEnough(text, x))) return e;
  return null;
}

const timeUp = (s: S, i: number, t: number) => s.startedAt[i] !== undefined && t - s.startedAt[i] > (SECONDS + 1.5) * 1000;
const total = (s: S) => s.answers.reduce((n, a) => n + (a?.points ?? 0), 0);

function Board({ puzzle, state, states, act, locked, players, elapsedMs }: BoardProps<P, S, A>) {
  const [msg, flash] = useFlash();
  const i = state.i;
  const finished = i >= puzzle.prompts.length;
  const started = state.startedAt[i];

  // start the clock for the current prompt
  useEffect(() => {
    if (!finished && started === undefined && !locked) act({ type: "start", i });
  }, [i, finished, started, locked, act]);

  const now = Date.now();
  const left = started === undefined ? SECONDS : Math.max(0, SECONDS - (now - started) / 1000);
  useEffect(() => {
    if (!finished && started !== undefined && left <= 0 && !locked) act({ type: "pass", i });
  }, [left, finished, started, i, locked, act]);
  void elapsedMs; // re-render each tick

  if (finished) {
    const others = players.filter((p) => !p.isMe);
    return (
      <div className="sky">
        <p className="game-note">
          You traveled <strong>{total(state) * 10} light-years</strong> ✦
        </p>
        <table className="sky-table">
          <thead>
            <tr>
              <th>Prompt</th>
              <th>You</th>
              {others.map((p) => (
                <th key={p.id}>{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {puzzle.prompts.map((pr, k) => {
              const deep = pr.entries.filter((e) => e.tier === 3).slice(0, 2).map((e) => e.name);
              return (
                <tr key={k}>
                  <td>
                    {pr.q}
                    <small>deep cuts: {deep.join(", ")}</small>
                  </td>
                  <AnsCell a={state.answers[k]} />
                  {others.map((p) => {
                    const s = states[p.id];
                    if (!s || s.i <= k) return <td key={p.id}>…</td>;
                    const jinx = s.answers[k] && state.answers[k] && s.answers[k]!.name === state.answers[k]!.name;
                    return <AnsCell key={p.id} a={s.answers[k]} jinx={!!jinx} />;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  const prompt = puzzle.prompts[i];
  return (
    <div className="sky">
      <div className="sky-head">
        <span>
          {i + 1} / {puzzle.prompts.length}
        </span>
        <span className={`sky-clock ${left < 6 ? "low" : ""}`}>{Math.ceil(left)}s</span>
        <span>{total(state) * 10} ly</span>
      </div>
      <h3 className="sky-q">{prompt.q}</h3>
      <p className="game-note">Rarer answers travel farther: {POINTS.map((p, k) => `${TIER_NAMES[k]} ${p * 10}`).join(" · ")}</p>
      <Flash msg={msg} />
      <AnswerBox
        key={i}
        disabled={locked}
        placeholder="your answer"
        onSubmit={(text) => {
          const e = findEntry(prompt, text);
          if (!e) {
            flash(`"${text}" doesn't count — try another`);
            return false;
          }
          flash(`${e.name}: ${TIER_NAMES[e.tier]}! +${POINTS[e.tier] * 10} ly`);
          act({ type: "answer", i, text });
        }}
      />
      <div className="row" style={{ marginTop: "0.5rem" }}>
        <button className="btn btn-ghost" disabled={locked} onClick={() => act({ type: "pass", i })}>
          Pass
        </button>
      </div>
      <p className="game-note">
        {players
          .filter((p) => !p.isMe)
          .map((p) => `${p.name}: ${Math.min(puzzle.prompts.length, (states[p.id]?.i ?? 0) + 1)}/${puzzle.prompts.length}`)
          .join(" · ")}
      </p>
    </div>
  );
}

function AnsCell({ a, jinx }: { a: Ans; jinx?: boolean }) {
  if (!a) return <td className="miss">—</td>;
  return (
    <td className={`tier-${a.tier}`}>
      {a.name}
      <small>
        {TIER_NAMES[a.tier]} · {a.points * 10} ly{jinx ? " · jinx!" : ""}
      </small>
    </td>
  );
}

export const deepsky: GameDef<P, S, A> = {
  id: "deepsky",
  name: "Deep Sky",
  icon: "🔭",
  tagline: "Name something in the category — the rarer, the farther you go",
  minutes: 3,
  modes: ["coop", "race"],
  scope: () => "perPlayer",
  puzzle: makePuzzle,
  init: () => ({ i: 0, startedAt: [], answers: [], misses: [] }),
  reduce: (s, a, { p, t }) => {
    if (s.i >= p.prompts.length || a.i !== s.i) return s;
    if (a.type === "start") {
      if (s.startedAt[a.i] !== undefined) return s;
      const startedAt = [...s.startedAt];
      startedAt[a.i] = t;
      return { ...s, startedAt };
    }
    const answers = [...s.answers];
    if (a.type === "pass") {
      answers[a.i] = null;
      return { ...s, answers, i: s.i + 1 };
    }
    if (timeUp(s, a.i, t)) {
      answers[a.i] = null;
      return { ...s, answers, i: s.i + 1 };
    }
    const e = findEntry(p.prompts[a.i], a.text);
    if (!e) return s;
    answers[a.i] = { name: e.name, tier: e.tier, points: POINTS[e.tier] };
    return { ...s, answers, i: s.i + 1 };
  },
  done: (s, p) => s.i >= p.prompts.length,
  score: (s) => ({ value: total(s), text: `${total(s) * 10} light-years` }),
  // co-op: add everyone up, but a shared answer only counts once
  teamScore: (states, p) => {
    let sum = 0;
    p.prompts.forEach((_, k) => {
      const seen = new Set<string>();
      for (const s of states) {
        const a = s.answers[k];
        if (a && !seen.has(a.name)) {
          seen.add(a.name);
          sum += a.points;
        }
      }
    });
    return { value: sum, text: `${sum * 10} light-years together` };
  },
  Board,
};
