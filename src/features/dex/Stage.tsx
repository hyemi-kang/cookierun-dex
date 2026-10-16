import {
  AnimatePresence,
  type MotionValue,
  motion,
  useAnimate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Character } from "../../types/character";
import { SkillFx } from "../fx";
import { ActionStage } from "./ActionStage";
import { CharacterCard3D } from "./CharacterCard3D";
import { BTN_PRIMARY, BTN_SECONDARY, gradeStyle, SPRING } from "./constants";
import type { DexView } from "./useDexUrl";

interface StageProps {
  character: Character | null;
  view: DexView;
  onViewChange: (v: DexView) => void;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onSkill: () => void;
  skillBusy: boolean;
  skillTrigger: number;
  reduced: boolean;
  onToast: (message: string) => void;
}

// 光の粒（L2）。位置は固定の疑似乱数
const DOTS = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 37 + 11) % 97}%`,
  top: `${(i * 53 + 7) % 91}%`,
  size: 3 + (i % 3) * 2,
}));

function ParallaxBg({
  rarity,
  reduced,
  px,
  py,
}: {
  rarity: string;
  reduced: boolean;
  px: MotionValue<number>;
  py: MotionValue<number>;
}) {
  const g = gradeStyle(rarity);
  // M8: 係数の違う3層（最大 ±24px）
  const l2x = useTransform(px, (v) => v * 8);
  const l2y = useTransform(py, (v) => v * 8);
  const l3x = useTransform(px, (v) => v * 24);
  const l3y = useTransform(py, (v) => v * 24);
  const l1x = useTransform(px, (v) => v * 4);
  const l1y = useTransform(py, (v) => v * 4);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div className="absolute -inset-8" style={reduced ? undefined : { x: l1x, y: l1y }}>
        <AnimatePresence initial={false}>
          <motion.div
            key={g.from}
            className="absolute inset-0"
            style={{ background: `linear-gradient(to bottom, ${g.from}, ${g.to})` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </AnimatePresence>
      </motion.div>
      <motion.div className="absolute -inset-8" style={reduced ? undefined : { x: l2x, y: l2y }}>
        {DOTS.map((d) => (
          <span
            key={d.left + d.top}
            className="absolute rounded-full bg-white/50"
            style={{ left: d.left, top: d.top, width: d.size, height: d.size }}
          />
        ))}
      </motion.div>
      <motion.div className="absolute -inset-8" style={reduced ? undefined : { x: l3x, y: l3y }}>
        <span className="absolute -left-10 bottom-0 size-64 rounded-full bg-jelly/15 blur-3xl" />
        <span className="absolute -right-10 top-10 size-56 rounded-full bg-accent/10 blur-3xl" />
      </motion.div>
    </div>
  );
}

/** 中央のステージ: 背景、カード/ステージ表示、スキル演出、操作バー */
export function Stage(p: StageProps) {
  const { character, view, reduced } = p;
  const [signals, setSignals] = useState({ flip: 0, reset: 0 });
  const [scope, animateEl] = useAnimate<HTMLDivElement>();

  // 退場中の同じキーが復活して古い角度を引き継がないよう、切替のたびにキーを新しくする
  const lastKey = useRef("");
  const epoch = useRef(0);
  const target = `${view}-${character?.id ?? "none"}`;
  if (lastKey.current !== target) {
    lastKey.current = target;
    epoch.current += 1;
  }
  const swapKey = `${target}-${epoch.current}`;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const px = useSpring(rawX, SPRING.soft);
  const py = useSpring(rawY, SPRING.soft);

  // M14: ステージの揺れ（最大 8px から 300ms で減衰）。reduced は揺らさない
  useEffect(() => {
    if (p.skillTrigger === 0 || reduced || !scope.current) return;
    animateEl(
      scope.current,
      { x: [0, 8, -6, 4, -2, 0], y: [0, -4, 3, -2, 1, 0] },
      { duration: 0.3, ease: "easeOut" },
    );
  }, [p.skillTrigger, reduced, scope, animateEl]);

  const enter = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.18 } } }
    : {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1, transition: SPRING.pop },
      };
  const exit = reduced
    ? { opacity: 0, transition: { duration: 0.12 } }
    : { opacity: 0, scale: 0.85, transition: { duration: 0.18, ease: "easeIn" as const } };

  const skillColor = character
    ? (character.theme?.accent ?? gradeStyle(character.rarity).badge)
    : "#FFC845";

  return (
    <section
      aria-label="ステージ"
      className="relative flex min-h-[520px] flex-col overflow-hidden rounded-lg border border-border max-[1279px]:min-h-[480px] min-[1280px]:h-full"
      onPointerMove={(e) => {
        if (reduced) return;
        const r = e.currentTarget.getBoundingClientRect();
        rawX.set(((e.clientX - r.left) / r.width) * 2 - 1);
        rawY.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
    >
      <ParallaxBg rarity={character?.rarity ?? "Common"} reduced={reduced} px={px} py={py} />

      <div ref={scope} className="relative z-10 grid flex-1 place-items-center p-4 pb-2">
        {character ? (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={swapKey} initial={enter.initial} animate={enter.animate} exit={exit}>
              {view === "card" ? (
                <CharacterCard3D
                  character={character}
                  reduced={reduced}
                  flipSignal={signals.flip}
                  resetSignal={signals.reset}
                />
              ) : (
                <ActionStage
                  character={character}
                  reduced={reduced}
                  skillBusy={p.skillBusy}
                  onToast={p.onToast}
                />
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div
            data-testid="no-selection"
            className="rounded-lg bg-surface/80 p-6 text-center text-base"
          >
            <p className="font-bold">キャラを選んでください</p>
            <p className="text-sm text-text-muted">左の一覧からクッキーを選んでください</p>
          </div>
        )}
      </div>

      {character && (
        <SkillFx
          trigger={p.skillTrigger}
          skillName={character.skill?.name ?? "スキル"}
          color={skillColor}
          reduced={reduced}
        />
      )}

      <div className="relative z-30 flex flex-col items-center gap-3 px-4 pb-6 pt-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" className={BTN_SECONDARY} onClick={p.onPrev} disabled={!character}>
            <span aria-hidden="true">◀</span> 前へ
          </button>
          {view === "card" && (
            <>
              <button
                type="button"
                data-testid="flip-card"
                className={BTN_SECONDARY}
                disabled={!character}
                onClick={() => setSignals((s) => ({ ...s, flip: s.flip + 1 }))}
              >
                裏返す
              </button>
              <button
                type="button"
                data-testid="reset-rotation"
                className={BTN_SECONDARY}
                disabled={!character}
                onClick={() => setSignals((s) => ({ ...s, reset: s.reset + 1 }))}
              >
                正面
              </button>
            </>
          )}
          <button
            type="button"
            data-testid="skill-btn"
            className={BTN_PRIMARY}
            disabled={!character || p.skillBusy}
            onClick={p.onSkill}
          >
            スキル発動 <span aria-hidden="true">⏎</span>
          </button>
          <button type="button" className={BTN_SECONDARY} onClick={p.onNext} disabled={!character}>
            次へ <span aria-hidden="true">▶</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <fieldset
            aria-label="表示切替"
            className="m-0 flex min-w-0 gap-1 rounded-full border-0 bg-surface-2 p-1"
          >
            {(["card", "stage"] as const).map((v) => (
              <button
                key={v}
                type="button"
                data-testid={`view-${v}`}
                aria-pressed={view === v}
                onClick={() => p.onViewChange(v)}
                className={`min-h-11 min-w-11 cursor-pointer rounded-full px-4 text-sm font-bold ${
                  view === v ? "bg-primary text-on-primary" : "text-text"
                }`}
              >
                {v === "card" ? "カード" : "ステージ表示"}
              </button>
            ))}
          </fieldset>
          {character && (
            <span
              data-testid="position"
              className="font-display text-sm tabular-nums text-text-muted"
            >
              {p.index + 1} / {p.total}
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted">⏎ スキル / ← → 切替</p>
      </div>
    </section>
  );
}
