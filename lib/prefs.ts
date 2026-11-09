"use client";

import { useSyncExternalStore } from "react";

/** Call settings remembered on this device. */
export type Prefs = {
  micOn: boolean;
  camOn: boolean;
  micId: string;
  camId: string;
  speakerId: string;
  /** Show my own video flipped, like a mirror (others always see it unflipped). */
  mirror: boolean;
  noiseSuppression: boolean;
  /** Send smaller video to use less data. */
  saveData: boolean;
  /** Soft sounds when someone joins or leaves. */
  chimes: boolean;
};

const DEFAULTS: Prefs = { micOn: true, camOn: true, micId: "", camId: "", speakerId: "", mirror: true, noiseSuppression: true, saveData: false, chimes: true };
const KEY = "starlit:call-prefs";

let current: Prefs = DEFAULTS;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) current = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable: defaults are fine */
  }
}

export function getPrefs(): Prefs {
  load();
  return current;
}

export function setPrefs(patch: Partial<Prefs>) {
  load();
  current = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* ignore */
  }
  subs.forEach((f) => f());
}

const subscribe = (f: () => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, getPrefs, () => DEFAULTS);
}

/** Capture settings LiveKit should use for the mic and camera. */
export function captureOptions(p: Prefs) {
  return {
    audio: { deviceId: p.micId || undefined, noiseSuppression: p.noiseSuppression, echoCancellation: true, autoGainControl: true },
    video: { deviceId: p.camId || undefined, resolution: p.saveData ? { width: 640, height: 360, frameRate: 15 } : { width: 1280, height: 720, frameRate: 30 } },
  };
}
