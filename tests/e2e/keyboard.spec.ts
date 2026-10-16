// キーボード操作 AC-43〜46
import { expect, type Page, test } from "@playwright/test";
import {
  blurActive,
  gotoDex,
  kingdom,
  searchbox,
  selectedId,
  thumbIds,
  withSkill,
} from "./helpers";

async function idle(page: Page) {
  await gotoDex(page);
  await blurActive(page);
}

test.describe("キーボード操作", () => {
  test("AC-43 → で表示中の一覧の次のキャラ、← で前のキャラが選ばれる", async ({ page }) => {
    await idle(page);
    const ids = await thumbIds(page);
    const start = ids.indexOf((await selectedId(page)) ?? "");
    expect(start).toBeGreaterThanOrEqual(0);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => selectedId(page)).toBe(ids[(start + 1) % ids.length]);
    await page.keyboard.press("ArrowLeft");
    await expect.poll(() => selectedId(page)).toBe(ids[start]);
    // 中央と右パネルも追従する
    await expect(page.getByTestId("detail-name")).toHaveText(
      kingdom.find((c) => c.id === ids[start])?.names.ja ?? "",
    );
  });

  test("AC-43 フィルタ済みの一覧では、表示中のキャラの範囲だけをたどる", async ({ page }) => {
    await idle(page);
    const rarity = kingdom[0].rarity;
    await page.getByTestId(`filter-grade-${rarity}`).click();
    await blurActive(page);
    const ids = await thumbIds(page);
    for (let i = 0; i < ids.length + 1; i++) {
      await page.keyboard.press("ArrowRight");
      expect(ids).toContain(await selectedId(page));
    }
  });

  test("AC-44 一覧の最後で → を押すと先頭に戻り、先頭で ← を押すと最後に移る", async ({ page }) => {
    await idle(page);
    const ids = await thumbIds(page);
    expect(await selectedId(page)).toBe(ids[0]);
    await page.keyboard.press("ArrowLeft");
    await expect.poll(() => selectedId(page)).toBe(ids[ids.length - 1]);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => selectedId(page)).toBe(ids[0]);
  });

  test("AC-45 検索欄にフォーカスがある間は ←/→ でキャラは切り替わらず、入力欄のカーソルが動く", async ({
    page,
  }) => {
    await gotoDex(page);
    const before = await selectedId(page);
    const box = searchbox(page);
    await box.click();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");
    expect(await selectedId(page)).toBe(before);
    // 検索語が空のまま → でも変わらない（0 件にならないので選択が保たれる）
    await box.fill("gin");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.type("X");
    await expect(box).toHaveValue("giXn");
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.type("Y");
    await expect(box).toHaveValue("gYiXn");
  });

  test("AC-45 検索欄の外へフォーカスを移すと再び ← → で切り替わる", async ({ page }) => {
    await gotoDex(page);
    await searchbox(page).focus();
    await blurActive(page);
    const ids = await thumbIds(page);
    const start = ids.indexOf((await selectedId(page)) ?? "");
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => selectedId(page)).toBe(ids[(start + 1) % ids.length]);
  });

  test("AC-46 タブ・一覧・動作ボタン・スキル発動ボタンが Tab キーでたどれ、フォーカスが見た目でわかる", async ({
    page,
  }) => {
    await gotoDex(page);
    const reached = { tab: false, thumb: false, motion: false, skill: false };
    const unseen: string[] = [];
    const walk = async (max: number) => {
      for (let i = 0; i < max; i++) {
        await page.keyboard.press("Tab");
        const info = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;
          const s = getComputedStyle(el);
          const visible =
            (s.outlineStyle !== "none" && Number.parseFloat(s.outlineWidth) > 0) ||
            s.boxShadow !== "none" ||
            el.matches(":focus-visible");
          return {
            id: el.getAttribute("data-testid") ?? "",
            role: el.getAttribute("role") ?? "",
            visible,
            outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`,
            shadow: s.boxShadow,
          };
        });
        if (!info) continue;
        if (info.role === "tab") reached.tab = true;
        if (info.id.startsWith("thumb-")) reached.thumb = true;
        if (info.id.startsWith("motion-") || info.id.startsWith("fallback-")) reached.motion = true;
        if (info.id === "skill-btn") reached.skill = true;
        const tracked =
          info.role === "tab" || /^(thumb-|motion-|fallback-|skill-btn)/.test(info.id);
        if (
          tracked &&
          !(
            info.outline.startsWith("solid") ||
            info.outline.startsWith("auto") ||
            info.shadow !== "none"
          )
        ) {
          unseen.push(`${info.id || info.role}: ${info.outline} / ${info.shadow}`);
        }
      }
    };
    await walk(40);
    expect(reached.tab, "タブに到達").toBe(true);
    expect(reached.thumb, "一覧に到達").toBe(true);
    // ステージ表示でボタンを確認
    if (withSkill.length > 0) {
      // 先頭がスキル持ちでない場合に備えて、スキル持ちのキャラを選ぶ
      await page
        .getByTestId(
          `thumb-${withSkill.filter((c) => c.title === "kingdom")[0]?.id ?? kingdom[0].id}`,
        )
        .click();
    }
    await page.getByTestId("view-stage").click();
    await blurActive(page);
    await walk(60);
    expect(reached.motion, "動作ボタン（または代替演出ボタン）に到達").toBe(true);
    if (withSkill.some((c) => c.title === "kingdom")) {
      expect(reached.skill, "スキル発動ボタンに到達").toBe(true);
    }
    expect(unseen, "フォーカスリングが見えない要素").toEqual([]);
  });
});
