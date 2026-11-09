"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import Scene from "@/components/Scene";
import { savedTheme, type ThemeId } from "@/lib/themes";
import { useApplyTheme } from "@/lib/useTheme";
import RoomInside from "@/components/RoomInside";
import Lobby from "@/components/Lobby";
import Mascot from "@/components/Mascot";
import { captureOptions, getPrefs } from "@/lib/prefs";

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

  const [savedName, setSavedName] = useState(nameFromUrl);
  // Set once you press Join in the lobby.
  const [joinName, setJoinName] = useState("");
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

  // Prefill the lobby with the name you used last time.
  useEffect(() => {
    if (nameFromUrl) return;
    try {
      const saved = localStorage.getItem("starlit:name");
      if (saved) setSavedName(saved);
    } catch {
      /* ignore */
    }
  }, [nameFromUrl]);

  useEffect(() => {
    if (!joinName) return;
    let cancelled = false;
    fetch(`/api/token?room=${encodeURIComponent(code)}&name=${encodeURIComponent(joinName)}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || "Couldn't get a room pass.");
        if (!cancelled) setToken(body.token);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [code, joinName]);

  // Camera/mic choices from the lobby, fixed for this visit.
  const call = useMemo(() => {
    const p = getPrefs();
    const c = captureOptions(p);
    return {
      audio: p.micOn,
      video: p.camOn,
      options: { adaptiveStream: true, dynacast: true, audioCaptureDefaults: c.audio, videoCaptureDefaults: c.video, audioOutput: p.speakerId ? { deviceId: p.speakerId } : undefined },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinName]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? "" : t)), 2600);
  }, []);

  const copyInvite = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      flash("Invite link copied ✦");
    } catch {
      flash(inviteUrl);
    }
  }, [inviteUrl, flash]);

  const scene = <Scene theme={theme} />;

  if (!serverUrl) {
    return <Status scene={scene} title="Almost there" body="Set NEXT_PUBLIC_LIVEKIT_URL in .env.local (see README), then restart the dev server." />;
  }

  if (!joinName) {
    return (
      <>
        {scene}
        <Lobby code={code} initialName={savedName} onJoin={setJoinName} />
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
      video={call.video}
      audio={call.audio}
      options={call.options}
      onDisconnected={() => router.push("/")}
      onError={(e) => setError(e.message)}
      data-lk-theme="default"
      style={{ background: "transparent" }}
    >
      {scene}
      <RoomInside
        code={code}
        theme={theme}
        initialTheme={initialTheme}
        setTheme={setTheme}
        copyInvite={copyInvite}
        flash={flash}
      />
      <RoomAudioRenderer />
      {toast && <div className="toast" role="status">{toast}</div>}
    </LiveKitRoom>
  );
}

function Status({ title, body, scene }: { title: string; body?: string; scene?: React.ReactNode }) {
  return (
    <>
    {scene}
    <main className="status-screen">
      <div className="glass">
        <Mascot pose="sit" size={84} />
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
