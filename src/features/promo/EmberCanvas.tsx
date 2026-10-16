import { useEffect, useRef } from "react";

interface Ember {
  x: number;
  y: number;
  vy: number;
  sway: number;
  phase: number;
  r: number;
  life: number;
  age: number;
  color: string;
}

const MAX_DPR = 2;

/**
 * 火の粉が舞い上がる背景（自前 Canvas 2D）。active=false（画面外・reduced）では止めて消す。
 * 粒子数の上限 max、DPR 上限 2。装飾なので aria-hidden。
 */
export function EmberCanvas({
  active,
  colors = ["#FF8A3D", "#FFC845", "#FF6FA8"],
  max = 90,
  rate = 28,
  className = "",
}: {
  active: boolean;
  colors?: string[];
  max?: number;
  rate?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const colorKey = colors.join(",");

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !active) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const palette = colorKey.split(",");
    let w = 1;
    let h = 1;
    let dpr = 1;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    resize();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);

    const list: Ember[] = [];
    let spawnAcc = 0;
    let last = performance.now();
    let raf = 0;
    const spawn = (initial: boolean) => {
      list.push({
        x: Math.random() * w,
        y: initial ? Math.random() * h : h + 8,
        vy: 24 + Math.random() * 70,
        sway: 10 + Math.random() * 28,
        phase: Math.random() * Math.PI * 2,
        r: 0.8 + Math.random() * 2.2,
        life: 4 + Math.random() * 5,
        age: 0,
        color: palette[Math.floor(Math.random() * palette.length)] ?? "#FF8A3D",
      });
    };
    for (let i = 0; i < Math.min(max / 2, 40); i++) spawn(true);

    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      spawnAcc += dt * rate;
      while (spawnAcc >= 1) {
        spawnAcc -= 1;
        if (list.length < max) spawn(false);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i] as Ember;
        p.age += dt;
        p.y -= p.vy * dt;
        if (p.age >= p.life || p.y < -10) {
          list.splice(i, 1);
          continue;
        }
        const k = p.age / p.life;
        const x = p.x + Math.sin(p.phase + p.age * 1.4) * p.sway;
        const a = Math.sin(Math.PI * Math.min(1, k * 1.15)) * 0.9;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = a * 0.22;
        ctx.beginPath();
        ctx.arc(x, p.y, p.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active, colorKey, max, rate]);

  return (
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable: 装飾の canvas（フォーカス不可）
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
