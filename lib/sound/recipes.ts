/**
 * Recipes for each ambient sound. Each one renders a seamless stereo loop.
 * They're layered the way a sound designer would build them in a DAW:
 * a noise "bed" for body, plus many small randomized events for detail.
 */

import {
  Biquad,
  TAU,
  addEvent,
  filterLoop,
  loopLfo,
  mixInto,
  mulberry32,
  noise,
  normalize,
  smoothstep,
  stereo,
  type Rand,
  type Stereo,
} from "./dsp";

export type SoundId = "rain" | "fire" | "crickets" | "waves" | "wind" | "birds";

/* ---------------- rain ---------------- */

export function rain(sr: number): Stereo {
  const rand = mulberry32(101);
  const len = Math.round(24 * sr);
  const out = stereo(len);

  // 1. The wash of countless distant drops: decorrelated pink noise per ear.
  const swell = loopLfo(len, rand, [
    [2, 0.6],
    [5, 0.3],
    [11, 0.1],
  ]);
  for (let c = 0; c < 2; c++) {
    const bed = noise(len, "pink", rand);
    filterLoop(bed, [new Biquad("highpass", 300, 0.7, sr), new Biquad("lowpass", 4200, 0.6, sr)]);
    for (let i = 0; i < len; i++) out[c][i] += bed[i] * 0.55 * (0.85 + 0.15 * swell[i]);

    // a low "roof" rumble underneath
    const low = noise(len, "brown", rand);
    filterLoop(low, [new Biquad("lowpass", 700, 0.7, sr)]);
    mixInto(out[c], low, 0.22);
  }

  // 2. Nearby drops tapping on leaves and the window: tiny damped pings.
  const taps = Math.round(24 * 90);
  for (let d = 0; d < taps; d++) {
    const n = Math.round(sr * (0.004 + rand() * 0.01));
    const f = 1600 + rand() * 4200;
    const tau = n / 5;
    const ev = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const env = Math.exp(-k / tau) * Math.min(1, k / 12);
      ev[k] = (Math.sin((TAU * f * k) / sr) * 0.7 + (rand() * 2 - 1) * 0.3) * env;
    }
    const amp = 0.015 + 0.13 * Math.pow(rand(), 3);
    addEvent(out, rand() * len, ev, 0.1 + rand() * 0.8, amp);
  }

  // 3. Drops landing in puddles: the bubble "plip" with its rising pitch.
  const plips = Math.round(24 * 3);
  for (let d = 0; d < plips; d++) {
    const n = Math.round(sr * (0.02 + rand() * 0.025));
    const f0 = 800 + rand() * 900;
    const ev = new Float32Array(n);
    let ph = 0;
    for (let k = 0; k < n; k++) {
      const x = k / n;
      ph += (TAU * f0 * (1 + 0.7 * x)) / sr;
      ev[k] = Math.sin(ph) * Math.exp(-x * 4) * Math.min(1, k / (sr * 0.002));
    }
    addEvent(out, rand() * len, ev, 0.15 + rand() * 0.7, 0.03 + rand() * 0.06);
  }

  // soften the very top end
  for (let c = 0; c < 2; c++) filterLoop(out[c], [new Biquad("lowpass", 9000, 0.7, sr)]);
  return normalize(out, -21);
}

/* ---------------- fireplace ---------------- */

export function fire(sr: number): Stereo {
  const rand = mulberry32(202);
  const len = Math.round(20 * sr);
  const out = stereo(len);

  // How lively the flames are, drifting over time (with a faster flutter).
  const flick = loopLfo(len, rand, [
    [3, 0.4],
    [7, 0.3],
    [13, 0.2],
    [29, 0.1],
  ]);
  const flutter = loopLfo(len, rand, [
    [97, 0.6],
    [151, 0.4],
  ]);
  const life = new Float32Array(len);
  for (let i = 0; i < len; i++) life[i] = 0.75 + 0.22 * flick[i] + 0.06 * flutter[i];

  const sharedLow = noise(len, "brown", rand);
  for (let c = 0; c < 2; c++) {
    // body: a soft low rumble (mostly shared between ears so it feels centered)
    const own = noise(len, "brown", rand);
    const low = new Float32Array(len);
    for (let i = 0; i < len; i++) low[i] = sharedLow[i] * 0.8 + own[i] * 0.2;
    filterLoop(low, [new Biquad("lowpass", 240, 0.7, sr)]);
    mixInto(out[c], low, life);

    // the breathy "whoosh" of the flames
    const roar = noise(len, "pink", rand);
    filterLoop(roar, [new Biquad("bandpass", 550, 0.8, sr)]);
    for (let i = 0; i < len; i++) out[c][i] += roar[i] * 0.22 * life[i] * life[i];

    // faint hiss of gas escaping the wood
    const hiss = noise(len, "pink", rand);
    filterLoop(hiss, [new Biquad("highpass", 3500, 0.7, sr)]);
    for (let i = 0; i < len; i++) out[c][i] += hiss[i] * 0.035 * life[i];
  }

  // Crackles come in little clusters of clicks, like real burning sap.
  const crackle = stereo(len);
  const clusters = Math.round(20 * 5);
  for (let g = 0; g < clusters; g++) {
    let t = rand() * len;
    const count = 1 + Math.floor(Math.pow(rand(), 2) * 9);
    const pan = 0.25 + rand() * 0.5;
    const loud = 0.25 + rand() * 0.75;
    for (let k = 0; k < count; k++) {
      const n = Math.max(8, Math.round(sr * (0.0004 + rand() * 0.0022)));
      const ev = new Float32Array(n);
      for (let j = 0; j < n; j++) ev[j] = (rand() * 2 - 1) * Math.exp((-j / n) * 5);
      addEvent(crackle, t, ev, pan + (rand() - 0.5) * 0.15, loud * (0.3 + rand() * 0.7));
      t += sr * (0.003 + Math.pow(rand(), 2) * 0.03);
    }
  }
  for (let c = 0; c < 2; c++) {
    filterLoop(crackle[c], [new Biquad("highpass", 1100, 0.7, sr), new Biquad("lowpass", 7500, 0.7, sr)]);
    mixInto(out[c], crackle[c], 0.55);
  }

  // Occasional deeper pops as a pocket of air bursts.
  const pops = 9;
  for (let p = 0; p < pops; p++) {
    const n = Math.round(sr * 0.09);
    const f = 85 + rand() * 80;
    const ev = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const env = Math.exp(-k / (sr * 0.022));
      ev[k] = Math.sin((TAU * f * k) / sr) * env + (k < sr * 0.002 ? (rand() * 2 - 1) * 0.6 : 0);
    }
    addEvent(out, rand() * len, ev, 0.35 + rand() * 0.3, 0.12 + rand() * 0.1);
  }

  return normalize(out, -22);
}

/* ---------------- crickets ---------------- */

function cricket(out: Stereo, sr: number, rand: Rand, opts: { f: number; pan: number; amp: number; period: number }) {
  const len = out[0].length;
  const pulses = 3 + Math.floor(rand() * 3);
  const pulsePeriod = 0.03 + rand() * 0.012;
  const pulseLen = pulsePeriod * 0.62;
  const chirp = new Float32Array(Math.round(sr * pulsePeriod * pulses));
  for (let p = 0; p < pulses; p++) {
    const start = Math.round(sr * p * pulsePeriod);
    const n = Math.round(sr * pulseLen);
    const level = 0.75 + 0.25 * Math.sin((Math.PI * (p + 0.5)) / pulses);
    let ph = 0;
    for (let k = 0; k < n; k++) {
      const x = k / n;
      ph += (TAU * opts.f * (1 - 0.015 * x)) / sr;
      const env = Math.pow(Math.sin(Math.PI * x), 2);
      chirp[start + k] += (Math.sin(ph) + 0.08 * Math.sin(2 * ph)) * env * level;
    }
  }
  // Sing in phrases with little rests, the way real crickets do.
  let t = rand() * sr;
  while (t < len) {
    const phrase = 8 + Math.floor(rand() * 20);
    for (let c = 0; c < phrase && t < len; c++) {
      addEvent(out, t, chirp, opts.pan, opts.amp * (0.85 + rand() * 0.3));
      t += sr * opts.period * (0.94 + rand() * 0.12);
    }
    t += sr * (0.8 + rand() * 2.5);
  }
}

export function crickets(sr: number): Stereo {
  const rand = mulberry32(303);
  const len = Math.round(24 * sr);
  const out = stereo(len);

  // Still night air: a very low distant breeze.
  for (let c = 0; c < 2; c++) {
    const air = noise(len, "brown", rand);
    filterLoop(air, [new Biquad("lowpass", 220, 0.7, sr)]);
    mixInto(out[c], air, 0.12);
  }

  // A few crickets at different distances around you.
  const field: Array<[pan: number, amp: number]> = [
    [0.32, 0.22],
    [0.74, 0.14],
    [0.12, 0.08],
    [0.9, 0.06],
    [0.55, 0.04],
  ];
  for (const [pan, amp] of field) {
    cricket(out, sr, rand, { f: 4200 + rand() * 900, pan, amp, period: 0.5 + rand() * 0.55 });
  }

  // A far-off katydid trill that swells and fades.
  const swell = loopLfo(len, rand, [
    [3, 0.7],
    [7, 0.3],
  ]);
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const am = Math.pow(0.5 + 0.5 * Math.sin(TAU * 46 * t), 3);
    const v = Math.sin(TAU * 3550 * t) * am * 0.018 * (0.5 + 0.5 * swell[i]);
    out[0][i] += v * 0.75;
    out[1][i] += v * 0.65;
  }

  return normalize(out, -26);
}

/* ---------------- waves ---------------- */

export function waves(sr: number): Stereo {
  const rand = mulberry32(404);
  const seconds = 36;
  const len = Math.round(seconds * sr);
  const out = stereo(len);

  // When each wave breaks (irregular, like the real sea).
  const starts = [0, 7.3, 15.1, 21.8, 29.4].map((s) => s + rand() * 0.6);
  const strength = starts.map(() => 0.7 + rand() * 0.3);

  // Body envelope (the wave building and crashing) and foam envelope (the wash).
  const body = (tSec: number, offset: number) => {
    let e = 0;
    for (let w = 0; w < starts.length; w++) {
      let tau = tSec - starts[w] - offset;
      tau = ((tau % seconds) + seconds) % seconds;
      if (tau < 3.2) e += strength[w] * Math.pow(tau / 3.2, 2.2);
      else e += strength[w] * Math.exp(-(tau - 3.2) / 1.6);
    }
    return Math.min(1.2, e);
  };
  const foam = (tSec: number, offset: number) => {
    let e = 0;
    for (let w = 0; w < starts.length; w++) {
      let tau = tSec - starts[w] - 3.1 - offset;
      tau = ((tau % seconds) + seconds) % seconds;
      if (tau < 9) e += strength[w] * smoothstep(tau / 0.25) * Math.exp(-tau / 2.4);
    }
    return e;
  };

  for (let c = 0; c < 2; c++) {
    const offset = c === 0 ? 0 : 0.14; // one ear hears it a hair later: width
    const env = new Float32Array(len);
    const fenv = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      env[i] = body(i / sr, offset);
      fenv[i] = foam(i / sr, offset);
    }

    // The surf: noise through a filter that opens as the wave rises.
    const surf = noise(len, "pink", rand);
    filterLoop(surf, [new Biquad("lowpass", 400, 0.6, sr), new Biquad("lowpass", 400, 0.6, sr)], (i, chain) => {
      const cut = 180 + 2600 * Math.pow(env[i], 1.3);
      chain[0].set(cut, 0.6);
      chain[1].set(cut * 1.2, 0.6);
    });
    for (let i = 0; i < len; i++) out[c][i] += surf[i] * (0.12 + 0.95 * env[i]);

    // The fizz of foam sliding back down the sand.
    const fizz = noise(len, "white", rand);
    filterLoop(fizz, [new Biquad("highpass", 2200, 0.6, sr), new Biquad("lowpass", 9000, 0.6, sr)]);
    for (let i = 0; i < len; i++) out[c][i] += fizz[i] * 0.06 * fenv[i];

    // Deep, constant sea underneath.
    const deep = noise(len, "brown", rand);
    filterLoop(deep, [new Biquad("lowpass", 160, 0.7, sr)]);
    mixInto(out[c], deep, 0.25);
  }

  return normalize(out, -21);
}

/* ---------------- wind ---------------- */

export function wind(sr: number): Stereo {
  const rand = mulberry32(505);
  const len = Math.round(30 * sr);
  const out = stereo(len);

  const gustRaw = loopLfo(len, rand, [
    [2, 0.4],
    [5, 0.3],
    [9, 0.2],
    [17, 0.1],
  ]);
  const shift = Math.round(sr * 0.35);

  for (let c = 0; c < 2; c++) {
    const g = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const v = 0.5 + 0.5 * gustRaw[(i + (c ? shift : 0)) % len];
      g[i] = Math.pow(v, 1.6);
    }

    // The broad body of the wind, its pitch rising with each gust.
    const body = noise(len, "pink", rand);
    filterLoop(body, [new Biquad("bandpass", 400, 0.9, sr)], (i, chain) => chain[0].set(220 + 650 * g[i], 0.9));
    for (let i = 0; i < len; i++) out[c][i] += body[i] * (0.3 + 0.9 * g[i]);

    // A faint whistle that only shows up in stronger gusts.
    const whistle = noise(len, "pink", rand);
    filterLoop(whistle, [new Biquad("bandpass", 900, 7, sr)], (i, chain) => chain[0].set(700 + 900 * g[i], 7));
    for (let i = 0; i < len; i++) out[c][i] += whistle[i] * 0.9 * g[i] * g[i];

    // Leaves rustling.
    const leaves = noise(len, "white", rand);
    filterLoop(leaves, [new Biquad("highpass", 2500, 0.7, sr), new Biquad("lowpass", 7000, 0.7, sr)]);
    for (let i = 0; i < len; i++) out[c][i] += leaves[i] * 0.03 * g[i];
  }

  return normalize(out, -23);
}

/* ---------------- birds ---------------- */

type Syl = { f0: number; f1: number; dur: number; trillHz?: number; trillDepth?: number; gap?: number };

function song(sr: number, syls: Syl[]): Float32Array {
  const total = syls.reduce((s, x) => s + x.dur + (x.gap ?? 0.04), 0);
  const out = new Float32Array(Math.round(sr * total) + 8);
  let pos = 0;
  for (const s of syls) {
    const n = Math.round(sr * s.dur);
    let ph = 0;
    for (let k = 0; k < n; k++) {
      const x = k / n;
      // curved sweep sounds more natural than a straight line
      let f = s.f0 + (s.f1 - s.f0) * (x * x * (3 - 2 * x));
      if (s.trillHz) f += (s.trillDepth ?? 300) * Math.sin((TAU * s.trillHz * k) / sr);
      ph += (TAU * f) / sr;
      const env = Math.pow(Math.sin(Math.PI * x), 1.4) * Math.min(1, k / (sr * 0.004));
      out[pos + k] += (Math.sin(ph) + 0.12 * Math.sin(2 * ph)) * env;
    }
    pos += n + Math.round(sr * (s.gap ?? 0.04));
  }
  return out;
}

export function birds(sr: number): Stereo {
  const rand = mulberry32(606);
  const len = Math.round(30 * sr);
  const out = stereo(len);

  // Soft morning air.
  for (let c = 0; c < 2; c++) {
    const air = noise(len, "pink", rand);
    filterLoop(air, [new Biquad("lowpass", 1100, 0.7, sr)]);
    mixInto(out[c], air, 0.025);
  }

  const vary = (x: number, amt = 0.06) => x * (1 - amt + rand() * amt * 2);

  const voices: Array<{ make: () => Float32Array; every: [number, number]; pan: number; amp: number }> = [
    {
      // a clear whistler: long down-slur then two quick up-chirps
      make: () =>
        song(sr, [
          { f0: vary(3300), f1: vary(2600), dur: 0.28, gap: 0.09 },
          { f0: vary(2400), f1: vary(3600), dur: 0.08, gap: 0.05 },
          { f0: vary(2400), f1: vary(3700), dur: 0.08 },
        ]),
      every: [4.5, 8],
      pan: 0.3,
      amp: 0.22,
    },
    {
      // a bright trill
      make: () => song(sr, [{ f0: vary(4300), f1: vary(3900), dur: 0.65, trillHz: vary(27), trillDepth: 520 }]),
      every: [6, 10],
      pan: 0.78,
      amp: 0.11,
    },
    {
      // a busy twitterer
      make: () =>
        song(
          sr,
          Array.from({ length: 5 + Math.floor(rand() * 4) }, () => ({
            f0: vary(5200, 0.1),
            f1: vary(3600, 0.1),
            dur: vary(0.055),
            gap: vary(0.045),
          })),
        ),
      every: [3.5, 7],
      pan: 0.6,
      amp: 0.12,
    },
    {
      // a distant dove: coo, COO, coo
      make: () =>
        song(sr, [
          { f0: 620, f1: 560, dur: 0.32, gap: 0.12 },
          { f0: 680, f1: 540, dur: 0.5, gap: 0.14 },
          { f0: 600, f1: 540, dur: 0.3 },
        ]),
      every: [9, 13],
      pan: 0.15,
      amp: 0.09,
    },
  ];

  for (const v of voices) {
    let t = rand() * v.every[0] * sr;
    while (t < len) {
      addEvent(out, t, v.make(), v.pan + (rand() - 0.5) * 0.1, v.amp * (0.8 + rand() * 0.4));
      t += sr * (v.every[0] + rand() * (v.every[1] - v.every[0]));
    }
  }

  return normalize(out, -27);
}

/* ---------------- registry ---------------- */

export const RECIPES: Record<SoundId, (sr: number) => Stereo> = { rain, fire, crickets, waves, wind, birds };

/** How much of each sound to send to the shared reverb (space and distance). */
export const REVERB_SEND: Record<SoundId, number> = {
  rain: 0.15,
  fire: 0.1,
  crickets: 0.55,
  waves: 0.2,
  wind: 0.15,
  birds: 0.5,
};
