import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const POP = { type: "spring", visualDuration: 0.35, bounce: 0.35 } as const;

/** 1回だけ true になる「画面に入った」判定。IntersectionObserver がなければ即 true。 */
function useSeenOnce<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setSeen(true);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, seen };
}

export function CtaSection({
  navigate,
  reduced,
}: {
  navigate: (to: string) => void;
  reduced: boolean;
}) {
  const { ref, seen } = useSeenOnce<HTMLElement>();

  return (
    <section
      ref={ref}
      aria-labelledby="cta-heading"
      className="flex min-h-[60svh] flex-col items-center justify-center gap-8 px-4 py-16 text-center"
    >
      <h2 id="cta-heading" className="font-display text-4xl font-bold">
        さあ、オーブンの外へ
      </h2>
      <motion.button
        type="button"
        data-testid="cta-dex"
        onClick={() => navigate("/")}
        className="relative min-h-11 overflow-hidden rounded-md bg-primary px-8 py-3 text-lg font-bold text-on-primary"
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
        animate={seen ? (reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }) : undefined}
        transition={reduced ? { duration: 0.3 } : POP}
      >
        図鑑を見る
        {seen && !reduced && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/40"
            style={{ skewX: -20 }}
            initial={{ x: "-150%" }}
            animate={{ x: "400%" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          />
        )}
      </motion.button>
    </section>
  );
}
