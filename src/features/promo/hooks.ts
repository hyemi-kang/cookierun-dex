import { useMotionValue, useSpring } from "motion/react";
import { type RefObject, useEffect, useState } from "react";

/** 画面内にあるか。IntersectionObserver がなければ常に true。 */
export function useVisible<T extends Element>(ref: RefObject<T | null>, margin = "0px"): boolean {
  const [visible, setVisible] = useState(typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((es) => setVisible(es.some((e) => e.isIntersecting)), {
      rootMargin: margin,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return visible;
}

/** 1回だけ true になる */
export function useSeenOnce<T extends Element>(ref: RefObject<T | null>, margin = "0px"): boolean {
  const [seen, setSeen] = useState(typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return seen;
}

const FINE = "(pointer: fine) and (hover: hover)";

export function useFinePointer(): boolean {
  const [fine, setFine] = useState(() => window.matchMedia?.(FINE).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(FINE);
    if (!mq) return;
    const on = () => setFine(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return fine;
}

/** ウィンドウ内のポインタ位置（-1〜1）をばねで滑らかにした MotionValue。enabled=false で 0 に戻る。 */
export function usePointerSpring(enabled: boolean) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const x = useSpring(rx, { stiffness: 70, damping: 18, mass: 0.6 });
  const y = useSpring(ry, { stiffness: 70, damping: 18, mass: 0.6 });
  useEffect(() => {
    if (!enabled) {
      rx.set(0);
      ry.set(0);
      return;
    }
    const move = (e: PointerEvent) => {
      rx.set((e.clientX / window.innerWidth) * 2 - 1);
      ry.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [enabled, rx, ry]);
  return { x, y };
}
