import { type MotionValue, motion, useScroll, useTransform } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { Character } from "../../types/character";
import { Chara } from "./Chara";
import { EmberCanvas } from "./EmberCanvas";
import { useFinePointer, usePointerSpring, useVisible } from "./hooks";
import { SplitText } from "./SplitText";
import { CHARS, KINGDOM, OVEN } from "./util";

const POP = { type: "spring", visualDuration: 0.6, bounce: 0.3 } as const;

/** ポインタ位置に応じて depth(px) だけ動く層 */
function Layer({
  px,
  py,
  depth,
  className = "",
  children,
}: {
  px: MotionValue<number>;
  py: MotionValue<number>;
  depth: number;
  className?: string;
  children?: ReactNode;
}) {
  const x = useTransform(px, (v) => v * depth);
  const y = useTransform(py, (v) => v * depth * 0.6);
  return (
    <motion.div className={className} style={{ x, y }}>
      {children}
    </motion.div>
  );
}

function Mountains({ far }: { far: boolean }) {
  const id = far ? "mt-far" : "mt-mid";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 400"
      preserveAspectRatio="none"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={far ? "#5a2a3a" : "#3a1c24"} />
          <stop offset="1" stopColor={far ? "#2a1418" : "#1a0e0c"} />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d={
          far
            ? "M0 400V240L110 150L230 230L380 90L540 220L690 130L850 240L1010 80L1190 210L1320 140L1440 220V400Z"
            : "M0 400V300L160 220L320 290L520 190L700 290L900 210L1100 300L1280 230L1440 290V400Z"
        }
      />
    </svg>
  );
}

/** 光の雲（ぼかし）。ゆっくり横に漂う。 */
function Cloud({ className, color }: { className: string; color: string }) {
  return (
    <div
      aria-hidden="true"
      className={`promo-anim promo-drift absolute rounded-full ${className}`}
      style={{ background: `radial-gradient(closest-side, ${color}, transparent)` }}
    />
  );
}

interface CastMember {
  c: Character | undefined;
  left: string;
  size: string;
  depth: number;
  delay: number;
  bottom: string;
}

export function PromoHero({ reduced, ready }: { reduced: boolean; ready: boolean }) {
  const [failed, setFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [playing, setPlaying] = useState(!reduced);
  const videoRef = useRef<HTMLVideoElement>(null);
  const root = useRef<HTMLElement>(null);
  const visible = useVisible(root);
  const fine = useFinePointer();
  const motionOn = !reduced;
  const { x: px, y: py } = usePointerSpring(motionOn && fine && visible);

  const { scrollYProgress } = useScroll({ target: root, offset: ["start start", "end start"] });
  const outScale = useTransform(scrollYProgress, [0, 1], [1, 1.5]);
  const outOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // カメラの傾き（perspective）
  const rotY = useTransform(px, (v) => v * 3);
  const rotX = useTransform(py, (v) => v * -2);
  const spotX = useTransform(px, (v) => v * 0.5 * window.innerWidth - 450);
  const spotY = useTransform(py, (v) => v * 0.5 * window.innerHeight - 450);

  useEffect(() => {
    if (videoRef.current?.error) setFailed(true);
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play()?.catch(() => setFailed(true));
    else v.pause();
  };

  const cast: CastMember[] = [
    {
      c: KINGDOM[3] ?? CHARS[3],
      left: "5%",
      size: "clamp(96px,13vw,210px)",
      depth: 70,
      delay: 0.5,
      bottom: "30svh",
    },
    {
      c: KINGDOM[0] ?? CHARS[0],
      left: "20%",
      size: "clamp(110px,16vw,260px)",
      depth: 46,
      delay: 0.7,
      bottom: "22svh",
    },
    {
      c: OVEN[1] ?? CHARS[1],
      left: "66%",
      size: "clamp(110px,16vw,260px)",
      depth: -46,
      delay: 0.8,
      bottom: "22svh",
    },
    {
      c: KINGDOM[2] ?? CHARS[2],
      left: "83%",
      size: "clamp(96px,13vw,210px)",
      depth: -70,
      delay: 0.6,
      bottom: "30svh",
    },
  ];
  const hero = OVEN[0] ?? CHARS[0];

  return (
    <section
      ref={root}
      data-testid="promo-hero"
      data-running={visible && motionOn ? "true" : "false"}
      aria-label="COOKIE RUN DEX"
      className="relative h-[calc(100svh-4rem)] min-h-[520px] overflow-hidden bg-bg"
    >
      <div className="absolute inset-0" style={{ perspective: 1200 }}>
        <motion.div
          className="absolute inset-0"
          style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
        >
          {/* L0 背景: 動画 or 代替（hero-fallback） */}
          {failed ? (
            <div
              data-testid="hero-fallback"
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, #120a14 0%, #2a1226 28%, #5a2230 52%, #b4441e 78%, #ff8a3d 100%)",
              }}
            >
              {!posterFailed && (
                <img
                  src="/promo/hero-poster.webp"
                  alt=""
                  onError={() => setPosterFailed(true)}
                  className="h-full w-full object-cover opacity-40"
                />
              )}
            </div>
          ) : (
            <>
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{ background: "linear-gradient(to bottom, #120a14, #5a2230 60%, #b4441e)" }}
              />
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
              <div aria-hidden="true" className="absolute inset-0 bg-bg/45" />
            </>
          )}

          {/* L1 星 */}
          <Layer px={px} py={py} depth={6} className="absolute inset-[-4%]">
            <div
              aria-hidden="true"
              className="h-full w-full opacity-70"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgb(255 244 230 / 0.8) 1px, transparent 1.6px)",
                backgroundSize: "120px 120px",
                maskImage: "linear-gradient(to bottom, black, transparent 60%)",
                WebkitMaskImage: "linear-gradient(to bottom, black, transparent 60%)",
              }}
            />
          </Layer>
          {/* L2 遠景の山 */}
          <Layer
            px={px}
            py={py}
            depth={12}
            className="absolute inset-x-[-4%] bottom-[18svh] h-[40svh]"
          >
            <Mountains far />
          </Layer>
          {/* L3 雲 */}
          <Layer px={px} py={py} depth={20} className="absolute inset-[-4%]">
            <Cloud
              className="top-[8%] left-[6%] h-[26svh] w-[38vw]"
              color="rgb(255 111 168 / 0.22)"
            />
            <Cloud
              className="top-[22%] right-[4%] h-[22svh] w-[34vw]"
              color="rgb(255 200 69 / 0.2)"
            />
            <Cloud
              className="top-[40%] left-[30%] h-[18svh] w-[30vw]"
              color="rgb(255 138 61 / 0.22)"
            />
          </Layer>
          {/* L4 オーブンの光 */}
          <div
            aria-hidden="true"
            className="promo-anim promo-pulse absolute inset-x-0 bottom-0 h-[70svh]"
            style={{
              background:
                "radial-gradient(60% 80% at 50% 100%, rgb(255 138 61 / 0.75), rgb(255 90 40 / 0.25) 45%, transparent 75%)",
            }}
          />
          {/* L5 近い山 */}
          <Layer
            px={px}
            py={py}
            depth={28}
            className="absolute inset-x-[-4%] bottom-[10svh] h-[30svh]"
          >
            <Mountains far={false} />
          </Layer>

          {/* スポットライト（カーソル追従） */}
          <motion.div
            aria-hidden="true"
            className="absolute top-0 left-0 h-[900px] w-[900px]"
            style={{
              x: motionOn && fine ? spotX : "calc(50vw - 450px)",
              y: motionOn && fine ? spotY : "5svh",
              background:
                "radial-gradient(closest-side, rgb(255 200 69 / 0.22), rgb(255 138 61 / 0.08) 55%, transparent)",
            }}
          />
        </motion.div>
      </div>

      <EmberCanvas active={visible && motionOn} max={110} rate={34} />

      {/* 地面と3層の流れる背景 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[32svh]">
        <div
          className="promo-anim promo-strip absolute bottom-[10svh] left-0 h-[16svh] w-[calc(100%+480px)]"
          style={{
            ["--period" as string]: "480px",
            ["--dur" as string]: "26s",
            backgroundImage: "radial-gradient(ellipse at 50% 100%, #2a1620 58%, transparent 60%)",
            backgroundSize: "480px 100%",
            backgroundRepeat: "repeat-x",
          }}
        />
        <div
          className="promo-anim promo-strip absolute bottom-[6svh] left-0 h-[9svh] w-[calc(100%+240px)]"
          style={{
            ["--period" as string]: "240px",
            ["--dur" as string]: "12s",
            backgroundImage: "radial-gradient(ellipse at 50% 100%, #3a1c1c 58%, transparent 60%)",
            backgroundSize: "240px 100%",
            backgroundRepeat: "repeat-x",
          }}
        />
        <div
          className="promo-anim promo-strip absolute bottom-0 left-0 h-[8svh] w-[calc(100%+120px)] border-t-4 border-primary"
          style={{
            ["--period" as string]: "120px",
            ["--dur" as string]: "5s",
            backgroundImage: "repeating-linear-gradient(90deg, #5a4234 0 60px, #4a3528 60px 120px)",
          }}
        />
      </div>

      {/* 走り続ける勇敢なクッキー */}
      <div className="pointer-events-none absolute bottom-[7svh] left-[44%] z-[5] h-[clamp(90px,11vw,170px)] w-[clamp(90px,11vw,170px)]">
        <div className="promo-anim promo-hop h-full w-full">
          <Chara cookie={hero} motionIds={["run"]} reduced={reduced} className="h-full w-full" />
        </div>
      </div>

      {/* 左右に浮かぶキャラ */}
      {cast.map((m, i) => (
        <Layer
          key={m.c?.id ?? i}
          px={px}
          py={py}
          depth={m.depth}
          className="absolute inset-0 z-[6]"
        >
          <div
            className="absolute"
            style={{ left: m.left, bottom: m.bottom, width: m.size, height: m.size }}
          >
            <motion.div
              className="h-full w-full"
              initial={reduced ? false : { opacity: 0, scale: 0.15, y: 160 }}
              animate={reduced ? undefined : ready ? { opacity: 1, scale: 1, y: 0 } : undefined}
              transition={{ ...POP, delay: m.delay }}
            >
              <div
                className="promo-anim promo-bob h-full w-full"
                style={{ animationDelay: `${-i * 0.9}s` }}
              >
                <Chara
                  cookie={m.c}
                  motionIds={["idle", "run"]}
                  reduced={reduced}
                  className="h-full w-full"
                />
              </div>
              <div
                aria-hidden="true"
                className="absolute -bottom-2 left-[15%] h-4 w-[70%] rounded-full bg-black/50 blur-md"
              />
            </motion.div>
          </div>
        </Layer>
      ))}

      {/* タイトル（スクロールで拡大して次の場面へ） */}
      <motion.div
        className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center"
        style={reduced ? undefined : { scale: outScale, opacity: outOpacity }}
      >
        <div className="-mt-[8svh] flex flex-col items-center gap-5">
          <h1 className="font-display text-[clamp(2.75rem,9vw,9rem)] leading-none font-bold tracking-wide">
            <SplitText
              text="COOKIE RUN DEX"
              active={ready}
              reduced={reduced}
              bounce
              stagger={0.06}
              delay={0.1}
            />
          </h1>
          <p className="rounded-full bg-bg/70 px-5 py-2 text-base text-text backdrop-blur-sm sm:text-lg">
            クッキーラン キャラ図鑑 — 回して、動かして、スキルを撃つ
          </p>
        </div>
      </motion.div>

      <div
        aria-hidden="true"
        className="promo-anim promo-hint absolute inset-x-0 bottom-[3svh] z-10 text-center text-sm font-bold tracking-widest text-text"
      >
        ↓ スクロール
      </div>

      {!failed && (
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "動画を一時停止" : "動画を再生"}
          className="absolute right-4 bottom-4 z-20 min-h-11 min-w-11 rounded-md bg-surface/90 px-4 text-sm font-bold text-text"
        >
          {playing ? "一時停止" : "再生"}
        </button>
      )}
    </section>
  );
}
