// prefers-reduced-motion AC-47〜50
import { expect, test } from "@playwright/test";
import {
  dragCard,
  gotoDex,
  mockAssetsOk,
  mod360,
  rotation,
  selectCharacter,
  withMotions,
  withSkill,
} from "./helpers";

test.use({ reducedMotion: "reduce" });

/** カード周辺の transform をまとめた文字列（傾き・揺れの有無の検出用） */
const cardTransforms = (page: import("@playwright/test").Page) =>
  page.getByTestId("card3d").evaluate((el) => {
    const nodes: Element[] = [];
    let p: Element | null = el.parentElement;
    for (let i = 0; i < 3 && p; i++, p = p.parentElement) nodes.push(p);
    nodes.push(el, ...Array.from(el.querySelectorAll("*")));
    return nodes.map((n) => getComputedStyle(n).transform).join("|");
  });

test.describe("reduced-motion: 図鑑", () => {
  test("AC-47 ドラッグ回転とダブルクリックでのリセットは使える", async ({ page }) => {
    await gotoDex(page);
    await dragCard(page, 200, "slow");
    await page.waitForTimeout(300);
    expect(Math.abs(await rotation(page))).toBeGreaterThanOrEqual(90);
    await page.getByTestId("card3d").dblclick();
    await expect
      .poll(
        async () => Math.min(mod360(await rotation(page)), 360 - mod360(await rotation(page))),
        {
          timeout: 1500,
        },
      )
      .toBeLessThan(1);
  });

  test("AC-47 速くドラッグして離しても、離した直後から回転角が変わらない（慣性なし）", async ({
    page,
  }) => {
    await gotoDex(page);
    const { beforeRelease } = await dragCard(page, 200, "fast");
    await page.waitForTimeout(100);
    const a = await rotation(page);
    await page.waitForTimeout(500);
    const b = await rotation(page);
    // 設計書 5章は「慣性の代わりに最寄りの 0°/180° へ寄せる」とあるが、AC-47 は『離した直後に変わらなくなる』。AC を正とする。
    expect(Math.abs(a - beforeRelease), "離した後に回転角が動いていない").toBeLessThan(1);
    expect(Math.abs(b - a)).toBeLessThan(1);
  });

  test("AC-47 マウス追従の傾きが動かない", async ({ page }) => {
    await gotoDex(page);
    const box = await page.getByTestId("card3d").boundingBox();
    if (!box) throw new Error("card3d なし");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);
    const base = await cardTransforms(page);
    await page.mouse.move(box.x + 4, box.y + 4, { steps: 5 });
    await page.waitForTimeout(400);
    expect(await cardTransforms(page)).toBe(base);
    await page.mouse.move(box.x + box.width - 4, box.y + box.height - 4, { steps: 5 });
    await page.waitForTimeout(400);
    expect(await cardTransforms(page)).toBe(base);
  });

  test("AC-47 待機中の揺れが起きない（3 秒以上操作しなくても transform が変わらない）", async ({
    page,
  }) => {
    test.setTimeout(30_000);
    await gotoDex(page);
    await page.mouse.move(0, 0);
    const base = await cardTransforms(page);
    await page.waitForTimeout(3800); // AC-23: 3 秒操作しないと揺れ始める（通常時）。reduce では起きない
    expect(await cardTransforms(page)).toBe(base);
    await page.waitForTimeout(700);
    expect(await cardTransforms(page)).toBe(base);
  });

  test("AC-48 スキル発動でスキル名だけを表示し、パーティクルは出さない", async ({ page }) => {
    test.skip(withSkill.length === 0, "データに skill を持つキャラが無い");
    const c = withSkill[0];
    await gotoDex(page);
    await selectCharacter(page, c);
    await page.getByTestId("view-stage").click();
    await page.getByTestId("skill-btn").click();
    await expect(page.getByTestId("skill-cutin")).toBeVisible({ timeout: 300 });
    await expect(page.getByTestId("skill-cutin")).toContainText(c.skill?.name ?? "");
    for (let i = 0; i < 5; i++) {
      expect(await page.getByTestId("particle-canvas").count(), "粒子 Canvas なし").toBe(0);
      await page.waitForTimeout(100);
    }
    await expect(page.getByTestId("skill-cutin")).toBeHidden({ timeout: 2500 });
  });

  test("AC-49 ステージの動作素材は最初は静止画で、動作ボタンを押したときだけ再生用 WebP になる", async ({
    page,
  }) => {
    test.skip(withMotions.length === 0, "データに motions を持つキャラが無い（素材取得前）");
    await mockAssetsOk(page);
    const c = withMotions[0];
    await gotoDex(page);
    await selectCharacter(page, c);
    await page.getByTestId("view-stage").click();
    const img = page.getByTestId("stage-img");
    const first =
      c.motions.find((m) => m.id === "idle") ??
      c.motions.find((m) => m.id === "run") ??
      c.motions[0];
    const target = c.motions.find((m) => m.id !== first.id) ?? first;
    // 初期表示: 再生用 src ではなく still か立ち絵
    const initial = (await img.getAttribute("src")) ?? "";
    expect(initial).not.toBe(first.src);
    expect([first.still, c.images.illustration].some((s) => initial.includes(s))).toBe(true);
    await page.getByTestId(`motion-${target.id}`).click();
    await expect(img).toHaveAttribute("src", target.src);
  });
});

test.describe("reduced-motion: /promo", () => {
  test("AC-50 走るキャラはアニメーションせず、年表は普通にスクロールして読める", async ({
    page,
  }) => {
    await page.goto("/promo");
    const runner = page.getByTestId("runner");
    await expect(runner).toBeAttached();
    const running = await runner.evaluate(
      (el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length,
    );
    expect(running, "実行中の CSS/WAAPI アニメーション").toBe(0);
    // 年表は最初から全表示（opacity 1）で、ページ末尾までスクロールできる
    const cards = page.getByTestId("timeline-card");
    expect(await cards.count()).toBeGreaterThanOrEqual(4);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    const n = await cards.count();
    for (let i = 0; i < n; i++) await expect(cards.nth(i)).toHaveCSS("opacity", "1");
    await expect(page.getByTestId("cta-dex")).toBeVisible();
  });
});
