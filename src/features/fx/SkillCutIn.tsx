import { motion } from "motion/react";

export interface SkillCutInProps {
  name: string;
  /** 等級のテーマ色 (#RRGGBB) */
  color: string;
  /** true のときは中央でフェードのみ（合計 800ms） */
  reduced?: boolean;
}

/** スキル名のカットイン。通常: 100ms 待機 → 250 入る → 600 停止 → 250 出る（約1.2秒）。 */
export function SkillCutIn({ name, color, reduced = false }: SkillCutInProps) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <motion.div
        data-testid="skill-cutin"
        aria-hidden="true"
        className="font-display text-4xl font-extrabold text-text sm:text-6xl"
        style={{
          background: "rgb(26 18 16 / 0.88)",
          borderLeft: `12px solid ${color}`,
          borderRight: `12px solid ${color}`,
          padding: "8px 40px",
          maxWidth: "100%",
          textAlign: "center",
          textShadow: `0 0 18px ${color}`,
          skewX: reduced ? 0 : -12,
        }}
        initial={reduced ? { opacity: 0 } : { opacity: 0, x: "-110%" }}
        animate={
          reduced
            ? { opacity: [0, 1, 1, 0] }
            : { opacity: [0, 1, 1, 0], x: ["-110%", "0%", "0%", "110%"] }
        }
        transition={
          reduced
            ? { duration: 0.8, times: [0, 0.25, 0.75, 1], ease: "linear" }
            : {
                delay: 0.1,
                duration: 1.1,
                times: [0, 0.227, 0.773, 1],
                ease: ["easeOut", "linear", "easeIn"],
              }
        }
      >
        {name}
      </motion.div>
    </div>
  );
}
