import { type Ref, useEffect, useImperativeHandle, useRef } from "react";

export interface BurstOptions {
  /** 粒子の数（残りの上限を超える分は切り捨てる） */
  count: number;
  /** 発生位置。canvas の幅・高さに対する割合 0〜1（既定 0.5） */
  x?: number;
  y?: number;
  /** 粒子の色（#RRGGBB など）。ランダムに選ぶ */
  colors: string[];
}

export interface ParticleCanvasHandle {
  burst: (options: BurstOptions) => void;
}

export interface ParticleCanvasProps {
  ref?: Ref<ParticleCanvasHandle>;
  /** 同時に存在できる粒子の上限 */
  maxParticles?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  life: number;
  size: number;
  color: string;
}

const MAX_DPR = 2;
const GRAVITY = 1400; // px/s^2（CSS px 単位）

/** 自前 Canvas 2D のパーティクル。装飾なので aria-hidden。タブが非表示の間は止める。 */
export function ParticleCanvas({ ref, maxParticles = 160 }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef<number | null>(null);
  const lastT = useRef(0);
  const clock = useRef(0); // 非表示の間は進めない、粒子用の時計(ms)
  const size = useRef({ w: 1, h: 1, dpr: 1 });

  const frame = useRef<(t: number) => void>(() => {});
  frame.current = (t: number) => {
    raf.current = null;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dt = Math.min(0.05, Math.max(0, (t - lastT.current) / 1000));
    lastT.current = t;
    clock.current += dt * 1000;

    const { w, h, dpr } = size.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const alive: Particle[] = [];
    for (const p of particles.current) {
      const age = clock.current - p.born;
      if (age >= p.life) continue;
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const k = 1 - age / p.life;
      ctx.globalAlpha = Math.max(0, k);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * k), 0, Math.PI * 2);
      ctx.fill();
      alive.push(p);
    }
    ctx.globalAlpha = 1;
    particles.current = alive;
    if (alive.length > 0 && !document.hidden) {
      raf.current = requestAnimationFrame((n) => frame.current(n));
    }
  };

  const start = () => {
    if (raf.current !== null || document.hidden) return;
    lastT.current = performance.now();
    raf.current = requestAnimationFrame((n) => frame.current(n));
  };

  useImperativeHandle(ref, () => ({
    burst({ count, x = 0.5, y = 0.5, colors }) {
      const room = Math.max(0, maxParticles - particles.current.length);
      const n = Math.min(Math.max(0, Math.floor(count)), room);
      const { w, h } = size.current;
      for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 250 + Math.random() * 650;
        particles.current.push({
          x: w * x,
          y: h * y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 250,
          born: clock.current,
          life: 600 + Math.random() * 300,
          size: 3 + Math.random() * 5,
          color: colors[Math.floor(Math.random() * colors.length)] ?? "#ffffff",
        });
      }
      start();
    },
  }));

  // biome-ignore lint/correctness/useExhaustiveDependencies: start は ref のみ参照する
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      size.current = { w, h, dpr };
    }
    const onVisibility = () => {
      if (document.hidden) {
        if (raf.current !== null) cancelAnimationFrame(raf.current);
        raf.current = null;
      } else if (particles.current.length > 0) {
        start();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, []);

  return (
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable: 装飾の canvas（フォーカス不可）。仕様で aria-hidden が必須
    <canvas
      ref={canvasRef}
      data-testid="particle-canvas"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
