import type { SoundId } from "./sound/recipes";

export type ThemeId = "starlit" | "cafe" | "forest" | "sakura" | "seaside";

export type Theme = {
  id: ThemeId;
  name: string;
  blurb: string;
  /** CSS background for the little swatch in the picker. */
  swatch: string;
  /** The ambience this room sounds like, used by "Play this room's sounds". */
  mix: Partial<Record<SoundId, number>>;
};

export const THEMES: Theme[] = [
  {
    id: "starlit",
    name: "Starlit Night",
    blurb: "Moon, stars, and crickets",
    swatch: "radial-gradient(circle at 70% 30%, #ffe2a8 0 14%, transparent 16%), linear-gradient(160deg, #2a2a6e, #070b1f)",
    mix: { crickets: 0.55, wind: 0.25 },
  },
  {
    id: "cafe",
    name: "Rainy Café",
    blurb: "Rain on the window, warm lights inside",
    swatch: "radial-gradient(circle at 30% 70%, #ffb46b 0 10%, transparent 12%), linear-gradient(160deg, #3a4a5c, #1a1410)",
    mix: { rain: 0.65, fire: 0.25 },
  },
  {
    id: "forest",
    name: "Forest Cabin",
    blurb: "Pines, fireflies, a crackling fire",
    swatch: "radial-gradient(circle at 60% 40%, #e4ff8a 0 6%, transparent 8%), linear-gradient(170deg, #2d5450, #0b1a14)",
    mix: { fire: 0.6, crickets: 0.35, wind: 0.2 },
  },
  {
    id: "sakura",
    name: "Sakura Morning",
    blurb: "Soft petals and birdsong",
    swatch: "radial-gradient(circle at 35% 35%, #ffffff 0 10%, transparent 12%), linear-gradient(160deg, #ffd6e4, #f6b1c8 60%, #e9a0c0)",
    mix: { birds: 0.6, wind: 0.2 },
  },
  {
    id: "seaside",
    name: "Seaside Dusk",
    blurb: "Sunset over gentle waves",
    swatch: "radial-gradient(circle at 50% 62%, #ffd27a 0 14%, transparent 16%), linear-gradient(180deg, #4b2c6e, #e0707a 60%, #1f2550 62%)",
    mix: { waves: 0.6, wind: 0.2 },
  },
];

export const THEME_IDS = THEMES.map((t) => t.id);

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

const KEY = "starlit:theme";

export function savedTheme(): ThemeId {
  try {
    const v = localStorage.getItem(KEY);
    if (v && THEME_IDS.includes(v as ThemeId)) return v as ThemeId;
  } catch {
    /* storage unavailable */
  }
  return "starlit";
}

export function saveTheme(id: ThemeId) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
}
