"use client";

import { useEffect, useRef, useState } from "react";
import { audioContext, startCrickets, startFire, startRain, type Ambience } from "@/lib/audio";

/**
 * Personal ambient sound mixer. Each person controls their own mix;
 * nothing here is shared over the call (and it isn't picked up by
 * the mic unless you're on speakers).
 */

const SOUNDS = [
  { id: "rain", label: "Rain", make: startRain },
  { id: "fire", label: "Fireplace", make: startFire },
  { id: "night", label: "Crickets", make: startCrickets },
] as const;

type Id = (typeof SOUNDS)[number]["id"];

export default function AmbiencePanel() {
  const nodes = useRef<Partial<Record<Id, Ambience>>>({});
  const [on, setOn] = useState<Record<Id, boolean>>({ rain: false, fire: false, night: false });
  const [vol, setVol] = useState<Record<Id, number>>({ rain: 0.5, fire: 0.5, night: 0.35 });

  const toggle = (id: Id, make: () => Ambience) => {
    const node = nodes.current[id];
    if (node) {
      const ac = audioContext();
      node.gain.gain.setTargetAtTime(0, ac.currentTime, 0.2);
      setTimeout(() => node.stop(), 800);
      delete nodes.current[id];
      setOn((s) => ({ ...s, [id]: false }));
    } else {
      const n = make();
      n.gain.gain.setTargetAtTime(vol[id] * 0.6, audioContext().currentTime, 0.4);
      nodes.current[id] = n;
      setOn((s) => ({ ...s, [id]: true }));
    }
  };

  const setVolume = (id: Id, v: number) => {
    setVol((s) => ({ ...s, [id]: v }));
    const node = nodes.current[id];
    if (node) node.gain.gain.setTargetAtTime(v * 0.6, audioContext().currentTime, 0.1);
  };

  useEffect(() => {
    const current = nodes.current;
    return () => {
      Object.values(current).forEach((n) => n?.stop());
    };
  }, []);

  return (
    <section className="glass panel" aria-label="Ambient sounds">
      <h2>Your ambience</h2>
      {SOUNDS.map(({ id, label, make }) => (
        <div className="sound" key={id}>
          <button className="btn btn-ghost" aria-pressed={on[id]} onClick={() => toggle(id, make)}>
            {label}
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
