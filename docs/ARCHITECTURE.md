# ARCHITECTURE

クッキーラン キャラ図鑑（cookierun-dex）。本人専用・非公開・非商用。PC ブラウザでローカル実行する。

## 技術選定（ADR 要約）
バージョンはすべて固定（`--save-exact`）。公開から2週間以上たった版を採用する。

| 区分 | 採用 | 理由 / 比較した候補 |
|---|---|---|
| 基盤 | vite 8.3.2、@vitejs/plugin-react 6.1.1、react / react-dom 19.3.0、typescript 6.0.3 | クライアントのみのアプリには最小構成で足りる。Next / Astro / SvelteKit 3.0（出た直後）/ Vue と比較。TS 7 は周辺ツールの対応が未確認なので 6.0.3 |
| スタイル | tailwindcss 4.3.3 + @tailwindcss/vite 4.3.3 | デザイントークンを `@theme` で定義できる |
| 動き | motion 13.5.0 | 回転ドラッグ、慣性、layout、AnimatePresence、useScroll を1つでまかなえる。14.x は公開2週間未満。GSAP（独自ライセンス）、React Spring と比較 |
| 回転方式 | CSS 3D（`rotateY` + `backface-visibility`） | アニメ WebP を `<img>` のまま再生できる。React Three Fiber は動く画像のテクスチャ化が重いので不採用 |
| パーティクル | 自前 Canvas 2D | 依存ゼロ |
| 検索 | `includes` + 正規化（NFKC、小文字化、カタカナ→ひらがな） | 10件規模なら fuse.js は不要 |
| ルーティング | 自前の小さなルーター（`/`、`/promo`、404） | 2画面だけなので依存を増やさない |
| 素材変換 | sharp 0.35.5（devDependency） | GIF → アニメ WebP。1コマ目の静止画 `<motionId>.still.webp` も出す |
| テスト | vitest 5.0.3、jsdom 30.1.1、@testing-library/react 16.3.2、@testing-library/dom 10.4.2、@playwright/test 1.63.0 | |
| lint/format | @biomejs/biome 2.5.15 | 1つの道具で済む |
| フォント | Google Fonts（Fredoka、M PLUS Rounded 1c、Jua、Noto Sans JP/KR） | |

## 決定事項
- 対象タイトルはキングダムとオーブンブレイク。タブで切り替える。オーブンブレイクでは役割フィルタを出さない。
- キャラは代表10体（キングダム6 / オーブンブレイク4）。データは静的 JSON。
- 慣性・傾き・揺れ・スキル演出は v1 ですべて実装する。
- 動作素材は1キャラ最大6種。
- 演出の強さは OS の prefers-reduced-motion にだけ従う（画面上の切替は作らない）。
- 等級の列挙値は、取得スクリプトの実データで確定する。未知の値は Common の色にする。

## フォルダ構成と担当範囲
```
cookierun-dex/
  docs/                         … リード
  scripts/fetch-assets.mjs      … データ担当
  src/data/                     … データ担当（characters.json, timeline.json）
  src/types/                    … リード（契約）
  src/styles/tokens.css         … リード
  src/app/                      … リード（土台）
  src/lib/                      … 画面担当A
  src/features/dex/             … 画面担当A
  src/features/fx/              … 画面担当B
  src/features/promo/           … 画面担当B
  public/assets/                … スクリプトの出力（.gitignore）
  public/promo/                 … hero.mp4 など（.gitignore）
  tests/unit, tests/e2e         … テスト担当
```
担当範囲の外は編集しない。契約の変更が必要なときはリードに報告する。

## 契約
- `Character` 型は PRD 5章に従う（`src/types/character.ts`）。
- `id` の形式は `^(crk|crob)-[a-z0-9-]+$`。`baseId` はタイトルをまたぐ同一キャラを結ぶ。
- `MotionAsset` は `{ id, label, src, still, loop, isSkill? }`。`still` は reduced-motion のときの静止画。
- 素材のパス: `/assets/{crk|crob}/{slug}/{motionId}.webp`。立ち絵は `illustration.webp`、サムネは `thumb.webp`（幅 300px）。
- URL: `/?game=kingdom|ovenbreak&c=<id>&view=card|stage`。検索語は URL に載せない。
- `timeline.json` の要素は `{ year, title, summary, sourceUrl }`。

## コマンド
| 目的 | コマンド |
|---|---|
| 開発サーバー | `npm run dev` |
| ビルド / 確認 | `npm run build` / `npm run preview`（4173） |
| lint | `npm run check` |
| 単体テスト | `npm test` |
| E2E | `npm run e2e` |
| 素材取得・変換 | `npm run assets`（`.env` の `WIKI_USER_AGENT` が必要） |

## 権利
- 画像・動作素材の著作権は Devsisters にある。ローカルの非公開利用に限り、`public/assets/` などは `.gitignore` で配布しない。
- 画面に「© Devsisters」と出典（cookierun.wiki、CC BY-SA 4.0）を表示する。
- スキル説明は原文を転載せず、手作業で要約する。
