"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Original artwork for the games: a cover illustration for each menu card,
 * plus the little animated pieces used inside the boards. All hand-drawn SVG.
 */

/** Confetti colors for each game's win moment. */
export const SKIN_COLORS: Record<string, string[]> = {
  moonword: ["#ffd98a", "#9db4ff", "#ffffff", "#c9b8ff"],
  constellations: ["#9fc0ff", "#f3d36b", "#8fd3a0", "#c9a6f0"],
  deepsky: ["#7ef0d6", "#f2a65a", "#c9a6f0", "#ffffff"],
  hive: ["#ffc233", "#ffe9b0", "#ff9d2e", "#3d2609"],
  ladder: ["#ffd36e", "#d9a468", "#8fe0c8", "#ffffff"],
  scramble: ["#e2542d", "#ffffff", "#3aa5a0", "#ffd45e"],
  emoji: ["#ffcf5a", "#d7263d", "#ffffff", "#ff8fa3"],
  timeline: ["#a5532a", "#e2b25a", "#5e7d5a", "#3b2a17"],
  sprint: ["#ff8a4c", "#ffffff", "#5ad1ff", "#ffe27a"],
  jinx: ["#c8ff5a", "#ff8fd0", "#8fd0ff", "#ffffff"],
  digits: ["#ffe27a", "#f4f1e4", "#ff9aa2", "#9ad1ff"],
  sudoku: ["#c8402f", "#26221c", "#e2b25a", "#7a9e7e"],
};

const starPoints = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  }).join(" ");

const dots = (pts: Array<[number, number, number?]>, fill = "#fff") => pts.map(([x, y, r = 1], i) => <circle key={i} cx={x} cy={y} r={r} fill={fill} opacity={0.5 + (i % 3) * 0.2} />);

/* ------------------------------------------------------------------ covers */

const COVERS: Record<string, ReactNode> = {
  moonword: (
    <>
      <rect width="200" height="90" fill="#171b4a" />
      {dots([[20, 14], [48, 26, 1.4], [92, 10], [128, 22, 1.2], [186, 60], [176, 12, 1.5], [8, 40]])}
      <circle cx="158" cy="28" r="17" fill="#ffe2a8" />
      <circle cx="166" cy="22" r="15" fill="#171b4a" />
      {["L", "U", "N", "A", "R"].map((l, i) => {
        const kind = [0, 1, 0, 2, 1][i];
        return (
          <g key={i} transform={`translate(${16 + i * 27} 50)`}>
            <rect width="23" height="23" rx="6" fill={kind === 1 ? "#ffd277" : kind === 2 ? "none" : "#343a78"} stroke={kind === 2 ? "#9db4ff" : "none"} strokeWidth="2" />
            <text x="11.5" y="16.5" textAnchor="middle" fontSize="13" fontWeight="800" fill={kind === 1 ? "#3b2a05" : "#e6e9ff"}>
              {l}
            </text>
          </g>
        );
      })}
    </>
  ),
  constellations: (
    <>
      <rect width="200" height="90" fill="#0b1236" />
      {dots([[14, 20], [40, 70, 1.3], [70, 12], [110, 78], [150, 14, 1.4], [188, 50], [180, 80], [96, 30]])}
      <polyline points="28,58 60,36 96,50 128,24 166,38 150,68 96,50" fill="none" stroke="#8fb2ff" strokeWidth="1.6" strokeLinejoin="round" opacity="0.9" />
      {[[28, 58], [60, 36], [96, 50], [128, 24], [166, 38], [150, 68]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="7" fill="#8fb2ff" opacity="0.18" />
          <circle cx={x} cy={y} r="3.2" fill="#fff" />
        </g>
      ))}
    </>
  ),
  deepsky: (
    <>
      <defs>
        <linearGradient id="cv-ds" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a1a6e" />
          <stop offset="1" stopColor="#0b1030" />
        </linearGradient>
      </defs>
      <rect width="200" height="90" fill="url(#cv-ds)" />
      {dots([[20, 16], [60, 70], [90, 20, 1.4], [120, 60], [190, 20], [176, 78, 1.3]])}
      <ellipse cx="150" cy="42" rx="34" ry="8" fill="none" stroke="#ffd9a0" strokeWidth="3" transform="rotate(-18 150 42)" />
      <circle cx="150" cy="42" r="18" fill="#f2a65a" />
      <path d="M134 36 a18 18 0 0 1 34 -2" fill="none" stroke="#ffd9a0" strokeWidth="3" opacity="0.5" />
      <path d="M18 76 Q 50 66 74 50" fill="none" stroke="#7ef0d6" strokeWidth="2" strokeDasharray="3 5" strokeLinecap="round" />
      <g transform="translate(80 44) rotate(-35)">
        <path d="M0 0 C 8 -9 20 -9 28 0 C 20 9 8 9 0 0 Z" fill="#f4f1ff" />
        <circle cx="17" cy="0" r="3.5" fill="#3a1a6e" />
        <path d="M2 -3 L -7 -9 L 4 -7 Z M2 3 L -7 9 L 4 7 Z" fill="#7ef0d6" />
      </g>
    </>
  ),
  hive: (
    <>
      <rect width="200" height="90" fill="#3a2408" />
      {[[40, 30], [70, 47], [40, 64], [100, 30], [100, 64], [130, 47], [10, 47], [160, 30], [160, 64], [190, 47]].map(([x, y], i) => (
        <polygon
          key={i}
          points={`${x - 18},${y} ${x - 9},${y - 15} ${x + 9},${y - 15} ${x + 18},${y} ${x + 9},${y + 15} ${x - 9},${y + 15}`}
          fill={i === 1 ? "#ffc233" : i % 3 === 0 ? "#6b4513" : "#54360e"}
          stroke="#2b1a06"
          strokeWidth="2.5"
        />
      ))}
      <g transform="translate(128 44) rotate(-12)">
        <ellipse cx="-3" cy="-9" rx="9" ry="5.5" fill="#fff" opacity="0.8" transform="rotate(-25)" />
        <ellipse cx="7" cy="-9" rx="9" ry="5.5" fill="#fff" opacity="0.65" transform="rotate(20)" />
        <ellipse cx="0" cy="0" rx="13" ry="9" fill="#ffd34d" />
        <path d="M-5 -8.4 v16.8 M2 -8.9 v17.8" stroke="#2b1a06" strokeWidth="3.4" />
        <circle cx="9.5" cy="-1.5" r="1.6" fill="#2b1a06" />
      </g>
    </>
  ),
  ladder: (
    <>
      <defs>
        <linearGradient id="cv-ld" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f2740" />
          <stop offset="1" stopColor="#1c5a5e" />
        </linearGradient>
      </defs>
      <rect width="200" height="90" fill="url(#cv-ld)" />
      {dots([[24, 14], [70, 26, 1.3], [180, 20], [160, 60], [36, 52]])}
      <g transform="rotate(24 100 60)" stroke="#d9a468" strokeWidth="5" strokeLinecap="round">
        <path d="M84 96 V 8 M116 96 V 8" />
        <path d="M84 82 H116 M84 64 H116 M84 46 H116 M84 28 H116" strokeWidth="4" stroke="#b9824a" />
      </g>
      <polygon points={starPoints(146, 18, 13)} fill="#ffd36e" />
      <circle cx="146" cy="18" r="22" fill="#ffd36e" opacity="0.15" />
    </>
  ),
  scramble: (
    <>
      <rect width="200" height="90" fill="#ffd45e" />
      <circle cx="170" cy="14" r="30" fill="#ffe08a" />
      {[
        ["D", 30, 50, -14, "#fff"],
        ["W", 74, 38, 9, "#fff"],
        ["R", 118, 54, -6, "#e2542d"],
        ["O", 160, 42, 16, "#fff"],
      ].map(([l, x, y, r, f], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <rect x="-17" y="-13" width="34" height="34" rx="7" fill="#b8860b" opacity="0.35" />
          <rect x="-17" y="-17" width="34" height="34" rx="7" fill={f as string} />
          <text y="7" textAnchor="middle" fontSize="20" fontWeight="800" fill={f === "#fff" ? "#3a2a00" : "#fff"}>
            {l}
          </text>
        </g>
      ))}
    </>
  ),
  emoji: (
    <>
      <rect width="200" height="90" fill="#22090d" />
      <rect x="46" y="14" width="108" height="56" rx="4" fill="#fff5e0" />
      <path d="M0 0 H52 Q 40 45 50 90 H0 Z" fill="#b3202e" />
      <path d="M200 0 H148 Q 160 45 150 90 H200 Z" fill="#b3202e" />
      <path d="M14 0 Q 8 45 16 90 M32 0 Q 24 45 34 90 M186 0 Q 192 45 184 90 M168 0 Q 176 45 166 90" stroke="#7d1420" strokeWidth="3" fill="none" />
      {[60, 80, 100, 120, 140].map((x) => (
        <circle key={x} cx={x} cy="7" r="2.6" fill="#ffcf5a" />
      ))}
      <g transform="translate(100 46)">
        <path d="M-15 -4 L-11 24 H11 L15 -4 Z" fill="#fff" />
        <path d="M-9 -4 L-6.5 24 H-2 L-3 -4 Z M3 -4 L2 24 H6.5 L9 -4 Z" fill="#d7263d" />
        {[[-10, -9], [-2, -13], [7, -10], [0, -6], [11, -5], [-6, -4]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5.5" fill="#ffe9a8" stroke="#e8c868" strokeWidth="0.8" />
        ))}
      </g>
    </>
  ),
  timeline: (
    <>
      <rect width="200" height="90" fill="#f1e3c6" />
      <path d="M0 62 H200" stroke="#7a4b2a" strokeWidth="3" strokeDasharray="1 7" strokeLinecap="round" />
      <path d="M12 62 H188" stroke="#7a4b2a" strokeWidth="2" />
      {[30, 76, 122, 168].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy="62" r="6" fill={i === 2 ? "#a5532a" : "#f1e3c6"} stroke="#7a4b2a" strokeWidth="2.5" />
          <rect x={x - 14} y="72" width="28" height="5" rx="2.5" fill="#7a4b2a" opacity="0.3" />
        </g>
      ))}
      <g transform="translate(122 28)">
        <path d="M-12 -18 H12 M-12 18 H12" stroke="#7a4b2a" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M-9 -16 C -9 -4 9 4 9 16 H-9 C -9 4 9 -4 9 -16 Z" fill="#fff8e6" stroke="#7a4b2a" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M-5 -10 C -3 -5 3 -5 5 -10 Z M0 2 C -6 9 -7 13 -7 14 H7 C 7 13 6 9 0 2 Z" fill="#e2a23a" />
      </g>
    </>
  ),
  sprint: (
    <>
      <rect width="200" height="90" fill="#e8612c" />
      <path d="M-10 78 Q 100 30 210 66 M-10 96 Q 100 48 210 84 M-10 60 Q 100 12 210 48" stroke="#fff" strokeWidth="2" fill="none" opacity="0.7" />
      <g transform="translate(62 44) rotate(-6)">
        <rect x="-26" y="-24" width="52" height="46" rx="5" fill="#fff" />
        <circle cx="-19" cy="-17" r="2.2" fill="#e8612c" />
        <circle cx="19" cy="-17" r="2.2" fill="#e8612c" />
        <text y="14" textAnchor="middle" fontSize="36" fontWeight="800" fill="#162238">
          A
        </text>
      </g>
      <g transform="translate(146 46)">
        <rect x="-4" y="-30" width="8" height="8" rx="2" fill="#162238" />
        <circle r="21" fill="#162238" />
        <circle r="16" fill="#fff" />
        <path d="M0 0 V-11 M0 0 L8 5" stroke="#e8612c" strokeWidth="3" strokeLinecap="round" />
      </g>
    </>
  ),
  jinx: (
    <>
      <rect width="200" height="90" fill="#2e1670" />
      <g>
        <rect x="14" y="18" width="70" height="40" rx="14" fill="#c8ff5a" />
        <path d="M30 56 L24 72 L46 57 Z" fill="#c8ff5a" />
        <rect x="116" y="30" width="70" height="40" rx="14" fill="#ff8fd0" />
        <path d="M170 68 L176 84 L154 69 Z" fill="#ff8fd0" />
        <text x="49" y="45" textAnchor="middle" fontSize="16" fontWeight="800" fill="#1c2a00">
          same
        </text>
        <text x="151" y="57" textAnchor="middle" fontSize="16" fontWeight="800" fill="#4a0b33">
          same
        </text>
      </g>
      <polygon points="104,8 90,44 100,44 94,80 112,38 101,38" fill="#fff36b" stroke="#2e1670" strokeWidth="2" strokeLinejoin="round" />
    </>
  ),
  digits: (
    <>
      <rect width="200" height="90" fill="#8a5a2b" />
      <rect x="6" y="6" width="188" height="78" rx="4" fill="#24493d" />
      <text x="100" y="52" textAnchor="middle" fontSize="27" fontWeight="700" fill="#f4f1e4" opacity="0.92" style={{ fontFamily: "var(--font-display)" }}>
        6 × 7 = 42
      </text>
      <path d="M52 62 Q 100 68 150 61" stroke="#ffe27a" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.9" />
      <rect x="150" y="74" width="26" height="6" rx="2" fill="#f4f1e4" />
      <circle cx="26" cy="22" r="7" fill="none" stroke="#f4f1e4" strokeWidth="1.6" strokeDasharray="3 2" opacity="0.6" />
    </>
  ),
  sudoku: (
    <>
      <rect width="200" height="90" fill="#f4ead7" />
      <g transform="translate(58 9)">
        <rect width="84" height="72" fill="#fffaf0" stroke="#26221c" strokeWidth="2.5" />
        <path d="M28 0 V72 M56 0 V72 M0 24 H84 M0 48 H84" stroke="#26221c" strokeWidth="1" opacity="0.5" />
        <path d="M42 0 V72 M0 24 H84 M0 48 H84" stroke="#26221c" strokeWidth="2" />
        {[["3", 14, 17], ["6", 70, 17], ["1", 42, 41], ["5", 14, 65], ["2", 70, 65]].map(([n, x, y], i) => (
          <text key={i} x={x} y={y} textAnchor="middle" fontSize="14" fontWeight="800" fill="#26221c">
            {n}
          </text>
        ))}
        <text x="42" y="17" textAnchor="middle" fontSize="14" fontWeight="800" fill="#c8402f">
          4
        </text>
      </g>
      <g transform="translate(168 66) rotate(-10)">
        <circle r="14" fill="#c8402f" />
        <polygon points={starPoints(0, 0, 8)} fill="#f4ead7" />
      </g>
      <path d="M14 20 q 10 -8 20 0 M12 32 q 12 -8 24 0" stroke="#26221c" strokeWidth="1.6" fill="none" opacity="0.35" strokeLinecap="round" />
    </>
  ),
};

export function GameCover({ id }: { id: string }) {
  return (
    <svg className="cover-art" viewBox="0 0 200 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {COVERS[id] ?? <rect width="200" height="90" fill="#333" />}
    </svg>
  );
}

/* --------------------------------------------------------------- in-game art */

/** A moon that fills in as guesses are used (Moonword). */
export function MoonPhase({ p, glow }: { p: number; glow?: boolean }) {
  return (
    <svg className={`moon-phase ${glow ? "glow" : ""}`} viewBox="0 0 64 64" width="58" height="58" aria-hidden="true">
      <defs>
        <mask id="moon-mask">
          <rect width="64" height="64" fill="#fff" />
          <circle cx="32" cy="32" r="27" fill="#000" style={{ transform: `translateX(${-(0.12 + p * 0.88) * 56}px)`, transition: "transform 0.7s ease" }} />
        </mask>
      </defs>
      <circle cx="32" cy="32" r="26" fill="#2a2f6c" stroke="#4a50a0" strokeWidth="1.5" />
      <g mask="url(#moon-mask)">
        <circle cx="32" cy="32" r="26" fill="#ffe2a8" />
        <circle cx="40" cy="26" r="5" fill="#e9c27a" opacity="0.7" />
        <circle cx="26" cy="40" r="3.4" fill="#e9c27a" opacity="0.7" />
        <circle cx="42" cy="42" r="2.4" fill="#e9c27a" opacity="0.7" />
      </g>
    </svg>
  );
}

const FIGURES: Array<Array<[number, number]>> = [
  [[6, 30], [20, 12], [36, 22], [54, 8]],
  [[8, 10], [24, 30], [40, 10], [54, 30]],
  [[8, 20], [22, 8], [38, 8], [52, 20], [30, 34], [8, 20]],
  [[30, 4], [38, 18], [54, 20], [42, 30], [30, 36], [18, 30], [6, 20], [22, 18], [30, 4]],
];

/** The little star figure drawn when a group is found (Constellations). */
export function ConstellationFigure({ level }: { level: number }) {
  const pts = FIGURES[level % FIGURES.length];
  return (
    <svg className="con-figure" viewBox="0 0 60 40" width="60" height="40" aria-hidden="true">
      <polyline points={pts.map((p) => p.join(",")).join(" ")} pathLength={100} />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.6" style={{ animationDelay: `${i * 0.08}s` }} />
      ))}
    </svg>
  );
}

/** A rocket flying from Earth to the deep sky as light-years add up (Deep Sky). */
export function Voyage({ frac }: { frac: number }) {
  const f = Math.max(0, Math.min(1, frac));
  return (
    <div className="voyage" aria-hidden="true">
      <div className="voyage-track" />
      <span className="stop" style={{ left: "0%" }}>
        <svg viewBox="0 0 20 20" width="18" height="18">
          <circle cx="10" cy="10" r="8" fill="#4aa3ff" />
          <path d="M5 8 q3 -4 6 -1 q3 2 0 5 q-4 2 -6 -4 Z" fill="#7be08f" />
        </svg>
      </span>
      <span className="stop" style={{ left: "33%" }}>
        <svg viewBox="0 0 20 20" width="14" height="14">
          <circle cx="10" cy="10" r="8" fill="#d9dcec" />
          <circle cx="7" cy="8" r="2" fill="#b3b7cf" />
          <circle cx="13" cy="12" r="1.5" fill="#b3b7cf" />
        </svg>
      </span>
      <span className="stop" style={{ left: "66%" }}>
        <svg viewBox="0 0 30 20" width="26" height="18">
          <ellipse cx="15" cy="10" rx="13" ry="3.4" fill="none" stroke="#ffd9a0" strokeWidth="1.6" transform="rotate(-15 15 10)" />
          <circle cx="15" cy="10" r="6.5" fill="#f2a65a" />
        </svg>
      </span>
      <span className="stop" style={{ left: "100%" }}>
        <svg viewBox="0 0 24 24" width="22" height="22" className="galaxy">
          <path d="M12 12 m-9 0 a9 4 0 1 0 18 0 a9 4 0 1 0 -18 0" fill="none" stroke="#c9a6f0" strokeWidth="1.5" transform="rotate(30 12 12)" />
          <path d="M12 12 m-9 0 a9 4 0 1 0 18 0 a9 4 0 1 0 -18 0" fill="none" stroke="#7ef0d6" strokeWidth="1.5" transform="rotate(-30 12 12)" />
          <circle cx="12" cy="12" r="2.6" fill="#fff" />
        </svg>
      </span>
      <span className="rocket" style={{ left: `${f * 100}%` }}>
        <svg viewBox="0 0 40 24" width="36" height="22">
          <path className="flame" d="M10 12 L0 8 Q 4 12 0 16 Z" fill="#ffb347" />
          <path d="M8 12 C 16 2 30 2 38 12 C 30 22 16 22 8 12 Z" fill="#f4f1ff" />
          <circle cx="26" cy="12" r="4" fill="#3a1a6e" />
          <path d="M12 8 L4 2 L16 5 Z M12 16 L4 22 L16 19 Z" fill="#7ef0d6" />
        </svg>
      </span>
    </div>
  );
}

/** A jar that fills with honey as the score grows (Hive). */
export function HoneyJar({ pct }: { pct: number }) {
  const h = Math.max(0, Math.min(1, pct)) * 34;
  return (
    <svg className="honey-jar" viewBox="0 0 44 54" width="40" height="50" aria-hidden="true">
      <defs>
        <clipPath id="jar-in">
          <path d="M7 14 H37 Q 41 14 41 20 V44 Q 41 50 35 50 H9 Q 3 50 3 44 V20 Q 3 14 7 14 Z" />
        </clipPath>
      </defs>
      <path d="M7 14 H37 Q 41 14 41 20 V44 Q 41 50 35 50 H9 Q 3 50 3 44 V20 Q 3 14 7 14 Z" fill="rgba(255,255,255,0.12)" />
      <g clipPath="url(#jar-in)">
        <rect x="0" y="50" width="44" height="40" fill="#ffb81f" style={{ transform: `translateY(${-h}px)`, transition: "transform 0.6s ease" }} />
        <rect x="0" y="50" width="44" height="3" fill="#ffe08a" style={{ transform: `translateY(${-h}px)`, transition: "transform 0.6s ease" }} />
      </g>
      <path d="M7 14 H37 Q 41 14 41 20 V44 Q 41 50 35 50 H9 Q 3 50 3 44 V20 Q 3 14 7 14 Z" fill="none" stroke="#ffe9b0" strokeWidth="2" />
      <rect x="6" y="5" width="32" height="8" rx="3" fill="#c98a2b" />
      <path d="M10 22 V40" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

/** A bee that zips across when a word is found (Hive). */
export function Bee() {
  return (
    <svg className="bee" viewBox="-20 -18 40 32" width="34" height="28" aria-hidden="true">
      <ellipse className="wing" cx="-3" cy="-9" rx="9" ry="5.5" fill="#fff" opacity="0.85" />
      <ellipse className="wing w2" cx="7" cy="-9" rx="9" ry="5.5" fill="#fff" opacity="0.7" />
      <ellipse cx="0" cy="0" rx="13" ry="9" fill="#ffd34d" />
      <path d="M-5 -8.4 v16.8 M2 -8.9 v17.8" stroke="#2b1a06" strokeWidth="3.4" />
      <circle cx="9.5" cy="-1.5" r="1.6" fill="#2b1a06" />
    </svg>
  );
}

/** A ring that drains as time runs out (Alphabet Sprint, Deep Sky). */
export function Stopwatch({ frac, label, low }: { frac: number; label: string; low?: boolean }) {
  const C = 2 * Math.PI * 26;
  return (
    <svg className={`stopwatch ${low ? "low" : ""}`} viewBox="0 0 64 70" width="60" height="66" role="img" aria-label={`${label} left`}>
      <rect x="28" y="1" width="8" height="7" rx="2" className="sw-knob" />
      <circle cx="32" cy="38" r="26" className="sw-bg" />
      <circle cx="32" cy="38" r="26" className="sw-ring" strokeDasharray={C} strokeDashoffset={C * (1 - Math.max(0, Math.min(1, frac)))} transform="rotate(-90 32 38)" />
      <text x="32" y="43" textAnchor="middle" className="sw-text">
        {label}
      </text>
    </svg>
  );
}

/** Two minds and the spark between them (Jinx). */
export function Minds({ left, right, state }: { left: string; right: string; state: "idle" | "thinking" | "match" }) {
  const face = (x: number, fill: string, dark: string, flip = false) => (
    <g transform={`translate(${x} 34)`}>
      <circle r="26" fill={fill} />
      <path d={flip ? "M-16 -22 q 8 -12 16 -4 q 10 -8 16 4" : "M-16 -22 q 6 -12 16 -4 q 8 -8 16 4"} fill="none" stroke={fill} strokeWidth="7" strokeLinecap="round" />
      <circle cx="-9" cy="-3" r="3.4" fill={dark} />
      <circle cx="9" cy="-3" r="3.4" fill={dark} />
      {state === "match" ? <path d="M-9 8 q 9 10 18 0" fill="none" stroke={dark} strokeWidth="3" strokeLinecap="round" /> : <path d="M-6 10 h 12" stroke={dark} strokeWidth="3" strokeLinecap="round" />}
    </g>
  );
  return (
    <div className={`minds minds-${state}`}>
      <svg viewBox="0 0 220 70" width="220" height="70" aria-hidden="true">
        {face(34, "#c8ff5a", "#1c2a00")}
        {face(186, "#ff8fd0", "#4a0b33", true)}
        <g className="spark">
          <polygon points="114,6 98,38 109,38 102,66 124,30 112,30" fill="#fff36b" />
        </g>
        <g className="waves">
          <path d="M70 26 q 8 8 0 16 M80 20 q 14 14 0 28" />
          <path d="M150 26 q -8 8 0 16 M140 20 q -14 14 0 28" />
        </g>
      </svg>
      <div className="minds-names">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

export function Hourglass({ turn }: { turn: number }) {
  return (
    <svg key={turn} className="hourglass" viewBox="-16 -22 32 44" width="26" height="36" aria-hidden="true">
      <path d="M-12 -18 H12 M-12 18 H12" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M-9 -16 C -9 -4 9 4 9 16 H-9 C -9 4 9 -4 9 -16 Z" fill="#fff8e6" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M-5 -10 C -3 -5 3 -5 5 -10 Z M0 2 C -6 9 -7 13 -7 14 H7 C 7 13 6 9 0 2 Z" fill="#e2a23a" />
    </svg>
  );
}

/** The red seal stamped on a finished grid (Mini Sudoku). */
export function Seal() {
  return (
    <svg className="seal" viewBox="-20 -20 40 40" width="64" height="64" aria-hidden="true">
      <circle r="17" fill="#c8402f" />
      <circle r="13.5" fill="none" stroke="#f6eedd" strokeWidth="1.2" />
      <polygon points={starPoints(0, 0, 9)} fill="#f6eedd" />
    </svg>
  );
}

export const cssVars = (vars: Record<string, string | number>) => vars as CSSProperties;
