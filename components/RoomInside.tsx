"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConnectionState, RoomEvent, type Participant } from "livekit-client";
import { useConnectionState, useLocalParticipant, useParticipants, useRoomContext } from "@livekit/components-react";
import VideoStage from "@/components/VideoStage";
import Pomodoro, { type Phase } from "@/components/Pomodoro";
import AmbiencePanel from "@/components/AmbiencePanel";
import Chat from "@/components/Chat";
import ControlBar from "@/components/ControlBar";
import SettingsDialog from "@/components/SettingsDialog";
import ThemePicker from "@/components/ThemePicker";
import GameArena, { type Session } from "@/components/games/GameArena";
import { LinkIcon } from "@/components/icons";
import { getTheme, type ThemeId } from "@/lib/themes";
import { useSyncedState } from "@/lib/useSyncedState";
import { useTopic } from "@/lib/useTopic";
import { useGameLog } from "@/lib/games/useGameLog";
import { fmtTime, type Player } from "@/lib/games/core";
import { playAlways } from "@/lib/games/sfx";
import { getPrefs } from "@/lib/prefs";

type RoomMode = "study" | "gamenight";
type Float = { id: string; emoji: string; name: string; x: number };
type ReactionMsg = { type: "emoji"; emoji: string; name: string } | { type: "hand"; up: boolean; id: string } | { type: "hello" };

/** Everything inside a connected room. */
export default function RoomInside({
  code,
  theme,
  initialTheme,
  setTheme,
  copyInvite,
  flash,
}: {
  code: string;
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
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  const room = useRoomContext();
  const connection = useConnectionState();
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

  /* ---------- reactions and raised hands ---------- */

  const [floats, setFloats] = useState<Float[]>([]);
  const [hands, setHands] = useState<Record<string, boolean>>({});
  const myHand = !!hands[me.id];
  const myHandRef = useRef(myHand);
  myHandRef.current = myHand;
  const meRef = useRef(me);
  meRef.current = me;

  const showFloat = useCallback((emoji: string, name: string) => {
    const id = Math.random().toString(36).slice(2);
    setFloats((f) => [...f.slice(-11), { id, emoji, name, x: 12 + Math.random() * 76 }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 3200);
    playAlways("pop");
  }, []);

  const post = useTopic("reactions", (data) => {
    const msg = data as ReactionMsg;
    if (msg.type === "emoji") showFloat(msg.emoji, msg.name);
    else if (msg.type === "hand") {
      setHands((h) => ({ ...h, [msg.id]: msg.up }));
      if (msg.up) playAlways("blip");
    } else if (msg.type === "hello" && myHandRef.current) post({ type: "hand", up: true, id: meRef.current.id } satisfies ReactionMsg);
  });

  useEffect(() => {
    const t = setTimeout(() => post({ type: "hello" } satisfies ReactionMsg), 1000);
    return () => clearTimeout(t);
  }, [post]);

  const react = (emoji: string) => {
    showFloat(emoji, "You");
    post({ type: "emoji", emoji, name: me.name } satisfies ReactionMsg);
  };

  const toggleHand = () => {
    const up = !myHand;
    setHands((h) => ({ ...h, [me.id]: up }));
    post({ type: "hand", up, id: me.id } satisfies ReactionMsg);
  };

  /* ---------- people coming and going ---------- */

  useEffect(() => {
    const joined = (p: Participant) => {
      flash(`${p.name || "Someone"} joined ✦`);
      if (getPrefs().chimes) playAlways("good");
    };
    const left = (p: Participant) => {
      flash(`${p.name || "Someone"} left`);
      setHands((h) => ({ ...h, [p.identity]: false }));
      if (getPrefs().chimes) playAlways("back");
    };
    room.on(RoomEvent.ParticipantConnected, joined);
    room.on(RoomEvent.ParticipantDisconnected, left);
    return () => {
      room.off(RoomEvent.ParticipantConnected, joined);
      room.off(RoomEvent.ParticipantDisconnected, left);
    };
  }, [room, flash]);

  /* ---------- games ---------- */

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
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

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

  const reconnecting = connection === ConnectionState.Reconnecting || connection === ConnectionState.SignalReconnecting;

  return (
    <main className={`room ${gameNight ? "room-gamenight" : ""}`}>
      <header className="room-top">
        <div className="room-brand">
          <h1 className="room-title">Starlit Desk</h1>
          <button className="room-code" onClick={copyInvite} title="Copy invite link">
            #{code} <LinkIcon size={13} />
          </button>
          <span className="people-count" title={players.map((p) => p.name).join(", ")}>
            {players.length} {players.length === 1 ? "person" : "people"} here
          </span>
        </div>
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

      {reconnecting && (
        <div className="break-banner glass reconnecting" role="status">
          <span>Your connection dropped for a moment. Reconnecting…</span>
        </div>
      )}

      {!arenaOpen && playable && (
        <div className="break-banner glass">
          <span>{gameNight ? "🎲 It's Game Night. Pick something to play together." : `☾ Break time${breakLeftMs !== null ? ` (${fmtTime(breakLeftMs)} left)` : ""}. Play a quick game together?`}</span>
          <button className="btn btn-lamp btn-sm" onClick={() => setArenaOpen(true)}>
            {session ? "Back to the game" : "Play"}
          </button>
        </div>
      )}

      <div className="room-main">
        <div className="stage-wrap">
          <VideoStage main={arena} hands={hands} onInvite={copyInvite} />
          <div className="reaction-layer" aria-live="polite">
            {floats.map((f) => (
              <span key={f.id} className="reaction-float" style={{ left: `${f.x}%` }}>
                <b>{f.emoji}</b>
                <small>{f.name}</small>
              </span>
            ))}
          </div>
        </div>
        <aside className="side">
          {/* kept mounted in Game Night so the shared timer isn't lost */}
          <div hidden={gameNight}>
            <Pomodoro onPhase={onPhase} />
          </div>
          <Chat />
          <AmbiencePanel theme={getTheme(theme)} />
        </aside>
      </div>

      <ControlBar
        onError={flash}
        onReact={react}
        handUp={myHand}
        onHand={toggleHand}
        gamesOpen={arenaOpen}
        gamesLocked={!playable}
        gamesLabel={playable ? "Games" : untilBreakMs !== null ? `Games in ${fmtTime(untilBreakMs)}` : "Games"}
        onGames={() => setArenaOpen((o) => !o)}
        onSettings={() => setSettingsOpen(true)}
      />

      {settingsOpen && <SettingsDialog onClose={closeSettings} flash={flash} />}
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
