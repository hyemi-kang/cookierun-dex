import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const TITLE = "COOKIE RUN DEX";
const POP = { type: "spring", visualDuration: 0.35, bounce: 0.35 } as const;

function Title({ reduced }: { reduced: boolean }) {
  const chars = Array.from(TITLE);
  return (
    <h1
      aria-label={TITLE}
      className="font-display text-4xl font-bold tracking-wide text-text sm:text-6xl"
    >
      {chars.map((ch, i) => (
        <motion.span
          // biome-ignore lint/suspicious/noArrayIndexKey: 固定文字列の1文字ずつ
          key={i}
          aria-hidden="true"
          className="inline-block whitespace-pre"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -40 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0.3 } : { ...POP, delay: i * 0.04 }}
        >
          {ch}
        </motion.span>
      ))}
    </h1>
  );
}

/** 冒頭の動画枠。動画がない・読めないときはポスターとタイトルの代替表示。 */
export function PromoHero({ reduced }: { reduced: boolean }) {
  const [failed, setFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [playing, setPlaying] = useState(!reduced);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current?.error) setFailed(true);
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play()?.catch(() => setFailed(true));
    } else {
      v.pause();
    }
  };

  return (
    <section
      data-testid="promo-hero"
      aria-label="COOKIE RUN DEX"
      className="relative flex h-svh min-h-[480px] items-center justify-center overflow-hidden bg-bg"
    >
      {failed ? (
        <div data-testid="hero-fallback" className="absolute inset-0">
          {!posterFailed && (
            <img
              src="/promo/hero-poster.webp"
              alt=""
              onError={() => setPosterFailed(true)}
              className="h-full w-full object-cover"
            />
          )}
        </div>
      ) : (
        <video
          ref={videoRef}
          data-testid="hero-video"
          src="/promo/hero.mp4"
          poster="/promo/hero-poster.webp"
          muted
          loop
          playsInline
          autoPlay={!reduced}
          preload="auto"
          onError={() => setFailed(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgb(26 18 16 / 0.55), rgb(26 18 16 / 0.7) 60%, var(--color-bg))",
        }}
      />
      <div className="relative z-10 flex flex-col items-center gap-4 px-4 text-center">
        <Title reduced={reduced} />
        <p className="text-base text-text-muted">クッキーラン キャラ図鑑</p>
        <p aria-hidden="true" className="mt-8 text-sm text-text-muted">
          ↓ スクロール
        </p>
      </div>
      {!failed && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "動画を一時停止" : "動画を再生"}
          className="absolute right-4 bottom-4 z-10 min-h-11 min-w-11 rounded-md bg-surface/90 px-4 text-sm font-bold text-text"
        >
          {playing ? "一時停止" : "再生"}
        </button>
      )}
    </section>
  );
}
