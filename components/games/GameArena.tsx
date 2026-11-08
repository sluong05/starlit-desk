"use client";

import { useEffect, useMemo, useState } from "react";
import { GAMES, getGame } from "@/lib/games";
import { fmtTime, makeRand, type GameDef, type Mode, type Player, type Score } from "@/lib/games/core";
import type { LoggedAct } from "@/lib/games/useGameLog";

export type Session = { sid: string; gameId: string; mode: Mode; seed: number; startedAt: number };

/**
 * The game area that replaces the big video tile. Shows the game menu, the
 * current game, results, and the "break's over" screen.
 */
export default function GameArena({
  session,
  setSession,
  acts,
  dispatch,
  players,
  me,
  playable,
  gameNight,
  untilBreakMs,
  breakLeftMs,
  onClose,
}: {
  session: Session | null;
  setSession: (s: Session | null) => void;
  acts: LoggedAct[];
  dispatch: (a: unknown) => void;
  players: Player[];
  me: Player;
  playable: boolean;
  gameNight: boolean;
  untilBreakMs: number | null;
  breakLeftMs: number | null;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("coop");
  const game = getGame(session?.gameId);

  const start = (g: GameDef, again = false) => {
    const m = again && session ? session.mode : g.modes.includes(mode) ? mode : g.modes[0];
    setSession({ sid: crypto.randomUUID(), gameId: g.id, mode: m, seed: Math.floor(Math.random() * 2 ** 31), startedAt: Date.now() });
  };

  return (
    <section className="arena glass" aria-label="Games">
      <header className="arena-head">
        <div className="arena-title">
          {game && session ? (
            <>
              <span className="arena-icon">{game.icon}</span>
              <strong>{game.name}</strong>
              <span className="chip">{session.mode === "coop" ? "Co-op" : "Race"}</span>
            </>
          ) : (
            <>
              <span className="arena-icon">🎲</span>
              <strong>{gameNight ? "Game Night" : "Break games"}</strong>
            </>
          )}
        </div>
        <div className="arena-actions">
          {!gameNight && breakLeftMs !== null && playable && <span className="chip">☾ break {fmtTime(breakLeftMs)}</span>}
          {session && playable && (
            <button className="btn btn-ghost btn-sm" onClick={() => setSession(null)}>
              All games
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close games">
            ✕
          </button>
        </div>
      </header>

      <div className="arena-body">
        {!playable && !session ? (
          <Locked untilBreakMs={untilBreakMs} />
        ) : !session || !game ? (
          <Menu mode={mode} setMode={setMode} onPick={(g) => start(g)} players={players} />
        ) : (
          <Play
            key={session.sid}
            game={game}
            session={session}
            acts={acts}
            dispatch={dispatch}
            players={players}
            me={me}
            playable={playable}
            onAgain={() => start(game, true)}
            onMenu={() => setSession(null)}
            onClose={onClose}
          />
        )}
      </div>
    </section>
  );
}

function Locked({ untilBreakMs }: { untilBreakMs: number | null }) {
  return (
    <div className="arena-locked">
      <div className="arena-moon">☾</div>
      <h3>Games unlock on your break</h3>
      <p>
        {untilBreakMs !== null ? `Next break in ${fmtTime(untilBreakMs)}. ` : "Start the timer, and when focus time ends, games open up. "}
        Want to just hang out and play? Switch the room to <strong>Game Night</strong> at the top.
      </p>
    </div>
  );
}

function Menu({ mode, setMode, onPick, players }: { mode: Mode; setMode: (m: Mode) => void; onPick: (g: GameDef) => void; players: Player[] }) {
  return (
    <div className="arena-menu">
      <div className="seg mode-seg" role="radiogroup" aria-label="How to play">
        <button className="btn btn-ghost" role="radio" aria-pressed={mode === "coop"} aria-checked={mode === "coop"} onClick={() => setMode("coop")}>
          🤝 Co-op <small>solve it together</small>
        </button>
        <button className="btn btn-ghost" role="radio" aria-pressed={mode === "race"} aria-checked={mode === "race"} onClick={() => setMode("race")}>
          🏁 Race <small>same puzzle, who wins?</small>
        </button>
      </div>
      {players.length < 2 && <p className="game-note">Tip: most games are more fun once your friend joins.</p>}
      <div className="game-cards">
        {GAMES.map((g) => {
          const only = !g.modes.includes(mode);
          return (
            <button key={g.id} className="game-card" onClick={() => onPick(g)}>
              <span className="gc-icon">{g.icon}</span>
              <span className="gc-name">{g.name}</span>
              <span className="gc-tag">{g.tagline}</span>
              <span className="gc-meta">
                ~{g.minutes} min{only ? ` · ${g.modes[0] === "coop" ? "co-op" : "race"} only` : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Play({
  game,
  session,
  acts,
  dispatch,
  players: present,
  me,
  playable,
  onAgain,
  onMenu,
  onClose,
}: {
  game: GameDef;
  session: Session;
  acts: LoggedAct[];
  dispatch: (a: unknown) => void;
  players: Player[];
  me: Player;
  playable: boolean;
  onAgain: () => void;
  onMenu: () => void;
  onClose: () => void;
}) {
  const [data, setData] = useState<unknown>(game.load ? undefined : null);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    if (!game.load) return;
    let alive = true;
    game
      .load()
      .then((d) => alive && setData(d))
      .catch(() => alive && setLoadError(true));
    return () => {
      alive = false;
    };
  }, [game]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const puzzle = useMemo(() => (data === undefined ? null : game.puzzle(makeRand(session.seed), data)), [game, session.seed, data]);

  // Everyone who's here, plus anyone who played moves and then left.
  const players = useMemo(() => {
    const list = [...present];
    for (const a of acts) if (!list.some((p) => p.id === a.by)) list.push({ id: a.by, name: "Friend (left)", isMe: false });
    return list;
  }, [present, acts]);

  const scope = game.scope(session.mode);
  const states = useMemo(() => {
    if (!puzzle) return {} as Record<string, unknown>;
    const run = (list: LoggedAct[]) =>
      list.reduce((s, a) => {
        try {
          return game.reduce(s, a.a, { p: puzzle, by: a.by, t: a.t });
        } catch {
          return s;
        }
      }, game.init(puzzle));
    if (scope === "shared") {
      const s = run(acts);
      return Object.fromEntries(players.map((p) => [p.id, s]));
    }
    return Object.fromEntries(players.map((p) => [p.id, run(acts.filter((a) => a.by === p.id))]));
  }, [puzzle, acts, players, scope, game]);

  if (loadError) return <p className="game-note">Couldn&apos;t load this game. Try another one.</p>;
  if (!puzzle) return <p className="game-note">Setting up the puzzle…</p>;

  const mine = states[me.id];
  const isDone = (pid: string) => !!states[pid] && game.done(states[pid], puzzle);
  const myDone = isDone(me.id);
  const allDone = scope === "shared" ? myDone : present.every((p) => isDone(p.id));
  const showResults = allDone || !playable;
  const locked = !playable || (scope === "shared" ? myDone : myDone);

  const Board = game.Board;
  return (
    <div className="play">
      {showResults && (
        <Results
          game={game}
          puzzle={puzzle}
          states={states}
          players={players.filter((p) => states[p.id] !== undefined)}
          mode={session.mode}
          breakOver={!playable}
          onAgain={onAgain}
          onMenu={onMenu}
          onClose={onClose}
        />
      )}
      {!showResults && myDone && scope === "perPlayer" && <p className="game-note waiting">✦ You&apos;re done! Waiting for the others to finish…</p>}
      <Board
        puzzle={puzzle}
        mode={session.mode}
        me={me}
        players={players}
        state={mine}
        states={states}
        act={dispatch}
        locked={locked}
        elapsedMs={Math.max(0, now - session.startedAt)}
      />
    </div>
  );
}

function Results({
  game,
  puzzle,
  states,
  players,
  mode,
  breakOver,
  onAgain,
  onMenu,
  onClose,
}: {
  game: GameDef;
  puzzle: unknown;
  states: Record<string, unknown>;
  players: Player[];
  mode: Mode;
  breakOver: boolean;
  onAgain: () => void;
  onMenu: () => void;
  onClose: () => void;
}) {
  const pids = players.map((p) => p.id);
  let body: React.ReactNode;
  if (mode === "coop") {
    const team: Score = game.teamScore
      ? game.teamScore(pids.map((id) => states[id]), puzzle, pids)
      : game.score(states[pids.find((id) => players.find((p) => p.id === id)?.isMe) ?? pids[0]], puzzle, pids[0]);
    body = <p className="results-line">🤝 Together: <strong>{team.text}</strong></p>;
  } else {
    const scored = players.map((p) => ({ p, s: game.score(states[p.id], puzzle, p.id) })).sort((a, b) => b.s.value - a.s.value);
    const top = scored[0]?.s.value;
    const tie = scored.filter((x) => x.s.value === top).length > 1;
    body = (
      <>
        <p className="results-line">
          {scored.length < 2
            ? "🏁 Your result"
            : top <= 0
              ? "🏁 Nobody finished — rematch next break!"
              : tie
                ? "🏁 It's a tie!"
                : scored[0].p.isMe
                  ? "🏆 You win!"
                  : `🏆 ${scored[0].p.name} wins!`}
        </p>
        <ol className="results-list">
          {scored.map(({ p, s }) => (
            <li key={p.id} className={s.value === top && !tie ? "winner" : ""}>
              <span>{p.isMe ? "You" : p.name}</span>
              <span>{s.text}</span>
            </li>
          ))}
        </ol>
      </>
    );
  }

  return (
    <div className={`results ${breakOver ? "break-over" : ""}`} role="status">
      {breakOver && <h3>☾ Break&apos;s over — back to studying!</h3>}
      {body}
      <div className="row">
        {breakOver ? (
          <button className="btn btn-lamp" onClick={onClose}>
            Back to my desk
          </button>
        ) : (
          <>
            <button className="btn btn-lamp" onClick={onAgain}>
              Play again
            </button>
            <button className="btn btn-ghost" onClick={onMenu}>
              Pick another game
            </button>
          </>
        )}
      </div>
    </div>
  );
}
