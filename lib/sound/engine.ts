/**
 * Playback side of the ambience: one shared AudioContext with a gentle
 * compressor and a small room reverb, and looping "voices" for each sound.
 */

import { RECIPES, REVERB_SEND, type SoundId } from "./recipes";
import type { Stereo } from "./dsp";

let ctx: AudioContext | null = null;
let master: GainNode;
let reverbIn: GainNode;

export function audio(): AudioContext {
  if (!ctx) {
    const Ctor =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    comp.attack.value = 0.01;
    comp.release.value = 0.3;
    comp.connect(ctx.destination);

    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(comp);

    const verb = ctx.createConvolver();
    verb.buffer = impulse(ctx, 2.6);
    const verbOut = ctx.createGain();
    verbOut.gain.value = 0.6;
    reverbIn = ctx.createGain();
    reverbIn.connect(verb).connect(verbOut).connect(master);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** A soft, darkish room impulse made from decaying stereo noise. */
function impulse(ac: AudioContext, seconds: number) {
  const n = Math.round(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, n, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const x = i / n;
      const w = Math.random() * 2 - 1;
      lp += (w - lp) * (0.35 - 0.25 * x); // gets darker as it decays
      d[i] = lp * Math.pow(1 - x, 3.2) * (i < ac.sampleRate * 0.01 ? i / (ac.sampleRate * 0.01) : 1);
    }
  }
  return buf;
}

/* ---------------- rendering (in a worker when possible) ---------------- */

let worker: Worker | null | undefined;
const pending = new Map<SoundId, (s: Stereo) => void>();

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL("./synth.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<{ id: SoundId; L: Float32Array; R: Float32Array }>) => {
      pending.get(e.data.id)?.([e.data.L, e.data.R]);
      pending.delete(e.data.id);
    };
    worker.onerror = () => {
      worker = null; // fall back to the main thread from now on
    };
  } catch {
    worker = null;
  }
  return worker;
}

function render(id: SoundId, sr: number): Promise<Stereo> {
  const w = getWorker();
  if (w) {
    return new Promise((resolve) => {
      pending.set(id, resolve);
      w.postMessage({ id, sr });
    });
  }
  // Fallback: let the "loading" state paint first, then render here.
  return new Promise((resolve) => setTimeout(() => resolve(RECIPES[id](sr)), 30));
}

const buffers = new Map<SoundId, Promise<AudioBuffer>>();

export function loadSound(id: SoundId): Promise<AudioBuffer> {
  let p = buffers.get(id);
  if (!p) {
    const ac = audio();
    p = render(id, ac.sampleRate).then(([L, R]) => {
      const buf = ac.createBuffer(2, L.length, ac.sampleRate);
      buf.copyToChannel(L as Float32Array<ArrayBuffer>, 0);
      buf.copyToChannel(R as Float32Array<ArrayBuffer>, 1);
      return buf;
    });
    buffers.set(id, p);
  }
  return p;
}

/* ---------------- voices ---------------- */

const curve = (v: number) => v * v * 1.4; // sliders feel even across the range

export class Voice {
  private src: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  constructor(public id: SoundId) {}

  async start(volume: number) {
    const ac = audio();
    const buf = await loadSound(this.id);
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = ac.createGain();
    gain.gain.value = 0;
    const send = ac.createGain();
    send.gain.value = REVERB_SEND[this.id];
    src.connect(gain);
    gain.connect(master);
    gain.connect(send).connect(reverbIn);
    src.start(0, Math.random() * buf.duration); // different starting point each time
    gain.gain.setTargetAtTime(curve(volume), ac.currentTime, 0.6);
    this.src = src;
    this.gain = gain;
  }

  setVolume(volume: number) {
    if (this.gain) this.gain.gain.setTargetAtTime(curve(volume), audio().currentTime, 0.08);
  }

  stop() {
    const { src, gain } = this;
    if (!src || !gain) return;
    gain.gain.setTargetAtTime(0, audio().currentTime, 0.35);
    setTimeout(() => {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    }, 2000);
    this.src = null;
    this.gain = null;
  }
}

/** A soft two-note bell for when a timer block ends. */
export function chime() {
  try {
    const ac = audio();
    const t0 = ac.currentTime + 0.02;
    const notes = [784, 1175]; // G5, D6
    const partials: Array<[ratio: number, amp: number, decay: number]> = [
      [1, 1, 2.2],
      [2.0, 0.28, 1.2],
      [2.76, 0.16, 0.9],
      [5.4, 0.05, 0.4],
    ];
    notes.forEach((f, ni) => {
      const start = t0 + ni * 0.22;
      for (const [ratio, amp, decay] of partials) {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.frequency.value = f * ratio;
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(0.09 * amp, start + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, start + decay);
        osc.connect(g);
        g.connect(master);
        g.connect(reverbIn);
        osc.start(start);
        osc.stop(start + decay + 0.05);
      }
    });
  } catch {
    /* audio blocked; the on-screen change is enough */
  }
}

/** Output nodes for short game sound effects (shares the ambience's reverb and compressor). */
export function sfxBus() {
  const ac = audio();
  return { ac, master, reverbIn };
}
