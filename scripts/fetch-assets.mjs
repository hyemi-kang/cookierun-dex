// 素材の取得・変換スクリプト（docs/詳細設計書.md 9章）。
// 使い方: .env に WIKI_USER_AGENT を書いて `npm run assets`。
// 証明書エラーが出る場合は NODE_OPTIONS=--use-system-ca を付ける（検証の無効化はしない）。
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://cookierun.wiki/mw/api.php";
const CACHE_DIR = path.join(ROOT, ".asset-cache");
const OUT_DIR = path.join(ROOT, "public", "assets");
const INTERVAL_MS = 1100; // 1秒以上
const MAX_BYTES = 3 * 1024 * 1024; // AC-09
const MAX_MOTIONS = 6;

// 動作の表示順と日本語ラベル。id は wiki のファイル名末尾（小文字）に対応する。
const MOTION_DEFS = {
  kingdom: [
    { id: "idle", label: "待機", loop: true },
    { id: "battle_idle", label: "バトル待機", loop: true },
    { id: "run", label: "走る", loop: true },
    { id: "skill1", label: "スキル1", loop: false, isSkill: true },
    { id: "skill2", label: "スキル2", loop: false, isSkill: true },
    { id: "joy", label: "喜び", loop: false },
  ],
  ovenbreak: [
    { id: "run", label: "走る", loop: true },
    { id: "jump", label: "ジャンプ", loop: false },
    { id: "double_jump", label: "二段ジャンプ", loop: false },
    { id: "slide", label: "スライド", loop: false },
    { id: "run_fast", label: "全力で走る", loop: true },
    { id: "landing", label: "着地", loop: false },
  ],
};

// ---------- .env ----------
function loadUserAgent() {
  let ua = process.env.WIKI_USER_AGENT;
  const envPath = path.join(ROOT, ".env");
  if (!ua && existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*WIKI_USER_AGENT\s*=\s*(.*?)\s*$/);
      if (m) ua = m[1].replace(/^(["'])(.*)\1$/, "$2");
    }
  }
  return ua?.trim() || "";
}

const UA = loadUserAgent();
if (!UA) {
  console.error(
    [
      "WIKI_USER_AGENT が未設定です。",
      "  1. プロジェクト直下に .env を作る（.env.example をコピー）。",
      "  2. 連絡先入りの User-Agent を書く。例:",
      "       WIKI_USER_AGENT=cookierun-dex/0.1 (personal use; you@example.com)",
      "  3. もう一度 `npm run assets` を実行する。",
      "（.env は .gitignore 済みです。スクリプトは .env を作りません。）",
    ].join("\n"),
  );
  process.exit(1);
}

// ---------- ネットワーク（逐次・間隔・キャッシュ） ----------
let lastRequestAt = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// MediaWiki は失敗時も HTTP 200 で {"error":...} を返すことがある。それは保存・再利用しない。
function isApiError(buf) {
  try {
    return Boolean(JSON.parse(buf.toString("utf8"))?.error);
  } catch {
    return true; // JSON として読めないものも不正とみなす
  }
}

async function cached(key, ext, producer) {
  const file = path.join(CACHE_DIR, `${createHash("sha1").update(key).digest("hex")}.${ext}`);
  if (existsSync(file)) {
    const hit = await readFile(file);
    if (ext !== "json" || !isApiError(hit)) return hit;
    // エラー応答が混じっていたら無視して取り直す
  }
  const wait = lastRequestAt + INTERVAL_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
  const buf = await producer();
  if (ext === "json" && isApiError(buf)) {
    throw new Error(`API エラー応答: ${buf.toString("utf8").slice(0, 200)}`);
  }
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(file, buf);
  return buf;
}

async function httpGet(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function apiGet(params) {
  const qs = new URLSearchParams({ format: "json", formatversion: "2", ...params });
  const url = `${API}?${qs}`;
  const buf = await cached(url, "json", () => httpGet(url));
  return JSON.parse(buf.toString("utf8"));
}

// 画像のダウンロード先は https の cookierun.wiki（サブドメイン含む）と cdn.wikimg.net だけ許可する。
function assertAllowedUrl(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    throw new Error(`URL 不正: ${url}`);
  }
  const host = u.hostname.toLowerCase();
  const ok =
    u.protocol === "https:" &&
    (host === "cookierun.wiki" || host.endsWith(".cookierun.wiki") || host === "cdn.wikimg.net");
  if (!ok) throw new Error(`許可外のダウンロード先: ${url}`);
}

const download = (url) => {
  assertAllowedUrl(url);
  return cached(url, "bin", () => httpGet(url));
};

// ---------- wiki 問い合わせ ----------
function pageTitleFromSourceUrl(sourceUrl) {
  const m = sourceUrl.match(/^https:\/\/cookierun\.wiki\/w\/(.+)$/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]).replace(/_/g, " ");
  } catch {
    return null; // 不正な % エスケープ
  }
}

async function fetchInfobox(pageTitle) {
  const data = await apiGet({ action: "parse", page: pageTitle, prop: "wikitext" });
  const text = data?.parse?.wikitext ?? "";
  const fields = {};
  for (const m of text.matchAll(/^\s*\|\s*([A-Za-z][A-Za-z0-9_ ]*?)\s*=\s*(.*?)\s*$/gm)) {
    const key = m[1].replace(/ /g, ""); // OB は "release date" のように空白入り
    if (m[2] && !(key in fields)) fields[key] = m[2];
  }
  const keys = ["rarity", "role", "position", "releasedate", "first_appearance"];
  const nameKeys = Object.keys(fields).filter((k) => /^name/.test(k));
  const picked = {};
  for (const k of [...keys, ...nameKeys]) if (fields[k]) picked[k] = fields[k];
  return picked;
}

async function listGalleryFiles(galleryTitle) {
  const files = [];
  let cont = {};
  do {
    const data = await apiGet({
      action: "query",
      prop: "images",
      titles: galleryTitle,
      imlimit: "500",
      ...cont,
    });
    for (const p of data?.query?.pages ?? []) for (const i of p.images ?? []) files.push(i.title);
    cont = data?.continue ?? null;
  } while (cont);
  return files.filter((t) => /\.gif$/i.test(t));
}

async function fileUrl(fileTitle) {
  const data = await apiGet({
    action: "query",
    prop: "imageinfo",
    iiprop: "url",
    titles: fileTitle,
  });
  return data?.query?.pages?.[0]?.imageinfo?.[0]?.url ?? null;
}

async function illustrationUrl(pageTitle) {
  const data = await apiGet({
    action: "query",
    prop: "pageimages",
    piprop: "original",
    titles: pageTitle,
  });
  return data?.query?.pages?.[0]?.original?.source ?? null;
}

// 動作 ID の比較用に正規化する（"battle idle" / "battle_idle" / "doublejump" を同一視）。
const normMotion = (v) => v.toLowerCase().replace(/[ _]/g, "");

// 動作 GIF の候補を集める。kingdom は Gallery ページ、ovenbreak は allimages の接頭辞で探す。
// 衣装違い（Cookie0000s01 など）と別コスチューム（Crob_knight_of_spades_*）は使わない。
async function findGifs(c, pageTitle) {
  const found = new Map(); // normMotion -> { title, name }
  if (c.title === "kingdom") {
    const gallery = `${pageTitle.replace(/\/Kingdom$/, "")}/Kingdom/Gallery`;
    for (const t of await listGalleryFiles(gallery)) {
      const name = t.replace(/^[^:]+:/, "");
      const m = name.match(/^Cookie\d{4}(?: emotion)?-(.+)\.gif$/i);
      if (m && !found.has(normMotion(m[1]))) found.set(normMotion(m[1]), { title: t, name });
    }
    return found;
  }
  const slugName = c.names.en
    .toLowerCase()
    .replace(/ cookie$/, "")
    .replace(/[^a-z0-9]+/g, "_");
  const prefixes = [`Crob_${slugName}_`];
  if (c.names.en === "GingerBrave") prefixes.push("Cookie0001_"); // 例外の命名
  for (const prefix of prefixes) {
    let cont = {};
    do {
      const data = await apiGet({
        action: "query",
        list: "allimages",
        aiprefix: prefix,
        aimime: "image/gif",
        ailimit: "100",
        ...cont,
      });
      for (const img of data?.query?.allimages ?? []) {
        const rest = img.name.slice(prefix.length).replace(/\.gif$/i, "");
        if (!found.has(normMotion(rest)))
          found.set(normMotion(rest), { title: `File:${img.name}`, name: img.name });
      }
      cont = data?.continue ?? null;
    } while (cont);
  }
  return found;
}

// ---------- 変換 ----------
async function toWebp(buf, { animated, width, quality }) {
  let img = sharp(buf, animated ? { animated: true } : undefined);
  if (width) img = img.resize({ width, withoutEnlargement: true });
  return img.webp({ quality, effort: 6, loop: 0 }).toBuffer();
}

async function writeWebp(file, buf, warnings) {
  await writeFile(file, buf);
  if (buf.length > MAX_BYTES) {
    warnings.push(
      `${path.relative(ROOT, file)}: ${(buf.length / 1024 / 1024).toFixed(2)}MB (3MB超)`,
    );
  }
}

// ---------- メイン ----------
async function main() {
  const characters = JSON.parse(
    await readFile(path.join(ROOT, "src/data/characters.json"), "utf8"),
  );
  const missing = []; // { id, asset, reason }
  const warnings = [];
  const results = {};
  const infoboxes = {};

  for (const c of characters) {
    if (!/^(crk|crob)-[a-z0-9-]+$/.test(String(c.id))) {
      missing.push({ id: String(c.id), asset: "(全素材)", reason: "id の形式が不正" });
      continue;
    }
    if ((c.title === "kingdom") !== c.id.startsWith("crk-") || !MOTION_DEFS[c.title]) {
      missing.push({ id: c.id, asset: "(全素材)", reason: "title と id の接頭辞が一致しない" });
      continue;
    }
    const slug = c.id.replace(/^(crk|crob)-/, "");
    const prefix = c.title === "kingdom" ? "crk" : "crob";
    const dir = path.join(OUT_DIR, prefix, slug);
    await mkdir(dir, { recursive: true });
    const pageTitle = pageTitleFromSourceUrl(c.sourceUrl);
    const out = { motions: [] };
    results[c.id] = out;
    console.log(`\n== ${c.id} (${pageTitle ?? "sourceUrl 不正"})`);
    if (!pageTitle) {
      missing.push({
        id: c.id,
        asset: "(全素材)",
        reason: "sourceUrl から wiki ページ名を取れない",
      });
      continue;
    }

    // インフォボックス
    try {
      infoboxes[c.id] = await fetchInfobox(pageTitle);
      console.log("  infobox:", JSON.stringify(infoboxes[c.id]));
    } catch (e) {
      missing.push({ id: c.id, asset: "infobox", reason: e.message });
    }

    // 立ち絵・サムネ
    try {
      const url = await illustrationUrl(pageTitle);
      if (!url) throw new Error("pageimages に原寸 URL なし");
      const src = await download(url);
      await writeWebp(
        path.join(dir, "illustration.webp"),
        await toWebp(src, { quality: 85 }),
        warnings,
      );
      await writeWebp(
        path.join(dir, "thumb.webp"),
        await toWebp(src, { width: 300, quality: 80 }),
        warnings,
      );
      out.illustration = true;
      console.log("  illustration / thumb OK");
    } catch (e) {
      missing.push({ id: c.id, asset: "illustration/thumb", reason: e.message });
    }

    // 動作 GIF
    let byMotion = new Map();
    try {
      byMotion = await findGifs(c, pageTitle);
    } catch (e) {
      console.log(`  GIF 一覧の取得に失敗: ${e.message}`);
    }
    const defs = MOTION_DEFS[c.title].slice(0, MAX_MOTIONS);
    // MOTION_DEFS の順に最大 MAX_MOTIONS 種。足りない分は補わず、一覧に出す。
    for (const def of defs) {
      const hit = byMotion.get(normMotion(def.id));
      if (!hit) {
        missing.push({ id: c.id, asset: def.id, reason: "GIF が見つからない" });
        continue;
      }
      try {
        const url = await fileUrl(hit.title);
        if (!url) throw new Error("imageinfo に URL なし");
        const gif = await download(url);
        let webp = await toWebp(gif, { animated: true, quality: 80 });
        if (webp.length > MAX_BYTES) webp = await toWebp(gif, { animated: true, quality: 60 });
        await writeWebp(path.join(dir, `${def.id}.webp`), webp, warnings);
        await writeWebp(
          path.join(dir, `${def.id}.still.webp`),
          await toWebp(gif, { animated: false, quality: 85 }),
          warnings,
        );
        out.motions.push({
          id: def.id,
          label: def.label,
          src: `/assets/${prefix}/${slug}/${def.id}.webp`,
          still: `/assets/${prefix}/${slug}/${def.id}.still.webp`,
          loop: def.loop,
          ...(def.isSkill ? { isSkill: true } : {}),
          _from: hit.name,
        });
        console.log(`  ${def.id}: ${hit.name} -> ${(webp.length / 1024).toFixed(0)}KB`);
      } catch (e) {
        missing.push({ id: c.id, asset: def.id, reason: e.message });
      }
    }
  }

  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(
    path.join(CACHE_DIR, "result.json"),
    JSON.stringify(
      { at: new Date().toISOString(), infoboxes, results, missing, warnings },
      null,
      2,
    ),
  );

  console.log("\n===== 取得できなかった素材（キャラID・素材名） =====");
  if (!missing.length) console.log("なし");
  for (const m of missing) console.log(`${m.id}\t${m.asset}\t${m.reason}`);
  console.log("\n===== 3MB超の警告 =====");
  if (!warnings.length) console.log("なし");
  for (const w of warnings) console.log(`警告: ${w}`);
  console.log("\n結果の詳細: .asset-cache/result.json");
}

main().then(
  () => process.exit(0), // 素材がないこと自体はエラーにしない（AC-07）
  (e) => {
    console.error(`致命的エラー: ${e.stack ?? e}`);
    if (/certificate|CERT|UNABLE_TO/i.test(String(e.cause ?? e))) {
      console.error("証明書エラーなら NODE_OPTIONS=--use-system-ca を付けて再実行してください。");
    }
    process.exit(1);
  },
);
