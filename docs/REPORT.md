# 進捗報告 — cookierun-dex

最終更新: 2026-10-16

## サマリー
| Phase | 内容 | 状態 |
|---|---|---|
| 0 | ヒアリング | ✅ |
| 1 | 調査（A: データ源・UX、B: 技術スタック、C: ライブラリ） | ✅ |
| 2 | 企画（PRD）・デザイン（UI仕様） | ✅ |
| 3 | 設計（ARCHITECTURE、基本設計書、詳細設計書） | ✅ |
| 4 | ユーザー承認 | ✅ |
| 5 | 土台づくり | ✅ |
| 6 | 実装（データ、図鑑画面、演出、宣伝ページ、テスト） | 🔲 |
| 7 | 検証・修正・レビュー | 🔲 |
| 8 | 報告・記録（ノートへの追記） | 🔲 |

## 決定事項
- 作るもの: 回転図鑑（選んだキャラを中央で回転表示し、右に説明）と、宣伝ページ `/promo`。
- 対象: キングダムとオーブンブレイクの両方（タブ切替）。代表10体（キングダム6、オーブンブレイク4）。
- 動作: Wiki の GIF をアニメーション WebP に変換して再生。素材がないキャラはプログラムの演出で代替。
- スキル演出、慣性、傾き、揺れは v1 ですべて作る。
- 宣伝ページ: コード演出。冒頭に claude.ai の Claude Motion の MP4 を後から差し込む枠を用意する。
- 環境: PC ブラウザ、ローカル実行、非公開・非商用。

## 実施したこと
1. 調査3本（並列）と、動作素材の追加調査。
2. PRD（受け入れ基準 AC-01〜67）と UI仕様（モーション M1〜M27）を作成。
3. 設計書一式を `docs/` に作成: PRD、UI、ARCHITECTURE、基本設計書、詳細設計書、RESEARCH、REPORT。
4. プロジェクトの作成、依存の固定とインストール、設定（Biome、Vitest、Playwright、Vite）。
5. 土台の実装: 型（契約）、デザイントークン、自前ルーター、ダミーデータ、スモークテスト。
6. GitHub（`hyemi-kang/cookierun-dex`）へ、内容ごとに分けてコミットしてプッシュ。

## 検証結果（土台）
| 確認 | 結果 |
|---|---|
| `npm run check`（Biome） | ✅ エラーなし |
| `npm run build`（tsc + vite） | ✅ |
| `npm test`（Vitest） | ✅ 2件成功 |
| `npm run e2e`（Playwright） | 🔲 未実施（ブラウザの導入とテストの作成が必要） |

## つまずいた点と対応
| 事象 | 原因 | 対応 |
|---|---|---|
| `npm install` が10分以上進まない | npm 10.9.8 が `vitest` の peer 依存の解決で落ちる | `--legacy-peer-deps` を付ける |
| パッケージ本体の取得が `UNABLE_TO_VERIFY_LEAF_SIGNATURE` | 社内ネットワークの証明書 | `NODE_OPTIONS=--use-system-ca`（Windows の証明書を信頼。検証は切らない） |
| curl で `registry.npmjs.org` に繋がらない | Windows の証明書失効確認（`CRYPT_E_REVOCATION_OFFLINE`） | npm 自体は通る。npm で確認した |
| Biome の移行で lint のルールが全部切れた | `biome migrate` が `preset: "none"` にした | `recommended` に戻し、Tailwind の記法を読めるようにした |
| 調査Bの報告に誤り | 並列取得で古い値が混じった | user-event と jest-dom は使えると訂正（必要になったら追加） |
| 止まった `npm install` を止めるため PID だけで `node.exe` を強制終了 | npm のものか未確認だった | 反省点。他の Node プロセスが落ちていたら再起動する |

## 未解決・要確認
- Claude Motion は報道ベースの機能で、公式の告知は未確認。社内アカウントで使えるかは情報システム部門に確認する。
- Devsisters の公式ファンキットの利用条件は未確認。
- 等級・役割の列挙値は、取得スクリプトの実データで確定する。
- 年表の年（2009、2013、2016、2021）は、実装時に wiki で確認する。
- Motion 14 系は公開2週間未満のため 13.5.0 に固定。切替は後日判断。
- `node_modules` の削除は許可されなかったため、途中で壊れた分は上書きでインストールした。

## 次にやること
1. データ担当: `scripts/fetch-assets.mjs`、`characters.json`（10体）、`timeline.json`。
2. 画面担当A: 図鑑（一覧、検索、回転カード、ステージ、説明パネル）。
3. 画面担当B: スキル演出、代替の動き、`/promo`。
4. テスト担当: 受け入れ基準から単体テストと E2E を作る。
5. 検証、レビュー、ノートへの追記。

## コミット履歴
| コミット | 内容 |
|---|---|
| `chore: add .gitignore and .env.example` | 素材と `.env` を管理対象外に |
| `docs: add ARCHITECTURE` | 技術選定、担当範囲、契約 |
| `chore: add pinned dependencies and scripts` | 依存の固定と lock |
| `feat: scaffold app ...` | 土台（型、トークン、ルーター、設定、スモークテスト） |
