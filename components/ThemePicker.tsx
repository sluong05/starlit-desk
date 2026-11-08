"use client";

import { THEMES, type ThemeId } from "@/lib/themes";

/** Row of little scene swatches. */
export default function ThemePicker({
  value,
  onChange,
  label = "Room theme",
}: {
  value: ThemeId;
  onChange: (id: ThemeId) => void;
  label?: string;
}) {
  return (
    <div className="theme-picker" role="radiogroup" aria-label={label}>
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={value === t.id}
          className="swatch"
          style={{ background: t.swatch }}
          title={`${t.name} — ${t.blurb}`}
          aria-label={t.name}
          onClick={() => onChange(t.id)}
        />
      ))}
    </div>
  );
}
