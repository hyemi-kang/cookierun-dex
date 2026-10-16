// 一覧・選択・説明パネル AC-14〜17
import { expect, test } from "@playwright/test";
import {
  characters,
  collectPanelText,
  findInPanelTabs,
  gotoDex,
  kingdom,
  mockAssetsOk,
  selectCharacter,
} from "./helpers";

test.describe("一覧と選択", () => {
  test("AC-14 一覧のキャラをクリックすると 1 秒以内に中央カードの alt と右パネル見出しが names.ja になる", async ({
    page,
  }) => {
    await mockAssetsOk(page); // 立ち絵が読み込めている状態で alt を確認する
    await gotoDex(page);
    const target = kingdom[kingdom.length - 1];
    await page.getByTestId(`thumb-${target.id}`).click();
    await expect(page.getByTestId("detail-name")).toHaveText(target.names.ja, { timeout: 1000 });
    await expect(
      page.getByTestId("card-front").locator(`img[alt="${target.names.ja}"]`).first(),
    ).toBeAttached({ timeout: 1000 });
  });

  test("AC-14 全キャラで見出しが切り替わる", async ({ page }) => {
    await gotoDex(page);
    for (const c of kingdom) {
      await page.getByTestId(`thumb-${c.id}`).click();
      await expect(page.getByTestId("detail-name")).toHaveText(c.names.ja, { timeout: 1000 });
    }
  });

  test("AC-15 選択中のキャラだけ aria-current=true で、見た目（枠線など）も変わる", async ({
    page,
  }) => {
    await gotoDex(page);
    await expect(page.locator('[data-testid^="thumb-"][aria-current="true"]')).toHaveCount(1);
    test.skip(kingdom.length < 2, "キングダムが 1 体のみのため、選択前後の見た目比較ができない");
    const a = page.getByTestId(`thumb-${kingdom[0].id}`);
    const b = page.getByTestId(`thumb-${kingdom[1].id}`);
    // 要素と子孫の枠線・影・背景などをまとめて文字列化（画像そのものは比較しない）
    const style = (l: typeof a) =>
      l.evaluate((el) =>
        [el, ...Array.from(el.querySelectorAll("*"))]
          .map((e) => {
            const s = getComputedStyle(e);
            return [
              s.borderColor,
              s.borderWidth,
              s.outlineColor,
              s.outlineWidth,
              s.boxShadow,
              s.backgroundColor,
              s.opacity,
              s.transform,
            ].join("|");
          })
          .join("#"),
      );
    await expect(a).toHaveAttribute("aria-current", "true");
    const selectedStyle = await style(a);
    await b.click();
    await expect(b).toHaveAttribute("aria-current", "true");
    await expect(a).not.toHaveAttribute("aria-current", "true");
    await expect(page.locator('[data-testid^="thumb-"][aria-current="true"]')).toHaveCount(1);
    await expect.poll(async () => (await style(a)) !== selectedStyle, { timeout: 1500 }).toBe(true);
  });

  test("AC-16 右パネルに等級・スキル・出典・ライセンスが出る。データにない項目は「不明」で空欄にしない", async ({
    page,
  }) => {
    await gotoDex(page);
    for (const c of kingdom) {
      await selectCharacter(page, c);
      const text = await collectPanelText(page);
      expect(text, `${c.id}: 等級`).toContain(c.rarity);
      expect(text, `${c.id}: ライセンス`).toContain("CC BY-SA 4.0");
      for (const label of ["等級", "ポジション", "役割", "初登場", "実装日"]) {
        expect(text, `${c.id}: 項目名 ${label}`).toContain(label);
      }
      if (c.skill) {
        expect(text, `${c.id}: スキル名`).toContain(c.skill.name);
        expect(text, `${c.id}: スキル要約`).toContain(c.skill.summary);
      }
      const missing = !c.position || !c.role || !c.firstAppearance || !c.releaseDate || !c.skill;
      if (missing) expect(text, `${c.id}: 欠けた項目は「不明」`).toContain("不明");
      if (c.position) expect(text).toContain(c.position);
      if (c.role) expect(text).toContain(c.role);
      if (c.firstAppearance) expect(text).toContain(c.firstAppearance);
    }
  });

  test("AC-17 出典リンクは sourceUrl を target=_blank rel=noopener noreferrer で開き、© Devsisters が出る", async ({
    page,
  }) => {
    await gotoDex(page);
    for (const c of characters.filter((x) => x.title === "kingdom")) {
      await selectCharacter(page, c);
      const link = await findInPanelTabs(page, () => page.getByTestId("source-link"));
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", c.sourceUrl);
      await expect(link).toHaveAttribute("target", "_blank");
      const rel = (await link.getAttribute("rel")) ?? "";
      expect(rel.split(/\s+/)).toEqual(expect.arrayContaining(["noopener", "noreferrer"]));
      const credit = await findInPanelTabs(page, () => page.getByTestId("credit"));
      await expect(credit).toContainText("© Devsisters");
    }
  });
});
