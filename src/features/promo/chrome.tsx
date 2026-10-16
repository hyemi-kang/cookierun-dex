import { motion, useMotionValue, useScroll, useSpring } from "motion/react";
import { createContext, type RefObject, useContext, useEffect, useRef } from "react";
import { useFinePointer } from "./hooks";

/** セクションごとのテーマ色を切り替えるためのコンテキスト（ルートの --promo-accent を更新する） */
export const AccentContext = createContext<(accent: string) => void>(() => {});

/** ref の要素が画面の中央線を横切っている間、テーマ色を accent にする */
export function useSectionAccent(ref: RefObject<Element | null>, accent: string) {
  const setAccent = useContext(AccentContext);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) setAccent(accent);
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, accent, setAccent]);
}

/** 上端のスクロール進捗バー（テーマ色に追従） */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden="true"
      data-testid="promo-progress"
      className="pointer-events-none fixed top-0 left-0 z-50 h-1 w-full origin-left"
      style={{
        scaleX,
        background: "linear-gradient(90deg, var(--promo-accent), #FFC845)",
        boxShadow: "0 0 12px var(--promo-accent)",
      }}
    />
  );
}

/** マウスカーソルの追従装飾。細かいポインタ（マウス）の環境だけ。 */
export function CursorFollower({ reduced }: { reduced: boolean }) {
  const fine = useFinePointer();
  const rx = useMotionValue(-100);
  const ry = useMotionValue(-100);
  const x = useSpring(rx, { stiffness: 260, damping: 28, mass: 0.5 });
  const y = useSpring(ry, { stiffness: 260, damping: 28, mass: 0.5 });
  const shown = useRef(false);
  const el = useRef<HTMLDivElement>(null);
  const enabled = fine && !reduced;
  useEffect(() => {
    if (!enabled) return;
    const move = (e: PointerEvent) => {
      rx.set(e.clientX - 18);
      ry.set(e.clientY - 18);
      if (!shown.current && el.current) {
        shown.current = true;
        el.current.style.opacity = "1";
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [enabled, rx, ry]);
  if (!enabled) return null;
  return (
    <div
      ref={el}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-50 opacity-0"
    >
      <motion.div
        className="h-9 w-9 rounded-full border-2"
        style={{
          x,
          y,
          borderColor: "var(--promo-accent)",
          boxShadow: "0 0 18px var(--promo-accent), inset 0 0 10px var(--promo-accent)",
        }}
      />
    </div>
  );
}

/** セクション見出しの小さな番号ラベル */
export function SectionLabel({ no, en }: { no: string; en: string }) {
  return (
    <p
      aria-hidden="true"
      className="font-display text-sm font-bold tracking-[0.3em] tabular-nums"
      style={{ color: "var(--promo-accent)" }}
    >
      {no} <span className="mx-1 opacity-60">/</span> {en}
    </p>
  );
}
