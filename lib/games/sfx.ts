/**
 * Game sound effects, synthesized with Web Audio (no audio files).
 * Each sound is a few short tones or filtered-noise bursts.
 */

import { sfxBus } from "@/lib/sound/engine";

const KEY = "starlit:sfx-muted";
let muted = false;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    muted = localStorage.getItem(KEY) === "1";
  } catch {
    /* storage unavailable */
  }
}

export function isMuted() {
  load();
  return muted;
}

export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(KEY, m ? "1" : "0");
  } catch {
    /* ignore */
  }
  subs.forEach((f) => f());
}

export function subscribeMuted(f: () => void) {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
}

type Tone = { f: number; to?: number; d: number; type?: OscillatorType; g?: number; at?: number; verb?: number };

function tone({ f, to, d, type = "sine", g = 0.1, at = 0, verb = 0.15 }: Tone) {
  const { ac, master, reverbIn } = sfxBus();
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + d);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(g, t + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + d);
  osc.connect(gain);
  gain.connect(master);
  if (verb) {
    const send = ac.createGain();
    send.gain.value = verb;
    gain.connect(send).connect(reverbIn);
  }
  osc.start(t);
  osc.stop(t + d + 0.03);
}

let noiseBuf: AudioBuffer | null = null;
type Noise = { d: number; freq: number; q?: number; kind?: BiquadFilterType; g?: number; at?: number; to?: number };

function noise({ d, freq, q = 1, kind = "bandpass", g = 0.1, at = 0, to }: Noise) {
  const { ac, master } = sfxBus();
  if (!noiseBuf || noiseBuf.sampleRate !== ac.sampleRate) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t = ac.currentTime + at;
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ac.createBiquadFilter();
  filter.type = kind;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(freq, t);
  if (to) filter.frequency.exponentialRampToValueAtTime(to, t + d);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(g, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + d);
  src.connect(filter).connect(gain).connect(master);
  src.start(t, Math.random() * 0.5);
  src.stop(t + d + 0.03);
}

const notes = (freqs: number[], step: number, o: Partial<Tone> = {}) => freqs.forEach((f, i) => tone({ f, d: 0.28, g: 0.09, at: i * step, ...o }));

const SOUNDS = {
  /** a button or tile press */
  tap: () => tone({ f: 520, to: 380, d: 0.06, type: "triangle", g: 0.07, verb: 0 }),
  /** typing a letter */
  type: () => tone({ f: 700 + Math.random() * 120, d: 0.035, type: "triangle", g: 0.05, verb: 0 }),
  back: () => tone({ f: 330, to: 240, d: 0.06, type: "triangle", g: 0.06, verb: 0 }),
  /** something right */
  good: () => notes([659, 880], 0.08),
  /** something really right */
  great: () => notes([523, 659, 784, 1047], 0.07, { d: 0.35 }),
  /** a soft "nope" */
  bad: () => {
    tone({ f: 196, to: 150, d: 0.16, type: "triangle", g: 0.11, verb: 0 });
    tone({ f: 207, to: 158, d: 0.16, type: "triangle", g: 0.07, verb: 0 });
  },
  /** a tile turning over */
  flip: () => [0, 0.09, 0.18, 0.27, 0.36].forEach((at) => noise({ d: 0.05, freq: 2400, q: 2, g: 0.07, at })),
  pop: () => tone({ f: 300, to: 900, d: 0.09, g: 0.1, verb: 0.05 }),
  whoosh: () => noise({ d: 0.3, freq: 500, to: 3000, q: 1.2, g: 0.07 }),
  shuffle: () => [0, 0.05, 0.1, 0.15].forEach((at) => noise({ d: 0.05, freq: 1500 + Math.random() * 1500, q: 3, g: 0.06, at })),
  /** a new game opening */
  start: () => {
    noise({ d: 0.35, freq: 400, to: 2600, q: 1, g: 0.05 });
    notes([392, 523, 659], 0.09, { g: 0.06 });
  },
  win: () => {
    notes([523, 659, 784, 1047, 1319], 0.09, { d: 0.5, g: 0.09, verb: 0.3 });
    notes([1047, 1319, 1568], 0.06, { d: 0.6, g: 0.04, at: 0.5, type: "triangle", verb: 0.4 });
  },
  lose: () => notes([440, 392, 330], 0.14, { d: 0.4, type: "triangle", g: 0.07 }),
  /** countdown tick */
  tick: () => tone({ f: 1100, d: 0.03, type: "square", g: 0.03, verb: 0 }),
  /** wood (Star Ladder) */
  knock: () => {
    tone({ f: 220, to: 160, d: 0.09, type: "triangle", g: 0.14, verb: 0.05 });
    noise({ d: 0.04, freq: 900, q: 2, g: 0.08 });
  },
  /** a rubber stamp (Timeline, Sudoku) */
  stamp: () => {
    tone({ f: 120, to: 70, d: 0.14, g: 0.2, verb: 0.05 });
    noise({ d: 0.07, freq: 500, q: 0.8, g: 0.1 });
  },
  /** a happy bee (Hive) */
  buzz: () => {
    tone({ f: 190, to: 230, d: 0.22, type: "sawtooth", g: 0.035, verb: 0 });
    notes([784, 988], 0.08, { at: 0.12 });
  },
  /** chalk on a board (Star Math) */
  chalk: () => noise({ d: 0.12, freq: 3200, to: 2200, q: 4, g: 0.07 }),
  /** applause (Emoji Cinema) */
  clap: () => {
    for (let i = 0; i < 9; i++) noise({ d: 0.05, freq: 1200 + Math.random() * 1400, q: 1.2, g: 0.05 + Math.random() * 0.04, at: i * 0.045 + Math.random() * 0.02 });
    notes([659, 880], 0.08, { g: 0.05 });
  },
  /** a spark between two minds (Jinx) */
  zap: () => {
    tone({ f: 1400, to: 220, d: 0.16, type: "sawtooth", g: 0.05, verb: 0.2 });
    noise({ d: 0.1, freq: 4000, q: 3, g: 0.04 });
  },
  /** a rocket boost (Deep Sky) */
  launch: () => {
    noise({ d: 0.45, freq: 300, to: 2400, q: 0.9, g: 0.08 });
    tone({ f: 180, to: 720, d: 0.4, type: "triangle", g: 0.06 });
  },
  /** your friend did something */
  blip: () => tone({ f: 880, d: 0.08, g: 0.04 }),
} as const;

export type Sfx = keyof typeof SOUNDS;

export function sfx(name: Sfx) {
  if (isMuted()) return;
  try {
    SOUNDS[name]();
  } catch (e) {
    // Audio isn't available; the visuals carry it.
    console.warn("sound effect failed:", name, e);
  }
}

export const SFX_NAMES = Object.keys(SOUNDS) as Sfx[];
