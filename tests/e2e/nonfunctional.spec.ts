// 非機能 AC-64, 65
import { expect, test } from "@playwright/test";
import { gotoDex, kingdom, mockAssetsOk, searchbox, switchTab, thumbs } from "./helpers";

test.describe("非機能", () => {
  test("AC-64 / を開いてから最初のキャラの立ち絵が表示されるまで 3 秒以内", async ({ page }) => {
    await mockAssetsOk(page); // 素材がある状況（ローカルで取得済み）を再現
    const t0 = Date.now();
    await page.goto("/");
    const img = page.getByTestId("card-front").locator("img").first();
    await expect(img).toBeVisible({ timeout: 3000 });
    await expect
      .poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), {
        timeout: 3000,
      })
      .toBe(true);
    expect(Date.now() - t0).toBeLessThan(3000);
  });

  test("AC-65 幅 1280px では一覧・中央・右パネルが横に 3 列で並ぶ", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoDex(page);
    const list = await thumbs(page).first().boundingBox();
    const center = await page.getByTestId("card3d").boundingBox();
    const right = await page.getByTestId("detail-name").boundingBox();
    if (!list || !center || !right) throw new Error("要素の位置が取れません");
    const cx = (b: { x: number; width: number }) => b.x + b.width / 2;
    expect(cx(list)).toBeLessThan(cx(center));
    expect(cx(center)).toBeLessThan(cx(right));
    expect(list.x + list.width).toBeLessThanOrEqual(center.x + 2);
    expect(center.x + center.width).toBeLessThanOrEqual(right.x + right.width);
    // 3 列が同じ行帯に並ぶ（縦に積まれていない）
    expect(Math.abs(list.y - center.y)).toBeLessThan(400);
    expect(right.y).toBeLessThan(800);
  });

  test("AC-65 幅 768px では横スクロールバーが出ず、主要機能を操作できる", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await gotoDex(page);
    const noHScroll = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      );
    expect(await noHScroll()).toBe(true);
    // タブ・検索・選択・ビュー切替が操作できる
    await switchTab(page, "ovenbreak");
    await switchTab(page, "kingdom");
    await searchbox(page).fill(kingdom[0].names.en);
    await thumbs(page).first().scrollIntoViewIfNeeded();
    await thumbs(page).first().click();
    await page.getByTestId("view-stage").scrollIntoViewIfNeeded();
    await page.getByTestId("view-stage").click();
    await expect(page.getByTestId("stage")).toBeVisible();
    await page.getByTestId("view-card").click();
    await expect(page.getByTestId("card3d")).toBeVisible();
    expect(await noHScroll()).toBe(true);
  });

  test("AC-65 幅 768px の /promo でも横スクロールバーが出ない", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/promo");
    await expect(page.getByTestId("promo-hero")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });
});
