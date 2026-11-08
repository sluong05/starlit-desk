/**
 * Small DSP toolkit for synthesizing seamless ambient loops offline.
 *
 * Everything here is plain math on Float32Arrays, so it runs in the browser
 * or in Node (handy for rendering previews). Loops are made seamless by:
 *  - placing events with wrap-around (an event near the end spills into the start)
 *  - running filters over the buffer twice and keeping the second pass, so the
 *    filter state at the start matches the state at the end
 *  - building slow modulation from sines with a whole number of cycles per loop
 */

export type Stereo = [Float32Array, Float32Array];

/** Deterministic PRNG so a sound is identical every time it is generated. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rand = () => number;

export const TAU = Math.PI * 2;

/* ---------------- noise ---------------- */

export class Pink {
  private b = [0, 0, 0, 0, 0, 0, 0];
  constructor(private rand: Rand) {}
  next() {
    const w = this.rand() * 2 - 1;
    const b = this.b;
    b[0] = 0.99886 * b[0] + w * 0.0555179;
    b[1] = 0.99332 * b[1] + w * 0.0750759;
    b[2] = 0.969 * b[2] + w * 0.153852;
    b[3] = 0.8665 * b[3] + w * 0.3104856;
    b[4] = 0.55 * b[4] + w * 0.5329522;
    b[5] = -0.7616 * b[5] - w * 0.016898;
    const out = (b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + w * 0.5362) * 0.11;
    b[6] = w * 0.115926;
    return out;
  }
}

export class Brown {
  private last = 0;
  constructor(private rand: Rand) {}
  next() {
    const w = this.rand() * 2 - 1;
    this.last = (this.last + 0.02 * w) / 1.02;
    return this.last * 3.5;
  }
}

/** Fill an array with noise. Noise has no memory, so any slice of it loops. */
export function noise(len: number, kind: "white" | "pink" | "brown", rand: Rand) {
  const out = new Float32Array(len);
  if (kind === "white") {
    for (let i = 0; i < len; i++) out[i] = rand() * 2 - 1;
  } else {
    const g = kind === "pink" ? new Pink(rand) : new Brown(rand);
    // warm up so the generator has settled before we start recording
    for (let i = 0; i < 4096; i++) g.next();
    for (let i = 0; i < len; i++) out[i] = g.next();
  }
  return out;
}

/* ---------------- filters ---------------- */

export type FilterType = "lowpass" | "highpass" | "bandpass";

/** RBJ-cookbook biquad, transposed direct form II. */
export class Biquad {
  b0 = 1;
  b1 = 0;
  b2 = 0;
  a1 = 0;
  a2 = 0;
  z1 = 0;
  z2 = 0;
  constructor(public type: FilterType, freq: number, q: number, public sr: number) {
    this.set(freq, q);
  }
  set(freq: number, q: number) {
    const w0 = (TAU * Math.min(freq, this.sr * 0.45)) / this.sr;
    const cos = Math.cos(w0);
    const alpha = Math.sin(w0) / (2 * q);
    let b0: number, b1: number, b2: number;
    if (this.type === "lowpass") {
      b0 = (1 - cos) / 2;
      b1 = 1 - cos;
      b2 = (1 - cos) / 2;
    } else if (this.type === "highpass") {
      b0 = (1 + cos) / 2;
      b1 = -(1 + cos);
      b2 = (1 + cos) / 2;
    } else {
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
    }
    const a0 = 1 + alpha;
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * cos) / a0;
    this.a2 = (1 - alpha) / a0;
  }
  process(x: number) {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }
}

/**
 * Run a chain of filters over a looping buffer, in place. The first pass only
 * warms up the filter state so the output has no seam at the loop point.
 * `update` (optional) can retune filters every `block` samples for sweeps.
 */
export function filterLoop(
  buf: Float32Array,
  chain: Biquad[],
  update?: (i: number, chain: Biquad[]) => void,
  block = 64,
) {
  const n = buf.length;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {
      if (update && i % block === 0) update(i, chain);
      let x = buf[i];
      for (let f = 0; f < chain.length; f++) x = chain[f].process(x);
      if (pass === 1) buf[i] = x;
    }
  }
  return buf;
}

/* ---------------- modulation ---------------- */

/**
 * A smooth, looping "random" curve in roughly [-1, 1], built from sines that
 * each complete a whole number of cycles per loop.
 */
export function loopLfo(len: number, rand: Rand, parts: Array<[cycles: number, amp: number]>) {
  const phases = parts.map(() => rand() * TAU);
  const total = parts.reduce((s, [, a]) => s + a, 0) || 1;
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    let v = 0;
    for (let p = 0; p < parts.length; p++) v += parts[p][1] * Math.sin((TAU * parts[p][0] * i) / len + phases[p]);
    out[i] = v / total;
  }
  return out;
}

/* ---------------- mixing ---------------- */

export function stereo(len: number): Stereo {
  return [new Float32Array(len), new Float32Array(len)];
}

/** Equal-power pan gains for pan in [0, 1] (0 = left). */
export function panGains(pan: number): [number, number] {
  return [Math.cos((pan * Math.PI) / 2), Math.sin((pan * Math.PI) / 2)];
}

/** Add a mono event into a stereo loop at `start`, wrapping past the end. */
export function addEvent(out: Stereo, start: number, samples: Float32Array, pan: number, gain = 1) {
  const [gl, gr] = panGains(pan);
  const n = out[0].length;
  let idx = ((Math.floor(start) % n) + n) % n;
  for (let k = 0; k < samples.length; k++) {
    const s = samples[k] * gain;
    out[0][idx] += s * gl;
    out[1][idx] += s * gr;
    if (++idx === n) idx = 0;
  }
}

/** out += src * gain (per channel arrays). */
export function mixInto(out: Float32Array, src: Float32Array, gain: number | Float32Array = 1) {
  if (typeof gain === "number") {
    for (let i = 0; i < out.length; i++) out[i] += src[i] * gain;
  } else {
    for (let i = 0; i < out.length; i++) out[i] += src[i] * gain[i];
  }
}

/** Scale to a target RMS (dBFS), then make sure peaks stay under -1 dBFS. */
export function normalize(out: Stereo, targetDb = -20) {
  let sum = 0;
  let peak = 0;
  const n = out[0].length;
  for (const ch of out) {
    for (let i = 0; i < n; i++) {
      sum += ch[i] * ch[i];
      const a = Math.abs(ch[i]);
      if (a > peak) peak = a;
    }
  }
  const rms = Math.sqrt(sum / (2 * n)) || 1e-9;
  let gain = Math.pow(10, targetDb / 20) / rms;
  if (peak * gain > 0.89) gain = 0.89 / peak;
  for (const ch of out) for (let i = 0; i < n; i++) ch[i] *= gain;
  return out;
}

/** Envelope helpers. */
export const smoothstep = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
