import { useEffect, useRef } from "react";

export interface GlobalShortcutHandlers {
  onPrev: () => void;
  onNext: () => void;
  onSkill: () => void;
  enabled?: boolean;
}

// フォーカスがここにあるときは無効（docs/UI.md 6章）。tablist は矢印キーを自分で使う。
const BLOCKED =
  'input, textarea, select, [role="tablist"], button, a, video, [contenteditable="true"]';
// 一覧のサムネだけは矢印キーを許す（クリック直後にフォーカスが残るため）。Enter は本来の動き。
const ARROWS_OK = '[data-shortcuts="arrows"]';

/** ←/→ でキャラ切替、Enter でスキル発動。 */
export function useGlobalShortcuts(handlers: GlobalShortcutHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const h = ref.current;
      if (h.enabled === false) return;
      if (e.defaultPrevented || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
      const isArrow = e.key === "ArrowLeft" || e.key === "ArrowRight";
      if (!isArrow && e.key !== "Enter") return;

      const target = e.target instanceof Element ? e.target : null;
      const blocked = target?.closest(BLOCKED) != null;
      if (isArrow) {
        if (blocked && target?.closest(ARROWS_OK) == null) return;
        e.preventDefault();
        if (e.key === "ArrowLeft") h.onPrev();
        else h.onNext();
        return;
      }
      if (blocked || e.repeat) return;
      e.preventDefault();
      h.onSkill();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
