/**
 * Animated backgrounds for each theme, drawn on a single full-screen canvas.
 * Every scene paints its static parts (sky, hills, trees…) once into an
 * offscreen layer on resize, then only animates the small moving things.
 */

import { mulberry32, type Rand } from "./sound/dsp";
import type { ThemeId } from "./themes";

export interface Scene {
  resize(w: number, h: number, dpr: number): void;
  draw(ctx: CanvasRenderingContext2D, t: number, dt: number): void;
}

const TAU = Math.PI * 2;

function layer(w: number, h: number, dpr: number, paint: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement("canvas");
  cv.width = Math.max(1, Math.round(w * dpr));
  cv.height = Math.max(1, Math.round(h * dpr));
  const c = cv.getContext("2d")!;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  paint(c);
  return cv;
}

function vgrad(c: CanvasRenderingContext2D, y0: number, y1: number, stops: Array<[number, string]>) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  for (const [o, col] of stops) g.addColorStop(o, col);
  return g;
}

function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color.replace("ALPHA", String(alpha)));
  g.addColorStop(1, color.replace("ALPHA", "0"));
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
}

/* =========================================================
   Starlit Night
   ========================================================= */

function starlit(): Scene {
  const rand = mulberry32(11);
  let w = 0,
    h = 0;
  let bg: HTMLCanvasElement;
  let stars: Array<{ x: number; y: number; r: number; ph: number; sp: number; warm: boolean }> = [];
  let shooter: { x: number; y: number; vx: number; vy: number; life: number } | null = null;

  return {
    resize(W, H, dpr) {
      w = W;
      h = H;
      bg = layer(w, h, dpr, (c) => {
        c.fillStyle = vgrad(c, 0, h, [
          [0, "#151b48"],
          [0.55, "#0c1233"],
          [1, "#070b1f"],
        ]);
        c.fillRect(0, 0, w, h);
        glow(c, w * 0.8, -h * 0.1, Math.max(w, h) * 0.7, "rgba(60,56,140,ALPHA)", 0.45);
        glow(c, 0, h * 1.1, Math.max(w, h) * 0.6, "rgba(29,58,92,ALPHA)", 0.5);
        // moon
        const mx = w * 0.86,
          my = h * 0.15,
          mr = Math.max(26, Math.min(w, h) * 0.045);
        glow(c, mx, my, mr * 4.5, "rgba(255,220,160,ALPHA)", 0.22);
        const body = c.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
        body.addColorStop(0, "#fff8e4");
        body.addColorStop(0.7, "#ffe2a8");
        body.addColorStop(1, "#f1c477");
        c.fillStyle = body;
        c.beginPath();
        c.arc(mx, my, mr, 0, TAU);
        c.fill();
        c.fillStyle = "rgba(214,160,90,0.25)";
        c.beginPath();
        c.arc(mx + mr * 0.25, my + mr * 0.15, mr * 0.18, 0, TAU);
        c.arc(mx - mr * 0.3, my + mr * 0.35, mr * 0.11, 0, TAU);
        c.fill();
      });
      const count = Math.round((w * h) / 5200);
      stars = Array.from({ length: count }, () => ({
        x: rand() * w,
        y: rand() * h,
        r: rand() * 1.3 + 0.25,
        ph: rand() * TAU,
        sp: rand() * 2 + 0.6,
        warm: rand() < 0.18,
      }));
    },
    draw(c, t) {
      c.drawImage(bg, 0, 0, w, h);
      for (const s of stars) {
        c.globalAlpha = 0.55 + 0.45 * Math.sin(s.ph + t * s.sp);
        c.fillStyle = s.warm ? "#ffe6b8" : "#e9e6ff";
        c.beginPath();
        c.arc(s.x, s.y, s.r, 0, TAU);
        c.fill();
      }
      c.globalAlpha = 1;
      if (!shooter && Math.random() < 0.0025) {
        shooter = { x: Math.random() * w * 0.7, y: Math.random() * h * 0.3, vx: 7 + Math.random() * 4, vy: 2.5 + Math.random() * 2, life: 1 };
      }
      if (shooter) {
        const tail = 14;
        const g = c.createLinearGradient(shooter.x, shooter.y, shooter.x - shooter.vx * tail, shooter.y - shooter.vy * tail);
        g.addColorStop(0, `rgba(255,240,210,${shooter.life})`);
        g.addColorStop(1, "rgba(255,240,210,0)");
        c.strokeStyle = g;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(shooter.x, shooter.y);
        c.lineTo(shooter.x - shooter.vx * tail, shooter.y - shooter.vy * tail);
        c.stroke();
        shooter.x += shooter.vx;
        shooter.y += shooter.vy;
        shooter.life -= 0.012;
        if (shooter.life <= 0) shooter = null;
      }
    },
  };
}

/* =========================================================
   Rainy Café — looking out a café window at a rainy city
   ========================================================= */

function cafe(): Scene {
  const rand = mulberry32(22);
  let w = 0,
    h = 0;
  let bg: HTMLCanvasElement, fg: HTMLCanvasElement;
  let streaks: Array<{ x: number; y: number; len: number; sp: number; a: number }> = [];
  let beads: Array<{ x: number; y: number; r: number }> = [];
  let runners: Array<{ x: number; y: number; r: number; sp: number; trail: number }> = [];
  let bokeh: Array<{ x: number; y: number; r: number; col: string; a: number; ph: number }> = [];
  let mug = { x: 0, y: 0 };

  const resetRunner = (r: { x: number; y: number; r: number; sp: number; trail: number }, top = false) => {
    r.x = rand() * w;
    r.y = top ? -10 : rand() * h * 0.8;
    r.r = 2.5 + rand() * 2.5;
    r.sp = 12 + rand() * 40;
    r.trail = 0;
  };

  return {
    resize(W, H, dpr) {
      w = W;
      h = H;
      const cols = ["255,180,107", "255,140,90", "120,200,210", "255,214,140", "240,120,150"];
      bokeh = Array.from({ length: 28 }, () => ({
        x: rand() * w,
        y: h * (0.35 + rand() * 0.5),
        r: 18 + rand() * 55,
        col: cols[Math.floor(rand() * cols.length)],
        a: 0.08 + rand() * 0.16,
        ph: rand() * TAU,
      }));
      bg = layer(w, h, dpr, (c) => {
        c.fillStyle = vgrad(c, 0, h, [
          [0, "#18222f"],
          [0.6, "#263241"],
          [1, "#2d2a30"],
        ]);
        c.fillRect(0, 0, w, h);
        // faint distant buildings
        c.fillStyle = "rgba(10,16,24,0.45)";
        let x = 0;
        while (x < w) {
          const bw = 40 + rand() * 90;
          const bh = h * (0.25 + rand() * 0.3);
          c.fillRect(x, h * 0.75 - bh, bw - 6, bh + h * 0.3);
          x += bw;
        }
      });
      beads = Array.from({ length: Math.round((w * h) / 9000) }, () => ({ x: rand() * w, y: rand() * h, r: 0.8 + rand() * 2.6 }));
      runners = Array.from({ length: 10 }, () => {
        const r = { x: 0, y: 0, r: 0, sp: 0, trail: 0 };
        resetRunner(r);
        return r;
      });
      streaks = Array.from({ length: Math.round(w / 9) }, () => ({
        x: rand() * w,
        y: rand() * h,
        len: 14 + rand() * 26,
        sp: 700 + rand() * 500,
        a: 0.06 + rand() * 0.14,
      }));
      mug = { x: Math.max(70, w * 0.07), y: h * 0.935 };
      fg = layer(w, h, dpr, (c) => {
        // warm interior light spilling up from below
        c.fillStyle = vgrad(c, h * 0.55, h, [
          [0, "rgba(255,170,90,0)"],
          [1, "rgba(255,170,90,0.28)"],
        ]);
        c.fillRect(0, 0, w, h);
        // window frame + mullions
        const wood = "#1d140e";
        const fw = Math.max(14, w * 0.014);
        c.fillStyle = wood;
        c.fillRect(0, 0, w, fw);
        c.fillRect(0, 0, fw, h);
        c.fillRect(w - fw, 0, fw, h);
        c.fillRect(w / 2 - fw / 2, 0, fw, h * 0.9);
        c.fillRect(0, h * 0.42, w, fw * 0.8);
        // sill
        c.fillStyle = vgrad(c, h * 0.9, h, [
          [0, "#3a271a"],
          [1, "#22160e"],
        ]);
        c.fillRect(0, h * 0.9, w, h * 0.1);
        c.fillStyle = "rgba(255,190,120,0.18)";
        c.fillRect(0, h * 0.9, w, 2);
        // mug on the sill
        const mx = mug.x,
          my = mug.y,
          mw = 34,
          mh = 30;
        c.fillStyle = "#f3e2cf";
        c.beginPath();
        c.roundRect(mx - mw / 2, my - mh, mw, mh, [3, 3, 8, 8]);
        c.fill();
        c.strokeStyle = "#f3e2cf";
        c.lineWidth = 5;
        c.beginPath();
        c.arc(mx + mw / 2 + 2, my - mh / 2, 8, -Math.PI / 2, Math.PI / 2);
        c.stroke();
        c.fillStyle = "#c98a5c";
        c.beginPath();
        c.arc(mx, my - mh * 0.55, 6, 0, TAU);
        c.fill();
        // little plant on the other side
        const px = w - Math.max(80, w * 0.08);
        c.fillStyle = "#b8643f";
        c.beginPath();
        c.moveTo(px - 18, my - 26);
        c.lineTo(px + 18, my - 26);
        c.lineTo(px + 13, my);
        c.lineTo(px - 13, my);
        c.fill();
        c.fillStyle = "#5f8a5a";
        for (let i = 0; i < 7; i++) {
          const a = -Math.PI / 2 + (i - 3) * 0.32;
          c.beginPath();
          c.ellipse(px + Math.cos(a) * 18, my - 30 + Math.sin(a) * 18, 6, 14, a + Math.PI / 2, 0, TAU);
          c.fill();
        }
      });
    },
    draw(c, t, dt) {
      c.drawImage(bg, 0, 0, w, h);
      // blurry city lights
      for (const b of bokeh) {
        glow(c, b.x, b.y, b.r, `rgba(${b.col},ALPHA)`, b.a * (0.8 + 0.2 * Math.sin(t * 0.6 + b.ph)));
      }
      // falling rain outside
      c.lineWidth = 1;
      for (const s of streaks) {
        s.y += s.sp * dt;
        s.x += s.sp * dt * 0.12;
        if (s.y > h) {
          s.y = -s.len;
          s.x = rand() * w;
        }
        c.strokeStyle = `rgba(200,220,255,${s.a})`;
        c.beginPath();
        c.moveTo(s.x, s.y);
        c.lineTo(s.x - s.len * 0.12, s.y - s.len);
        c.stroke();
      }
      // beads of water on the glass
      for (const b of beads) {
        c.fillStyle = "rgba(220,235,255,0.16)";
        c.beginPath();
        c.arc(b.x, b.y, b.r, 0, TAU);
        c.fill();
        c.fillStyle = "rgba(255,255,255,0.28)";
        c.beginPath();
        c.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.35, 0, TAU);
        c.fill();
      }
      // a few drops sliding down, leaving a trail
      for (const r of runners) {
        r.y += r.sp * dt * (0.6 + 0.4 * Math.sin(t * 3 + r.x));
        r.trail = Math.min(r.trail + r.sp * dt, 120);
        const g = c.createLinearGradient(r.x, r.y - r.trail, r.x, r.y);
        g.addColorStop(0, "rgba(220,235,255,0)");
        g.addColorStop(1, "rgba(220,235,255,0.18)");
        c.strokeStyle = g;
        c.lineWidth = r.r * 0.8;
        c.beginPath();
        c.moveTo(r.x, r.y - r.trail);
        c.lineTo(r.x, r.y);
        c.stroke();
        c.fillStyle = "rgba(230,240,255,0.35)";
        c.beginPath();
        c.arc(r.x, r.y, r.r, 0, TAU);
        c.fill();
        if (r.y > h + 10) resetRunner(r, true);
      }
      c.drawImage(fg, 0, 0, w, h);
      // steam from the mug
      for (let i = 0; i < 3; i++) {
        const p = (t * 0.25 + i / 3) % 1;
        const x = mug.x + Math.sin(t * 1.3 + i * 2) * 6 * p;
        const y = mug.y - 34 - p * 50;
        c.fillStyle = `rgba(255,245,235,${0.22 * (1 - p)})`;
        c.beginPath();
        c.arc(x, y, 5 + p * 9, 0, TAU);
        c.fill();
      }
    },
  };
}

/* =========================================================
   Forest Cabin — pines at dusk, fireflies, a lit cabin
   ========================================================= */

function forest(): Scene {
  const rand = mulberry32(33);
  let w = 0,
    h = 0;
  let bg: HTMLCanvasElement, fg: HTMLCanvasElement;
  let flies: Array<{ x: number; y: number; ph: number; sp: number; rx: number; ry: number; blink: number }> = [];
  let chimney = { x: 0, y: 0 };

  const pine = (c: CanvasRenderingContext2D, x: number, base: number, height: number, col: string) => {
    const width = height * 0.36;
    c.fillStyle = col;
    c.fillRect(x - width * 0.04, base - height * 0.12, width * 0.08, height * 0.14);
    for (let tier = 0; tier < 4; tier++) {
      const top = base - height + (tier * height) / 4.6;
      const tw = width * (0.45 + tier * 0.2);
      c.beginPath();
      c.moveTo(x, top);
      c.lineTo(x - tw / 2, top + height * 0.36);
      c.lineTo(x + tw / 2, top + height * 0.36);
      c.closePath();
      c.fill();
    }
  };

  const row = (c: CanvasRenderingContext2D, base: number, minH: number, maxH: number, col: string, gap: number) => {
    let x = -20;
    while (x < w + 40) {
      pine(c, x, base + rand() * 10, minH + rand() * (maxH - minH), col);
      x += gap * (0.6 + rand() * 0.8);
    }
  };

  return {
    resize(W, H, dpr) {
      w = W;
      h = H;
      bg = layer(w, h, dpr, (c) => {
        c.fillStyle = vgrad(c, 0, h, [
          [0, "#0f2133"],
          [0.45, "#1d4147"],
          [0.75, "#3d6b5e"],
          [1, "#0a1712"],
        ]);
        c.fillRect(0, 0, w, h);
        glow(c, w * 0.22, h * 0.2, Math.min(w, h) * 0.35, "rgba(230,245,220,ALPHA)", 0.18);
        c.fillStyle = "#e8f4e6";
        c.beginPath();
        c.arc(w * 0.22, h * 0.2, Math.max(16, Math.min(w, h) * 0.028), 0, TAU);
        c.fill();
        for (let i = 0; i < 70; i++) {
          c.globalAlpha = 0.2 + rand() * 0.5;
          c.fillStyle = "#fff";
          c.beginPath();
          c.arc(rand() * w, rand() * h * 0.4, rand() * 1.1 + 0.2, 0, TAU);
          c.fill();
        }
        c.globalAlpha = 1;
        // far ridge
        c.fillStyle = "#1b3a38";
        c.beginPath();
        c.moveTo(0, h);
        for (let x = 0; x <= w; x += 8) {
          c.lineTo(x, h * 0.58 - Math.sin(x * 0.004 + 1) * h * 0.05 - Math.sin(x * 0.011) * h * 0.02);
        }
        c.lineTo(w, h);
        c.fill();
        row(c, h * 0.72, h * 0.1, h * 0.18, "#16302d", 26);
        // mist between layers
        c.fillStyle = vgrad(c, h * 0.6, h * 0.8, [
          [0, "rgba(180,220,200,0)"],
          [0.5, "rgba(180,220,200,0.12)"],
          [1, "rgba(180,220,200,0)"],
        ]);
        c.fillRect(0, h * 0.6, w, h * 0.2);
        row(c, h * 0.84, h * 0.16, h * 0.26, "#0f2420", 40);
      });
      fg = layer(w, h, dpr, (c) => {
        // the cabin
        const cx = w * 0.78,
          base = h * 0.93,
          cw = Math.max(90, w * 0.09),
          ch = cw * 0.55;
        c.fillStyle = "#1a1410";
        c.fillRect(cx - cw / 2, base - ch, cw, ch);
        c.beginPath();
        c.moveTo(cx - cw * 0.62, base - ch);
        c.lineTo(cx, base - ch - cw * 0.42);
        c.lineTo(cx + cw * 0.62, base - ch);
        c.fill();
        c.fillRect(cx + cw * 0.18, base - ch - cw * 0.4, cw * 0.1, cw * 0.25);
        chimney = { x: cx + cw * 0.23, y: base - ch - cw * 0.42 };
        glow(c, cx - cw * 0.18, base - ch * 0.55, cw * 0.7, "rgba(255,190,100,ALPHA)", 0.35);
        c.fillStyle = "#ffcf7a";
        c.fillRect(cx - cw * 0.3, base - ch * 0.75, cw * 0.24, ch * 0.36);
        c.fillStyle = "#1a1410";
        c.fillRect(cx - cw * 0.19, base - ch * 0.75, 2, ch * 0.36);
        c.fillRect(cx - cw * 0.3, base - ch * 0.58, cw * 0.24, 2);
        // near trees framing the edges
        c.fillStyle = "#06100c";
        c.fillRect(0, h * 0.93, w, h * 0.07);
        pine(c, w * 0.03, h * 1.02, h * 0.62, "#07120e");
        pine(c, w * 0.12, h * 1.02, h * 0.42, "#07120e");
        pine(c, w * 0.96, h * 1.02, h * 0.55, "#07120e");
        pine(c, w * 0.62, h * 1.02, h * 0.3, "#07120e");
      });
      flies = Array.from({ length: Math.round(Math.min(70, w / 22)) }, () => ({
        x: rand() * w,
        y: h * (0.45 + rand() * 0.5),
        ph: rand() * TAU,
        sp: 0.2 + rand() * 0.5,
        rx: 20 + rand() * 60,
        ry: 10 + rand() * 30,
        blink: 0.5 + rand() * 1.2,
      }));
    },
    draw(c, t) {
      c.drawImage(bg, 0, 0, w, h);
      c.drawImage(fg, 0, 0, w, h);
      // chimney smoke
      for (let i = 0; i < 6; i++) {
        const p = (t * 0.08 + i / 6) % 1;
        const x = chimney.x + Math.sin(t * 0.5 + i) * 10 * p + p * 30;
        const y = chimney.y - p * h * 0.25;
        c.fillStyle = `rgba(200,215,210,${0.12 * (1 - p)})`;
        c.beginPath();
        c.arc(x, y, 6 + p * 22, 0, TAU);
        c.fill();
      }
      // fireflies drifting and blinking
      for (const f of flies) {
        const x = f.x + Math.sin(t * f.sp + f.ph) * f.rx;
        const y = f.y + Math.cos(t * f.sp * 1.3 + f.ph) * f.ry;
        const b = Math.pow(Math.max(0, Math.sin(t * f.blink + f.ph * 3)), 3);
        if (b < 0.02) continue;
        glow(c, x, y, 16, "rgba(220,255,120,ALPHA)", 0.35 * b);
        c.fillStyle = `rgba(245,255,190,${0.9 * b})`;
        c.beginPath();
        c.arc(x, y, 1.6, 0, TAU);
        c.fill();
      }
    },
  };
}

/* =========================================================
   Sakura Morning — pastel sky, a blossom branch, falling petals
   ========================================================= */

function sakura(): Scene {
  const rand = mulberry32(44);
  let w = 0,
    h = 0;
  let bg: HTMLCanvasElement, branch: HTMLCanvasElement;
  let clouds: Array<{ x: number; y: number; s: number; sp: number; puffs: Array<[number, number, number]> }> = [];
  let petals: Array<{ x: number; y: number; vx: number; vy: number; rot: number; spin: number; flip: number; size: number; col: string }> = [];

  const flower = (c: CanvasRenderingContext2D, x: number, y: number, r: number, col: string) => {
    c.fillStyle = col;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + r;
      c.beginPath();
      c.ellipse(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, r * 0.75, r * 0.55, a, 0, TAU);
      c.fill();
    }
    c.fillStyle = "#e66f93";
    c.beginPath();
    c.arc(x, y, r * 0.35, 0, TAU);
    c.fill();
  };

  const newPetal = (anywhere: boolean) => ({
    x: anywhere ? rand() * w : -20 - rand() * w * 0.3,
    y: anywhere ? rand() * h : rand() * h * 0.6 - h * 0.2,
    vx: 25 + rand() * 35,
    vy: 18 + rand() * 30,
    rot: rand() * TAU,
    spin: (rand() - 0.5) * 2,
    flip: rand() * TAU,
    size: 5 + rand() * 5,
    col: ["#ffc2d4", "#ffd9e6", "#f7a9c3", "#fff0f5"][Math.floor(rand() * 4)],
  });

  return {
    resize(W, H, dpr) {
      w = W;
      h = H;
      bg = layer(w, h, dpr, (c) => {
        c.fillStyle = vgrad(c, 0, h, [
          [0, "#f7d6ea"],
          [0.45, "#ffe1ea"],
          [0.8, "#fff1e6"],
          [1, "#ffe9dc"],
        ]);
        c.fillRect(0, 0, w, h);
        glow(c, w * 0.82, h * 0.18, Math.min(w, h) * 0.5, "rgba(255,255,255,ALPHA)", 0.85);
        // soft hills
        const hill = (y: number, amp: number, freq: number, col: string) => {
          c.fillStyle = col;
          c.beginPath();
          c.moveTo(0, h);
          for (let x = 0; x <= w; x += 10) c.lineTo(x, y - Math.sin(x * freq + y) * amp - Math.sin(x * freq * 2.7) * amp * 0.3);
          c.lineTo(w, h);
          c.fill();
        };
        hill(h * 0.8, h * 0.04, 0.004, "#f4c6d8");
        hill(h * 0.88, h * 0.035, 0.006, "#eeb3cb");
        hill(h * 0.96, h * 0.02, 0.009, "#e7a3bf");
      });
      branch = layer(w, h, dpr, (c) => {
        const s = Math.min(w, h) / 800;
        c.strokeStyle = "#5b3a3f";
        c.lineCap = "round";
        const limb = (x0: number, y0: number, x1: number, y1: number, cx: number, cy: number, width: number) => {
          c.lineWidth = width * s;
          c.beginPath();
          c.moveTo(x0, y0);
          c.quadraticCurveTo(cx, cy, x1, y1);
          c.stroke();
        };
        limb(-20, h * 0.05, w * 0.36, h * 0.16, w * 0.15, h * 0.18, 16);
        limb(w * 0.16, h * 0.14, w * 0.27, h * 0.3, w * 0.24, h * 0.17, 8);
        limb(w * 0.28, h * 0.15, w * 0.44, h * 0.07, w * 0.37, h * 0.13, 6);
        limb(w * 0.06, h * 0.1, w * 0.12, -10, w * 0.1, h * 0.04, 7);
        // blossoms clustered along the branch
        const pts: Array<[number, number]> = [];
        for (let i = 0; i < 70; i++) {
          const u = rand();
          const along: [number, number][] = [
            [-20 + u * (w * 0.36 + 20), h * 0.05 + u * h * 0.11 + Math.sin(u * Math.PI) * h * 0.05],
            [w * 0.16 + u * w * 0.11, h * 0.14 + u * h * 0.16],
            [w * 0.28 + u * w * 0.16, h * 0.15 - u * h * 0.08],
          ];
          const [px, py] = along[Math.floor(rand() * 3)];
          pts.push([px + (rand() - 0.5) * 40 * s, py + (rand() - 0.5) * 30 * s]);
        }
        for (const [px, py] of pts) {
          flower(c, px, py, (6 + rand() * 6) * s, rand() < 0.5 ? "#ffd3e0" : "#ffb8cd");
        }
      });
      clouds = Array.from({ length: 6 }, () => ({
        x: rand() * w,
        y: h * (0.08 + rand() * 0.4),
        s: 0.6 + rand() * 0.9,
        sp: 4 + rand() * 8,
        puffs: Array.from({ length: 6 }, (_, i) => [i * 22 - 55 + rand() * 10, (rand() - 0.5) * 14, 18 + rand() * 18] as [number, number, number]),
      }));
      petals = Array.from({ length: Math.round(Math.min(90, w / 14)) }, () => newPetal(true));
    },
    draw(c, t, dt) {
      c.drawImage(bg, 0, 0, w, h);
      for (const cl of clouds) {
        cl.x += cl.sp * dt;
        if (cl.x - 120 * cl.s > w) cl.x = -120 * cl.s;
        c.fillStyle = "rgba(255,255,255,0.75)";
        for (const [dx, dy, r] of cl.puffs) {
          c.beginPath();
          c.arc(cl.x + dx * cl.s, cl.y + dy * cl.s, r * cl.s, 0, TAU);
          c.fill();
        }
      }
      c.drawImage(branch, 0, 0, w, h);
      for (const p of petals) {
        p.x += (p.vx + Math.sin(t * 0.8 + p.flip) * 20) * dt;
        p.y += p.vy * dt;
        p.rot += p.spin * dt;
        p.flip += dt * 2.2;
        if (p.x > w + 30 || p.y > h + 30) Object.assign(p, newPetal(false));
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.scale(Math.cos(p.flip), 1);
        c.fillStyle = p.col;
        c.beginPath();
        c.ellipse(0, 0, p.size, p.size * 0.62, 0, 0, TAU);
        c.fill();
        c.restore();
      }
    },
  };
}

/* =========================================================
   Seaside Dusk — sunset over the water, waves washing in
   ========================================================= */

function seaside(): Scene {
  const rand = mulberry32(55);
  let w = 0,
    h = 0,
    hz = 0,
    sunX = 0;
  let bg: HTMLCanvasElement;
  let glints: Array<{ y: number; wd: number; ph: number; off: number }> = [];
  let stars: Array<{ x: number; y: number; ph: number }> = [];
  let streaks: Array<{ x: number; y: number; len: number; sp: number }> = [];

  return {
    resize(W, H, dpr) {
      w = W;
      h = H;
      hz = h * 0.6;
      sunX = w * 0.74;
      bg = layer(w, h, dpr, (c) => {
        c.fillStyle = vgrad(c, 0, hz, [
          [0, "#241a46"],
          [0.35, "#4c2f6e"],
          [0.65, "#a24a78"],
          [0.85, "#e8766e"],
          [1, "#ffbe85"],
        ]);
        c.fillRect(0, 0, w, hz);
        // sun sitting on the horizon
        const sr = Math.max(40, Math.min(w, h) * 0.085);
        glow(c, sunX, hz, sr * 5, "rgba(255,170,110,ALPHA)", 0.45);
        c.save();
        c.beginPath();
        c.rect(0, 0, w, hz);
        c.clip();
        const sun = c.createLinearGradient(0, hz - sr, 0, hz);
        sun.addColorStop(0, "#ffe7a3");
        sun.addColorStop(1, "#ff9a62");
        c.fillStyle = sun;
        c.beginPath();
        c.arc(sunX, hz, sr, 0, TAU);
        c.fill();
        c.restore();
        // sea
        c.fillStyle = vgrad(c, hz, h, [
          [0, "#5a3f78"],
          [0.3, "#2f2d5e"],
          [1, "#141836"],
        ]);
        c.fillRect(0, hz, w, h - hz);
        c.fillStyle = "rgba(255,200,150,0.35)";
        c.fillRect(0, hz, w, 1.5);
      });
      glints = Array.from({ length: 70 }, () => {
        const y = hz + 4 + Math.pow(rand(), 1.6) * (h * 0.88 - hz);
        const depth = (y - hz) / (h - hz);
        return { y, wd: 8 + depth * 90 * rand(), ph: rand() * TAU, off: (rand() - 0.5) * (40 + depth * 260) };
      });
      stars = Array.from({ length: 50 }, () => ({ x: rand() * w, y: rand() * hz * 0.4, ph: rand() * TAU }));
      streaks = Array.from({ length: 6 }, () => ({ x: rand() * w, y: hz * (0.25 + rand() * 0.5), len: 120 + rand() * 260, sp: 3 + rand() * 6 }));
    },
    draw(c, t, dt) {
      c.drawImage(bg, 0, 0, w, h);
      for (const s of stars) {
        c.fillStyle = `rgba(255,240,230,${0.25 + 0.25 * Math.sin(t * 1.5 + s.ph)})`;
        c.fillRect(s.x, s.y, 1.4, 1.4);
      }
      // thin glowing clouds drifting across the sunset
      for (const s of streaks) {
        s.x += s.sp * dt;
        if (s.x - s.len > w) s.x = -s.len;
        const g = c.createLinearGradient(s.x - s.len, 0, s.x + s.len, 0);
        g.addColorStop(0, "rgba(255,170,160,0)");
        g.addColorStop(0.5, "rgba(255,190,170,0.28)");
        g.addColorStop(1, "rgba(255,170,160,0)");
        c.fillStyle = g;
        c.beginPath();
        c.ellipse(s.x, s.y, s.len, 4, 0, 0, TAU);
        c.fill();
      }
      // shimmering path of sunlight on the water
      for (const g of glints) {
        const a = Math.max(0, Math.sin(t * 2.2 + g.ph));
        const depth = (g.y - hz) / (h - hz);
        c.fillStyle = `rgba(255,${200 - depth * 60},${150 - depth * 40},${a * (0.55 - depth * 0.4)})`;
        c.fillRect(sunX + g.off - g.wd / 2 + Math.sin(t + g.ph) * 6, g.y, g.wd, 1.6 + depth * 1.6);
      }
      // rolling swells
      c.lineWidth = 1.2;
      for (let i = 0; i < 9; i++) {
        const depth = (i + 1) / 10;
        const y = hz + Math.pow(depth, 1.7) * (h - hz) * 0.92;
        const amp = 1 + depth * 6;
        c.strokeStyle = `rgba(255,190,200,${0.05 + depth * 0.08})`;
        c.beginPath();
        for (let x = 0; x <= w; x += 12) {
          const yy = y + Math.sin(x * (0.02 - depth * 0.012) + t * (0.6 + depth) + i) * amp;
          if (x === 0) c.moveTo(x, yy);
          else c.lineTo(x, yy);
        }
        c.stroke();
      }
      // the shore, with foam washing in and out (about one wave every 9s)
      const wash = 0.5 - 0.5 * Math.cos((t / 9) * TAU);
      const shoreY = h * 0.955 - wash * h * 0.045;
      c.fillStyle = "#2a2240";
      c.beginPath();
      c.moveTo(0, h);
      for (let x = 0; x <= w; x += 10) c.lineTo(x, h * 0.965 + Math.sin(x * 0.01) * 4);
      c.lineTo(w, h);
      c.fill();
      c.strokeStyle = `rgba(255,235,240,${0.35 + 0.25 * wash})`;
      c.lineWidth = 2;
      c.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const yy = shoreY + Math.sin(x * 0.03 + t * 1.5) * 2 + Math.sin(x * 0.011) * 4;
        if (x === 0) c.moveTo(x, yy);
        else c.lineTo(x, yy);
      }
      c.stroke();
    },
  };
}

export const SCENES: Record<ThemeId, () => Scene> = { starlit, cafe, forest, sakura, seaside };

export type { Rand };
