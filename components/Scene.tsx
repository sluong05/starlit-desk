"use client";

import { useEffect, useRef } from "react";
import { SCENES, type Scene as SceneImpl } from "@/lib/scenes";
import type { ThemeId } from "@/lib/themes";

/**
 * Full-screen animated background for the current theme.
 * Switching themes cross-fades from the old scene to the new one.
 */
export default function Scene({ theme }: { theme: ThemeId }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef<{ current?: SceneImpl; previous?: SceneImpl; fade: number; theme?: ThemeId; size: [number, number, number] }>({
    fade: 1,
    size: [0, 0, 1],
  });

  // Swap scenes when the theme changes.
  useEffect(() => {
    const s = state.current;
    if (s.theme === theme) return;
    const next = SCENES[theme]();
    const [w, h, dpr] = s.size;
    if (w) next.resize(w, h, dpr);
    s.previous = s.current;
    s.current = next;
    s.fade = s.previous ? 0 : 1;
    s.theme = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const s = state.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s.size = [w, h, dpr];
      s.current?.resize(w, h, dpr);
      s.previous?.resize(w, h, dpr);
      if (reduce) paint(8, 0);
    };

    const paint = (t: number, dt: number) => {
      if (!s.current) return;
      s.current.draw(ctx, t, dt);
      if (s.previous && s.fade < 1) {
        ctx.globalAlpha = 1 - s.fade;
        s.previous.draw(ctx, t, dt);
        ctx.globalAlpha = 1;
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (s.previous) {
        s.fade = Math.min(1, s.fade + dt / 1.2);
        if (s.fade >= 1) s.previous = undefined;
      }
      paint(now / 1000, reduce ? 0 : dt);
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    if (reduce) {
      // Still respect theme switches, just without motion.
      const id = setInterval(() => {
        s.previous = undefined;
        paint(8, 0);
      }, 500);
      return () => {
        clearInterval(id);
        window.removeEventListener("resize", resize);
      };
    }
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}
