"use client";

import { useState, type CSSProperties } from "react";

/** A one-off burst of confetti over the game area. */
export function Confetti({ colors, count = 44 }: { colors: string[]; count?: number }) {
  const [bits] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      dur: 1.6 + Math.random() * 1.4,
      size: 6 + Math.random() * 7,
      dx: (Math.random() - 0.5) * 180,
      rot: 240 + Math.random() * 720,
      color: colors[i % colors.length],
      round: Math.random() < 0.3,
    })),
  );
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <i
          key={i}
          style={
            {
              left: `${b.left}%`,
              width: b.size,
              height: b.round ? b.size : b.size * 0.55,
              borderRadius: b.round ? "50%" : 2,
              background: b.color,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.dur}s`,
              "--dx": `${b.dx}px`,
              "--rot": `${b.rot}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
