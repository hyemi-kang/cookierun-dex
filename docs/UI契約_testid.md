# UI 契約: テスト用の識別子（data-testid・aria）

画面担当A・B とテスト担当が共有する契約。変更が必要なときはリードに報告する（担当が勝手に変えない）。
テストは実装を見ずに、この表と PRD の受け入れ基準だけで書く。

## 共通
- 動きを減らす設定は `page.emulateMedia({ reducedMotion: "reduce" })` で再現する。
- 素材（`public/assets/`）がなくても画面は壊れない（AC-62）。E2E は素材なしでも通る内容にする（画像は `alt` と代替表示で確認する）。

## 図鑑 `/`
| 部品 | 識別子・属性 | 補足 |
|---|---|---|
| ゲームタブ | `role="tab"` 名前 `キングダム` / `オーブンブレイク`、`aria-selected` | `role="tablist"` の中 |
| 検索欄 | `role="searchbox"` `aria-label="クッキーを検索"` | |
| 等級フィルタ | `data-testid="filter-grade-<等級>"`、`aria-pressed` | 例: `filter-grade-Legendary` |
| 役割フィルタ | `data-testid="filter-role-<役割>"`、`aria-pressed` | オーブンブレイクでは出さない（AC-42） |
| 件数 | `data-testid="result-count"` | `aria-live="polite"` |
| サムネ | `data-testid="thumb-<キャラid>"`、選択中は `aria-current="true"` | 例: `thumb-crk-gingerbrave` |
| 0件表示 | `data-testid="empty-state"`、中のボタン名 `条件をクリア` | AC-40 |
| 未選択表示 | `data-testid="no-selection"` | AC-41 |
| ビュー切替 | `data-testid="view-card"` / `data-testid="view-stage"`、`aria-pressed` | |
| 3Dカード | `data-testid="card3d"`、属性 `data-rotation`（Y軸の角度、度）、`data-side="front"\|"back"` | AC-18〜20 |
| 表面・裏面 | `data-testid="card-front"` / `card-back` | 表面の立ち絵 `alt` はキャラの `names.ja` |
| 正面ボタン / 裏返しボタン | `data-testid="reset-rotation"` / `flip-card` | |
| 説明パネル見出し | `data-testid="detail-name"` | `names.ja` |
| 説明パネルのタブ | `role="tab"` 名前 `概要` / `スキル` / `登場` | |
| 出典リンク | `data-testid="source-link"`（`target="_blank" rel="noopener noreferrer"`） | AC-17 |
| 権利表記 | `data-testid="credit"`（`© Devsisters` を含む） | |
| ステージ | `data-testid="stage"` | `view=stage` のとき |
| ステージの画像 | `data-testid="stage-img"`（`src` が動作 WebP） | AC-26 |
| 動作ボタン | `data-testid="motion-<動作id>"`、`aria-pressed` | AC-25, 26 |
| 代替演出ボタン | `data-testid="fallback-bounce"` / `fallback-squash` | `motions` が空のとき（AC-27） |
| 代替演出の要素 | `data-fallback-motion="bounce"\|"squash"\|…` | |
| スキル発動ボタン | `data-testid="skill-btn"` | 演出中は `disabled`（AC-32） |
| スキル名カットイン | `data-testid="skill-cutin"` | AC-30 |
| 粒子 Canvas | `data-testid="particle-canvas"` | 演出中だけ DOM にある（AC-31） |
| 読み込み失敗の通知 | `data-testid="toast"` | AC-61 |
| 画像エラー時の代替 | `data-testid="silhouette"` | AC-59, 60 |
| 一覧の位置番号 | `data-testid="position"`（例 `3 / 10`） | |

## 宣伝 `/promo`
| 部品 | 識別子 | 補足 |
|---|---|---|
| ヒーロー | `data-testid="promo-hero"` | |
| 動画 | `data-testid="hero-video"` | `hero.mp4` があるとき（AC-51） |
| 動画の代替 | `data-testid="hero-fallback"` | AC-52 |
| 年表カード | `data-testid="timeline-card"` | 4件以上（AC-53） |
| 走るキャラ | `data-testid="runner"` | スクロールで `transform` が変わる（AC-54） |
| CTA | `data-testid="cta-dex"`（名前 `図鑑を見る`） | AC-56 |
| 図鑑へのリンク（ヘッダー） | `role="link"` 名前 `図鑑` | AC-57 |
| 宣伝へのリンク（ヘッダー） | `role="link"` 名前 `宣伝ページ →` | |

## キーボード
- ←/→: 一覧の前後のキャラへ（検索欄・タブ・ボタン・リンクにフォーカスがあるときは無効。AC-43〜45）。
- Enter: スキル発動（ボタンにフォーカスがないとき）。
- カードにフォーカスがあるとき: Space で裏返し、Home で正面に戻す。
