// スキル演出 AC-30〜33（AC-34 は目視 [M]）
import { expect, test } from "@playwright/test";
import { gotoDex, mockAssetsOk, selectCharacter, withSkill } from "./helpers";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test.describe("スキル演出", () => {
  test.skip(withSkill.length === 0, "データに skill を持つキャラが無い");
  const c = withSkill[0];

  test.beforeEach(async ({ page }) => {
    await gotoDex(page);
    await selectCharacter(page, c);
    await page.getByTestId("view-stage").click();
    await expect(page.getByTestId("stage")).toBeVisible();
  });

  test("AC-30 スキル発動で 200ms 以内に skill.name のカットインが出て、2.5 秒以内に消える", async ({
    page,
  }) => {
    await expect(page.getByTestId("skill-cutin")).toHaveCount(0);
    await page.getByTestId("skill-btn").click();
    await expect(page.getByTestId("skill-cutin")).toBeVisible({ timeout: 200 });
    await expect(page.getByTestId("skill-cutin")).toContainText(c.skill?.name ?? "");
    await expect(page.getByTestId("skill-cutin")).toBeHidden({ timeout: 2500 });
  });

  test("AC-31 演出中は particle-canvas が DOM にあり、終わると取り除かれるか非表示になる", async ({
    page,
  }) => {
    await page.getByTestId("skill-btn").click();
    await expect(page.getByTestId("particle-canvas")).toBeAttached({ timeout: 500 });
    await expect(page.getByTestId("particle-canvas")).toBeHidden({ timeout: 2500 });
  });

  test("AC-32 連打しても演出は同時に 1 つだけ。演出中ボタンは disabled、終わると戻る", async ({
    page,
  }) => {
    const btn = page.getByTestId("skill-btn");
    await btn.click();
    await expect(btn).toBeDisabled({ timeout: 300 });
    for (let i = 0; i < 5; i++) await btn.click({ force: true, timeout: 500 }).catch(() => {});
    expect(await page.getByTestId("skill-cutin").count()).toBeLessThanOrEqual(1);
    expect(await page.getByTestId("particle-canvas").count()).toBeLessThanOrEqual(1);
    await expect(btn).toBeEnabled({ timeout: 3500 });
    await btn.click();
    await expect(page.getByTestId("skill-cutin")).toBeVisible({ timeout: 300 });
  });

  test("AC-33 skill1 素材のないキャラは代替演出「つぶれて伸びる」を使う", async ({ page }) => {
    test.skip(
      c.motions.some((m) => m.id === "skill1"),
      "このキャラは skill1 素材を持つ",
    );
    await page.getByTestId("skill-btn").click();
    await expect(page.locator('[data-fallback-motion="squash"]').first()).toBeAttached({
      timeout: 500,
    });
  });
});

test.describe("スキル演出（素材あり）", () => {
  const withSkill1 = withSkill.filter((x) => x.motions.some((m) => m.id === "skill1"));

  test("AC-33 skill1 素材があるキャラは演出中 skill1 に切り替わり、終わると直前の動作に戻る", async ({
    page,
  }) => {
    test.skip(withSkill1.length === 0, "skill1 の動作素材を持つキャラがデータに無い（素材取得前）");
    const x = withSkill1[0];
    const skill1 = x.motions.find((m) => m.id === "skill1");
    const prev =
      x.motions.find((m) => m.id === "idle") ??
      x.motions.find((m) => m.id === "run") ??
      x.motions[0];
    await mockAssetsOk(page);
    await gotoDex(page);
    await selectCharacter(page, x);
    await page.getByTestId("view-stage").click();
    await page.getByTestId(`motion-${prev.id}`).click();
    await page.getByTestId("skill-btn").click();
    await expect(page.getByTestId("stage-img")).toHaveAttribute(
      "src",
      new RegExp(esc(skill1?.src ?? "skill1")),
      { timeout: 500 },
    );
    await expect(page.getByTestId("skill-btn")).toBeEnabled({ timeout: 3500 });
    await expect(page.getByTestId("stage-img")).toHaveAttribute("src", new RegExp(esc(prev.src)));
    await expect(page.getByTestId(`motion-${prev.id}`)).toHaveAttribute("aria-pressed", "true");
  });
});
