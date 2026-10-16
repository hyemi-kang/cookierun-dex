import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { ParticleCanvas, type ParticleCanvasHandle } from "../fx/ParticleCanvas";
import { Chara } from "./Chara";
import { SectionLabel, useSectionAccent } from "./chrome";
import { EmberCanvas } from "./EmberCanvas";
import { useVisible } from "./hooks";
import { SplitText } from "./SplitText";
import { BUTTER, JELLY, KINGDOM, OVEN, PRIMARY } from "./util";

const POP = { type: "spring", visualDuration: 0.5, bounce: 0.45 } as const;
/** 走り抜けるのに使う進捗の範囲（0〜RUN_END）。以降は CTA */
const RUN_END = 0.6;

function CtaButton({
  navigate,
  shown,
  reduced,
}: {
  navigate: (to: string) => void;
  shown: boolean;
  reduced: boolean;
}) {
  return (
    <motion.button
      type="button"
      data-testid="cta-dex"
      onClick={() => navigate("/")}
      tabIndex={shown ? 0 : -1}
      aria-hidden={shown ? undefined : true}
      className="relative min-h-14 overflow-hidden rounded-full bg-primary px-12 py-4 text-2xl font-bold text-on-primary"
      style={{ boxShadow: "0 0 40px rgb(255 138 61 / 0.7), 0 10px 30px -8px #000a" }}
      initial={reduced ? false : { opacity: 0, scale: 0.4 }}
      animate={reduced ? undefined : shown ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
      transition={POP}
      whileHover={reduced ? undefined : { scale: 1.06 }}
      whileTap={reduced ? undefined : { scale: 0.96 }}
    >
      図鑑を見る
      {shown && !reduced && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/40"
          style={{ skewX: -20 }}
          initial={{ x: "-150%" }}
          animate={{ x: "400%" }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
        />
      )}
    </motion.button>
  );
}

/** 動きを減らす設定: 静止したキャラと CTA（runner は静止） */
function StaticFinale({ navigate }: { navigate: (to: string) => void }) {
  const ref = useRef<HTMLElement>(null);
  useSectionAccent(ref, PRIMARY);
  return (
    <section
      ref={ref}
      aria-labelledby="finale-heading"
      className="flex min-h-[70svh] flex-col items-center justify-center gap-8 px-4 py-16 text-center"
      style={{
        background: "radial-gradient(60% 70% at 50% 100%, #FF8A3D55, transparent 70%), #1a1210",
      }}
    >
      <SectionLabel no="05" en="START" />
      <h2 id="finale-heading" className="font-display text-4xl font-bold">
        さあ、オーブンの外へ
      </h2>
      <div data-testid="runner" className="h-40 w-40">
        <Chara cookie={OVEN[0]} motionIds={["run"]} reduced className="h-full w-full" />
      </div>
      <CtaButton navigate={navigate} shown reduced />
    </section>
  );
}

function ScrollFinale({ navigate }: { navigate: (to: string) => void }) {
  const ref = useRef<HTMLElement>(null);
  const visible = useVisible(ref);
  const particles = useRef<ParticleCanvasHandle>(null);
  const bucket = useRef(0);
  useSectionAccent(ref, PRIMARY);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const runnerX = useTransform(p, [0, RUN_END], ["-20vw", "120vw"]);
  const trail = useTransform(p, (v) =>
    Math.max(0, (-20 + 140 * Math.min(1, v / RUN_END) + 7) / 100),
  );
  const trailOpacity = useTransform(p, [RUN_END, 1], [1, 0.85]);
  const [shown, setShown] = useState(false);

  useMotionValueEvent(p, "change", (v) => {
    setShown(v >= RUN_END - 0.05);
    // 走り抜ける途中、足元から粒子を弾けさせる（0.1 刻み）
    const b = Math.floor(v / 0.1);
    if (b !== bucket.current) {
      bucket.current = b;
      if (v > 0.05 && v < RUN_END + 0.05) {
        const x = Math.min(0.95, Math.max(0.05, (-20 + 140 * Math.min(1, v / RUN_END) + 7) / 100));
        particles.current?.burst({ count: 36, x, y: 0.82, colors: [PRIMARY, BUTTER, JELLY] });
      }
    }
  });

  return (
    <section
      ref={ref}
      aria-labelledby="finale-heading"
      data-testid="finale-section"
      className="relative"
      style={{ height: "250vh" }}
    >
      <div
        className="sticky top-0 h-svh overflow-hidden"
        style={{
          background:
            "radial-gradient(70% 60% at 50% 100%, #FF8A3D66, transparent 70%), linear-gradient(to bottom, #1a1210, #2a1226 60%, #3a1a10)",
        }}
      >
        <EmberCanvas active={visible} max={100} rate={30} />
        <div className="pointer-events-none absolute inset-0 z-[5]">
          <ParticleCanvas ref={particles} maxParticles={160} />
        </div>

        <div className="absolute inset-x-0 top-[12svh] z-10 flex flex-col items-center gap-8 px-4 text-center">
          <SectionLabel no="05" en="START" />
          <h2
            id="finale-heading"
            className="font-display text-[clamp(2.25rem,6vw,5.5rem)] leading-tight font-bold"
          >
            <SplitText
              text="さあ、オーブンの外へ"
              active={shown}
              reduced={false}
              bounce
              stagger={0.05}
            />
          </h2>
          <CtaButton navigate={navigate} shown={shown} reduced={false} />
        </div>

        {/* 地面と光の軌跡 */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[8svh] border-t-4 border-primary"
          style={{
            background: "repeating-linear-gradient(90deg, #5a4234 0 60px, #4a3528 60px 120px)",
          }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute bottom-[calc(8svh+2.5rem)] left-0 h-3 w-screen origin-left rounded-full"
          style={{
            scaleX: trail,
            opacity: trailOpacity,
            background: "linear-gradient(90deg, transparent, #FF6FA8 30%, #FFC845 70%, #fff4e6)",
            boxShadow: "0 0 24px #FFC845, 0 0 60px #FF8A3D",
          }}
        />

        {/* 走り抜けたあとに登場して喜ぶ仲間 */}
        {[KINGDOM[0] ?? OVEN[0], KINGDOM[1] ?? OVEN[1]].map((c, i) => (
          <motion.div
            key={c?.id ?? i}
            aria-hidden="true"
            className="absolute bottom-[8svh] z-10 h-[clamp(110px,16vw,230px)] w-[clamp(110px,16vw,230px)] max-sm:hidden"
            style={{ [i === 0 ? "left" : "right"]: "8%" }}
            initial={{ opacity: 0, y: 120, scale: 0.4 }}
            animate={shown ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 120, scale: 0.4 }}
            transition={{ ...POP, delay: 0.2 + i * 0.12 }}
          >
            <Chara
              cookie={c}
              motionIds={["joy", "idle"]}
              reduced={false}
              className="h-full w-full"
            />
          </motion.div>
        ))}
        <motion.div
          data-testid="runner"
          className="absolute bottom-[8svh] left-0 z-20 h-[clamp(110px,14vw,200px)] w-[clamp(110px,14vw,200px)]"
          style={{ x: runnerX }}
        >
          <Chara
            cookie={OVEN[0]}
            motionIds={["run_fast", "run"]}
            reduced={false}
            className="h-full w-full"
          />
        </motion.div>
      </div>
    </section>
  );
}

export function Finale({
  reduced,
  navigate,
}: {
  reduced: boolean;
  navigate: (to: string) => void;
}) {
  return reduced ? <StaticFinale navigate={navigate} /> : <ScrollFinale navigate={navigate} />;
}
