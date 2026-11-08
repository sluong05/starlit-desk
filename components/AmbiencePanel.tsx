"use client";

import { useEffect, useRef, useState } from "react";
import { Voice } from "@/lib/sound/engine";
import type { SoundId } from "@/lib/sound/recipes";
import type { Theme } from "@/lib/themes";

/**
 * Personal ambient sound mixer. Each person controls their own mix;
 * nothing here is shared over the call.
 */

const SOUNDS: Array<{ id: SoundId; label: string }> = [
  { id: "rain", label: "Rain" },
  { id: "fire", label: "Fireplace" },
  { id: "crickets", label: "Crickets" },
  { id: "waves", label: "Waves" },
  { id: "wind", label: "Wind" },
  { id: "birds", label: "Birds" },
];

type Status = "off" | "loading" | "on";

export default function AmbiencePanel({ theme }: { theme: Theme }) {
  const voices = useRef<Partial<Record<SoundId, Voice>>>({});
  const [status, setStatus] = useState<Record<SoundId, Status>>({
    rain: "off",
    fire: "off",
    crickets: "off",
    waves: "off",
    wind: "off",
    birds: "off",
  });
  const [vol, setVol] = useState<Record<SoundId, number>>({
    rain: 0.6,
    fire: 0.6,
    crickets: 0.5,
    waves: 0.6,
    wind: 0.4,
    birds: 0.5,
  });
  const volRef = useRef(vol);
  volRef.current = vol;

  const turnOn = async (id: SoundId, volume = volRef.current[id]) => {
    if (voices.current[id]) {
      voices.current[id]!.setVolume(volume);
      return;
    }
    const v = new Voice(id);
    voices.current[id] = v;
    setStatus((s) => ({ ...s, [id]: "loading" }));
    try {
      await v.start(volume);
      // It may have been switched off while it was loading.
      if (voices.current[id] === v) setStatus((s) => ({ ...s, [id]: "on" }));
      else v.stop();
    } catch {
      delete voices.current[id];
      setStatus((s) => ({ ...s, [id]: "off" }));
    }
  };

  const turnOff = (id: SoundId) => {
    voices.current[id]?.stop();
    delete voices.current[id];
    setStatus((s) => ({ ...s, [id]: "off" }));
  };

  const toggle = (id: SoundId) => (voices.current[id] ? turnOff(id) : turnOn(id));

  const setVolume = (id: SoundId, v: number) => {
    setVol((s) => ({ ...s, [id]: v }));
    voices.current[id]?.setVolume(v);
  };

  const playThemeMix = () => {
    for (const { id } of SOUNDS) {
      const level = theme.mix[id];
      if (level === undefined) turnOff(id);
      else {
        setVol((s) => ({ ...s, [id]: level }));
        void turnOn(id, level);
      }
    }
  };

  const anyOn = Object.values(status).some((s) => s !== "off");

  useEffect(() => {
    const current = voices.current;
    return () => Object.values(current).forEach((v) => v?.stop());
  }, []);

  return (
    <section className="glass panel" aria-label="Ambient sounds">
      <h2>Your ambience</h2>

      <div className="row" style={{ marginBottom: "0.85rem" }}>
        <button className="btn btn-ghost" onClick={playThemeMix} title={`Play the sounds of ${theme.name}`}>
          ♪ {theme.name} mix
        </button>
        {anyOn && (
          <button className="btn btn-ghost" style={{ flex: "0 0 auto" }} onClick={() => SOUNDS.forEach(({ id }) => turnOff(id))}>
            Stop all
          </button>
        )}
      </div>

      {SOUNDS.map(({ id, label }) => (
        <div className="sound" key={id}>
          <button className="btn btn-ghost" aria-pressed={status[id] !== "off"} aria-busy={status[id] === "loading"} onClick={() => toggle(id)}>
            {status[id] === "loading" ? "…" : label}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={vol[id]}
            aria-label={`${label} volume`}
            onChange={(e) => setVolume(id, Number(e.target.value))}
          />
        </div>
      ))}
    </section>
  );
}
