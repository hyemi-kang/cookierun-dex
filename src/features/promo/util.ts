import raw from "../../data/characters.json";
import type { Character, MotionAsset } from "../../types/character";

export const CHARS = raw as unknown as Character[];
export const KINGDOM = CHARS.filter((c) => c.title === "kingdom");
export const OVEN = CHARS.filter((c) => c.title === "ovenbreak");

/** 等級の色（docs/UI.md 3.3）。未知の等級は Common。 */
export const GRADE_COLORS: Record<string, string> = {
  Common: "#BFB3A6",
  Rare: "#4FA8E8",
  Epic: "#C065E6",
  "Super Epic": "#F0587C",
  Legendary: "#FFD24A",
  Dragon: "#F06A3A",
  Ancient: "#F4EBD0",
  Beast: "#8F7BFF",
  Witch: "#5ED3C2",
  Special: "#FF9ED1",
};
export const gradeColor = (rarity: string): string =>
  GRADE_COLORS[rarity] ?? (GRADE_COLORS.Common as string);

export const charUrl = (c: Character): string => `/?game=${c.title}&c=${c.id}`;

export function motionOf(c: Character | undefined, ids: string[]): MotionAsset | undefined {
  if (!c) return undefined;
  for (const id of ids) {
    const m = c.motions.find((x) => x.id === id);
    if (m) return m;
  }
  return c.motions[0];
}

/** 素材 id から FallbackActor の動作へ */
export function fallbackAction(id: string | undefined) {
  switch (id) {
    case "run":
    case "run_fast":
      return "run" as const;
    case "jump":
      return "jump" as const;
    case "double_jump":
      return "double_jump" as const;
    case "slide":
      return "slide" as const;
    case "joy":
      return "joy" as const;
    case "skill1":
    case "skill2":
      return "skill" as const;
    default:
      return "idle" as const;
  }
}

/** 均等に n 件選ぶ */
export function pickEven<T>(list: T[], n: number): T[] {
  if (list.length <= n) return list;
  return Array.from({ length: n }, (_, i) => list[Math.floor((i * list.length) / n)] as T);
}

export const PRIMARY = "#FF8A3D";
export const BUTTER = "#FFC845";
export const JELLY = "#FF6FA8";
