/**
 * Tiny Web Audio helpers. Every sound is generated in the browser, so the app
 * ships with no audio files and nothing to license.
 */

let ctx: AudioContext | null = null;

export function audioContext(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** A soft two-note bell for when a timer block ends. */
export function chime() {
  try {
    const ac = audioContext();
    const t = ac.currentTime;
    [880, 1318.5].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.18, t + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 1.6);
      osc.connect(gain).connect(ac.destination);
      osc.start(t + i * 0.18);
      osc.stop(t + i * 0.18 + 1.7);
    });
  } catch {
    /* audio blocked; the visual change is enough */
  }
}

function noiseBuffer(ac: AudioContext, kind: "pink" | "brown"): AudioBuffer {
  const len = ac.sampleRate * 4;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  if (kind === "brown") {
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  } else {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }
  return buf;
}

export type Ambience = { gain: GainNode; stop: () => void };

/** Steady rain: pink noise through a gentle band-pass. */
export function startRain(): Ambience {
  const ac = audioContext();
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac, "pink");
  src.loop = true;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2400;
  const gain = ac.createGain();
  gain.gain.value = 0;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
  return { gain, stop: () => src.stop() };
}

/** Fireplace: low brown-noise rumble plus random crackles. */
export function startFire(): Ambience {
  const ac = audioContext();
  const gain = ac.createGain();
  gain.gain.value = 0;
  gain.connect(ac.destination);

  const rumble = ac.createBufferSource();
  rumble.buffer = noiseBuffer(ac, "brown");
  rumble.loop = true;
  const low = ac.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 500;
  rumble.connect(low).connect(gain);
  rumble.start();

  let alive = true;
  const crackle = () => {
    if (!alive) return;
    const t = ac.currentTime;
    const len = Math.floor(ac.sampleRate * 0.03);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const s = ac.createBufferSource();
    s.buffer = buf;
    const hp = ac.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1500 + Math.random() * 2500;
    const g = ac.createGain();
    g.gain.value = 0.3 + Math.random() * 0.7;
    s.connect(hp).connect(g).connect(gain);
    s.start(t);
    setTimeout(crackle, 60 + Math.random() * 420);
  };
  crackle();

  return {
    gain,
    stop: () => {
      alive = false;
      rumble.stop();
    },
  };
}

/** Summer night: soft crickets chirping in little trills. */
export function startCrickets(): Ambience {
  const ac = audioContext();
  const gain = ac.createGain();
  gain.gain.value = 0;
  gain.connect(ac.destination);

  let alive = true;
  const trill = (pitch: number) => {
    if (!alive) return;
    const t = ac.currentTime;
    const pulses = 3 + Math.floor(Math.random() * 3);
    for (let p = 0; p < pulses; p++) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = pitch;
      const start = t + p * 0.055;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.12, start + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.04);
      osc.connect(g).connect(gain);
      osc.start(start);
      osc.stop(start + 0.05);
    }
    setTimeout(() => trill(pitch), 700 + Math.random() * 900);
  };
  trill(4400);
  setTimeout(() => trill(4900), 400);

  return { gain, stop: () => (alive = false) };
}
