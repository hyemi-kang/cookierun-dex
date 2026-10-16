# cookierun-dex

Devsisters「クッキーラン」シリーズ（キングダム／オーブンブレイク）のキャラクター図鑑です。選んだキャラを画面中央に大きく表示してドラッグで回転でき、右側に説明が出ます。動作アニメーションやスキル演出も見られます。

> **個人利用・非公開・非商用のプロジェクトです。** 画像・動作素材の著作権は Devsisters にあります。このリポジトリには素材を含めていません（`public/assets/` と `public/promo/` は `.gitignore` 済み）。素材を含めたままの公開・配布や、GitHub Pages などでの公開はしないでください。非公式のファン制作物で、Devsisters とは関係ありません。

## 機能
### 図鑑 `/`
- キングダム／オーブンブレイクのタブ切替（代表10体）
- 検索（ひらがな・カタカナ・全角半角・英語名に対応）、等級・役割のフィルタ
- 3D 回転カード: ドラッグで回転、慣性、マウス追従の傾きと光沢、待機中の揺れ、ダブルクリックで正面に戻る。表は立ち絵、裏はステータス
- ステージ表示: 動作（待機・走る・スキルなど）を切り替えて再生。素材がないキャラは、跳ねる・つぶれて伸びるなどの代替演出
- スキル演出: フラッシュ、画面の揺れ、粒子、スキル名のカットイン
- 説明パネル（概要／スキル／登場）、出典とライセンスの表示
- キー操作（←/→ でキャラ切替、Enter でスキル発動）、URL でキャラを共有（`/?game=kingdom&c=crk-pure-vanilla`）
- OS の「視差効果を減らす」設定に対応

### 宣伝ページ `/promo`
- 先頭に動画枠（`public/promo/hero.mp4`。なければ代替表示）。動画は claude.ai の Claude Motion で作る想定です（[docs/PROMO_VIDEO.md](docs/PROMO_VIDEO.md)）
- スクロールに連動して勇敢なクッキーが走り、シリーズの年表を紹介
- 図鑑へのボタン

## 使用技術
| 区分 | 技術 |
|---|---|
| 言語・UI | TypeScript 6.0.3、React 19.3.0 |
| ビルド | Vite 8.3.2 |
| スタイル | Tailwind CSS 4.3.3 |
| 動き | Motion 13.5.0、CSS 3D、Canvas 2D（自前の粒子） |
| 素材変換 | sharp 0.35.5（GIF → アニメーション WebP） |
| テスト | Vitest 5.0.3、Testing Library、Playwright 1.63.0 |
| 静的解析 | Biome 2.5.15 |
| データ源 | [cookierun.wiki](https://cookierun.wiki/)（MediaWiki API、本文は CC BY-SA 4.0） |

バージョンはすべて固定しています。選定理由は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) と [docs/RESEARCH.md](docs/RESEARCH.md) を参照してください。

## セットアップ
Node.js 20.9 以上が必要です。

```bash
npm install --save-exact --legacy-peer-deps
```

- npm 10.9.8 は `vitest` の peer 依存の解決で失敗することがあるため、`--legacy-peer-deps` を付けます。
- 社内ネットワークなどで `UNABLE_TO_VERIFY_LEAF_SIGNATURE` が出るときは、`NODE_OPTIONS=--use-system-ca` を付けて実行します（OS の証明書を信頼させる方法です。証明書の検証は無効にしません）。

### 素材の取得（初回のみ）
画像と動作素材はリポジトリに含まれていないので、自分で取得します。

1. `.env.example` を `.env` にコピーし、`WIKI_USER_AGENT` を書き換えます（cookierun.wiki にアクセスするときの名乗りです。連絡先を入れます。`.env` はコミットされません）。
2. 実行します。

```bash
npm run assets
```

`src/data/characters.json` に書かれたキャラの項目・立ち絵・動作 GIF を cookierun.wiki から取得し、WebP に変換して `public/assets/` に出力します。逐次実行（1秒間隔）で、結果は `.asset-cache/` にキャッシュされます。取得できなかった素材は一覧で表示されます。素材がなくても図鑑は動き、代替の表示になります。

## コマンド
| 目的 | コマンド |
|---|---|
| 開発サーバー（http://localhost:5173） | `npm run dev` |
| ビルド | `npm run build` |
| ビルド結果の確認（http://localhost:4173） | `npm run preview` |
| lint・整形の確認 | `npm run check` |
| 整形と自動修正 | `npm run format` |
| 単体テスト | `npm test` |
| E2E テスト（ビルドして実行） | `npm run e2e` |
| 素材の取得・変換 | `npm run assets` |

E2E テストの前に、初回だけ `npx playwright install chromium` が必要です。

## フォルダ構成
```
docs/                 要件定義・設計書・調査・報告
scripts/              素材の取得・変換スクリプト（fetch-assets.mjs）
src/
  app/                アプリの入口、ルーター
  features/dex/       図鑑画面
  features/fx/        スキル演出、代替の動き
  features/promo/     宣伝ページ
  lib/                検索、キー操作、動きを減らす設定
  data/               キャラと年表の JSON
  types/              型の定義（契約）
  styles/tokens.css   デザイントークン
tests/unit/           単体テスト
tests/e2e/            E2E テスト
public/assets/        素材の出力先（.gitignore）
public/promo/         宣伝動画 hero.mp4 など（.gitignore）
```

## キャラを追加するには
1. `src/data/characters.json` に1件追加します（`id` は `crk-<名前>` または `crob-<名前>`、`sourceUrl` は cookierun.wiki のページ）。要約は原文を転載せず、自分の言葉で書きます。
2. `npm run assets` を実行します。
3. `npm test` で、データの検証（形式、重複、ライセンス表記など）が通ることを確認します。

## ドキュメント
| 文書 | 内容 |
|---|---|
| [PRD.md](docs/PRD.md) | 要件定義（機能一覧、ユーザーストーリー、受け入れ基準） |
| [基本設計書.md](docs/基本設計書.md) | システム構成、使用技術、画面・機能・データ設計、非機能要件 |
| [詳細設計書.md](docs/詳細設計書.md) | モジュール、状態管理、回転・演出・取得スクリプトの詳細 |
| [UI.md](docs/UI.md) | UI 仕様（レイアウト、トークン、コンポーネント、モーション） |
| [UI契約_testid.md](docs/UI契約_testid.md) | テスト用の識別子の取り決め |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 技術選定、担当範囲、契約 |
| [RESEARCH.md](docs/RESEARCH.md) | 調査の比較表と出典 |
| [PROMO_VIDEO.md](docs/PROMO_VIDEO.md) | 宣伝動画（Claude Motion）の絵コンテとプロンプト |
| [REPORT.md](docs/REPORT.md) | 進捗報告、検証結果、つまずいた点 |

## 権利・出典
- キャラクターと画像は © Devsisters。クッキーランは Devsisters の登録商標です。
- キャラの項目は [cookierun.wiki](https://cookierun.wiki/) を出典としています（本文は [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)）。説明文は原文を転載せず、要約しています。
- ゲームのデータから抜き出された素材（wiki 上で Datamined と記載されたもの）が含まれる場合があります。個人の非公開利用に限ってください。
- このリポジトリのソースコードには、ライセンスを付けていません（個人用）。
