"use client";

import { useEffect, useRef } from "react";

/**
 * Full-screen animated night sky: twinkling stars, a soft moon,
 * and the occasional shooting star. Pure canvas, no assets.
 */
export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let raf = 0;

    type Star = { x: number; y: number; r: number; phase: number; speed: number; warm: boolean };
    type Shooter = { x: number; y: number; vx: number; vy: number; life: number };
    let stars: Star[] = [];
    let shooter: Shooter | null = null;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round((width * height) / 5500);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.3 + 0.25,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.002 + 0.0006,
        warm: Math.random() < 0.18,
      }));
    };

    const drawMoon = () => {
      const mx = width * 0.86;
      const my = height * 0.14;
      const mr = Math.max(28, Math.min(width, height) * 0.045);
      const glow = ctx.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 4);
      glow.addColorStop(0, "rgba(255, 220, 160, 0.22)");
      glow.addColorStop(1, "rgba(255, 220, 160, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(mx, my, mr * 4, 0, Math.PI * 2);
      ctx.fill();

      const body = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
      body.addColorStop(0, "#fff8e4");
      body.addColorStop(0.7, "#ffe2a8");
      body.addColorStop(1, "#f1c477");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();

      // a couple of soft craters
      ctx.fillStyle = "rgba(214, 160, 90, 0.25)";
      ctx.beginPath();
      ctx.arc(mx + mr * 0.25, my + mr * 0.15, mr * 0.18, 0, Math.PI * 2);
      ctx.arc(mx - mr * 0.3, my + mr * 0.35, mr * 0.11, 0, Math.PI * 2);
      ctx.fill();
    };

    const frame = (t: number) => {
      ctx.clearRect(0, 0, width, height);

      for (const s of stars) {
        const tw = reduceMotion ? 0.8 : 0.55 + 0.45 * Math.sin(s.phase + t * s.speed);
        ctx.globalAlpha = tw;
        ctx.fillStyle = s.warm ? "#ffe6b8" : "#e9e6ff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      drawMoon();

      if (!reduceMotion) {
        if (!shooter && Math.random() < 0.0025) {
          shooter = {
            x: Math.random() * width * 0.7,
            y: Math.random() * height * 0.3,
            vx: 7 + Math.random() * 4,
            vy: 2.5 + Math.random() * 2,
            life: 1,
          };
        }
        if (shooter) {
          const tail = 14;
          const grad = ctx.createLinearGradient(
            shooter.x,
            shooter.y,
            shooter.x - shooter.vx * tail,
            shooter.y - shooter.vy * tail,
          );
          grad.addColorStop(0, `rgba(255, 240, 210, ${shooter.life})`);
          grad.addColorStop(1, "rgba(255, 240, 210, 0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(shooter.x, shooter.y);
          ctx.lineTo(shooter.x - shooter.vx * tail, shooter.y - shooter.vy * tail);
          ctx.stroke();
          shooter.x += shooter.vx;
          shooter.y += shooter.vy;
          shooter.life -= 0.012;
          if (shooter.life <= 0 || shooter.x > width + 200) shooter = null;
        }
      }

      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
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
