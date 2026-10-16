import type { Transition } from "motion/react";
import type { Character, GameTitle, Position } from "../../types/character";

/** ドラッグ量(px)あたりの回転角(度)。テストはこの定数を参照する（AC-18） */
export const DRAG_DEG_PER_PX = 0.5;
/** 回転の慣性の速度上限(度/秒) */
export const MAX_SPIN_VELOCITY = 1440;
/** これより遅い離し方では慣性を付けない(度/秒)（AC-21） */
export const MIN_FLING_VELOCITY = 120;
/**
 * 慣性。詳細設計書は timeConstant 600 だが、その値だと上限速度で止まるまで約4.5秒かかり
 * AC-21「2秒以内に止まる」を満たせないため 250 にしている（リードへ報告済み）。
 */
export const INERTIA = { power: 0.6, timeConstant: 250, restDelta: 0.5 } as const;
/** マウス追従の傾きの最大角(度)（M2 / AC-22 の ±15° 以内） */
export const TILT_MAX = 12;
/** 操作がこの時間なければ待機の揺れを始める（AC-23） */
export const IDLE_DELAY_MS = 3000;
/** スキル演出の長さ。この間は発動ボタンを無効にする（AC-32）。reduced は 800ms のカットイン + 余白 */
export const FX_DURATION_MS = 1300;
export const FX_DURATION_REDUCED_MS = 900;
export const TOAST_MS = 3000;
export const HINT_STORAGE_KEY = "dex.hintSeen";

export const SPRING = {
  pop: { type: "spring", visualDuration: 0.35, bounce: 0.35 },
  snappy: { type: "spring", stiffness: 400, damping: 32 },
  tilt: { type: "spring", stiffness: 150, damping: 18, mass: 0.6 },
  soft: { type: "spring", stiffness: 120, damping: 20 },
} as const satisfies Record<string, Transition>;

export const GAME_LABEL: Record<GameTitle, string> = {
  kingdom: "キングダム",
  ovenbreak: "オーブンブレイク",
};

export const POSITION_LABEL: Record<Position, string> = {
  Front: "前衛（Front）",
  Middle: "中衛（Middle）",
  Rear: "後衛（Rear）",
};

export interface GradeStyle {
  badge: string;
  from: string;
  to: string;
}

// docs/UI.md 3.3。キーは gradeKey() で正規化した値
const GRADE_STYLES: Record<string, GradeStyle> = {
  common: { badge: "#BFB3A6", from: "#3A3029", to: "#1A1210" },
  rare: { badge: "#4FA8E8", from: "#163A57", to: "#0F1A24" },
  epic: { badge: "#C065E6", from: "#3D1A4F", to: "#170D1F" },
  superepic: { badge: "#F0587C", from: "#4F1426", to: "#1F0A10" },
  legendary: { badge: "#FFD24A", from: "#4A3A10", to: "#1A1408" },
  dragon: { badge: "#F06A3A", from: "#521A0C", to: "#1C0A06" },
  ancient: { badge: "#F4EBD0", from: "#4A4330", to: "#16140E" },
  beast: { badge: "#8F7BFF", from: "#24184F", to: "#0C0A1C" },
  witch: { badge: "#5ED3C2", from: "#0F3D38", to: "#071715" },
  special: { badge: "#FF9ED1", from: "#4F1A35", to: "#1C0A13" },
};
const GRADE_ORDER = Object.keys(GRADE_STYLES);

function gradeKey(rarity: string): string {
  return rarity.toLowerCase().replace(/[\s_-]+/g, "");
}

/** 未知の等級は Common の色で代用する */
export function gradeStyle(rarity: string): GradeStyle {
  return GRADE_STYLES[gradeKey(rarity)] ?? GRADE_STYLES.common;
}

/** 等級の並び順（既知は UI.md の順、未知は末尾で名前順） */
export function compareGrade(a: string, b: string): number {
  const ia = GRADE_ORDER.indexOf(gradeKey(a));
  const ib = GRADE_ORDER.indexOf(gradeKey(b));
  if (ia === -1 && ib === -1) return a.localeCompare(b);
  if (ia === -1) return 1;
  if (ib === -1) return -1;
  return ia - ib;
}

/** ステージ表示を開いたときの最初の動作（idle → run → なし=代替演出）（AC-28） */
export function defaultMotionId(c: Character): string | null {
  for (const id of ["idle", "run"]) {
    if (c.motions.some((m) => m.id === id)) return id;
  }
  return null;
}

// 共通のボタン見た目（当たり判定 44px 以上）
export const BTN_BASE =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1 rounded-md px-4 text-sm font-bold transition-transform duration-120 ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";
export const BTN_SECONDARY = `${BTN_BASE} border border-border bg-surface-2 text-text`;
export const BTN_PRIMARY = `${BTN_BASE} bg-primary text-on-primary`;
