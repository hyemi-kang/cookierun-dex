import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import { useMemo, useRef, useState } from "react";
import type { Character } from "../../types/character";
import type { TimelineItem } from "../../types/timeline";
import { Chara } from "./Chara";
import { SectionLabel, useSectionAccent } from "./chrome";
import { useVisible } from "./hooks";
import { SplitText } from "./SplitText";
import { CHARS, KINGDOM, OVEN } from "./util";

const SOFT = { type: "spring", stiffness: 120, damping: 20 } as const;

function isHttps(url: string): boolean {
  return url.startsWith("https://");
}

/** 進捗がこの値を超えたらカードを順に出す（既定 0.15 / 0.35 / 0.55 / 0.75 の等間隔。件数が多いときは詰める） */
export function cardThresholds(count: number): number[] {
  const step = count > 1 ? Math.min(0.2, 0.6 / (count - 1)) : 0;
  return Array.from({ length: count }, (_, i) => 0.15 + i * step);
}

interface EraTheme {
  from: string;
  to: string;
  glow: string;
  game: "oven" | "kingdom" | "other";
  guests: Character[];
  guestMotion: string[];
}

const OVEN_THEMES = [
  { from: "#7a3208", to: "#1a0c06", glow: "#FF8A3D" },
  { from: "#8a2c10", to: "#240c08", glow: "#FF6A3D" },
  { from: "#8a4a06", to: "#1e1006", glow: "#FFB03D" },
];

/** 年の作品から場面の色とゲストを決める。OvenBreak=オレンジ、キングダム=暖色グラデ、他=夜空 */
function eraTheme(item: TimelineItem, i: number): EraTheme {
  const t = item.title;
  const pick = (list: Character[]) =>
    [0, 1].map((k) => list[(i + k) % Math.max(1, list.length)]).filter((c): c is Character => !!c);
  if (/キングダム|Kingdom/i.test(t)) {
    return {
      from: "#a23a48",
      to: "#2a1418",
      glow: "#FFC845",
      game: "kingdom",
      guests: pick(KINGDOM.length ? KINGDOM : CHARS),
      guestMotion: ["idle", "battle_idle"],
    };
  }
  if (/オーブンブレイク|OvenBreak|Oven Break/i.test(t)) {
    const th = OVEN_THEMES[i % OVEN_THEMES.length] as (typeof OVEN_THEMES)[number];
    return { ...th, game: "oven", guests: pick(OVEN.length ? OVEN : CHARS), guestMotion: ["run"] };
  }
  return {
    from: "#2c2a6e",
    to: "#0e0c24",
    glow: "#7BD88F",
    game: "other",
    guests: [KINGDOM[0] ?? CHARS[0], OVEN[0] ?? CHARS[1]].filter((c): c is Character => !!c),
    guestMotion: ["idle", "run"],
  };
}

function SourceLink({ url, tab }: { url: string; tab: boolean }) {
  if (!isHttps(url)) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={tab ? 0 : -1}
      className="mt-1 inline-flex min-h-11 items-center text-sm text-accent underline"
    >
      出典
      <span className="sr-only">（新しいタブ）</span>
    </a>
  );
}

function Card({
  item,
  active,
  current,
  glow,
}: {
  item: TimelineItem;
  active: boolean;
  current: boolean;
  glow: string;
}) {
  return (
    <motion.li
      data-testid="timeline-card"
      data-active={active}
      aria-hidden={active ? undefined : true}
      className="list-none rounded-lg border bg-surface/90 p-4 shadow-md max-sm:!w-full max-sm:p-3"
      style={{
        width: "clamp(220px, calc((100vw - 144px) / 5), 280px)",
        borderColor: current ? glow : "var(--color-border)",
        boxShadow: current ? `0 0 28px ${glow}88` : undefined,
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={SOFT}
    >
      <p className="font-display text-2xl font-bold text-accent tabular-nums max-sm:text-xl">
        {item.year}
      </p>
      <h3 className="text-base leading-snug font-bold">{item.title}</h3>
      <p className="mt-1 text-sm text-text-muted">{item.summary}</p>
      <SourceLink url={item.sourceUrl} tab={active} />
    </motion.li>
  );
}

function StaticCard({ item }: { item: TimelineItem }) {
  return (
    <li
      data-testid="timeline-card"
      className="list-none rounded-lg border border-border bg-surface/90 p-4 shadow-md"
      style={{ width: 280, maxWidth: "100%" }}
    >
      <p className="font-display text-2xl font-bold text-accent tabular-nums">{item.year}</p>
      <h3 className="text-base leading-snug font-bold">{item.title}</h3>
      <p className="mt-1 text-sm text-text-muted">{item.summary}</p>
      <SourceLink url={item.sourceUrl} tab />
    </li>
  );
}

function Heading({ active, reduced }: { active: boolean; reduced: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <SectionLabel no="01" en="HISTORY" />
      <h2 className="font-display text-4xl font-bold max-sm:text-2xl">
        <SplitText text="クッキーランの歩み" active={active} reduced={reduced} />
      </h2>
    </div>
  );
}

/** 動きを減らす設定: 静的な一覧（普通にスクロール）。 */
function StaticTimeline({ items }: { items: TimelineItem[] }) {
  const ref = useRef<HTMLElement>(null);
  useSectionAccent(ref, "#FF8A3D");
  return (
    <section
      ref={ref}
      aria-label="年表"
      className="flex flex-col items-center gap-8 px-4 py-16"
      style={{
        background: "linear-gradient(to bottom, var(--color-bg), #3a1a0c 50%, var(--color-bg))",
      }}
    >
      <Heading active reduced />
      {items.length === 0 ? (
        <p className="text-text-muted">年表データを準備中です。</p>
      ) : (
        <ol className="m-0 flex w-full max-w-[1200px] list-none flex-wrap justify-center gap-6 p-0">
          {items.map((item) => (
            <StaticCard key={`${item.year}-${item.title}`} item={item} />
          ))}
        </ol>
      )}
    </section>
  );
}

function ScrollTimeline({ items }: { items: TimelineItem[] }) {
  const ref = useRef<HTMLElement>(null);
  const visible = useVisible(ref);
  useSectionAccent(ref, "#FF8A3D");
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const { scrollYProgress: enter } = useScroll({
    target: ref,
    offset: ["start end", "start start"],
  });
  const clip = useTransform(enter, [0, 1], ["circle(0% at 50% 50%)", "circle(100% at 50% 50%)"]);

  const thresholds = useMemo(() => cardThresholds(items.length), [items.length]);
  const countAt = (v: number) => thresholds.filter((t) => v >= t).length;
  const [shown, setShown] = useState(() => countAt(p.get()));
  useMotionValueEvent(p, "change", (v) => setShown(countAt(v)));
  const eraIdx = Math.max(0, Math.min(items.length - 1, shown - 1));
  const themes = useMemo(() => items.map((it, i) => eraTheme(it, i)), [items]);
  const theme = themes[eraIdx];
  const item = items[eraIdx];
  const glow = theme?.glow ?? "#FF8A3D";

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
      data-running={visible ? "true" : "false"}
      className="relative"
      style={{ height: "600vh" }}
    >
      <motion.div className="sticky top-0 h-svh overflow-hidden bg-bg" style={{ clipPath: clip }}>
        {/* 年ごとに切り替わる背景色（クロスフェード） */}
        {themes.map((th, i) => (
          <motion.div
            // biome-ignore lint/suspicious/noArrayIndexKey: 年表の並びは固定
            key={i}
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: `linear-gradient(to bottom, ${th.from}, ${th.to} 85%)` }}
            initial={{ opacity: i === 0 ? 1 : 0 }}
            animate={{ opacity: i === eraIdx ? 1 : 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        ))}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[70%]"
          style={{ background: `radial-gradient(60% 80% at 50% 100%, ${glow}66, transparent 70%)` }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute top-0 left-0 h-full w-[300%]"
          style={{
            x: l1,
            backgroundImage:
              "radial-gradient(circle, rgb(255 244 230 / 0.5) 1.5px, transparent 2px)",
            backgroundSize: "140px 140px",
          }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute bottom-[8svh] left-0 h-[34svh] w-[300%]"
          style={{
            x: l2,
            backgroundImage: "radial-gradient(ellipse at 50% 100%, #1a0c10cc 62%, transparent 63%)",
            backgroundSize: "480px 100%",
          }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[10svh] w-[300%] border-t-4"
          style={{
            x: l3,
            borderColor: glow,
            backgroundImage: "repeating-linear-gradient(90deg, #5a4234 0 60px, #4a3528 60px 120px)",
          }}
        />

        {/* 巨大な年の数字 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-[8svh] flex justify-center overflow-hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={item?.year ?? 0}
              className="font-display text-[clamp(8rem,30vw,26rem)] leading-[0.85] font-bold tabular-nums"
              style={{
                backgroundImage: `linear-gradient(to bottom, #fff4e6f0, ${glow}55 70%, transparent)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
              initial={{ opacity: 0, scale: 1.35, y: 60 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -40 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {item?.year}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 年ごとに登場するキャラ */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={eraIdx}
            aria-hidden="true"
            className="pointer-events-none absolute right-[4%] bottom-[9svh] flex items-end gap-2 max-sm:hidden"
            initial={{ opacity: 0, x: 160 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ type: "spring", visualDuration: 0.5, bounce: 0.25 }}
          >
            {(theme?.guests ?? []).map((g) => (
              <Chara
                key={g.id}
                cookie={g}
                motionIds={theme?.guestMotion ?? ["idle"]}
                reduced={false}
                className="h-[clamp(110px,18svh,200px)] w-[clamp(110px,18svh,200px)]"
              />
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-x-0 top-[5svh] z-10 flex flex-col items-center gap-4 px-4 max-sm:top-[3svh] max-sm:gap-2">
          <Heading active={visible} reduced={false} />
          {items.length === 0 ? (
            <p className="text-text-muted">年表データを準備中です。</p>
          ) : (
            <ol className="m-0 flex list-none flex-wrap justify-center gap-3 p-0 max-sm:w-full max-sm:flex-col max-sm:items-stretch max-sm:gap-2">
              {items.map((it, i) => (
                <Card
                  key={`${it.year}-${it.title}`}
                  item={it}
                  active={i < shown}
                  current={i === eraIdx && shown > 0}
                  glow={themes[i]?.glow ?? "#FF8A3D"}
                />
              ))}
            </ol>
          )}
        </div>

        {/* 歴史を走り抜けるキャラ（作品に合わせて入れ替わる） */}
        <motion.div
          data-testid="timeline-runner"
          aria-hidden="true"
          className="absolute bottom-[6svh] left-0 z-20 h-32 w-32 sm:h-40 sm:w-40"
          style={{ x: runnerX }}
        >
          <Chara
            cookie={theme?.game === "kingdom" ? KINGDOM[0] : OVEN[0]}
            motionIds={["run"]}
            reduced={false}
            className="h-full w-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

export function TimelineSection({ items, reduced }: { items: TimelineItem[]; reduced: boolean }) {
  const sorted = useMemo(() => [...items].sort((a, b) => a.year - b.year), [items]);
  return reduced ? <StaticTimeline items={sorted} /> : <ScrollTimeline items={sorted} />;
}
