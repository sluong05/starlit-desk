"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Track } from "livekit-client";
import { DisconnectButton, TrackToggle, useLocalParticipant, useParticipants } from "@livekit/components-react";
import VideoStage from "@/components/VideoStage";
import Pomodoro, { type Phase } from "@/components/Pomodoro";
import AmbiencePanel from "@/components/AmbiencePanel";
import Chat from "@/components/Chat";
import ScreenShareButton from "@/components/ScreenShareButton";
import ThemePicker from "@/components/ThemePicker";
import GameArena, { type Session } from "@/components/games/GameArena";
import { getTheme, type ThemeId } from "@/lib/themes";
import { useSyncedState } from "@/lib/useSyncedState";
import { useGameLog } from "@/lib/games/useGameLog";
import { fmtTime, type Player } from "@/lib/games/core";

type RoomMode = "study" | "gamenight";

/** Everything inside a connected room. */
export default function RoomInside({
  code,
  inviteUrl,
  theme,
  initialTheme,
  setTheme,
  copyInvite,
  flash,
}: {
  code: string;
  inviteUrl: string;
  theme: ThemeId;
  initialTheme: ThemeId;
  setTheme: (t: ThemeId) => void;
  copyInvite: () => void;
  flash: (msg: string) => void;
}) {
  // Shared between everyone in the room.
  const [roomMode, setRoomMode] = useSyncedState<RoomMode>("room-mode", "study");
  const [session, setSession] = useSyncedState<Session | null>("game-session", null);

  const [phase, setPhase] = useState<Phase>({ mode: "focus", endsAt: null, remainingMs: 25 * 60_000 });
  const [arenaOpen, setArenaOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const gameNight = roomMode === "gamenight";
  const onBreak = phase.mode === "break";
  const playable = gameNight || onBreak;
  const phaseLeft = phase.endsAt ? Math.max(0, phase.endsAt - now) : phase.remainingMs;
  const untilBreakMs = !onBreak && phase.endsAt ? phaseLeft : null;
  const breakLeftMs = onBreak ? phaseLeft : null;

  // Players for the games: you first, then everyone else in the call.
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const players: Player[] = useMemo(
    () =>
      [...participants]
        .sort((a, b) => Number(b.isLocal) - Number(a.isLocal))
        .map((p) => ({ id: p.identity, name: p.name || p.identity, isMe: p.isLocal })),
    [participants],
  );
  const me = players.find((p) => p.isMe) ?? { id: localParticipant.identity, name: "You", isMe: true };
  const [acts, dispatch] = useGameLog(session?.sid ?? null, me.id);

  // A new break starts fresh: clear the last break's game.
  const wasBreak = useRef(onBreak);
  useEffect(() => {
    if (onBreak && !wasBreak.current && !gameNight) {
      setSession(null);
      flash("☾ Break time! Games are unlocked.");
    }
    wasBreak.current = onBreak;
  }, [onBreak, gameNight, setSession, flash]);

  // Open the games when your friend starts one or when Game Night begins.
  const lastSid = useRef(session?.sid);
  useEffect(() => {
    if (session?.sid && session.sid !== lastSid.current && playable) setArenaOpen(true);
    lastSid.current = session?.sid;
  }, [session?.sid, playable]);
  useEffect(() => {
    if (gameNight) setArenaOpen(true);
  }, [gameNight]);

  const switchMode = (m: RoomMode) => {
    if (m === roomMode) return;
    setRoomMode(m);
    if (m === "study") setSession(null);
  };

  const onPhase = useCallback((p: Phase) => setPhase(p), []);

  const arena = arenaOpen ? (
    <GameArena
      session={session}
      setSession={setSession}
      acts={acts}
      dispatch={dispatch}
      players={players}
      me={me}
      playable={playable}
      gameNight={gameNight}
      untilBreakMs={untilBreakMs}
      breakLeftMs={breakLeftMs}
      onClose={() => setArenaOpen(false)}
    />
  ) : undefined;

  return (
    <main className={`room ${gameNight ? "room-gamenight" : ""}`}>
      <header className="room-top">
        <h1 className="room-title">
          Starlit Desk<span>#{code}</span>
        </h1>
        <div className="room-actions">
          <div className="seg room-mode" role="radiogroup" aria-label="Room mode">
            <button className="btn btn-ghost" role="radio" aria-checked={!gameNight} aria-pressed={!gameNight} onClick={() => switchMode("study")}>
              📚 Study
            </button>
            <button className="btn btn-ghost" role="radio" aria-checked={gameNight} aria-pressed={gameNight} onClick={() => switchMode("gamenight")}>
              🎲 Game Night
            </button>
          </div>
          <SharedTheme initial={initialTheme} onTheme={setTheme} />
          <button className="btn btn-lamp" onClick={copyInvite}>
            Invite ✦
          </button>
        </div>
      </header>

      {!arenaOpen && playable && (
        <div className="break-banner glass">
          <span>{gameNight ? "🎲 It's Game Night — pick something to play together." : `☾ Break time${breakLeftMs !== null ? ` (${fmtTime(breakLeftMs)} left)` : ""} — play a quick game together?`}</span>
          <button className="btn btn-lamp btn-sm" onClick={() => setArenaOpen(true)}>
            {session ? "Back to the game" : "Play"}
          </button>
        </div>
      )}

      <div className="room-main">
        <VideoStage inviteUrl={inviteUrl} main={arena} />
        <aside className="side">
          {/* kept mounted in Game Night so the shared timer isn't lost */}
          <div hidden={gameNight}>
            <Pomodoro onPhase={onPhase} />
          </div>
          <Chat />
          <AmbiencePanel theme={getTheme(theme)} />
        </aside>
      </div>

      <footer className="glass controls">
        <TrackToggle source={Track.Source.Microphone} className="btn btn-ghost">
          Mic
        </TrackToggle>
        <TrackToggle source={Track.Source.Camera} className="btn btn-ghost">
          Camera
        </TrackToggle>
        <ScreenShareButton onError={flash} />
        <button
          className="btn btn-ghost"
          aria-pressed={arenaOpen}
          onClick={() => setArenaOpen((o) => !o)}
          title={playable ? "Games" : untilBreakMs !== null ? `Games unlock in ${fmtTime(untilBreakMs)}` : "Games unlock on your break"}
        >
          {playable ? "🎲 Games" : `🔒 Games${untilBreakMs !== null ? ` · ${fmtTime(untilBreakMs)}` : ""}`}
        </button>
        <DisconnectButton className="btn btn-leave">Leave</DisconnectButton>
      </footer>
    </main>
  );
}

/** The room's theme, shared with everyone in it. */
function SharedTheme({ initial, onTheme }: { initial: ThemeId; onTheme: (t: ThemeId) => void }) {
  const [theme, setTheme] = useSyncedState<ThemeId>("theme", initial);
  useEffect(() => onTheme(theme), [theme, onTheme]);
  return (
    <>
      <span className="theme-name">{getTheme(theme).name}</span>
      <ThemePicker value={theme} onChange={setTheme} />
    </>
  );
}
