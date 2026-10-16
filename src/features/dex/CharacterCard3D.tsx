import {
  type AnimationPlaybackControls,
  animate,
  type MotionValue,
  motion,
  useIsPresent,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
} from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Character } from "../../types/character";
import { CookieSilhouette } from "./CookieSilhouette";
import {
  DRAG_DEG_PER_PX,
  gradeStyle,
  HINT_STORAGE_KEY,
  IDLE_DELAY_MS,
  INERTIA,
  MAX_SPIN_VELOCITY,
  MIN_FLING_VELOCITY,
  POSITION_LABEL,
  SPRING,
  TILT_MAX,
} from "./constants";
import { GradeBadge } from "./GradeBadge";

interface Props {
  character: Character;
  reduced: boolean;
  /** 値が変わるたびに裏返す */
  flipSignal: number;
  /** 値が変わるたびに正面へ戻す */
  resetSignal: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const isBack = (deg: number) => {
  const m = ((deg % 360) + 360) % 360;
  return m > 90 && m < 270;
};

function useSignal(value: number, cb: () => void) {
  const prev = useRef(value);
  const latest = useRef(cb);
  latest.current = cb;
  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    latest.current();
  }, [value]);
}

function HoloSheen({
  x,
  y,
  opacity,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  opacity: MotionValue<number>;
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute"
        style={{
          left: "-30%",
          top: "-30%",
          width: "160%",
          height: "160%",
          x,
          y,
          opacity,
          background:
            "radial-gradient(circle, rgb(255 255 255 / 0.55) 0%, rgb(255 255 255 / 0) 45%), linear-gradient(115deg, rgb(255 80 160 / 0) 25%, rgb(255 210 80 / 0.22) 40%, rgb(80 210 255 / 0.22) 60%, rgb(255 80 160 / 0) 75%)",
        }}
      />
    </div>
  );
}

export function dismissDragHint() {
  try {
    localStorage.setItem(HINT_STORAGE_KEY, "1");
  } catch {
    // 保存できなくても動作には影響しない
  }
}

function DragHint({ reduced }: { reduced: boolean }) {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(HINT_STORAGE_KEY) !== "1";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    if (!visible || !reduced) return;
    const t = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(t);
  }, [visible, reduced]);
  if (!visible) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 -bottom-10 flex justify-center"
    >
      <motion.span
        className="rounded-full bg-surface/80 px-3 py-1 text-sm text-text-muted"
        animate={reduced ? undefined : { x: [0, -24, 24, 0] }}
        transition={{ duration: 1.2, repeat: 2, ease: "easeInOut" }}
        onAnimationComplete={() => {
          if (!reduced) setVisible(false);
        }}
      >
        ⟲ ドラッグで回転
      </motion.span>
    </div>
  );
}

/** 表: 立ち絵 / 裏: ステータス。CSS 3D（docs/詳細設計書.md 5章） */
export function CharacterCard3D({ character, reduced, flipSignal, resetSignal }: Props) {
  const present = useIsPresent();
  const style = gradeStyle(character.rarity);

  const rotateY = useMotionValue(0);
  const tiltX = useSpring(0, SPRING.tilt);
  const tiltY = useSpring(0, SPRING.tilt);
  const sheenX = useSpring(0, SPRING.tilt);
  const sheenY = useSpring(0, SPRING.tilt);
  const sheenOpacity = useSpring(reduced ? 0.2 : 0, SPRING.tilt);
  const floatY = useMotionValue(0);
  const floatRot = useMotionValue(0);
  const fade = useMotionValue(1);
  useEffect(() => {
    sheenOpacity.set(reduced ? 0.2 : 0);
  }, [reduced, sheenOpacity]);
  const totalY = useTransform([rotateY, tiltY], ([a, b]: number[]) => a + b);

  const cardRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const spin = useRef<AnimationPlaybackControls | null>(null);
  const samples = useRef<{ t: number; x: number }[]>([]);
  const [side, setSide] = useState<"front" | "back">("front");
  const [idle, setIdle] = useState(false);
  const idleTimer = useRef<number | undefined>(undefined);
  const [imgState, setImgState] = useState<"loading" | "loaded" | "error">("loading");
  const [retry, setRetry] = useState(0);

  // 角度・表裏は DOM に直接反映する（毎フレームの再描画を避ける）
  useMotionValueEvent(rotateY, "change", (v) => {
    const back = isBack(v);
    const el = cardRef.current;
    if (el) {
      el.dataset.rotation = String(Math.round(v * 10) / 10);
      el.dataset.side = back ? "back" : "front";
    }
    if (frontRef.current) frontRef.current.style.visibility = back ? "hidden" : "visible";
    if (backRef.current) backRef.current.style.visibility = back ? "visible" : "hidden";
    setSide(back ? "back" : "front");
  });

  // 操作を受けたら揺れを止め、3秒後に再開する（reduced は揺れない）
  const poke = useCallback(() => {
    setIdle(false);
    window.clearTimeout(idleTimer.current);
    if (!reduced) idleTimer.current = window.setTimeout(() => setIdle(true), IDLE_DELAY_MS);
  }, [reduced]);
  useEffect(() => {
    poke();
    return () => window.clearTimeout(idleTimer.current);
  }, [poke]);

  useEffect(() => {
    if (!idle) {
      if (floatY.get() !== 0) animate(floatY, 0, { duration: 0.2 });
      if (floatRot.get() !== 0) animate(floatRot, 0, { duration: 0.2 });
      return;
    }
    const loop = { duration: 3.2, repeat: Infinity, ease: "easeInOut" } as const;
    const a = animate(floatY, [0, -6, 0], loop);
    const b = animate(floatRot, [0, 0.5, 0, -0.5, 0], loop);
    return () => {
      a.stop();
      b.stop();
    };
  }, [idle, floatY, floatRot]);

  // reduced の裏返し（フェード → 角度の入れ替え）の進行中の状態
  const fadeCtl = useRef<AnimationPlaybackControls | null>(null);
  const pendingFlip = useRef<number | null>(null);
  const cancelFade = () => {
    fadeCtl.current?.stop();
    fadeCtl.current = null;
    pendingFlip.current = null;
    fade.set(1);
  };
  const stopSpin = () => {
    spin.current?.stop();
    spin.current = null;
    cancelFade();
  };

  const reset = () => {
    stopSpin();
    poke();
    // 見た目が同じ最短の角度に正規化してから 0 へ戻す
    let m = ((rotateY.get() % 360) + 360) % 360;
    if (m > 180) m -= 360;
    rotateY.set(m);
    tiltX.set(0);
    tiltY.set(0);
    spin.current = animate(
      rotateY,
      0,
      reduced ? { duration: 0.18, ease: "easeOut" } : SPRING.snappy,
    );
  };

  const flip = () => {
    spin.current?.stop();
    spin.current = null;
    poke();
    // 最寄りの面を基準に反対の面へ。フェード中の連打は予定の角度から数える
    const base = pendingFlip.current ?? rotateY.get();
    const target = Math.round(base / 180) * 180 + 180;
    if (reduced) {
      // M7: 180ms のクロスフェードで入れ替える
      fadeCtl.current?.stop();
      pendingFlip.current = target;
      const ctl = animate(fade, 0, { duration: 0.09 });
      fadeCtl.current = ctl;
      ctl.then(() => {
        if (fadeCtl.current !== ctl) return; // 中断された
        rotateY.set(target);
        pendingFlip.current = null;
        fadeCtl.current = animate(fade, 1, { duration: 0.09 });
      });
    } else {
      spin.current = animate(rotateY, target, SPRING.pop);
    }
  };

  useSignal(flipSignal, flip);
  useSignal(resetSignal, reset);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    poke();
    if (reduced || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    const ny = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    tiltY.set(nx * TILT_MAX);
    tiltX.set(-ny * TILT_MAX);
    sheenX.set(nx * r.width * 0.5);
    sheenY.set(ny * r.height * 0.5);
    sheenOpacity.set(0.55);
  };
  const onPointerLeave = () => {
    poke();
    if (reduced) return;
    tiltX.set(0);
    tiltY.set(0);
    sheenX.set(0);
    sheenY.set(0);
    sheenOpacity.set(0);
  };

  const label = `${character.names.ja}、${side === "front" ? "表面" : "裏面: ステータス"}`;
  const src = `${character.images.illustration}${retry ? `?r=${retry}` : ""}`;
  const tid = (id: string) => (present ? id : undefined);

  const rows: [string, React.ReactNode][] = [
    ["等級", <GradeBadge key="g" grade={character.rarity} />],
    ["役割", character.role ?? "—"],
    ["ポジション", character.position ? POSITION_LABEL[character.position] : "—"],
    ["初登場", character.firstAppearance ?? "—"],
    ["実装日", character.releaseDate ?? "—"],
    ["スキル", character.skill?.name ?? "—"],
  ];

  return (
    <div
      className="dex-perspective relative"
      aria-hidden={present ? undefined : true}
      style={{
        width: "min(clamp(260px, 32vw, 400px), max(200px, calc((100svh - 340px) * 0.714)))",
        aspectRatio: "5 / 7",
      }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <motion.div className="size-full" style={{ opacity: fade }}>
        <motion.div
          ref={cardRef}
          data-testid={tid("card3d")}
          data-rotation="0"
          data-side="front"
          role="group"
          aria-roledescription="回転できるカード"
          aria-label={label}
          tabIndex={present ? 0 : -1}
          onPanStart={() => {
            stopSpin();
            poke();
            dismissDragHint();
            samples.current = [];
          }}
          onPan={(_, info) => {
            poke();
            rotateY.set(rotateY.get() + info.delta.x * DRAG_DEG_PER_PX);
            const now = performance.now();
            samples.current = [...samples.current, { t: now, x: info.point.x }].filter(
              (p) => now - p.t <= 150,
            );
          }}
          onPanEnd={() => {
            // 直近 150ms のポインタ位置と時刻から自前で速度を出す（合成イベントでも安定）
            const pts = samples.current;
            const first = pts[0];
            const last = pts[pts.length - 1];
            const fresh = last !== undefined && performance.now() - last.t <= 150;
            const pxPerSec =
              fresh && first && last.t > first.t
                ? ((last.x - first.x) / (last.t - first.t)) * 1000
                : 0;
            const v = clamp(pxPerSec * DRAG_DEG_PER_PX, -MAX_SPIN_VELOCITY, MAX_SPIN_VELOCITY);
            // reduced: 慣性なし（AC-47）。ゆっくり離したときも慣性なし（AC-21）
            if (reduced || Math.abs(v) < MIN_FLING_VELOCITY) return;
            // 開始値と同じ目標だと即終了してしまうため、速度の向きに 1° ずらす（慣性は目標値を無視する）
            spin.current = animate(rotateY, rotateY.get() + Math.sign(v), {
              type: "inertia",
              velocity: v,
              ...INERTIA,
            });
          }}
          onDoubleClick={reset}
          onKeyDown={(e) => {
            if (e.key === " ") {
              e.preventDefault();
              flip();
            } else if (e.key === "Home") {
              e.preventDefault();
              reset();
            }
          }}
          className="relative size-full cursor-grab rounded-xl active:cursor-grabbing"
          style={{
            transformStyle: "preserve-3d",
            touchAction: "none",
            rotateX: tiltX,
            rotateY: totalY,
            y: floatY,
            rotateZ: floatRot,
            boxShadow: `0 24px 48px -12px rgb(0 0 0 / .6), 0 0 32px ${style.badge}73`,
          }}
        >
          <div
            ref={frontRef}
            data-testid={tid("card-front")}
            className="dex-face"
            style={{ background: `linear-gradient(160deg, ${style.from}, ${style.to})` }}
          >
            {imgState === "loading" && (
              <div aria-hidden="true" className="dex-shimmer absolute inset-0" />
            )}
            {imgState === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                <CookieSilhouette tint={style.badge} className="h-1/2" testId={tid("silhouette")} />
                <p className="text-lg font-bold">{character.names.ja}</p>
                <p className="text-sm text-text-muted">画像を読み込めませんでした</p>
                <button
                  type="button"
                  onClick={() => {
                    setImgState("loading");
                    setRetry((n) => n + 1);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="relative z-10 inline-flex min-h-11 cursor-pointer items-center rounded-md bg-primary px-4 text-sm font-bold text-on-primary"
                >
                  再試行
                </button>
              </div>
            )}
            <img
              key={retry}
              src={src}
              alt={present ? character.names.ja : ""}
              draggable={false}
              onLoad={() => setImgState("loaded")}
              onError={() => setImgState("error")}
              className={`pointer-events-none absolute inset-0 size-full object-contain p-4 pb-14 ${
                imgState === "loaded" ? "opacity-100" : "opacity-0"
              }`}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8"
            >
              <span className="truncate font-display text-lg font-bold">{character.names.ja}</span>
              <GradeBadge grade={character.rarity} />
            </div>
            <HoloSheen x={sheenX} y={sheenY} opacity={sheenOpacity} />
          </div>

          <div
            ref={backRef}
            data-testid={tid("card-back")}
            className="dex-face dex-face-back"
            style={{
              visibility: "hidden",
              background: `linear-gradient(200deg, ${style.from}, ${style.to})`,
            }}
          >
            <div className="flex size-full flex-col gap-4 p-6">
              <h3 className="font-display text-xl font-bold">ステータス</h3>
              <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 text-base">
                {rows.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-sm text-text-muted">{k}</dt>
                    <dd className="font-bold">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <HoloSheen x={sheenX} y={sheenY} opacity={sheenOpacity} />
          </div>
        </motion.div>
      </motion.div>
      {present && <DragHint reduced={reduced} />}
    </div>
  );
}
