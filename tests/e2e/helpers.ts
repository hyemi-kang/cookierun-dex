// E2E 共通ヘルパー。セレクタは docs/UI契約_testid.md だけを使う。実装コード(src/features)には依存しない。
import { expect, type Locator, type Page } from "@playwright/test";
import charactersJson from "../../src/data/characters.json" with { type: "json" };
import timelineJson from "../../src/data/timeline.json" with { type: "json" };
import type { Character, GameTitle } from "../../src/types/character";

export const characters = charactersJson as unknown as Character[];

export interface TimelineItem {
  year: number;
  title: string;
  summary: string;
  sourceUrl: string;
}
export const timeline = timelineJson as unknown as TimelineItem[];

export const TAB_NAME: Record<GameTitle, string> = {
  kingdom: "キングダム",
  ovenbreak: "オーブンブレイク",
};

/** 一覧の表示順は order 昇順と仮定（PRD 5章: order = 一覧での並び順） */
export function byTitle(title: GameTitle): Character[] {
  return characters.filter((c) => c.title === title).sort((a, b) => a.order - b.order);
}
export const kingdom = byTitle("kingdom");
export const ovenbreak = byTitle("ovenbreak");

// --- 検索の期待値（仕様 AC-35/36 と詳細設計書4章から、テスト側で独立に実装したオラクル）---
export function norm(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .trim();
}
export function oracleMatches(c: Character, q: string): boolean {
  const nq = norm(q);
  const fields = [c.names.ja, c.names.en, c.names.ko, ...(c.names.aliases ?? [])].filter(
    (x): x is string => !!x,
  );
  return fields.some((f) => norm(f).includes(nq));
}

// 1x1 の SVG。素材が「存在する場合」を再現するためのスタブ（バイナリを避けて文字列で返す）
const IMG_STUB =
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#c96"/></svg>';

/** /assets/** をすべて 1x1 画像で成功させる（動作素材・立ち絵があるときの挙動を見る用） */
export async function mockAssetsOk(page: Page) {
  await page.route("**/assets/{crk,crob}/**", (route) =>
    route.fulfill({ status: 200, contentType: "image/svg+xml", body: IMG_STUB }),
  );
}
/** /assets/** をすべて 404 にする（素材ディレクトリがない状態の再現） */
export async function mockAssetsMissing(page: Page) {
  await page.route("**/assets/{crk,crob}/**", (route) =>
    route.fulfill({ status: 404, contentType: "text/plain", body: "not found" }),
  );
}

export async function gotoDex(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.getByRole("tablist").first()).toBeVisible();
}

export const thumbs = (page: Page) => page.locator('[data-testid^="thumb-"]');

export async function thumbIds(page: Page): Promise<string[]> {
  const ids = await thumbs(page).evaluateAll((els) =>
    els.map((e) => (e.getAttribute("data-testid") ?? "").replace(/^thumb-/, "")),
  );
  return ids;
}

export async function selectedId(page: Page): Promise<string | null> {
  const sel = page.locator('[data-testid^="thumb-"][aria-current="true"]');
  if ((await sel.count()) === 0) return null;
  return ((await sel.first().getAttribute("data-testid")) ?? "").replace(/^thumb-/, "");
}

export const tab = (page: Page, title: GameTitle) =>
  page.getByRole("tab", { name: TAB_NAME[title], exact: true });

export async function switchTab(page: Page, title: GameTitle) {
  await tab(page, title).click();
  await expect(tab(page, title)).toHaveAttribute("aria-selected", "true");
}

export const searchbox = (page: Page) => page.getByRole("searchbox", { name: "クッキーを検索" });

/** 入力欄・ボタンのフォーカスを外す（←/→ は検索欄・ボタン・リンクにフォーカスがあると無効のため） */
export async function blurActive(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

export async function rotation(page: Page): Promise<number> {
  return Number(await page.getByTestId("card3d").getAttribute("data-rotation"));
}
export const mod360 = (n: number) => ((n % 360) + 360) % 360;

/** 回転角が安定する（連続2回同じ）まで待って返す */
export async function settledRotation(page: Page, timeout = 4000): Promise<number> {
  let prev = Number.NaN;
  let cur = await rotation(page);
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    await page.waitForTimeout(120);
    prev = cur;
    cur = await rotation(page);
    if (Math.abs(cur - prev) < 0.01) return cur;
  }
  return cur;
}

/** カード中央から水平に dx px ドラッグ。mode=fast は素早く、slow はゆっくり動かして離す */
export async function dragCard(
  page: Page,
  dx: number,
  mode: "fast" | "slow" = "slow",
): Promise<{ beforeRelease: number }> {
  const box = await page.getByTestId("card3d").boundingBox();
  if (!box) throw new Error("card3d の位置が取れません");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  if (mode === "fast") {
    // 実機のフリックに近い速さ（約 8ms 間隔で 10 回）。Playwright の即時移動だと速度が 0 と計算される実装があり得るため
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(x + (dx * i) / 10, y);
      await page.waitForTimeout(8);
    }
  } else {
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(x + (dx * i) / steps, y);
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(250); // 離す直前に止まって速度を 0 にする
  }
  const beforeRelease = await rotation(page);
  await page.mouse.up();
  return { beforeRelease };
}

/** 説明パネルの 概要 / スキル / 登場 タブを順に開いて、条件に合う要素を探す */
export async function findInPanelTabs(page: Page, make: () => Locator): Promise<Locator> {
  const target = make();
  if ((await target.count()) > 0 && (await target.first().isVisible())) return target.first();
  for (const name of ["概要", "スキル", "登場"]) {
    const t = page.getByRole("tab", { name, exact: true });
    if ((await t.count()) === 0) continue;
    await t.click();
    const l = make();
    if ((await l.count()) > 0 && (await l.first().isVisible())) return l.first();
  }
  return make().first();
}

/** 説明パネルの 3 タブ分のテキストをまとめて返す */
export async function collectPanelText(page: Page): Promise<string> {
  let text = await page.locator("body").innerText();
  for (const name of ["概要", "スキル", "登場"]) {
    const t = page.getByRole("tab", { name, exact: true });
    if ((await t.count()) === 0) continue;
    await t.click();
    text += `\n${await page.locator("body").innerText()}`;
  }
  return text;
}

export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

export const withMotions = characters.filter((c) => c.motions.length > 0);
export const withoutMotions = characters.filter((c) => c.motions.length === 0);
export const withSkill = characters.filter((c) => !!c.skill);

/** そのキャラのタブへ切り替えてサムネをクリックする */
export async function selectCharacter(page: Page, c: Character) {
  if ((await tab(page, c.title).getAttribute("aria-selected")) !== "true") {
    await switchTab(page, c.title);
  }
  await page.getByTestId(`thumb-${c.id}`).click();
  await expect(page.getByTestId(`thumb-${c.id}`)).toHaveAttribute("aria-current", "true");
}

/** カード表面に名前が出ている（alt 付き img、または画像エラー時の代替の文字） */
export async function expectFrontShowsName(page: Page, name: string, timeout = 1000) {
  const front = page.getByTestId("card-front");
  const byAlt = front.locator(`img[alt="${name}"]`);
  const byText = front.getByText(name, { exact: false });
  await expect(byAlt.or(byText).first()).toBeAttached({ timeout });
}
