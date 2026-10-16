// タブ切替 AC-10〜13
import { expect, test } from "@playwright/test";
import {
  characters,
  gotoDex,
  kingdom,
  oracleMatches,
  ovenbreak,
  searchbox,
  switchTab,
  tab,
  thumbIds,
  thumbs,
} from "./helpers";

test.describe("タブ切替", () => {
  test("AC-10 初期表示はキングダムが選択され、一覧は kingdom のキャラだけ", async ({ page }) => {
    await gotoDex(page);
    await expect(tab(page, "kingdom")).toHaveAttribute("aria-selected", "true");
    await expect(tab(page, "ovenbreak")).toHaveAttribute("aria-selected", "false");
    await expect(thumbs(page)).toHaveCount(kingdom.length);
    expect((await thumbIds(page)).sort()).toEqual(kingdom.map((c) => c.id).sort());
  });

  test("AC-11 オーブンブレイクのタブで 500ms 以内に ovenbreak のキャラだけになり aria-selected=true", async ({
    page,
  }) => {
    await gotoDex(page);
    await tab(page, "ovenbreak").click();
    await expect(tab(page, "ovenbreak")).toHaveAttribute("aria-selected", "true", { timeout: 500 });
    await expect(thumbs(page)).toHaveCount(ovenbreak.length, { timeout: 500 });
    expect((await thumbIds(page)).sort()).toEqual(ovenbreak.map((c) => c.id).sort());
    await expect(tab(page, "kingdom")).toHaveAttribute("aria-selected", "false");
  });

  test("AC-12 タブを切り替えると切替先の先頭キャラが選択され、中央と右パネルがそのキャラになる", async ({
    page,
  }) => {
    await gotoDex(page);
    await switchTab(page, "ovenbreak");
    const ids = await thumbIds(page);
    const first = characters.find((c) => c.id === ids[0]);
    expect(first).toBeTruthy();
    await expect(page.getByTestId(`thumb-${ids[0]}`)).toHaveAttribute("aria-current", "true");
    await expect(page.getByTestId("detail-name")).toHaveText(first?.names.ja ?? "");
    await expect(page.getByTestId("card-front")).toBeVisible();

    // 戻しても同様
    await switchTab(page, "kingdom");
    const kids = await thumbIds(page);
    await expect(page.getByTestId(`thumb-${kids[0]}`)).toHaveAttribute("aria-current", "true");
  });

  test("AC-13 タブを切り替えても検索欄の文字列は残り、切替先に対して検索が効く", async ({
    page,
  }) => {
    // 両タイトルにいるキャラ（baseId が同じ）の英語名で検索する
    const both = kingdom.find((k) => ovenbreak.some((o) => o.baseId && o.baseId === k.baseId));
    test.skip(!both, "両タイトルに存在する baseId のキャラがデータにない");
    const q = both?.names.en.slice(0, 6) ?? "";
    await gotoDex(page);
    await searchbox(page).fill(q);
    await switchTab(page, "ovenbreak");
    await expect(searchbox(page)).toHaveValue(q);
    const expected = ovenbreak
      .filter((c) => oracleMatches(c, q))
      .map((c) => c.id)
      .sort();
    await expect(thumbs(page)).toHaveCount(expected.length);
    expect((await thumbIds(page)).sort()).toEqual(expected);
  });

  test("AC-13 異常系 切替先に該当が無い検索語でも文字列は残り、0件表示になる", async ({ page }) => {
    await gotoDex(page);
    await searchbox(page).fill("zzzzqqqq");
    await switchTab(page, "ovenbreak");
    await expect(searchbox(page)).toHaveValue("zzzzqqqq");
    await expect(page.getByTestId("empty-state")).toBeVisible();
  });
});
