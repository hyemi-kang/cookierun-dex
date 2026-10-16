import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

/** 暗転 → 光が差し込む → 消える（約 1.8 秒）。クリック・キー・スクロールでスキップできる。 */
export function Intro({ playing, onDone }: { playing: boolean; onDone: () => void }) {
  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(onDone, 1800);
    const skip = () => onDone();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    window.addEventListener("wheel", skip, { passive: true });
    window.addEventListener("touchmove", skip, { passive: true });
    window.addEventListener("scroll", skip, { passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchmove", skip);
      window.removeEventListener("scroll", skip);
    };
  }, [playing, onDone]);

  return (
    <AnimatePresence>
      {playing && (
        <motion.div
          key="intro"
          data-testid="promo-intro"
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[60] overflow-hidden bg-black"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: "easeIn" } }}
        >
          {/* 光が差し込む */}
          <motion.div
            className="absolute top-1/2 left-1/2 h-[120vmax] w-[120vmax] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(closest-side, rgb(255 244 230 / 0.95), rgb(255 200 69 / 0.6) 25%, rgb(255 138 61 / 0.25) 55%, transparent 75%)",
            }}
            initial={{ scale: 0.02, opacity: 0 }}
            animate={{ scale: [0.02, 0.5, 1.1], opacity: [0, 1, 0.9] }}
            transition={{ duration: 1.6, times: [0, 0.55, 1], ease: "easeOut" }}
          />
          {/* 光の筋 */}
          <motion.div
            className="absolute top-1/2 left-1/2 h-[3px] w-[90vw] -translate-x-1/2 -translate-y-1/2 bg-white/80"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: [0, 1, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 1.1, times: [0, 0.5, 1], ease: "easeOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
