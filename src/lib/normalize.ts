/**
 * 検索用の正規化（docs/詳細設計書.md 4章）。
 * NFKC（半角カナ・全角英数を統一）→ 小文字化 → カタカナをひらがなへ → 前後の空白を除去。
 */
export function normalize(input: string): string {
  const lowered = input.normalize("NFKC").toLowerCase();
  let out = "";
  for (const ch of lowered) {
    const code = ch.codePointAt(0) ?? 0;
    // U+30A1–U+30F6（ァ〜ヶ）を 0x60 引くとひらがな（ぁ〜ゖ）になる
    out += code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - 0x60) : ch;
  }
  return out.trim();
}
