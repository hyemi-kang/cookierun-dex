import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ParticleCanvas, type ParticleCanvasHandle } from "./ParticleCanvas";
import { SkillCutIn } from "./SkillCutIn";

export interface SkillFxProps {
  /** 連番。値が変わるたびに演出を1回再生する（連打時は最初からやり直し） */
  trigger: number;
  skillName: string;
  /** 等級のテーマ色 (#RRGGBB) */
  color: string;
  /** 動きを減らす設定。true のときはスキル名の表示だけ */
  reduced: boolean;
}

/** 演出の全体時間（ms）。カットイン 1.2 秒 + 余裕。2.5 秒以内に必ず DOM から外れる。 */
const TOTAL_MS = 1300;
const REDUCED_MS = 850;
const JELLY = "#FF6FA8";
const PARTICLE_COUNT = 100; // 80〜120
const FLASH_WINDOW_MS = 1000;
const FLASH_MAX_IN_WINDOW = 3;

interface Run {
  id: number;
  flash: boolean;
  skillName: string;
  color: string;
}

/**
 * スキル演出。親要素を `position: relative` にして、その全面に重ねる（pointer-events なし）。
 * 揺れは、この重ね層（粒子・カットイン）自身を動かして表現する。
 */
export function SkillFx({ trigger, skillName, color, reduced }: SkillFxProps) {
  const [run, setRun] = useState<Run | null>(null);
  const prevTrigger = useRef(trigger);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimes = useRef<number[]>([]);
  const latest = useRef({ reduced, skillName, color });
  latest.current = { reduced, skillName, color };

  useEffect(() => {
    if (trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;

    const now = performance.now();
    flashTimes.current = flashTimes.current.filter((t) => now - t < FLASH_WINDOW_MS);
    const isReduced = latest.current.reduced;
    const flash = !isReduced && flashTimes.current.length < FLASH_MAX_IN_WINDOW;
    if (flash) flashTimes.current.push(now);

    setRun({
      id: trigger,
      flash,
      skillName: latest.current.skillName,
      color: latest.current.color,
    });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setRun(null), isReduced ? REDUCED_MS : TOTAL_MS);
  }, [trigger]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  if (!run) return null;

  return (
    <div
      key={run.id}
      data-fx="skill"
      className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
    >
      {reduced ? (
        <SkillCutIn name={run.skillName} color={run.color} reduced />
      ) : (
        <FullFx skillName={run.skillName} color={run.color} flash={run.flash} />
      )}
    </div>
  );
}

function FullFx({ skillName, color, flash }: { skillName: string; color: string; flash: boolean }) {
  const particles = useRef<ParticleCanvasHandle>(null);

  useEffect(() => {
    particles.current?.burst({ count: PARTICLE_COUNT, colors: [color, JELLY, "#FFF4E6"] });
  }, [color]);

  return (
    <>
      {flash && (
        <motion.div
          data-testid="skill-flash"
          aria-hidden="true"
          className="absolute inset-0 bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 0.15, times: [0, 0.4, 1], ease: "linear" }}
        />
      )}
      {/* 揺れ: 最大 8px から 300ms で減衰 */}
      <motion.div
        className="absolute inset-0"
        initial={{ x: 0, y: 0 }}
        animate={{ x: [0, 8, -6, 4, -2, 0], y: [0, -4, 3, -2, 1, 0] }}
        transition={{ duration: 0.3, ease: "linear" }}
      >
        <ParticleCanvas ref={particles} maxParticles={160} />
        <SkillCutIn name={skillName} color={color} />
      </motion.div>
    </>
  );
}
