import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { useState } from "react";
import type { Character } from "../../types/character";
import type { FallbackActorProps } from "../fx";
import { FallbackActor } from "../fx";
import { BTN_SECONDARY, defaultMotionId } from "./constants";

type FallbackAction = FallbackActorProps["action"];

interface Props {
  character: Character;
  reduced: boolean;
  /** スキル演出中（AC-33） */
  skillBusy: boolean;
  onToast: (message: string) => void;
}

const FALLBACK_BUTTONS: { id: "bounce" | "squash"; label: string }[] = [
  { id: "bounce", label: "跳ねる" },
  { id: "squash", label: "つぶれて伸びる" },
];

/** 動作の画像。クロスフェードの退場側には testid と alt を付けない（現在の1枚だけが stage-img） */
function LayerImg({
  name,
  ...rest
}: { name: string } & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "alt">) {
  const present = useIsPresent();
  return (
    <img
      {...rest}
      data-testid={present ? "stage-img" : undefined}
      alt={present ? name : ""}
      aria-hidden={present ? undefined : true}
      draggable={false}
    />
  );
}

/** ステージ表示。動作素材（アニメ WebP）か、素材がないときの代替演出を出す。キャラごとに作り直される。 */
export function ActionStage({ character, reduced, skillBusy, onToast }: Props) {
  const present = useIsPresent();
  const tid = (id: string) => (present ? id : undefined);
  const { motions } = character;
  const hasMotions = motions.length > 0;

  const [motionId, setMotionId] = useState<string | null>(() => defaultMotionId(character));
  const [fallbackAction, setFallbackAction] = useState<FallbackAction>("idle");
  const [userPlayed, setUserPlayed] = useState(false);
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(new Set());

  const base = motions.find((m) => m.id === motionId);
  const skill1 = motions.find((m) => m.id === "skill1" && !failed.has(m.id));

  // 何を出すか。img（動作素材）と fb（代替演出）
  let img: { id: string; src: string } | undefined;
  let fb: FallbackAction | undefined;
  const srcOf = (m: { src: string; still: string }) => (reduced && !userPlayed ? m.still : m.src);
  if (skillBusy && (reduced || !skill1)) {
    fb = "squash"; // 素材がない・動きを減らすときは「つぶれて伸びる」（AC-33）
  } else if (skillBusy && skill1) {
    img = { id: skill1.id, src: srcOf(skill1) };
  } else if (hasMotions && base) {
    img = { id: base.id, src: srcOf(base) };
    if (failed.has(base.id)) fb = "bounce"; // 読み込み失敗（AC-61）
  } else {
    fb = hasMotions ? "idle" : fallbackAction;
  }

  const imgFailed = img ? failed.has(img.id) : false;
  const imgLoaded = img ? loaded.has(img.src) : true;
  const layerKey = img ? img.src : "fallback";

  const select = (id: string) => {
    setMotionId(id);
    setUserPlayed(true);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        data-testid={tid("stage")}
        className="relative"
        style={{ width: "clamp(220px, 28vw, 340px)", aspectRatio: "1 / 1" }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={layerKey}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {img && (
              <LayerImg
                name={character.names.ja}
                src={img.src}
                onLoad={() => setLoaded((s) => new Set(s).add(img.src))}
                onError={() => {
                  setFailed((s) => new Set(s).add(img.id));
                  onToast("この動作は読み込めませんでした");
                }}
                className={`absolute inset-0 size-full object-contain ${
                  imgFailed ? "opacity-0" : "opacity-100"
                }`}
              />
            )}
            {fb && (
              <FallbackActor
                className="dex-fallback size-full"
                imageSrc={character.images.illustration}
                alt={img ? "" : character.names.ja}
                action={fb}
                reduced={reduced}
              />
            )}
          </motion.div>
        </AnimatePresence>
        {img && !imgFailed && !imgLoaded && (
          <span
            role="status"
            aria-label="読み込み中"
            className="dex-spin absolute right-2 top-2 size-6 rounded-full border-[3px] border-text-muted border-t-transparent"
          />
        )}
      </div>

      <fieldset
        aria-label="動作"
        className="m-0 flex min-w-0 flex-wrap justify-center gap-2 border-0 p-0"
      >
        {hasMotions
          ? motions.map((m) => (
              <button
                key={m.id}
                type="button"
                data-testid={tid(`motion-${m.id}`)}
                aria-pressed={motionId === m.id}
                onClick={() => select(m.id)}
                className={`${BTN_SECONDARY} ${motionId === m.id ? "!border-accent !bg-accent !text-on-primary" : ""}`}
              >
                {m.label}
              </button>
            ))
          : FALLBACK_BUTTONS.map((b) => (
              <button
                key={b.id}
                type="button"
                data-testid={tid(`fallback-${b.id}`)}
                aria-pressed={fallbackAction === b.id}
                onClick={() => setFallbackAction(b.id)}
                className={`${BTN_SECONDARY} ${fallbackAction === b.id ? "!border-accent !bg-accent !text-on-primary" : ""}`}
              >
                {b.label}
              </button>
            ))}
      </fieldset>
    </div>
  );
}
