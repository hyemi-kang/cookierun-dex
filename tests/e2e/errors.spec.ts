// エラー状態 AC-59〜63
import { expect, test } from "@playwright/test";
import {
  collectPageErrors,
  gotoDex,
  kingdom,
  mockAssetsMissing,
  mockAssetsOk,
  searchbox,
  selectCharacter,
  thumbs,
  withMotions,
} from "./helpers";

test.describe("エラー状態", () => {
  test("AC-59 立ち絵が 404 のとき、カード表面にキャラ名と代わりの表示が出て、ほかの操作は使える", async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.route("**/illustration.webp", (r) => r.fulfill({ status: 404, body: "" }));
    await gotoDex(page);
    const front = page.getByTestId("card-front");
    await expect(front).toBeVisible();
    await expect(front.getByTestId("silhouette")).toBeVisible();
    await expect(front).toContainText(kingdom[0].names.ja);
    // 回転・裏返しは使える
    await page.getByTestId("flip-card").click();
    await expect(page.getByTestId("card3d")).toHaveAttribute("data-side", "back");
    await page.getByTestId("reset-rotation").click();
    await expect(page.getByTestId("card3d")).toHaveAttribute("data-side", "front");
    expect(errors).toEqual([]);
  });

  test("AC-60 サムネが読み込めないとき、頭文字のプレースホルダーに置き換わり、要素の高さは変わらない", async ({
    page,
  }) => {
    // 1) 画像が読める状態の高さ
    await mockAssetsOk(page);
    await gotoDex(page);
    await expect(thumbs(page)).toHaveCount(kingdom.length);
    await page.waitForLoadState("networkidle");
    const heightsOk = await thumbs(page).evaluateAll((els) =>
      els.map((e) => Math.round(e.getBoundingClientRect().height)),
    );
    // 2) 読めない状態
    await page.unroute("**/assets/{crk,crob}/**");
    await mockAssetsMissing(page);
    await page.reload();
    await expect(thumbs(page)).toHaveCount(kingdom.length);
    await page.waitForLoadState("networkidle");
    const heightsNg = await thumbs(page).evaluateAll((els) =>
      els.map((e) => Math.round(e.getBoundingClientRect().height)),
    );
    expect(heightsNg).toEqual(heightsOk);
    for (const c of kingdom) {
      const t = page.getByTestId(`thumb-${c.id}`);
      await expect(
        t
          .getByTestId("silhouette")
          .or(t.getByText(c.names.ja.charAt(0)))
          .first(),
      ).toBeVisible();
      await expect(t).toContainText(c.names.ja.charAt(0));
    }
  });

  test("AC-61 動作素材が読み込めないとき、代替演出（跳ねる）に切り替わり、通知が出て約 3 秒で消える", async ({
    page,
  }) => {
    test.skip(withMotions.length === 0, "データに motions を持つキャラが無い（素材取得前）");
    const c = withMotions[0];
    await page.route("**/assets/{crk,crob}/**", (r) => r.fulfill({ status: 404, body: "" }));
    await gotoDex(page);
    await selectCharacter(page, c);
    await page.getByTestId("view-stage").click();
    const m = c.motions[0];
    await page.getByTestId(`motion-${m.id}`).click();
    const toast = page.getByTestId("toast");
    await expect(toast).toBeVisible({ timeout: 2000 });
    await expect(toast).toContainText("この動作は読み込めませんでした");
    await expect(page.locator('[data-fallback-motion="bounce"]').first()).toBeAttached();
    await page.waitForTimeout(1500);
    await expect(toast, "3 秒間は出ている").toBeVisible();
    await expect(toast).toBeHidden({ timeout: 3500 });
  });

  test("AC-62 素材ディレクトリが丸ごと無くても白い画面にならず、全キャラがプレースホルダーで出てデータと検索が使える", async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await mockAssetsMissing(page);
    await gotoDex(page);
    await expect(thumbs(page)).toHaveCount(kingdom.length);
    for (const c of kingdom) {
      const t = page.getByTestId(`thumb-${c.id}`);
      await expect(t).toBeVisible();
      await expect(t).toContainText(c.names.ja.charAt(0));
    }
    await expect(page.getByTestId("detail-name")).toHaveText(kingdom[0].names.ja);
    expect((await page.locator("body").innerText()).trim().length).toBeGreaterThan(0);
    // 検索が使える
    await searchbox(page).fill("zzzzqqqq");
    await expect(page.getByTestId("empty-state")).toBeVisible();
    await searchbox(page).fill(kingdom[0].names.en);
    await expect(page.getByTestId(`thumb-${kingdom[0].id}`)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("AC-62 実環境（public/assets が無いままのビルド）でも同様に表示される", async ({ page }) => {
    // ルートのモックなし。プレビューサーバーが実際に返す応答に対して確認する
    const errors = collectPageErrors(page);
    await gotoDex(page);
    await expect(thumbs(page)).toHaveCount(kingdom.length);
    await expect(page.getByTestId("detail-name")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("AC-63 存在しないパスで「ページが見つかりません」と / へのリンクが出る", async ({
    page,
  }) => {
    await page.goto("/foo");
    await expect(page.getByText("ページが見つかりません")).toBeVisible();
    const link = page.locator('a[href="/"]').first();
    await expect(link).toBeVisible();
    await link.click();
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(page.getByRole("tablist").first()).toBeVisible();
  });

  test("AC-63 深い階層の存在しないパスでも 404 画面になる", async ({ page }) => {
    await page.goto("/foo/bar/baz");
    await expect(page.getByText("ページが見つかりません")).toBeVisible();
  });
});
