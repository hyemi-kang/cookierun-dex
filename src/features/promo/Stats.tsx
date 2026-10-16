import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { SectionLabel, useSectionAccent } from "./chrome";
import { useSeenOnce } from "./hooks";
import { SplitText } from "./SplitText";
import { CHARS } from "./util";

/** 図鑑のデータから算出する（ハードコードしない） */
export function computeStats() {
  return [
    { label: "キャラクター", unit: "体", value: CHARS.length },
    { label: "ゲーム", unit: "作品", value: new Set(CHARS.map((c) => c.title)).size },
    { label: "動作アニメ", unit: "種", value: CHARS.reduce((n, c) => n + c.motions.length, 0) },
    { label: "等級", unit: "段階", value: new Set(CHARS.map((c) => c.rarity)).size },
  ];
}

function CountUp({ to, seen, reduced }: { to: number; seen: boolean; reduced: boolean }) {
  const mv = useMotionValue(reduced ? to : 0);
  const text = useTransform(mv, (v) => Math.round(v));
  useEffect(() => {
    if (reduced) {
      mv.set(to);
      return;
    }
    if (!seen) return;
    const c = animate(mv, to, { duration: 1.8, ease: "easeOut" });
    return () => c.stop();
  }, [seen, to, reduced, mv]);
  return <motion.span>{text}</motion.span>;
}

export function Stats({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const seen = useSeenOnce(ref, "-10% 0px");
  useSectionAccent(ref, "#7BD88F");
  const items = computeStats();
  return (
    <section
      ref={ref}
      aria-label="数字で見る"
      className="flex flex-col items-center gap-10 px-4 py-24"
      style={{
        background:
          "radial-gradient(60% 60% at 50% 50%, #7BD88F22, transparent 70%), linear-gradient(to bottom, #1a1210, #10281c 50%, #1a1210)",
      }}
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <SectionLabel no="04" en="NUMBERS" />
        <h2 className="font-display text-[clamp(2rem,4.5vw,4rem)] leading-tight font-bold">
          <SplitText
            text="数字で見る"
            active={seen}
            reduced={reduced}
            glow="rgb(123 216 143 / 0.5)"
          />
        </h2>
      </div>
      <ul className="m-0 grid w-full max-w-[1100px] list-none grid-cols-2 gap-4 p-0 md:grid-cols-4">
        {items.map((s, i) => (
          <motion.li
            key={s.label}
            className="rounded-xl border border-border bg-surface/80 px-4 py-6 text-center"
            initial={reduced ? false : { opacity: 0, y: 40, scale: 0.9 }}
            animate={reduced ? undefined : seen ? { opacity: 1, y: 0, scale: 1 } : undefined}
            transition={{ type: "spring", visualDuration: 0.5, bounce: 0.3, delay: i * 0.1 }}
          >
            <p
              className="font-display text-[clamp(2.75rem,6vw,5rem)] leading-none font-bold tabular-nums"
              style={{
                backgroundImage: "linear-gradient(to bottom, #fff4e6, #7BD88F)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              <CountUp to={s.value} seen={seen} reduced={reduced} />
              <span className="ml-1 text-xl">{s.unit}</span>
            </p>
            <p className="mt-2 text-base font-bold text-text">{s.label}</p>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
