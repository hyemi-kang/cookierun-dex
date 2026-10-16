import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useMemo, useRef, useState } from "react";
import type { TimelineItem } from "../../types/timeline";
import { FallbackActor } from "../fx";

const SOFT = { type: "spring", stiffness: 120, damping: 20 } as const;
const RUNNER_RUN = "/assets/crob/gingerbrave/run.webp";
const RUNNER_STILL = "/assets/crk/gingerbrave/illustration.webp";
const RUNNER_ALT = "走る勇敢なクッキー";

function isHttps(url: string): boolean {
  return url.startsWith("https://");
}

/** 進捗がこの値を超えたらカードを順に出す（既定 0.15 / 0.35 / 0.55 / 0.75。件数が多いときは詰める） */
export function cardThresholds(count: number): number[] {
  const step = count > 1 ? Math.min(0.2, 0.6 / (count - 1)) : 0;
  return Array.from({ length: count }, (_, i) => 0.15 + i * step);
}

function Card({ item, active }: { item: TimelineItem; active: boolean }) {
  return (
    <motion.li
      data-testid="timeline-card"
      data-active={active}
      aria-hidden={active ? undefined : true}
      className="w-[280px] list-none rounded-lg max-sm:w-full border border-border bg-surface/90 p-4 shadow-md max-sm:p-3"
      initial={{ opacity: 0, y: 24 }}
      animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={SOFT}
    >
      <p className="font-display text-2xl font-bold text-accent tabular-nums max-sm:text-xl">
        {item.year}
      </p>
      <h3 className="text-lg font-bold max-sm:text-base">{item.title}</h3>
      <p className="mt-1 text-sm text-text-muted">{item.summary}</p>
      {isHttps(item.sourceUrl) && (
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={active ? 0 : -1}
          className="mt-2 inline-flex min-h-11 items-center text-sm text-accent underline"
        >
          出典
          <span className="sr-only">（新しいタブ）</span>
        </a>
      )}
    </motion.li>
  );
}

/** 走るキャラ。run.webp が読めなければ立ち絵 + FallbackActor の「走る」。 */
function Runner({ reduced }: { reduced: boolean }) {
  const [failed, setFailed] = useState(false);
  if (reduced) {
    return <FallbackActor imageSrc={RUNNER_STILL} alt={RUNNER_ALT} action="idle" reduced />;
  }
  if (failed) {
    return <FallbackActor imageSrc={RUNNER_STILL} alt={RUNNER_ALT} action="run" reduced={false} />;
  }
  return (
    <img
      src={RUNNER_RUN}
      alt={RUNNER_ALT}
      draggable={false}
      onError={() => setFailed(true)}
      className="h-full w-full object-contain"
    />
  );
}

function Heading() {
  return <h2 className="font-display text-4xl font-bold max-sm:text-2xl">クッキーランの歩み</h2>;
}

function Empty() {
  return <p className="text-text-muted">年表データを準備中です。</p>;
}

/** 動きを減らす設定: 静的な一覧（普通にスクロール）。走るキャラは中央に静止。 */
function StaticTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <section aria-label="年表" className="flex flex-col items-center gap-8 px-4 py-16">
      <Heading />
      {items.length === 0 ? (
        <Empty />
      ) : (
        <ol className="m-0 flex w-full max-w-[1200px] list-none flex-wrap justify-center gap-6 p-0">
          {items.map((item) => (
            <Card key={`${item.year}-${item.title}`} item={item} active />
          ))}
        </ol>
      )}
      <div data-testid="runner" className="h-40 w-40">
        <Runner reduced />
      </div>
    </section>
  );
}

function ScrollTimeline({ items }: { items: TimelineItem[] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const thresholds = useMemo(() => cardThresholds(items.length), [items.length]);
  const countAt = (v: number) => thresholds.filter((t) => v >= t).length;
  const [shown, setShown] = useState(() => countAt(p.get()));
  useMotionValueEvent(p, "change", (v) => setShown(countAt(v)));

  const runnerX = useTransform(p, [0, 1], ["-20vw", "120vw"]);
  // 視差: 係数 0.2 / 0.5 / 1.0（レイヤー幅は画面の 300%。1.0 = 画面幅 100vw 分 = 自身の 33.3%）
  const l1 = useTransform(p, [0, 1], ["0%", `${-(0.2 * 100) / 3}%`]);
  const l2 = useTransform(p, [0, 1], ["0%", `${-(0.5 * 100) / 3}%`]);
  const l3 = useTransform(p, [0, 1], ["0%", `${-(1.0 * 100) / 3}%`]);

  return (
    <section
      ref={ref}
      aria-label="年表"
      data-testid="timeline-section"
      className="relative"
      style={{ height: "400vh" }}
    >
      <div className="sticky top-0 h-svh overflow-hidden bg-bg">
        <motion.div
          aria-hidden="true"
          className="absolute top-0 left-0 h-full w-[300%]"
          style={{
            x: l1,
            backgroundColor: "#1a1210",
            backgroundImage:
              "radial-gradient(circle, rgb(255 244 230 / 0.55) 1.5px, transparent 2px), linear-gradient(to bottom, #3a2a22, #1a1210)",
            backgroundSize: "140px 140px, 100% 100%",
          }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute bottom-[8svh] left-0 h-[34svh] w-[300%]"
          style={{
            x: l2,
            backgroundImage: "radial-gradient(ellipse at 50% 100%, #3a2a22 62%, transparent 63%)",
            backgroundSize: "480px 100%",
          }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[10svh] w-[300%] border-t-4 border-primary"
          style={{
            x: l3,
            backgroundImage: "repeating-linear-gradient(90deg, #5a4234 0 60px, #4a3528 60px 120px)",
          }}
        />

        <div className="absolute inset-x-0 top-[6svh] z-10 flex flex-col items-center gap-4 px-4 max-sm:top-[3svh] max-sm:gap-2">
          <Heading />
          {items.length === 0 ? (
            <Empty />
          ) : (
            <ol className="m-0 flex list-none flex-wrap justify-center gap-6 p-0 max-sm:w-full max-sm:flex-col max-sm:items-stretch max-sm:gap-2">
              {items.map((item, i) => (
                <Card key={`${item.year}-${item.title}`} item={item} active={i < shown} />
              ))}
            </ol>
          )}
        </div>

        <motion.div
          data-testid="runner"
          className="absolute bottom-[6svh] left-0 z-20 h-32 w-32 sm:h-40 sm:w-40"
          style={{ x: runnerX }}
        >
          <Runner reduced={false} />
        </motion.div>
      </div>
    </section>
  );
}

export function TimelineSection({ items, reduced }: { items: TimelineItem[]; reduced: boolean }) {
  const sorted = useMemo(() => [...items].sort((a, b) => a.year - b.year), [items]);
  return reduced ? <StaticTimeline items={sorted} /> : <ScrollTimeline items={sorted} />;
}
