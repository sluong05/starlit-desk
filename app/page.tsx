"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Starfield from "@/components/Starfield";

const ADJECTIVES = ["sleepy", "cozy", "quiet", "moonlit", "dreamy", "velvet", "gentle", "drowsy"];
const NOUNS = ["owl", "comet", "lantern", "otter", "teacup", "nebula", "fox", "willow"];

function makeRoomCode() {
  const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}-${Math.floor(100 + Math.random() * 900)}`;
}

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("starlit:name");
      if (saved) setName(saved);
    } catch {
      /* storage unavailable; that's fine */
    }
  }, []);

  const go = (roomCode: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Tell your study buddy who you are first.");
      return;
    }
    try {
      localStorage.setItem("starlit:name", trimmed);
    } catch {
      /* ignore */
    }
    router.push(`/room/${roomCode}?name=${encodeURIComponent(trimmed)}`);
  };

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    // Accept either a bare code or a pasted invite link.
    const raw = code.trim().toLowerCase();
    const match = raw.match(/room\/([a-z0-9-]+)/);
    const roomCode = match ? match[1] : raw;
    if (!/^[a-z0-9-]{3,40}$/.test(roomCode)) {
      setError("That room code doesn't look right.");
      return;
    }
    go(roomCode);
  };

  return (
    <>
      <Starfield />
      <main className="landing">
        <div className="glass landing-card">
          <div className="moon-icon" aria-hidden="true" />
          <h1 className="brand">
            Starlit <em>Desk</em>
          </h1>
          <p className="tagline">A quiet room under the stars for studying side by side with a friend.</p>

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
                placeholder="Steven"
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
              />
            </div>

            <button type="button" className="btn btn-lamp" onClick={() => go(makeRoomCode())}>
              Open a new desk ✦
            </button>

            <div className="divider">or join a friend</div>

            <div>
              <label className="label" htmlFor="code">
                Room code or invite link
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
        </div>
      </main>
    </>
  );
}
