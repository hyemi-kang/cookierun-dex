import { describe, expect, it } from "vitest";
import characters from "../../src/data/characters.json";
import timeline from "../../src/data/timeline.json";

// 列挙値は fetch-assets の実データで確定する（暫定値は PRD 5章）。
const RARITY: Record<string, string[]> = {
  kingdom: ["Common", "Rare", "Epic", "SuperEpic", "Legendary", "Ancient", "Dragon", "Special"],
  ovenbreak: ["Common", "Rare", "Epic", "Legendary", "Special", "Ancient"],
};
const ROLE = ["Charge", "Defense", "Magic", "Ranged", "Support", "Healing", "Bomber", "Ambush"];
const POSITION = ["Front", "Middle", "Rear"];

type Json = Record<string, unknown>;
const list = characters as unknown as Json[];
const isStr = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const obj = (v: unknown): Json => (v && typeof v === "object" ? (v as Json) : {});

describe("characters.json", () => {
  it("AC-01 必須項目がすべてある", () => {
    for (const c of list) {
      const label = String(c.id);
      expect(isStr(c.id), `${label}: id`).toBe(true);
      expect(isStr(c.title), `${label}: title`).toBe(true);
      expect(isStr(obj(c.names).ja), `${label}: names.ja`).toBe(true);
      expect(isStr(obj(c.names).en), `${label}: names.en`).toBe(true);
      expect(isStr(c.rarity), `${label}: rarity`).toBe(true);
      expect(isStr(c.summary), `${label}: summary`).toBe(true);
      expect(isStr(obj(c.images).illustration), `${label}: images.illustration`).toBe(true);
      expect(isStr(c.sourceUrl), `${label}: sourceUrl`).toBe(true);
      expect(isStr(obj(c.license).text), `${label}: license.text`).toBe(true);
      expect(isStr(obj(c.license).url), `${label}: license.url`).toBe(true);
      expect(isStr(c.imageCredit), `${label}: imageCredit`).toBe(true);
      expect(Number.isNaN(Date.parse(String(c.fetchedAt))), `${label}: fetchedAt`).toBe(false);
      expect(Array.isArray(c.motions), `${label}: motions`).toBe(true);
      expect(typeof c.order, `${label}: order`).toBe("number");
    }
  });

  it("AC-02 id は一意で形式が正しい", () => {
    const ids = list.map((c) => String(c.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^(crk|crob)-[a-z0-9-]+$/);
  });

  it("AC-02 id の接頭辞が title と一致する", () => {
    for (const c of list) {
      expect(String(c.id).startsWith(c.title === "kingdom" ? "crk-" : "crob-")).toBe(true);
    }
  });

  it("AC-03 title・rarity・role・position が列挙値に入る", () => {
    for (const c of list) {
      expect(["kingdom", "ovenbreak"], String(c.id)).toContain(c.title);
      expect(RARITY[String(c.title)], `${c.id}: rarity=${c.rarity}`).toContain(c.rarity);
      if (c.role !== undefined) expect(ROLE, `${c.id}: role=${c.role}`).toContain(c.role);
      if (c.position !== undefined) expect(POSITION, `${c.id}: position`).toContain(c.position);
      if (c.title === "ovenbreak") {
        expect(c.role, `${c.id}: オーブンブレイクに role は不要`).toBeUndefined();
      }
    }
  });

  it("AC-04 sourceUrl は cookierun.wiki、license.text は CC BY-SA 4.0", () => {
    for (const c of list) {
      expect(String(c.sourceUrl).startsWith("https://cookierun.wiki/"), String(c.id)).toBe(true);
      expect(obj(c.license).text, String(c.id)).toBe("CC BY-SA 4.0");
    }
  });

  it("AC-05 キャラ数は 8〜12、各タイトル 3 件以上", () => {
    expect(list.length).toBeGreaterThanOrEqual(8);
    expect(list.length).toBeLessThanOrEqual(12);
    for (const t of ["kingdom", "ovenbreak"]) {
      expect(list.filter((c) => c.title === t).length, t).toBeGreaterThanOrEqual(3);
    }
  });

  it("AC-06 motions の id は重複せず、src と still は /assets/ で始まる", () => {
    for (const c of list) {
      const motions = (c.motions as Json[]) ?? [];
      const ids = motions.map((m) => String(m.id));
      expect(new Set(ids).size, `${c.id}: motions.id`).toBe(ids.length);
      expect(motions.length, `${c.id}: 最大6種`).toBeLessThanOrEqual(6);
      for (const m of motions) {
        expect(String(m.src).startsWith("/assets/"), `${c.id}/${m.id}: src`).toBe(true);
        expect(String(m.src).endsWith(".webp"), `${c.id}/${m.id}: src`).toBe(true);
        expect(String(m.still).startsWith("/assets/"), `${c.id}/${m.id}: still`).toBe(true);
      }
    }
  });

  it("baseId を持つキャラは、同じ baseId の相手が別タイトルにいる場合に限り結ばれる", () => {
    const byBase = new Map<string, string[]>();
    for (const c of list) {
      if (!isStr(c.baseId)) continue;
      byBase.set(c.baseId, [...(byBase.get(c.baseId) ?? []), String(c.title)]);
    }
    for (const [, titles] of byBase) expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("timeline.json", () => {
  it("4〜6件で、各要素が year / title / summary / sourceUrl を持つ", () => {
    const items = timeline as unknown as Json[];
    expect(items.length).toBeGreaterThanOrEqual(4);
    expect(items.length).toBeLessThanOrEqual(6);
    for (const t of items) {
      expect(Number.isInteger(t.year)).toBe(true);
      expect(isStr(t.title)).toBe(true);
      expect(isStr(t.summary)).toBe(true);
      expect(String(t.sourceUrl).startsWith("https://cookierun.wiki/")).toBe(true);
    }
  });
});
