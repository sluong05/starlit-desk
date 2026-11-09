"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Scene from "@/components/Scene";
import ThemePicker from "@/components/ThemePicker";
import Mascot from "@/components/Mascot";
import { getTheme } from "@/lib/themes";
import { useLocalTheme } from "@/lib/useTheme";

const ADJECTIVES = ["sleepy", "cozy", "quiet", "moonlit", "dreamy", "velvet", "gentle", "drowsy"];
const NOUNS = ["owl", "comet", "lantern", "otter", "teacup", "nebula", "fox", "willow"];

function makeRoomCode() {
  const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}-${Math.floor(100 + Math.random() * 900)}`;
}

function greeting(hour: number) {
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [hello, setHello] = useState("Welcome");
  const [theme, setTheme] = useLocalTheme();

  useEffect(() => {
    setHello(greeting(new Date().getHours()));
    try {
      const saved = localStorage.getItem("starlit:name");
      if (saved) setName(saved);
    } catch {
      /* storage unavailable; that's fine */
    }
  }, []);

  // The name is optional here: the next screen (camera check) asks for it too.
  const go = (roomCode: string) => {
    const trimmed = name.trim();
    try {
      if (trimmed) localStorage.setItem("starlit:name", trimmed);
    } catch {
      /* ignore */
    }
    router.push(`/room/${roomCode}${trimmed ? `?name=${encodeURIComponent(trimmed)}` : ""}`);
  };

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    // Accept either a bare code or a pasted invite link.
    const raw = code.trim().toLowerCase();
    const match = raw.match(/room\/([a-z0-9-]+)/);
    const roomCode = match ? match[1] : raw;
    if (!/^[a-z0-9-]{3,40}$/.test(roomCode)) {
      setError("That doesn't look like a room code. Paste the whole invite link, or just the part after “room/”.");
      return;
    }
    go(roomCode);
  };

  const first = name.trim().split(/\s+/)[0];

  return (
    <>
      <Scene theme={theme} />
      <main className="landing">
        <div className="landing-wrap">
          <div className="landing-card-holder">
            <div className="landing-mascot">
              <Mascot pose="peek" size={120} />
            </div>
            <div className="glass landing-card">
              <p className="hello">
                {hello}
                {first ? `, ${first}` : ""}.
              </p>
              <h1 className="brand">Starlit Desk</h1>
              <p className="tagline">Pull up a chair. Study side by side with a friend, wherever you both are.</p>

              <form onSubmit={join}>
                <div>
                  <label className="label" htmlFor="name">
                    Your name
                  </label>
                  <input
                    id="name"
                    className="input"
                    value={name}
                    maxLength={24}
                    autoComplete="nickname"
                    placeholder="What should your friend call you?"
                    onChange={(e) => {
                      setName(e.target.value);
                      setError("");
                    }}
                  />
                </div>

                <button type="button" className="btn btn-lamp btn-big" onClick={() => go(makeRoomCode())}>
                  Open a new desk
                </button>

                <div className="divider">or join a friend&apos;s desk</div>

                <div>
                  <label className="label" htmlFor="code">
                    Invite link or room code
                  </label>
                  <div className="join-row">
                    <input
                      id="code"
                      className="input"
                      value={code}
                      placeholder="cozy-owl-482"
                      onChange={(e) => {
                        setCode(e.target.value);
                        setError("");
                      }}
                    />
                    <button type="submit" className="btn btn-ghost">
                      Join
                    </button>
                  </div>
                </div>

                {error && <p className="error">{error}</p>}
              </form>

              <div className="landing-theme">
                <span>
                  Your room: <strong>{getTheme(theme).name}</strong>
                </span>
                <ThemePicker value={theme} onChange={setTheme} label="Pick a room" />
              </div>
            </div>
          </div>

          <ol className="landing-steps">
            <li>
              <span className="step-art" aria-hidden="true">
                🪑
              </span>
              <strong>Open a desk</strong>
              <span>Check your camera, then send your friend the link.</span>
            </li>
            <li>
              <span className="step-art" aria-hidden="true">
                ⏳
              </span>
              <strong>Focus together</strong>
              <span>One shared timer, cozy sounds, and a room you both see.</span>
            </li>
            <li>
              <span className="step-art" aria-hidden="true">
                🎲
              </span>
              <strong>Play on breaks</strong>
              <span>Twelve quick games unlock when the timer says rest.</span>
            </li>
          </ol>
        </div>
      </main>
    </>
  );
}
