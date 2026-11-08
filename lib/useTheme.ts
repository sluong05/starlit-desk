"use client";

import { useEffect, useState } from "react";
import { saveTheme, savedTheme, type ThemeId } from "./themes";

/** Puts the theme's palette on the page and remembers it for next time. */
export function useApplyTheme(theme: ThemeId) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);
}

/** A theme that only this browser cares about (landing page, waiting screens). */
export function useLocalTheme(): [ThemeId, (t: ThemeId) => void] {
  const [theme, setTheme] = useState<ThemeId>("starlit");
  useEffect(() => setTheme(savedTheme()), []);
  useApplyTheme(theme);
  return [theme, setTheme];
}
