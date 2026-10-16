import type { Character, GameTitle } from "../types/character";
import { normalize } from "./normalize";

/** 名前（ja / en / ko）と別名を正規化して部分一致で判定する。空のクエリは全件に一致する。 */
export function matches(character: Character, query: string): boolean {
  const q = normalize(query);
  if (q === "") return true;
  const { ja, en, ko, aliases } = character.names;
  const haystacks = [ja, en, ko, ...(aliases ?? [])];
  return haystacks.some((h) => h !== undefined && normalize(h).includes(q));
}

export interface CharacterFilter {
  game: GameTitle;
  query: string;
  /** 空なら絞り込まない。複数選択は OR（同じ軸の中）、軸どうしは AND（AC-39） */
  grades: ReadonlySet<string>;
  roles: ReadonlySet<string>;
}

export function filterCharacters(all: readonly Character[], f: CharacterFilter): Character[] {
  return all
    .filter((c) => c.title === f.game)
    .filter((c) => matches(c, f.query))
    .filter((c) => f.grades.size === 0 || f.grades.has(c.rarity))
    .filter((c) => f.roles.size === 0 || (c.role !== undefined && f.roles.has(c.role)))
    .sort((a, b) => a.order - b.order);
}
