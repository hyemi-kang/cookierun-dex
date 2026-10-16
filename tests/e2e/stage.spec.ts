// ステージ表示・動作切替 AC-25〜29
import { expect, type Page, test } from "@playwright/test";
import {
  byTitle,
  gotoDex,
  kingdom,
  mockAssetsOk,
  mod360,
  rotation,
  selectCharacter,
  switchTab,
  withMotions,
  withoutMotions,
} from "./helpers";

const motionButtons = (page: Page) => page.locator('[data-testid^="motion-"]');
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test.describe("ステージ表示・動作切替", () => {
  test("AC-25 ステージ表示に切り替えるとカードの代わりにステージが出て、motions の数だけ動作ボタンが並ぶ", async ({
    page,
  }) => {
    await mockAssetsOk(page);
    await gotoDex(page);
    for (const title of ["kingdom", "ovenbreak"] as const) {
      await switchTab(page, title);
      for (const c of byTitle(title)) {
        await selectCharacter(page, c);
        await page.getByTestId("view-stage").click();
        await expect(page.getByTestId("view-stage")).toHaveAttribute("aria-pressed", "true");
        await expect(page.getByTestId("stage")).toBeVisible();
        await expect(page.getByTestId("card3d")).toHaveCount(0);
        await expect(motionButtons(page), c.id).toHaveCount(c.motions.length);
        for (const m of c.motions) {
          await expect(page.getByTestId(`motion-${m.id}`)).toBeVisible();
        }
        await page.getByTestId("view-card").click();
      }
    }
  });

  test("AC-26 動作ボタンをクリックすると stage-img の src がその動作の WebP になり aria-pressed=true", async ({
    page,
  }) => {
    test.skip(withMotions.length === 0, "データに motions を持つキャラが無い（素材取得前）");
    await mockAssetsOk(page);
    await gotoDex(page);
    const c = withMotions[0];
    await selectCharacter(page, c);
    await page.getByTestId("view-stage").click();
    for (const m of c.motions) {
      await page.getByTestId(`motion-${m.id}`).click();
      await expect(page.getByTestId(`motion-${m.id}`)).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("stage-img")).toHaveAttribute("src", new RegExp(esc(m.src)));
      for (const other of c.motions.filter((x) => x.id !== m.id)) {
        await expect(page.getByTestId(`motion-${other.id}`)).toHaveAttribute(
          "aria-pressed",
          "false",
        );
      }
    }
  });

  test("AC-27 motions が空のキャラは「跳ねる」「つぶれて伸びる」の 2 ボタンが出て、押すと data-fallback-motion が付く", async ({
    page,
  }) => {
    test.skip(withoutMotions.length === 0, "motions が空のキャラがデータに無い");
    await gotoDex(page);
    await selectCharacter(page, withoutMotions[0]);
    await page.getByTestId("view-stage").click();
    await expect(page.getByTestId("stage")).toBeVisible();
    await expect(motionButtons(page)).toHaveCount(0);
    await expect(page.getByTestId("fallback-bounce")).toBeVisible();
    await expect(page.getByTestId("fallback-squash")).toBeVisible();
    await page.getByTestId("fallback-bounce").click();
    await expect(page.locator('[data-fallback-motion="bounce"]')).toBeAttached();
    await expect(page.getByTestId("fallback-bounce")).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("fallback-squash").click();
    await expect(page.locator('[data-fallback-motion="squash"]')).toBeAttached();
    await expect(page.getByTestId("fallback-squash")).toHaveAttribute("aria-pressed", "true");
  });

  test("AC-28 ステージ表示のままキャラを切り替えると、新しいキャラの最初の動作（idle→run→代替演出）になる", async ({
    page,
  }) => {
    await mockAssetsOk(page);
    await gotoDex(page);
    await page.getByTestId("view-stage").click();
    const targets = [...kingdom.slice(1), ...byTitle("ovenbreak")];
    for (const c of targets) {
      await selectCharacter(page, c);
      await expect(page.getByTestId("stage")).toBeVisible();
      const first = c.motions.find((m) => m.id === "idle") ?? c.motions.find((m) => m.id === "run");
      if (first) {
        await expect(page.getByTestId(`motion-${first.id}`), c.id).toHaveAttribute(
          "aria-pressed",
          "true",
        );
      } else {
        await expect(page.locator("[data-fallback-motion]").first(), c.id).toBeAttached();
      }
    }
  });

  test("AC-29 カード表示に戻すと、回転カードが正面向きで出る", async ({ page }) => {
    await gotoDex(page);
    await page.getByTestId("flip-card").click();
    await expect(page.getByTestId("card3d")).toHaveAttribute("data-side", "back");
    await page.getByTestId("view-stage").click();
    await expect(page.getByTestId("stage")).toBeVisible();
    await page.getByTestId("view-card").click();
    await expect(page.getByTestId("view-card")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("card3d")).toBeVisible();
    await expect(page.getByTestId("stage")).toHaveCount(0);
    await expect
      .poll(async () => mod360(await rotation(page)), { timeout: 1500 })
      .toBeCloseTo(0, 0);
    await expect(page.getByTestId("card3d")).toHaveAttribute("data-side", "front");
  });
});
