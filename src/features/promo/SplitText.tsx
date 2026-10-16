import { motion } from "motion/react";
import { useMemo } from "react";

const GRAD = "linear-gradient(90deg, #FFF4E6 0%, #FFC845 35%, #FF8A3D 70%, #FF6FA8 100%)";
const isNarrow = (ch: string) => /[\x20-\x7e]/.test(ch);

/**
 * 見出し。グラデーション + グロー、1文字ずつのスタッガー表示。
 * 文字ごとにグラデーションの位置をずらして、全体で1本のグラデーションに見せる。
 * `active` が true になると出現する。reduced は出現アニメーションなし（フェードもなし）。
 */
export function SplitText({
  text,
  active,
  reduced,
  className = "",
  glow = "rgb(255 138 61 / 0.55)",
  stagger = 0.04,
  delay = 0,
  bounce = false,
}: {
  text: string;
  active: boolean;
  reduced: boolean;
  className?: string;
  glow?: string;
  stagger?: number;
  delay?: number;
  /** true なら「弾けて現れる」（拡大して戻る） */
  bounce?: boolean;
}) {
  const chars = useMemo(() => Array.from(text), [text]);
  const widths = useMemo(
    () => chars.map((c) => (c === " " ? 0.3 : isNarrow(c) ? 0.62 : 1)),
    [chars],
  );
  const total = widths.reduce((a, b) => a + b, 0);
  let acc = 0;
  return (
    <span className={`inline-flex flex-wrap justify-center ${className}`}>
      <span className="sr-only">{text}</span>
      <span
        aria-hidden="true"
        className="inline-flex flex-wrap justify-center"
        style={{ filter: `drop-shadow(0 0 0.35em ${glow})` }}
      >
        {chars.map((ch, i) => {
          const x = acc;
          acc += widths[i] as number;
          return (
            <motion.span
              // biome-ignore lint/suspicious/noArrayIndexKey: 固定文字列の1文字ずつ
              key={i}
              aria-hidden="true"
              className="inline-block whitespace-pre"
              style={{
                backgroundImage: GRAD,
                backgroundSize: `${total}em 100%`,
                backgroundPosition: `${-x}em 0`,
                backgroundRepeat: "no-repeat",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
              initial={
                reduced ? false : { opacity: 0, y: 50, scale: 0.3, rotate: i % 2 ? 10 : -10 }
              }
              animate={
                reduced
                  ? undefined
                  : active
                    ? bounce
                      ? {
                          opacity: 1,
                          y: [50, -12, 0],
                          scale: [0.3, 1.25, 1],
                          rotate: [i % 2 ? 10 : -10, 3, 0],
                        }
                      : { opacity: 1, y: 0, scale: 1, rotate: 0 }
                    : { opacity: 0, y: 50, scale: 0.3, rotate: i % 2 ? 10 : -10 }
              }
              transition={
                bounce
                  ? {
                      delay: delay + i * stagger,
                      duration: 0.55,
                      times: [0, 0.65, 1],
                      ease: "easeOut",
                    }
                  : {
                      delay: delay + i * stagger,
                      type: "spring",
                      visualDuration: 0.45,
                      bounce: 0.35,
                    }
              }
            >
              {ch}
            </motion.span>
          );
        })}
      </span>
    </span>
  );
}
