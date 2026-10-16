// 契約: docs/ARCHITECTURE.md / docs/PRD.md 5章。変更はリードのみ。
export type GameTitle = "kingdom" | "ovenbreak";

// 列挙値は fetch-assets の実データで確定する。未知の値は Common の色で代用する。
export type Rarity = string;
export type Role = string;
export type Position = "Front" | "Middle" | "Rear";

export interface LocalizedName {
  ja: string;
  en: string;
  ko?: string;
  aliases?: string[];
}

export interface MotionAsset {
  id: string; // "idle" | "battle_idle" | "run" | "jump" | "skill1" など
  label: string;
  src: string; // "/assets/crk/gingerbrave/run.webp"
  still: string; // reduced-motion 用の静止画
  loop: boolean;
  isSkill?: boolean;
}

export type FallbackMotion = "bounce" | "squash";

export interface Skill {
  name: string;
  summary: string; // 手作業で書いた要約（原文は転載しない）
}

export interface Character {
  id: string; // ^(crk|crob)-[a-z0-9-]+$
  baseId?: string;
  title: GameTitle;
  order: number;
  names: LocalizedName;
  rarity: Rarity;
  position?: Position;
  role?: Role;
  firstAppearance?: string;
  releaseDate?: string; // YYYY-MM-DD
  summary: string;
  skill?: Skill;
  images: { illustration: string; thumbnail?: string };
  motions: MotionAsset[]; // 空なら代替演出
  fallbackMotions?: FallbackMotion[];
  theme?: { accent: string };
  sourceUrl: string; // https://cookierun.wiki/...
  license: { text: "CC BY-SA 4.0"; url: string };
  imageCredit: string; // "© Devsisters"
  fetchedAt: string; // ISO 8601
}
