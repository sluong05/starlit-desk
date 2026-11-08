"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Track } from "livekit-client";
import { DisconnectButton, LiveKitRoom, RoomAudioRenderer, TrackToggle } from "@livekit/components-react";
import Scene from "@/components/Scene";
import ThemePicker from "@/components/ThemePicker";
import VideoStage from "@/components/VideoStage";
import Pomodoro from "@/components/Pomodoro";
import AmbiencePanel from "@/components/AmbiencePanel";
import Chat from "@/components/Chat";
import ScreenShareButton from "@/components/ScreenShareButton";
import { getTheme, savedTheme, type ThemeId } from "@/lib/themes";
import { useApplyTheme } from "@/lib/useTheme";
import { useSyncedState } from "@/lib/useSyncedState";

export default function RoomPage() {
  return (
    <Suspense fallback={<Status title="Lighting the lamp…" />}>
      <Room />
    </Suspense>
  );
}

function Room() {
  const { code } = useParams<{ code: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const nameFromUrl = search.get("name") ?? "";

  const [name, setName] = useState(nameFromUrl);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  // What's on screen. Starts from this browser's last theme; once connected,
  // the room's shared theme takes over.
  const [theme, setTheme] = useState<ThemeId>("starlit");
  const [initialTheme, setInitialTheme] = useState<ThemeId | null>(null);
  useEffect(() => {
    const t = savedTheme();
    setTheme(t);
    setInitialTheme(t);
  }, []);
  useApplyTheme(theme);

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/room/${code}` : "";

  // Friends who open a bare invite link pick a name first.
  useEffect(() => {
    if (nameFromUrl) return;
    try {
      const saved = localStorage.getItem("starlit:name");
      if (saved) setName(saved);
    } catch {
      /* ignore */
    }
  }, [nameFromUrl]);

  useEffect(() => {
    if (!nameFromUrl) return;
    let cancelled = false;
    fetch(`/api/token?room=${encodeURIComponent(code)}&name=${encodeURIComponent(nameFromUrl)}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || "Couldn't get a room pass.");
        if (!cancelled) setToken(body.token);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [code, nameFromUrl]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      flash("Invite link copied ✦");
    } catch {
      flash(inviteUrl);
    }
  };

  const scene = <Scene theme={theme} />;

  if (!serverUrl) {
    return <Status scene={scene} title="Almost there" body="Set NEXT_PUBLIC_LIVEKIT_URL in .env.local (see README), then restart the dev server." />;
  }

  if (!nameFromUrl) {
    return (
      <>
      {scene}
      <main className="status-screen">
        <form
          className="glass"
          onSubmit={(e) => {
            e.preventDefault();
            const n = name.trim();
            if (!n) return;
            try {
              localStorage.setItem("starlit:name", n);
            } catch {
              /* ignore */
            }
            router.replace(`/room/${code}?name=${encodeURIComponent(n)}`);
          }}
          style={{ display: "grid", gap: "1rem", textAlign: "left", width: "min(420px, 100%)" }}
        >
          <h1 className="room-title" style={{ textAlign: "center" }}>
            You&apos;re invited to a desk ✦
          </h1>
          <div>
            <label className="label" htmlFor="name">
              Your name
            </label>
            <input id="name" className="input" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <button className="btn btn-lamp" type="submit">
            Take a seat
          </button>
        </form>
      </main>
      </>
    );
  }

  if (error) return <Status scene={scene} title="Hmm, the door is stuck" body={error} />;
  if (!token || !initialTheme) return <Status scene={scene} title="Lighting the lamp…" />;

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect
      video
      audio
      onDisconnected={() => router.push("/")}
      onError={(e) => setError(e.message)}
      data-lk-theme="default"
      style={{ background: "transparent" }}
    >
      {scene}
      <main className="room">
        <header className="room-top">
          <h1 className="room-title">
            Starlit Desk<span>#{code}</span>
          </h1>
          <div className="room-actions">
            <SharedTheme initial={initialTheme} onTheme={setTheme} />
            <button className="btn btn-lamp" onClick={copyInvite}>
              Invite ✦
            </button>
          </div>
        </header>

        <div className="room-main">
          <VideoStage inviteUrl={inviteUrl} />
          <aside className="side">
            <Pomodoro />
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
          <DisconnectButton className="btn btn-leave">Leave</DisconnectButton>
        </footer>
      </main>
      <RoomAudioRenderer />
      {toast && <div className="toast" role="status">{toast}</div>}
    </LiveKitRoom>
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

function Status({ title, body, scene }: { title: string; body?: string; scene?: React.ReactNode }) {
  return (
    <>
    {scene}
    <main className="status-screen">
      <div className="glass">
        <h1 className="room-title">{title}</h1>
        {body && <p style={{ color: "var(--ink-dim)", lineHeight: 1.5 }}>{body}</p>}
        {body && (
          <a href="/" className="btn btn-ghost" style={{ display: "inline-block", textDecoration: "none", marginTop: "0.5rem" }}>
            Back home
          </a>
        )}
      </div>
    </main>
    </>
  );
}
