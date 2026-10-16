// 正規化・検索の単体テスト。
// 根拠: PRD AC-35, AC-36 / 詳細設計書 4章（normalize: NFKC→小文字化→カタカナをひらがなへ→trim、
// matches: names.ja / en / ko / aliases を normalize して includes。空クエリは全件一致）。
import { describe, expect, it } from "vitest";
import { normalize } from "../../src/lib/normalize";
import { matches } from "../../src/lib/search";
import type { Character } from "../../src/types/character";

function ch(names: Character["names"], over: Partial<Character> = {}): Character {
  return {
    id: "crk-test",
    title: "kingdom",
    order: 1,
    names,
    rarity: "Common",
    summary: "テスト",
    images: { illustration: "/assets/crk/test/illustration.webp" },
    motions: [],
    sourceUrl: "https://cookierun.wiki/w/Test",
    license: { text: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" },
    imageCredit: "© Devsisters",
    fetchedAt: "2026-10-16T00:00:00Z",
    ...over,
  };
}

describe("normalize", () => {
  it("AC-35 カタカナ・ひらがな・半角カナが同じキーになる", () => {
    const k = normalize("ホリーベリー");
    expect(normalize("ほりーべりー")).toBe(k);
    expect(normalize("ﾎﾘｰﾍﾞﾘｰ")).toBe(k);
  });

  it("AC-36 全角英字と半角英字（大文字小文字違い含む）が同じキーになる", () => {
    expect(normalize("ＤＡＲＫ")).toBe(normalize("dark"));
    expect(normalize("ＤＡＲＫ")).toBe("dark");
    expect(normalize("Dark")).toBe("dark");
  });

  it("AC-35 濁点・半濁点付きの半角カナも統一される", () => {
    expect(normalize("ﾊﾟｲ")).toBe(normalize("ぱい"));
    expect(normalize("ｳﾞｧ")).toBe(normalize("ゔぁ"));
  });

  it("AC-35 境界: カタカナ範囲の両端(ァ U+30A1 / ヶ U+30F6)も変換される", () => {
    expect(normalize("ァ")).toBe("ぁ");
    expect(normalize("ヶ")).toBe("ゖ");
  });

  it("AC-35 長音「ー」と漢字・英数は変わらない（ひらがなに壊されない）", () => {
    expect(normalize("ー")).toBe("ー");
    expect(normalize("勇敢なクッキー")).toBe("勇敢なくっきー");
    expect(normalize("GingerBrave")).toBe("gingerbrave");
  });

  it("前後の空白を除去する（詳細設計書 4章）", () => {
    expect(normalize("  Vanilla \t")).toBe("vanilla");
    expect(normalize("　ばにら　")).toBe("ばにら");
  });

  it("異常系: 空文字は空文字、空白のみも空文字", () => {
    expect(normalize("")).toBe("");
    expect(normalize("   ")).toBe("");
  });

  it("冪等: 2回かけても同じ", () => {
    for (const s of ["ﾎﾘｰﾍﾞﾘｰ", "ＤＡＲＫ", "ピュアバニラクッキー", "  Brave  "]) {
      expect(normalize(normalize(s))).toBe(normalize(s));
    }
  });
});

describe("matches", () => {
  const vanilla = ch(
    {
      ja: "ピュアバニラクッキー",
      en: "Pure Vanilla Cookie",
      ko: "순수 바닐라 맛 쿠키",
      aliases: ["PV", "ばにら様"],
    },
    { id: "crk-pure-vanilla" },
  );
  const brave = ch({ ja: "勇敢なクッキー", en: "GingerBrave" }, { id: "crk-gingerbrave" });

  it("AC-37 ひらがなの入力でカタカナの名前に一致する", () => {
    expect(matches(vanilla, "ばにら")).toBe(true);
    expect(matches(vanilla, "ぴゅあ")).toBe(true);
  });

  it("AC-35 半角カナの入力でも一致する", () => {
    expect(matches(vanilla, "ﾊﾞﾆﾗ")).toBe(true);
  });

  it("AC-38 英語名は大文字小文字を問わず部分一致する", () => {
    expect(matches(brave, "brave")).toBe(true);
    expect(matches(brave, "BRAVE")).toBe(true);
    expect(matches(brave, "ginger")).toBe(true);
  });

  it("AC-36 全角英字の入力でも英語名に一致する", () => {
    expect(matches(brave, "ＢＲＡＶＥ")).toBe(true);
  });

  it("韓国語名・別名（aliases）にも一致する", () => {
    expect(matches(vanilla, "바닐라")).toBe(true);
    expect(matches(vanilla, "pv")).toBe(true);
    expect(matches(vanilla, "バニラ様")).toBe(true); // alias はひらがな化して比較
  });

  it("部分一致である（前方一致に限らない）", () => {
    expect(matches(brave, "なクッ")).toBe(true);
    expect(matches(brave, "erbra")).toBe(true);
  });

  it("空クエリは全件に一致する", () => {
    expect(matches(vanilla, "")).toBe(true);
    expect(matches(brave, "")).toBe(true);
  });

  it("前後の空白だけのクエリは空クエリ扱い（trim される）", () => {
    expect(matches(brave, "   ")).toBe(true);
  });

  it("クエリ前後の空白は無視される", () => {
    expect(matches(brave, "  brave ")).toBe(true);
  });

  it("異常系: どこにも含まれない文字列は一致しない", () => {
    expect(matches(brave, "ばにら")).toBe(false);
    expect(matches(vanilla, "zzzz")).toBe(false);
  });

  it("異常系: ko や aliases が未定義でも例外を出さない", () => {
    const bare = ch({ ja: "名前", en: "Name" });
    expect(() => matches(bare, "x")).not.toThrow();
    expect(matches(bare, "x")).toBe(false);
    expect(matches(bare, "name")).toBe(true);
  });
});
