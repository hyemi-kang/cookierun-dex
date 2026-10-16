import { useState } from "react";
import type { Character } from "../../types/character";
import { FallbackActor, type FallbackActorProps } from "../fx";
import { fallbackAction, motionOf } from "./util";

/**
 * キャラの動く素材（WebP）を出す。読めなければ立ち絵 + FallbackActor、
 * それも読めなければシルエット。reduced のときは静止画（still）。
 */
export function Chara({
  cookie,
  motionIds = ["idle", "run"],
  reduced,
  className = "",
  forceAction,
}: {
  cookie: Character | undefined;
  motionIds?: string[];
  reduced: boolean;
  className?: string;
  forceAction?: FallbackActorProps["action"];
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const motion = motionOf(cookie, motionIds);
  const alt = cookie?.names.ja ?? "クッキー";
  const src = motion ? (reduced ? motion.still : motion.src) : undefined;
  const action = forceAction ?? fallbackAction(motion?.id);
  if (!cookie || !src || failed === src) {
    return (
      <div className={className}>
        <FallbackActor
          imageSrc={cookie?.images.illustration ?? "/assets/missing.webp"}
          alt={alt}
          action={action === "skill" ? "bounce" : action}
          reduced={reduced}
        />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      onError={() => setFailed(src)}
      className={`object-contain ${className}`}
    />
  );
}
