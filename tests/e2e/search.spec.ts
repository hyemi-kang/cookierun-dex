// 検索・フィルタ AC-37〜42
import { expect, test } from "@playwright/test";
import {
  byTitle,
  characters,
  gotoDex,
  kingdom,
  oracleMatches,
  ovenbreak,
  searchbox,
  selectedId,
  switchTab,
  thumbIds,
  thumbs,
} from "./helpers";

const pureVanilla = characters.find((c) => c.names.ja === "ピュアバニラクッキー");
const brave = characters.find((c) => c.title === "kingdom" && c.names.en === "GingerBrave");

test.describe("検索", () => {
  test("AC-37 「ばにら」と入力すると 300ms 以内に一覧が「ピュアバニラクッキー」を含むキャラだけになる", async ({
    page,
  }) => {
    test.skip(
      !pureVanilla,
      "ピュアバニラクッキーが characters.json に無い（データ担当の確認待ち）",
    );
    if (!pureVanilla) return;
    await gotoDex(page);
    await switchTab(page, pureVanilla.title);
    await searchbox(page).fill("ばにら");
    const expected = byTitle(pureVanilla.title)
      .filter((c) => oracleMatches(c, "ばにら"))
      .map((c) => c.id)
      .sort();
    expect(expected).toContain(pureVanilla.id);
    await expect(thumbs(page)).toHaveCount(expected.length, { timeout: 300 });
    expect((await thumbIds(page)).sort()).toEqual(expected);
    await expect(page.getByTestId(`thumb-${pureVanilla.id}`)).toBeVisible();
  });

  test("AC-38 「brave」と入力すると勇敢なクッキー（GingerBrave）が一覧に出る", async ({ page }) => {
    test.skip(!brave, "キングダムの GingerBrave がデータに無い");
    if (!brave) return;
    await gotoDex(page);
    await searchbox(page).fill("brave");
    await expect(page.getByTestId(`thumb-${brave.id}`)).toBeVisible();
    const expected = kingdom
      .filter((c) => oracleMatches(c, "brave"))
      .map((c) => c.id)
      .sort();
    await expect(thumbs(page)).toHaveCount(expected.length);
    expect((await thumbIds(page)).sort()).toEqual(expected);
  });

  test("AC-38 大文字・全角英字・日本語名でも同じキャラに当たる", async ({ page }) => {
    test.skip(!brave, "キングダムの GingerBrave がデータに無い");
    if (!brave) return;
    await gotoDex(page);
    for (const q of ["BRAVE", "ＢＲＡＶＥ", "勇敢"]) {
      await searchbox(page).fill(q);
      await expect(page.getByTestId(`thumb-${brave.id}`), q).toBeVisible();
    }
  });

  test("AC-37 検索語を消すと、そのタブの全キャラに戻る", async ({ page }) => {
    await gotoDex(page);
    await searchbox(page).fill("zzzzqqqq");
    await expect(thumbs(page)).toHaveCount(0);
    await searchbox(page).fill("");
    await expect(thumbs(page)).toHaveCount(kingdom.length);
  });

  test("件数表示（result-count）が一覧の件数と一致する", async ({ page }) => {
    await gotoDex(page);
    await expect(page.getByTestId("result-count")).toContainText(String(kingdom.length));
    await expect(page.getByTestId("result-count")).toHaveAttribute("aria-live", "polite");
  });
});

test.describe("フィルタ", () => {
  test("AC-39 等級フィルタで選んだ等級のキャラだけになる（Legendary があれば Legendary）", async ({
    page,
  }) => {
    await gotoDex(page);
    const rarity = kingdom.some((c) => c.rarity === "Legendary") ? "Legendary" : kingdom[0].rarity;
    await page.getByTestId(`filter-grade-${rarity}`).click();
    await expect(page.getByTestId(`filter-grade-${rarity}`)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const expected = kingdom
      .filter((c) => c.rarity === rarity)
      .map((c) => c.id)
      .sort();
    await expect(thumbs(page)).toHaveCount(expected.length);
    const ids = await thumbIds(page);
    for (const id of ids) {
      expect(characters.find((c) => c.id === id)?.rarity).toBe(rarity);
    }
    expect(ids.sort()).toEqual(expected);
  });

  test("AC-39 等級と役割の組み合わせは AND 条件", async ({ page }) => {
    const roles = [...new Set(kingdom.map((c) => c.role).filter((r): r is string => !!r))];
    test.skip(roles.length === 0, "キングダムのデータに role が無く、役割フィルタが出ない");
    await gotoDex(page);
    const rarity = kingdom[0].rarity;
    const role = roles[0];
    await page.getByTestId(`filter-grade-${rarity}`).click();
    await page.getByTestId(`filter-role-${role}`).click();
    await expect(page.getByTestId(`filter-role-${role}`)).toHaveAttribute("aria-pressed", "true");
    const expected = kingdom
      .filter((c) => c.rarity === rarity && c.role === role)
      .map((c) => c.id)
      .sort();
    if (expected.length === 0) {
      await expect(page.getByTestId("empty-state")).toBeVisible();
    } else {
      await expect(thumbs(page)).toHaveCount(expected.length);
      expect((await thumbIds(page)).sort()).toEqual(expected);
    }
  });

  test("AC-39 検索語とフィルタも AND（検索 × 等級）", async ({ page }) => {
    await gotoDex(page);
    const rarity = kingdom[0].rarity;
    const q = kingdom[0].names.en.slice(0, 4);
    await searchbox(page).fill(q);
    await page.getByTestId(`filter-grade-${rarity}`).click();
    const expected = kingdom
      .filter((c) => c.rarity === rarity && oracleMatches(c, q))
      .map((c) => c.id)
      .sort();
    await expect(thumbs(page)).toHaveCount(expected.length);
    expect((await thumbIds(page)).sort()).toEqual(expected);
  });

  test("AC-39 同じフィルタをもう一度押すと解除される（aria-pressed=false、全件に戻る）", async ({
    page,
  }) => {
    await gotoDex(page);
    const rarity = kingdom[0].rarity;
    await page.getByTestId(`filter-grade-${rarity}`).click();
    await page.getByTestId(`filter-grade-${rarity}`).click();
    await expect(page.getByTestId(`filter-grade-${rarity}`)).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(thumbs(page)).toHaveCount(kingdom.length);
  });

  test("AC-40 該当 0 件でメッセージと「条件をクリア」が出て、押すと検索欄とフィルタが初期化される", async ({
    page,
  }) => {
    await gotoDex(page);
    await page.getByTestId(`filter-grade-${kingdom[0].rarity}`).click();
    await searchbox(page).fill("zzzzqqqq存在しない");
    const empty = page.getByTestId("empty-state");
    await expect(empty).toBeVisible();
    await expect(empty).toContainText("該当するクッキーが見つかりません");
    await empty.getByRole("button", { name: "条件をクリア" }).click();
    await expect(searchbox(page)).toHaveValue("");
    await expect(page.locator('[data-testid^="filter-"][aria-pressed="true"]')).toHaveCount(0);
    await expect(page.getByTestId("empty-state")).toHaveCount(0);
    await expect(thumbs(page)).toHaveCount(kingdom.length);
  });

  test("AC-40 オーブンブレイクのタブでも 0 件表示→クリアで、そのタブの全キャラが出る", async ({
    page,
  }) => {
    await gotoDex(page);
    await switchTab(page, "ovenbreak");
    await searchbox(page).fill("zzzzqqqq");
    await page.getByTestId("empty-state").getByRole("button", { name: "条件をクリア" }).click();
    await expect(thumbs(page)).toHaveCount(ovenbreak.length);
  });

  test("AC-41 絞り込みで選択中のキャラが消えたら、結果の先頭キャラが選ばれる", async ({ page }) => {
    test.skip(kingdom.length < 2, "キングダムが 1 体のみで『消える』状況を作れない");
    const last = kingdom[kingdom.length - 1];
    const first = kingdom[0];
    const q = first.names.en;
    test.skip(oracleMatches(last, q), "先頭キャラの英語名が末尾キャラにも当たる");
    await gotoDex(page);
    await page.getByTestId(`thumb-${last.id}`).click();
    await expect(page.getByTestId(`thumb-${last.id}`)).toHaveAttribute("aria-current", "true");
    await searchbox(page).fill(q);
    await expect(page.getByTestId(`thumb-${last.id}`)).toHaveCount(0);
    const ids = await thumbIds(page);
    expect(await selectedId(page)).toBe(ids[0]);
    const head = characters.find((c) => c.id === ids[0]);
    await expect(page.getByTestId("detail-name")).toHaveText(head?.names.ja ?? "");
  });

  test("AC-41 0 件のときは中央と右パネルに「キャラを選んでください」の空状態が出る", async ({
    page,
  }) => {
    await gotoDex(page);
    await searchbox(page).fill("zzzzqqqq");
    const none = page.getByTestId("no-selection");
    await expect(none).toBeVisible();
    await expect(page.getByText("キャラを選んでください").first()).toBeVisible();
    await expect(page.getByTestId("card3d")).toHaveCount(0);
    await expect(page.getByTestId("detail-name")).toHaveCount(0);
    // 条件を戻すと選択が復活する
    await searchbox(page).fill("");
    await expect(page.getByTestId("no-selection")).toHaveCount(0);
    await expect(page.getByTestId("card3d")).toBeVisible();
  });

  test("AC-42 オーブンブレイクで role が無い場合、役割フィルタは無効表示か非表示", async ({
    page,
  }) => {
    test.skip(
      ovenbreak.some((c) => c.role),
      "オーブンブレイクのデータに role がある",
    );
    await gotoDex(page);
    await switchTab(page, "ovenbreak");
    const roleBtns = page.locator('[data-testid^="filter-role-"]');
    const n = await roleBtns.count();
    for (let i = 0; i < n; i++) {
      const b = roleBtns.nth(i);
      const visible = await b.isVisible();
      if (visible) await expect(b).toBeDisabled();
    }
  });
});
