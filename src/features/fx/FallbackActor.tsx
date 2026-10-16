import { motion, type TargetAndTransition, type Transition, useAnimate } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";

export type FallbackAction =
  | "idle"
  | "run"
  | "jump"
  | "double_jump"
  | "slide"
  | "skill"
  | "joy"
  | "bounce"
  | "squash";

export interface FallbackActorProps {
  imageSrc: string;
  alt: string;
  action: FallbackAction;
  /** 動きを減らす設定。true のときは静止画 */
  reduced: boolean;
  /** 省略可。ルート要素の class */
  className?: string;
}

interface Loop {
  animate: TargetAndTransition;
  transition: Transition;
}

const LOOP = { repeat: Infinity } as const;
const HOP_PAUSE = 0.4;

/** 動作ごとの transform（docs/UI.md 5章）。transform だけで動かす。 */
const LOOPS: Record<Exclude<FallbackAction, "skill">, Loop> = {
  // 呼吸: scale 1↔1.02 を 2秒
  idle: {
    animate: { scale: [1, 1.02, 1] },
    transition: { ...LOOP, duration: 2, ease: "easeInOut" },
  },
  // 走る: y 0↔-6px と scaleY 1.04↔0.96 を 300ms、前傾 -4°
  run: {
    animate: { y: [0, -6], scaleY: [1.04, 0.96], rotate: -4 },
    transition: {
      y: { ...LOOP, repeatType: "mirror", duration: 0.15, ease: "easeInOut" },
      scaleY: { ...LOOP, repeatType: "mirror", duration: 0.15, ease: "easeInOut" },
      rotate: { duration: 0.15 },
    },
  },
  // ジャンプ: y 0→-80→0 を 600ms、着地で scaleX 1.15 / scaleY 0.85 を 120ms
  jump: {
    animate: {
      y: [0, -80, 0, 0],
      scaleX: [1, 1, 1.15, 1],
      scaleY: [1, 1, 0.85, 1],
    },
    transition: {
      ...LOOP,
      duration: 0.72,
      times: [0, 0.42, 0.83, 1],
      ease: "easeInOut",
      repeatDelay: HOP_PAUSE,
    },
  },
  // 二段ジャンプ: 2回跳ね、2回目の頂点で rotate 360°
  double_jump: {
    animate: { y: [0, -60, 0, -80, 0], rotate: [0, 0, 0, 360, 360] },
    transition: {
      ...LOOP,
      duration: 1.2,
      times: [0, 0.2, 0.4, 0.7, 1],
      ease: "easeInOut",
      repeatDelay: HOP_PAUSE,
    },
  },
  // スライド: scaleY 0.6 / scaleX 1.2 / y +20% を 500ms 保って戻る
  slide: {
    animate: {
      y: ["0%", "20%", "20%", "0%"],
      scaleX: [1, 1.2, 1.2, 1],
      scaleY: [1, 0.6, 0.6, 1],
    },
    transition: {
      ...LOOP,
      duration: 0.8,
      times: [0, 0.1, 0.725, 1],
      ease: "easeInOut",
      repeatDelay: 0.5,
    },
  },
  // 喜ぶ: 2回跳ねながら rotate ±8°
  joy: {
    animate: { y: [0, -32, 0, -32, 0], rotate: [0, -8, 0, 8, 0] },
    transition: { ...LOOP, duration: 0.9, ease: "easeInOut", repeatDelay: 0.3 },
  },
  // 代替「跳ねる」
  bounce: {
    animate: {
      y: [0, -50, 0, 0],
      scaleX: [1, 1, 1.12, 1],
      scaleY: [1, 1, 0.88, 1],
    },
    transition: {
      ...LOOP,
      duration: 0.7,
      times: [0, 0.45, 0.85, 1],
      ease: "easeInOut",
      repeatDelay: 0.15,
    },
  },
  // 代替「つぶれて伸びる」
  squash: {
    animate: { scaleX: [1, 1.15, 0.92, 1], scaleY: [1, 0.85, 1.08, 1] },
    transition: { ...LOOP, duration: 0.6, ease: "easeInOut" },
  },
};

const POP = { type: "spring", visualDuration: 0.35, bounce: 0.35 } as const;

function Silhouette({ alt }: { alt: string }) {
  return (
    <svg
      role="img"
      aria-label={alt}
      viewBox="0 0 100 120"
      className="max-h-full max-w-full"
      style={{ width: "60%", height: "auto" }}
    >
      <title>{alt}</title>
      <circle cx="50" cy="38" r="30" fill="#5a4234" />
      <rect x="22" y="62" width="56" height="44" rx="14" fill="#5a4234" />
      <rect x="10" y="64" width="16" height="10" rx="5" fill="#5a4234" />
      <rect x="74" y="64" width="16" height="10" rx="5" fill="#5a4234" />
    </svg>
  );
}

const ROOT_STYLE = { transformOrigin: "50% 100%" } as const;
const ROOT_CLASS = "flex h-full w-full items-end justify-center";

function Picture({
  src,
  alt,
  failed,
  onError,
}: {
  src: string;
  alt: string;
  failed: boolean;
  onError: () => void;
}) {
  if (failed) return <Silhouette alt={alt} />;
  return (
    <img
      src={src}
      alt={alt}
      onError={onError}
      draggable={false}
      className="max-h-full max-w-full object-contain"
    />
  );
}

/** スキル: scale 1→1.15→1（spring.pop）を1回。 */
function PopActor({ className, children }: { className: string; children: ReactNode }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  useEffect(() => {
    const el = scope.current;
    if (!el) return;
    let cancelled = false;
    const up = animate(el, { scale: 1.15 }, POP);
    up.then(() => {
      if (!cancelled) animate(el, { scale: 1 }, POP);
    });
    return () => {
      cancelled = true;
      up.stop();
    };
  }, [animate, scope]);
  return (
    <div ref={scope} data-fallback-motion="skill" className={className} style={ROOT_STYLE}>
      {children}
    </div>
  );
}

/**
 * 立ち絵を動かす代替演出。画像が読めなければシルエットを出す。
 * ルート要素に data-fallback-motion={action} を付ける（AC-27）。
 */
export function FallbackActor({ imageSrc, alt, action, reduced, className }: FallbackActorProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === imageSrc;
  const pic = (
    <Picture src={imageSrc} alt={alt} failed={failed} onError={() => setFailedSrc(imageSrc)} />
  );
  const cls = className ? `${ROOT_CLASS} ${className}` : ROOT_CLASS;

  if (reduced) {
    // 静止。skill だけ scale 1.05 を1回
    return (
      <motion.div
        key={action}
        data-fallback-motion={action}
        className={cls}
        style={ROOT_STYLE}
        animate={{ scale: action === "skill" ? 1.05 : 1 }}
        transition={{ duration: 0.18 }}
      >
        {pic}
      </motion.div>
    );
  }

  if (action === "skill") {
    return (
      <PopActor key="skill" className={cls}>
        {pic}
      </PopActor>
    );
  }

  const loop = LOOPS[action];
  return (
    <motion.div
      key={action}
      data-fallback-motion={action}
      className={cls}
      style={ROOT_STYLE}
      animate={loop.animate}
      transition={loop.transition}
    >
      {pic}
    </motion.div>
  );
}
