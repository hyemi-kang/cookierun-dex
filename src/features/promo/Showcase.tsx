import {
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import { type ReactNode, useContext, useEffect, useRef, useState } from "react";
import type { Character } from "../../types/character";
import { FallbackActor, SkillFx } from "../fx";
import { Chara } from "./Chara";
import { AccentContext, SectionLabel, useSectionAccent } from "./chrome";
import { useVisible } from "./hooks";
import { SplitText } from "./SplitText";
import { CHARS, fallbackAction, gradeColor } from "./util";

/** デモに使うキャラ。スキルと動作素材があるものを優先（なければ先頭） */
const TEAM = (() => {
  const t = CHARS.filter((c) => c.skill && c.motions.length > 0);
  return t.length > 0 ? t : CHARS.slice(0, 1);
})();

const SCENES = [
  {
    no: "01",
    title: "回して見る",
    text: "立ち絵のカードをドラッグで自由に回転。裏面にはステータスが並びます。",
    accent: "#FF6FA8",
    from: "#3a1430",
  },
  {
    no: "02",
    title: "動きを切り替える",
    text: "待機・走る・ジャンプ。ボタンひとつで、公式の動作アニメに切り替わります。",
    accent: "#7BD88F",
    from: "#10303a",
  },
  {
    no: "03",
    title: "スキルを撃つ",
    text: "画面いっぱいの光と粒子。好きなタイミングでスキル演出を発動できます。",
    accent: "#FFC845",
    from: "#3a2a0c",
  },
] as const;

const BTN =
  "min-h-11 rounded-md bg-surface-2 px-4 text-base font-bold text-text aria-pressed:bg-primary aria-pressed:text-on-primary";

function Picker({ idx, onPick }: { idx: number; onPick: (i: number) => void }) {
  if (TEAM.length < 2) return null;
  return (
    <fieldset
      aria-label="デモのキャラクターを選ぶ"
      className="m-0 flex min-w-0 flex-wrap justify-center gap-2 border-0 p-0"
    >
      {TEAM.map((c, i) => (
        <button
          key={c.id}
          type="button"
          className={BTN}
          aria-pressed={i === idx}
          onClick={() => onPick(i)}
        >
          <span aria-hidden="true">{c.names.ja.replace(/クッキー$/, "")}</span>
          <span className="sr-only">{c.names.ja}</span>
        </button>
      ))}
    </fieldset>
  );
}

/* ---------- (a) 回転する3Dカード ---------- */

function SpinCard({
  cookie,
  reduced,
  active,
  picker,
}: {
  cookie: Character;
  reduced: boolean;
  active: boolean;
  picker: ReactNode;
}) {
  const [spinning, setSpinning] = useState(!reduced);
  const rot = useMotionValue(0);
  useAnimationFrame((_, delta) => {
    if (spinning && active) rot.set(rot.get() + delta * 0.045);
  });
  const sheen = useTransform(rot, (v) => `${((((v % 360) + 360) % 360) / 360) * 240 - 120}%`);
  const color = gradeColor(cookie.rarity);

  const settle = () => {
    const target = Math.round(rot.get() / 180) * 180;
    animate(rot, target, { type: "spring", stiffness: 140, damping: 18 });
  };
  const toggleSpin = () => {
    if (spinning) {
      setSpinning(false);
      settle();
    } else {
      setSpinning(true);
    }
  };
  const flip = () => {
    setSpinning(false);
    const target = (Math.round(rot.get() / 180) + 1) * 180;
    if (reduced) rot.set(target);
    else animate(rot, target, { type: "spring", visualDuration: 0.5, bounce: 0.3 });
  };

  const face =
    "absolute inset-0 overflow-hidden rounded-[24px] border-4 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]";
  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className="aspect-[5/7] h-[clamp(480px,62svh,620px)]"
        style={{ perspective: 1100 }}
        data-testid="showcase-card"
      >
        <motion.div
          className="relative h-full w-full"
          style={{ rotateY: rot, transformStyle: "preserve-3d" }}
        >
          <div
            className={face}
            style={{
              borderColor: color,
              background: `linear-gradient(160deg, ${color}55, #1a1210 70%)`,
              boxShadow: `0 0 48px ${color}77`,
            }}
          >
            <div className="flex h-full w-full items-end justify-center p-4 pb-20">
              <FallbackActor
                imageSrc={cookie.images.illustration}
                alt={cookie.names.ja}
                action="idle"
                reduced={reduced}
              />
            </div>
            <motion.div
              aria-hidden="true"
              className="promo-card-holo absolute inset-y-0 -left-1/2 w-full opacity-60"
              style={{ x: sheen }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-bg/80 px-4 py-3 text-center">
              <p className="text-2xl font-bold">{cookie.names.ja}</p>
              <p className="text-lg font-bold" style={{ color }}>
                {cookie.rarity}
              </p>
            </div>
          </div>
          <div
            className={face}
            style={{
              borderColor: color,
              transform: "rotateY(180deg)",
              background: "linear-gradient(160deg, #2a1e19, #1a1210)",
              boxShadow: `0 0 48px ${color}77`,
            }}
          >
            <dl className="flex h-full flex-col justify-center gap-5 p-8 text-xl">
              <p className="font-display text-3xl font-bold tracking-widest" style={{ color }}>
                STATUS
              </p>
              {(
                [
                  ["等級", cookie.rarity],
                  ["役割", cookie.role ?? "—"],
                  ["配置", cookie.position ?? "—"],
                  ["リリース", cookie.releaseDate ?? "—"],
                  ["スキル", cookie.skill?.name ?? "—"],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-border pb-2">
                  <dt className="text-text-muted">{k}</dt>
                  <dd className="font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </motion.div>
      </div>
      <div className="flex gap-3">
        {!reduced && (
          <button type="button" className={BTN} aria-pressed={spinning} onClick={toggleSpin}>
            自動で回す
          </button>
        )}
        <button type="button" className={BTN} onClick={flip}>
          裏返す
        </button>
      </div>
      {picker}
    </div>
  );
}

/* ---------- (b) 動作の切り替え ---------- */

function MotionDemo({
  cookie,
  reduced,
  picker,
}: {
  cookie: Character;
  reduced: boolean;
  picker: ReactNode;
}) {
  const motions = cookie.motions.slice(0, 6);
  const [pickedId, setId] = useState("run");
  const id = motions.some((m) => m.id === pickedId) ? pickedId : (motions[0]?.id ?? "");
  const [played, setPlayed] = useState(!reduced);
  const [failed, setFailed] = useState<string | null>(null);
  const cur = motions.find((m) => m.id === id);
  const src = cur ? (played ? cur.src : cur.still) : undefined;
  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className="relative flex h-[clamp(380px,62svh,620px)] w-[min(90vw,680px)] items-end justify-center overflow-hidden rounded-2xl border border-border bg-black/30"
        data-testid="showcase-motion-stage"
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{ background: "radial-gradient(60% 100% at 50% 100%, #7BD88F77, transparent)" }}
        />
        {!cur || !src || failed === src ? (
          <FallbackActor
            imageSrc={cookie.images.illustration}
            alt={cookie.names.ja}
            action={fallbackAction(cur?.id)}
            reduced={reduced}
            className="p-6"
          />
        ) : (
          <motion.img
            key={src}
            src={src}
            alt={`${cookie.names.ja}の「${cur.label}」`}
            draggable={false}
            onError={() => setFailed(src)}
            className="relative h-full w-full object-contain p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12 }}
          />
        )}
      </div>
      <div className="flex max-w-[680px] flex-wrap justify-center gap-3">
        {motions.map((m) => (
          <button
            key={m.id}
            type="button"
            className={BTN}
            aria-pressed={m.id === id}
            onClick={() => {
              setId(m.id);
              setPlayed(true);
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      {picker}
    </div>
  );
}

/* ---------- (c) スキル演出 ---------- */

function SkillDemo({
  cookie,
  reduced,
  picker,
}: {
  cookie: Character;
  reduced: boolean;
  picker: ReactNode;
}) {
  const [trigger, setTrigger] = useState(0);
  const [firing, setFiring] = useState(false);
  const color = cookie.theme?.accent ?? gradeColor(cookie.rarity);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const fire = () => {
    setTrigger((t) => t + 1);
    setFiring(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFiring(false), 1300);
  };
  return (
    <>
      <div className="flex flex-col items-center gap-5">
        <motion.div
          key={trigger}
          className="h-[clamp(300px,50svh,500px)] w-[min(80vw,500px)]"
          initial={{ scale: 1 }}
          animate={trigger > 0 && !reduced ? { scale: [1, 1.14, 0.96, 1] } : undefined}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Chara
            cookie={cookie}
            motionIds={firing ? ["skill1", "idle"] : ["idle"]}
            reduced={reduced}
            className="h-full w-full"
          />
        </motion.div>
        <button
          type="button"
          onClick={fire}
          data-testid="showcase-skill-btn"
          className="min-h-14 rounded-full bg-primary px-12 text-2xl font-bold text-on-primary shadow-[0_0_32px_rgb(255_138_61/0.6)]"
        >
          スキル発動
        </button>
        <div className="max-w-[560px] rounded-xl border border-border bg-bg/80 px-6 py-4 text-center">
          <p
            className="font-display text-2xl font-bold"
            style={{ color: gradeColor(cookie.rarity) }}
          >
            {cookie.skill?.name ?? "スキル"}
          </p>
          <p className="mt-1 text-base text-text">{cookie.skill?.summary ?? "スキル情報なし"}</p>
        </div>
        {picker}
      </div>
      <SkillFx
        trigger={trigger}
        skillName={cookie.skill?.name ?? "スキル"}
        color={color}
        reduced={reduced}
        intense
      />
    </>
  );
}

function SceneBody({
  i,
  idx,
  onPick,
  reduced,
  active,
}: {
  i: number;
  idx: number;
  onPick: (i: number) => void;
  reduced: boolean;
  active: boolean;
}): ReactNode {
  const cookie = TEAM[idx] ?? (CHARS[0] as Character);
  const picker = <Picker idx={idx} onPick={onPick} />;
  if (i === 0)
    return <SpinCard cookie={cookie} reduced={reduced} active={active} picker={picker} />;
  if (i === 1) return <MotionDemo cookie={cookie} reduced={reduced} picker={picker} />;
  return <SkillDemo cookie={cookie} reduced={reduced} picker={picker} />;
}

function SceneText({ i, active, reduced }: { i: number; active: boolean; reduced: boolean }) {
  const s = SCENES[i] as (typeof SCENES)[number];
  return (
    <div className="flex flex-col items-start gap-3 max-md:items-center max-md:text-center">
      <SectionLabel no="02" en="FEATURES" />
      <p
        aria-hidden="true"
        className="font-display text-[clamp(4rem,10vw,9rem)] leading-none font-bold tabular-nums opacity-30"
        style={{ color: s.accent }}
      >
        {s.no}
      </p>
      <h3 className="font-display text-[clamp(2rem,4.5vw,4rem)] leading-tight font-bold">
        <SplitText
          text={s.title}
          active={active}
          reduced={reduced}
          glow={`${s.accent}99`}
          className="justify-start max-md:justify-center"
        />
      </h3>
      <p className="max-w-[28rem] rounded-lg bg-bg/60 text-base text-text sm:text-lg">{s.text}</p>
    </div>
  );
}

/** 動きを減らす設定: 3場面を縦に並べた静的な構成 */
function StaticShowcase() {
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLElement>(null);
  useSectionAccent(ref, "#FF6FA8");
  return (
    <section ref={ref} aria-label="できること" className="flex flex-col">
      {SCENES.map((s, i) => (
        <div
          key={s.no}
          className="relative flex flex-col items-center gap-8 overflow-hidden px-6 py-16 md:flex-row md:justify-center md:gap-16"
          style={{ background: `linear-gradient(to bottom, ${s.from}, var(--color-bg))` }}
        >
          <SceneText i={i} active reduced />
          <SceneBody i={i} idx={idx} onPick={setIdx} reduced active={false} />
        </div>
      ))}
    </section>
  );
}

function ScrollShowcase() {
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const visible = useVisible(ref);
  const setAccent = useContext(AccentContext);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const { scrollYProgress: enter } = useScroll({
    target: ref,
    offset: ["start end", "start start"],
  });
  const scale = useTransform(enter, [0, 1], [0.8, 1]);
  const opacity = useTransform(enter, [0, 0.6], [0, 1]);
  const [scene, setScene] = useState(0);
  useMotionValueEvent(p, "change", (v) => setScene(v < 0.34 ? 0 : v < 0.67 ? 1 : 2));
  const sceneColor = (SCENES[scene] as (typeof SCENES)[number]).accent;
  useEffect(() => {
    if (!visible) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mid = window.innerHeight / 2;
    if (r.top < mid && r.bottom > mid) setAccent(sceneColor);
  }, [sceneColor, visible, setAccent]);
  useSectionAccent(ref, sceneColor);

  return (
    <section
      ref={ref}
      aria-label="できること"
      data-testid="showcase-section"
      className="relative"
      style={{ height: "300vh" }}
    >
      <motion.div className="sticky top-0 h-svh overflow-hidden bg-bg" style={{ scale, opacity }}>
        {SCENES.map((s, i) => (
          <motion.div
            key={s.no}
            className="absolute inset-0 grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)] items-center gap-8 px-[5vw] max-md:flex max-md:flex-col max-md:justify-center max-md:gap-4 max-md:px-4"
            style={{
              zIndex: i,
              background: `radial-gradient(60% 80% at 68% 55%, ${s.accent}55, transparent 70%), linear-gradient(to bottom, ${s.from}, #1a1210)`,
            }}
            initial={false}
            animate={{
              clipPath: scene >= i ? "circle(150% at 50% 50%)" : "circle(0% at 50% 50%)",
            }}
            transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
            inert={scene !== i}
            aria-hidden={scene !== i}
          >
            <SceneText i={i} active={scene === i} reduced={false} />
            <SceneBody
              i={i}
              idx={idx}
              onPick={setIdx}
              reduced={false}
              active={scene === i && visible}
            />
          </motion.div>
        ))}
        <div
          aria-hidden="true"
          className="absolute top-1/2 right-4 z-10 flex -translate-y-1/2 flex-col gap-3"
        >
          {SCENES.map((s, i) => (
            <span
              key={s.no}
              className="block h-3 w-3 rounded-full border-2"
              style={{
                borderColor: s.accent,
                background: i === scene ? s.accent : "transparent",
              }}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

export function Showcase({ reduced }: { reduced: boolean }) {
  if (TEAM.length === 0) return null;
  return reduced ? <StaticShowcase /> : <ScrollShowcase />;
}
