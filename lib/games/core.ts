/**
 * Shared pieces for every break game.
 *
 * A game is a pure state machine: `puzzle(rand)` builds the puzzle from a seed
 * (so both players generate the identical puzzle locally), `init` gives the
 * starting state, and `reduce` applies one action. Every action either player
 * takes is broadcast and kept in a shared log; each browser replays the log,
 * so both always agree on the result without a server.
 *
 * Co-op: everyone's actions build one shared state.
 * Race: each player's actions build their own state, and scores are compared.
 */

import type { ComponentType } from "react";
import { mulberry32 } from "@/lib/sound/dsp";

export type Mode = "coop" | "race";
export type Rand = () => number;

export type Player = { id: string; name: string; isMe: boolean };

export type BoardProps<P, S, A> = {
  puzzle: P;
  mode: Mode;
  me: Player;
  players: Player[];
  /** The state this player is looking at (shared in co-op, their own in race). */
  state: S;
  /** Everyone's state by player id (in co-op they're all the same object). */
  states: Record<string, S>;
  act: (a: A) => void;
  /** True once the game or the break is over. */
  locked: boolean;
  /** Milliseconds since the round started (shared clock). */
  elapsedMs: number;
};

export type Score = { value: number; text: string };

export interface GameDef<P = any, S = any, A = any> {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  /** Roughly how long a round takes, shown on the menu. */
  minutes: number;
  modes: Mode[];
  /** Simultaneous games keep a state per player even in co-op. */
  scope: (mode: Mode) => "shared" | "perPlayer";
  /** Optional async data (word lists), loaded when the game is picked. */
  load?: () => Promise<unknown>;
  puzzle: (rand: Rand, data: any) => P;
  init: (p: P) => S;
  reduce: (s: S, a: A, ctx: { p: P; by: string; t: number }) => S;
  done: (s: S, p: P) => boolean;
  /** A player's result. `pid` matters for shared-state games that track each player inside. */
  score: (s: S, p: P, pid: string) => Score;
  /** Optional: the team's result in co-op when the game keeps per-player progress. */
  teamScore?: (states: S[], p: P, pids: string[]) => Score;
  Board: ComponentType<BoardProps<P, S, A>>;
}

export function makeRand(seed: number): Rand {
  return mulberry32(seed);
}

export function shuffle<T>(xs: readonly T[], rand: Rand): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick<T>(xs: readonly T[], rand: Rand): T {
  return xs[Math.floor(rand() * xs.length)];
}

export function sample<T>(xs: readonly T[], n: number, rand: Rand): T[] {
  return shuffle(xs, rand).slice(0, n);
}

/** Lowercase, strip accents and anything that isn't a letter, digit, + or # (so C, C++ and C# differ). */
export function norm(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9+#]/g, "");
}

export function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  const m = a.length,
    n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/** Forgiving answer match: exact after normalizing, or a small typo on longer answers. */
export function closeEnough(guess: string, answer: string) {
  const g = norm(guess),
    a = norm(answer);
  if (!g) return false;
  if (g === a) return true;
  const allowed = a.length >= 9 ? 2 : a.length >= 5 ? 1 : 0;
  return allowed > 0 && levenshtein(g, a) <= allowed;
}

export const plural = (n: number, word: string, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

export function fmtTime(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
