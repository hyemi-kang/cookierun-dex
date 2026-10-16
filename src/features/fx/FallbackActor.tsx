export type FallbackAction =
  | "idle"
  | "run"
  | "jump"
  | "double_jump"
  | "slide"
  | "skill"
  | "joy"
  | "bounce"
  | "squash";

export interface FallbackActorProps {
  imageSrc: string;
  alt: string;
  action: FallbackAction;
  /** 動きを減らす設定。true のときは静止画 */
  reduced: boolean;
}

// TODO(画面担当B): 動作ごとの transform を実装する。docs/UI.md 5章の表。
// ルート要素に data-fallback-motion={action} を付ける（AC-27）。
export function FallbackActor({ imageSrc, alt, action }: FallbackActorProps) {
  return <img src={imageSrc} alt={alt} data-fallback-motion={action} />;
}
