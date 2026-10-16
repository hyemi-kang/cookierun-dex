import {
  animate,
  type MotionValue,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Character } from "../../types/character";
import { ParticleCanvas, type ParticleCanvasHandle } from "../fx/ParticleCanvas";
import { SectionLabel, useSectionAccent } from "./chrome";
import { useVisible } from "./hooks";
import { SplitText } from "./SplitText";
import { CHARS, charUrl, gradeColor, JELLY, pickEven } from "./util";

const CARD_W = "clamp(120px, 13vw, 190px)";
const MAX_CARDS = 7;
const CARDS = pickEven(CHARS, MAX_CARDS);

/** カードの表面。立ち絵 + 名前。画像が読めなければ頭文字。 */
function Face({ cookie, hint }: { cookie: Character; hint?: boolean }) {
  const [failed, setFailed] = useState(false);
  const color = gradeColor(cookie.rarity);
  return (
    <span
      className="relative block h-full w-full overflow-hidden rounded-[18px] border-[3px]"
      style={{
        borderColor: color,
        background: `linear-gradient(160deg, ${color}66, #1a1210 75%)`,
      }}
    >
      {failed ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center font-display text-6xl font-bold"
          style={{ color }}
        >
          {cookie.names.ja.slice(0, 1)}
        </span>
      ) : (
        <img
          src={cookie.images.illustration}
          alt=""
          draggable={false}
          onError={() => setFailed(true)}
          className="absolute inset-x-0 top-2 bottom-12 h-[calc(100%-3.5rem)] w-full object-contain"
        />
      )}
      <span
        aria-hidden="true"
        className="promo-card-holo absolute inset-0 opacity-0 transition-opacity duration-150 group-hover:opacity-70 group-focus-visible:opacity-70"
      />
      <span className="absolute inset-x-0 bottom-0 bg-bg/85 px-2 py-1.5 text-center">
        <span className="block truncate text-sm font-bold">{cookie.names.ja}</span>
        <span className="block text-xs font-bold" style={{ color }}>
          {cookie.rarity}
        </span>
        {hint && <span className="sr-only">（選択すると詳細を表示）</span>}
      </span>
    </span>
  );
}

function onHolo(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * 100;
  const y = ((e.clientY - r.top) / r.height) * 100;
  el.style.setProperty("--hx", `${x}%`);
  el.style.setProperty("--hy", `${y}%`);
  el.style.transform = `perspective(600px) rotateY(${(x - 50) / 5}deg) rotateX(${-(y - 50) / 6}deg)`;
}
function offHolo(e: React.PointerEvent<HTMLElement>) {
  e.currentTarget.style.transform = "";
}

function FanCard({
  cookie,
  offset,
  open,
  selected,
  spinning,
  onSelect,
}: {
  cookie: Character;
  offset: number;
  open: MotionValue<number>;
  selected: boolean;
  spinning: boolean;
  onSelect: () => void;
}) {
  const sel = useMotionValue(0);
  useEffect(() => {
    const c = animate(sel, selected ? 1 : 0, { type: "spring", stiffness: 140, damping: 16 });
    return () => c.stop();
  }, [selected, sel]);
  const x = useTransform(
    [open, sel],
    (v: number[]) => `${offset * 9 * (v[0] ?? 0) * (1 - (v[1] ?? 0))}vw`,
  );
  const y = useTransform(
    [open, sel],
    (v: number[]) =>
      `${offset * offset * 1.2 * (v[0] ?? 0) * (1 - (v[1] ?? 0)) - (v[1] ?? 0) * 4}vw`,
  );
  const rotate = useTransform(
    [open, sel],
    (v: number[]) => offset * 7 * (v[0] ?? 0) * (1 - (v[1] ?? 0)),
  );
  const scale = useTransform(sel, (s) => 1 + 0.3 * s);
  const color = gradeColor(cookie.rarity);
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-[8svh]">
      <motion.div
        className="pointer-events-auto relative"
        style={{
          x,
          y,
          rotate,
          scale,
          width: CARD_W,
          aspectRatio: "5 / 7",
          transformOrigin: "50% 130%",
          zIndex: selected ? 50 : 10 - Math.abs(offset),
        }}
      >
        <motion.div
          aria-hidden="true"
          className={`absolute -inset-8 rounded-full blur-2xl ${spinning ? "promo-anim promo-spin" : ""}`}
          style={{
            opacity: sel,
            background: `conic-gradient(from 0deg, ${color}, transparent 30%, ${color} 50%, transparent 80%, ${color})`,
          }}
        />
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          onPointerMove={onHolo}
          onPointerLeave={offHolo}
          className="group relative block h-full w-full cursor-pointer rounded-[20px] transition-transform duration-150 hover:-translate-y-4"
          style={{ boxShadow: `0 18px 40px -10px #000c, 0 0 ${selected ? 40 : 0}px ${color}` }}
        >
          <Face cookie={cookie} hint />
        </button>
      </motion.div>
    </div>
  );
}

function Detail({
  cookie,
  navigate,
}: {
  cookie: Character | undefined;
  navigate: (to: string) => void;
}) {
  const color = cookie ? gradeColor(cookie.rarity) : "#BFB3A6";
  return (
    <div
      aria-live="polite"
      className="mx-auto flex max-w-[640px] flex-col items-center gap-1 rounded-xl bg-bg/85 px-6 py-3 text-center backdrop-blur-sm"
    >
      {cookie ? (
        <>
          <p className="text-lg font-bold">
            {cookie.names.ja}{" "}
            <span className="text-sm" style={{ color }}>
              {cookie.rarity}
              {cookie.role ? ` ・ ${cookie.role}` : ""}
            </span>
          </p>
          <p className="text-sm text-text-muted">
            {cookie.skill ? `${cookie.skill.name}: ${cookie.skill.summary}` : cookie.summary}
          </p>
          <a
            href={charUrl(cookie)}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              navigate(charUrl(cookie));
            }}
            className="inline-flex min-h-11 items-center text-sm font-bold text-accent underline"
          >
            {cookie.names.ja}を詳しく見る →
          </a>
        </>
      ) : (
        <p className="text-sm text-text-muted">カードを選ぶと、ここに詳細が出ます。</p>
      )}
    </div>
  );
}

function Heading({ active, reduced }: { active: boolean; reduced: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <SectionLabel no="03" en="CHARACTERS" />
      <h2 className="font-display text-[clamp(2rem,4.5vw,4rem)] leading-tight font-bold">
        <SplitText text="推しのクッキーを選ぼう" active={active} reduced={reduced} />
      </h2>
    </div>
  );
}

/** 動きを減らす設定: 扇ではなく並べた静的なカード */
function StaticFan({ cards, navigate }: { cards: Character[]; navigate: (to: string) => void }) {
  const ref = useRef<HTMLElement>(null);
  useSectionAccent(ref, "#C065E6");
  const [sel, setSel] = useState<string | null>(cards[0]?.id ?? null);
  const cur = cards.find((c) => c.id === sel);
  return (
    <section
      ref={ref}
      aria-label="キャラクター"
      className="flex flex-col items-center gap-8 px-4 py-16"
    >
      <Heading active reduced />
      <ul className="m-0 flex list-none flex-wrap justify-center gap-4 p-0">
        {cards.map((c) => (
          <li key={c.id} style={{ width: CARD_W, aspectRatio: "5 / 7" }}>
            <button
              type="button"
              aria-pressed={c.id === sel}
              onClick={() => setSel(c.id)}
              className="group block h-full w-full rounded-[20px]"
            >
              <Face cookie={c} />
            </button>
          </li>
        ))}
      </ul>
      <Detail cookie={cur} navigate={navigate} />
    </section>
  );
}

function ScrollFan({ cards, navigate }: { cards: Character[]; navigate: (to: string) => void }) {
  const ref = useRef<HTMLElement>(null);
  const visible = useVisible(ref);
  const particles = useRef<ParticleCanvasHandle>(null);
  useSectionAccent(ref, "#C065E6");
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const { scrollYProgress: enter } = useScroll({
    target: ref,
    offset: ["start end", "start start"],
  });
  const open = useTransform(p, [0.05, 0.5], [0, 1]);
  const clip = useTransform(enter, [0, 1], ["inset(50% 0% 50% 0%)", "inset(0% 0% 0% 0%)"]);
  const [sel, setSel] = useState<number | null>(null);
  const mid = Math.floor(cards.length / 2);
  useMotionValueEvent(open, "change", (v) => {
    if (v >= 0.9 && sel === null) setSel(mid);
  });

  useEffect(() => {
    if (sel === null || !visible) return;
    const c = cards[sel];
    if (!c) return;
    particles.current?.burst({
      count: 100,
      x: 0.5,
      y: 0.45,
      colors: [gradeColor(c.rarity), JELLY, "#FFF4E6"],
    });
  }, [sel, visible, cards]);

  const cur = sel === null ? undefined : cards[sel];
  return (
    <section
      ref={ref}
      aria-label="キャラクター"
      data-testid="fan-section"
      className="relative"
      style={{ height: "250vh" }}
    >
      <motion.div
        className="sticky top-0 h-svh overflow-hidden"
        style={{
          clipPath: clip,
          background:
            "radial-gradient(70% 60% at 50% 40%, #4f1a6a88, transparent 70%), linear-gradient(to bottom, #1a1210, #24102e 60%, #1a1210)",
        }}
      >
        <div className="absolute inset-x-0 top-[5svh] z-10 flex justify-center px-4">
          <Heading active={visible} reduced={false} />
        </div>
        <ul className="m-0 list-none p-0">
          {cards.map((c, i) => (
            <li key={c.id}>
              <FanCard
                cookie={c}
                offset={i - (cards.length - 1) / 2}
                open={open}
                selected={sel === i}
                spinning={visible}
                onSelect={() => setSel(i)}
              />
            </li>
          ))}
        </ul>
        <div className="pointer-events-none absolute inset-0 z-[60]">
          <ParticleCanvas ref={particles} maxParticles={160} />
        </div>
        <div className="absolute inset-x-0 bottom-[4svh] z-[70] px-4">
          <Detail cookie={cur} navigate={navigate} />
        </div>
      </motion.div>
    </section>
  );
}

export function FeatureFan({
  reduced,
  navigate,
}: {
  reduced: boolean;
  navigate: (to: string) => void;
}) {
  const cards = CARDS;
  if (cards.length === 0) return null;
  return reduced ? (
    <StaticFan cards={cards} navigate={navigate} />
  ) : (
    <ScrollFan cards={cards} navigate={navigate} />
  );
}
