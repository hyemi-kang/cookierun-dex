// 宣伝ページ /promo AC-51〜57（AC-58 は目視 [M]）
import { expect, test } from "@playwright/test";
import { collectPageErrors, gotoDex, timeline } from "./helpers";

const runnerX = (page: import("@playwright/test").Page) =>
  page.getByTestId("runner").evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);

const scrollToRatio = (page: import("@playwright/test").Page, r: number) =>
  page.evaluate((ratio) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.round(max * ratio));
  }, r);

test.describe("宣伝ページ", () => {
  test("AC-51 冒頭に動画枠が出る。hero.mp4 があれば muted autoplay loop playsinline の video", async ({
    page,
  }) => {
    await page.goto("/promo");
    await expect(page.getByTestId("promo-hero")).toBeVisible();
    // hero.mp4 の有無は実際の応答で判定する（プレビューは未知のパスに index.html を返すことがあるため content-type も見る）
    const res = await page.request.get("/promo/hero.mp4");
    const heroVideoExists = res.ok() && (res.headers()["content-type"] ?? "").startsWith("video/");
    test.skip(
      !heroVideoExists,
      "public/promo/hero.mp4 が無い（枠の確認のみ。代替表示は AC-52 で確認）",
    );
    const v = page.getByTestId("hero-video");
    await expect(v).toBeAttached();
    expect(await v.evaluate((el: HTMLVideoElement) => el.muted)).toBe(true);
    for (const a of ["autoplay", "loop", "playsinline"]) {
      expect(await v.evaluate((el, n) => el.hasAttribute(n), a), a).toBe(true);
    }
  });

  test("AC-52 hero.mp4 が読み込めないとき、代替表示に切り替わり未処理の例外が出ない", async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    await page.route("**/promo/hero.mp4", (route) => route.fulfill({ status: 404, body: "" }));
    await page.goto("/promo");
    await expect(page.getByTestId("promo-hero")).toBeVisible();
    await expect(page.getByTestId("hero-fallback")).toBeVisible({ timeout: 5000 });
    expect(errors).toEqual([]);
  });

  test("AC-53 年表に 4 項目以上が年の昇順で並び、各項目に年・タイトル・概要が出る", async ({
    page,
  }) => {
    await page.goto("/promo");
    const cards = page.getByTestId("timeline-card");
    await expect(cards.first()).toBeAttached();
    const n = await cards.count();
    expect(n).toBeGreaterThanOrEqual(4);
    const texts = await cards.evaluateAll((els) => els.map((e) => e.textContent ?? ""));
    const years = texts.map((t) => Number(t.match(/\d{4}/)?.[0]));
    expect(
      years.every((y) => Number.isFinite(y)),
      "各項目に年がある",
    ).toBe(true);
    expect(years).toEqual([...years].sort((a, b) => a - b));
    // timeline.json（データ担当）と内容が一致する
    test.skip(
      timeline.length < 4,
      "timeline.json が 4 件未満（データ未整備）。画面側の件数・順序だけ確認した",
    );
    const sorted = [...timeline].sort((a, b) => a.year - b.year);
    expect(n).toBe(sorted.length);
    sorted.forEach((item, i) => {
      expect(texts[i], `項目${i}: 年`).toContain(String(item.year));
      expect(texts[i], `項目${i}: タイトル`).toContain(item.title);
      expect(texts[i], `項目${i}: 概要`).toContain(item.summary);
    });
  });

  test("AC-54 スクロールで走るキャラの X が増え、戻すと戻る。時間では動かない", async ({
    page,
  }) => {
    await page.goto("/promo");
    await expect(page.getByTestId("runner")).toBeAttached();
    const x0 = await runnerX(page);
    // 時間経過だけでは動かない
    await page.waitForTimeout(600);
    expect(await runnerX(page), "時間では動かない").toBeCloseTo(x0, 0);
    await scrollToRatio(page, 1);
    await expect.poll(() => runnerX(page), { timeout: 3000 }).toBeGreaterThan(x0);
    const xEnd = await runnerX(page);
    await scrollToRatio(page, 0.5);
    await expect.poll(() => runnerX(page), { timeout: 3000 }).toBeLessThan(xEnd);
    const xMid = await runnerX(page);
    expect(xMid).toBeGreaterThan(x0 - 1);
    // 止まっている間は動かない
    await page.waitForTimeout(500);
    expect(await runnerX(page)).toBeCloseTo(xMid, 0);
  });

  test("AC-55 年表の項目は画面に入ると opacity が 1 になる（入る前は 1 未満）", async ({
    page,
  }) => {
    await page.goto("/promo");
    const cards = page.getByTestId("timeline-card");
    await expect(cards.first()).toBeAttached();
    const n = await cards.count();
    const last = cards.nth(n - 1);
    expect(
      Number(await last.evaluate((el) => getComputedStyle(el).opacity)),
      "入る前",
    ).toBeLessThan(1);
    // 段階的にスクロールして末尾まで
    for (const r of [0.25, 0.5, 0.75, 1]) {
      await scrollToRatio(page, r);
      await page.waitForTimeout(80);
    }
    for (let i = 0; i < n; i++)
      await expect(cards.nth(i)).toHaveCSS("opacity", "1", { timeout: 3000 });
  });

  test("AC-56 最後の CTA「図鑑を見る」をクリックすると / に移り図鑑が表示される", async ({
    page,
  }) => {
    await page.goto("/promo");
    await scrollToRatio(page, 1);
    const cta = page.getByTestId("cta-dex");
    await expect(cta).toBeVisible();
    await expect(cta).toContainText("図鑑を見る");
    await cta.click();
    await expect(page).toHaveURL(/\/(\?.*)?$/);
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(page.getByRole("tablist").first()).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "クッキーを検索" })).toBeVisible();
  });

  test("AC-57 / から /promo へのリンクがあり、/promo からも / に戻れる", async ({ page }) => {
    await gotoDex(page);
    await page.getByRole("link", { name: /宣伝ページ/ }).click();
    await expect(page).toHaveURL(/\/promo$/);
    await expect(page.getByTestId("promo-hero")).toBeVisible();
    await page.getByRole("link", { name: "図鑑", exact: true }).click();
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(page.getByRole("tablist").first()).toBeVisible();
  });

  test("AC-57 ブラウザの戻る/進むでも画面が追従する", async ({ page }) => {
    await gotoDex(page);
    await page.getByRole("link", { name: /宣伝ページ/ }).click();
    await expect(page.getByTestId("promo-hero")).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("tablist").first()).toBeVisible();
    await page.goForward();
    await expect(page.getByTestId("promo-hero")).toBeVisible();
  });
});
