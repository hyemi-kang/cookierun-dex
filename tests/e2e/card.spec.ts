// 回転カード AC-18〜21, 24（AC-22, 23 は目視 [M]）
import { expect, test } from "@playwright/test";
import {
  dragCard,
  gotoDex,
  kingdom,
  mod360,
  rotation,
  settledRotation,
  switchTab,
  thumbs,
} from "./helpers";

test.describe("回転カード", () => {
  test.beforeEach(async ({ page }) => {
    await gotoDex(page);
    await expect(page.getByTestId("card3d")).toBeVisible();
  });

  test("AC-18 水平に 200px ドラッグすると Y 軸回転角が 90° 以上変わる", async ({ page }) => {
    const before = await rotation(page);
    await dragCard(page, 200, "slow");
    const after = await settledRotation(page);
    expect(Math.abs(after - before)).toBeGreaterThanOrEqual(90);
  });

  test("AC-18 逆方向（-200px）でも 90° 以上変わる", async ({ page }) => {
    const before = await rotation(page);
    await dragCard(page, -200, "slow");
    const after = await settledRotation(page);
    expect(Math.abs(after - before)).toBeGreaterThanOrEqual(90);
  });

  test("AC-18 境界: 数 px の微小ドラッグでは回転が 90° 未満", async ({ page }) => {
    const before = await rotation(page);
    await dragCard(page, 4, "slow");
    const after = await settledRotation(page);
    expect(Math.abs(after - before)).toBeLessThan(90);
  });

  test("AC-19 裏返しボタンで裏面（data-side=back）になり、裏面に等級・役割・ポジションが出る", async ({
    page,
  }) => {
    const c = kingdom[0];
    await expect(page.getByTestId("card3d")).toHaveAttribute("data-side", "front");
    await page.getByTestId("flip-card").click();
    await expect
      .poll(async () => mod360(await rotation(page)), { timeout: 2000 })
      .toBeCloseTo(180, 0);
    await expect(page.getByTestId("card3d")).toHaveAttribute("data-side", "back");
    const back = page.getByTestId("card-back");
    await expect(back).toBeVisible();
    await expect(back).toContainText(c.rarity);
    // 裏面の項目名と値（値が無いときの表記は AC-19 では規定されない。空欄でないことだけ確認する）
    await expect(back).toContainText("役割");
    await expect(back).toContainText("ポジション");
    if (c.role) await expect(back).toContainText(c.role);
    if (c.position) await expect(back).toContainText(c.position);
  });

  test("AC-19 data-side は回転角 90〜270°(mod 360) で back、それ以外で front と一致する", async ({
    page,
  }) => {
    const check = async () => {
      const r = mod360(await settledRotation(page));
      const side = await page.getByTestId("card3d").getAttribute("data-side");
      expect(side, `rotation=${r}`).toBe(r >= 90 && r <= 270 ? "back" : "front");
    };
    await check(); // 0°
    for (const dx of [120, 120, 120, -500]) {
      await dragCard(page, dx, "slow");
      await check();
    }
  });

  test("AC-19 正面ボタンで表面に戻る", async ({ page }) => {
    await page.getByTestId("flip-card").click();
    await expect(page.getByTestId("card3d")).toHaveAttribute("data-side", "back");
    await page.getByTestId("reset-rotation").click();
    await expect(page.getByTestId("card3d")).toHaveAttribute("data-side", "front");
  });

  test("AC-20 ダブルクリックで 800ms 以内に回転角が 0°（正面）に戻る", async ({ page }) => {
    await dragCard(page, 200, "slow");
    await settledRotation(page);
    await page.getByTestId("card3d").dblclick();
    await expect
      .poll(
        async () => {
          const r = mod360(await rotation(page));
          return Math.min(r, 360 - r);
        },
        { timeout: 800 },
      )
      .toBeLessThan(1);
    await expect(page.getByTestId("card3d")).toHaveAttribute("data-side", "front");
  });

  test("AC-21 速くドラッグして離すと離した後も回転角が変わり続け、2 秒以内に止まる", async ({
    page,
  }) => {
    const { beforeRelease } = await dragCard(page, 200, "fast");
    await page.waitForTimeout(150);
    const soon = await rotation(page);
    expect(Math.abs(soon - beforeRelease), "離した後も回っている").toBeGreaterThan(1);
    const t0 = Date.now();
    const final = await settledRotation(page, 2500);
    expect(Date.now() - t0, "2 秒以内に停止").toBeLessThanOrEqual(2200);
    await page.waitForTimeout(300);
    expect(Math.abs((await rotation(page)) - final)).toBeLessThan(0.5);
  });

  test("AC-21 ゆっくりドラッグして離すと、離した直後に止まる（慣性による変化が 5° 未満）", async ({
    page,
  }) => {
    const { beforeRelease } = await dragCard(page, 60, "slow");
    await page.waitForTimeout(600);
    expect(Math.abs((await rotation(page)) - beforeRelease)).toBeLessThan(5);
  });

  test("AC-24 別のキャラを選ぶと回転角は 0° に戻る", async ({ page }) => {
    await page.getByTestId("flip-card").click();
    await expect(page.getByTestId("card3d")).toHaveAttribute("data-side", "back");
    if (kingdom.length >= 2) {
      await page.getByTestId(`thumb-${kingdom[1].id}`).click();
    } else {
      await switchTab(page, "ovenbreak");
    }
    await expect
      .poll(async () => mod360(await rotation(page)), { timeout: 1500 })
      .toBeCloseTo(0, 0);
    await expect(page.getByTestId("card3d")).toHaveAttribute("data-side", "front");
    expect(await thumbs(page).count()).toBeGreaterThan(0);
  });

  test("UI契約 カードにフォーカスして Space で裏返し、Home で正面に戻す", async ({ page }) => {
    await page.getByTestId("card3d").focus();
    await page.keyboard.press("Space");
    await expect(page.getByTestId("card3d")).toHaveAttribute("data-side", "back");
    await page.keyboard.press("Home");
    await expect(page.getByTestId("card3d")).toHaveAttribute("data-side", "front");
  });
});
