# UI仕様: クッキーラン キャラ図鑑（ローカル・非公開）

> 作成: デザイン担当（2026-10-16）。前提: React 19 / Tailwind 4 / Motion 13.5.0（`motion/react`）/ 自前の Canvas 2D パーティクル。
> ルーティングやデータの形は `docs/ARCHITECTURE.md` を正とする。この文書の「仮定」は末尾の「リードへの相談事項」と「リードの決定事項」で整理している。

---

## 1. 画面一覧と画面遷移

| ID | パス | 画面名 | 概要 |
|---|---|---|---|
| S1 | `/` | 図鑑 | 一覧（左）、3Dステージ（中央）、説明（右）の3ペイン |
| S2 | `/promo` | 宣伝ページ | ヒーロー動画、スクロール連動の年表、CTA |

### URLの状態
`/?game=kingdom&c=crk-gingerbrave&view=card`（ARCHITECTURE.md の契約に合わせる。説明パネルのタブ `tab` は画面内の状態として持つ）

| クエリ | 値 | 既定値 |
|---|---|---|
| `game` | `kingdom` \| `ovenbreak` | `kingdom` |
| `c` | キャラの id | 一覧の先頭 |
| `view` | `card` \| `stage` | `card` |

検索語とフィルタはURLに載せず、画面内の状態として持つ。キャラを切り替えたときは `replaceState` を使い、履歴を汚さない。ゲームのタブを切り替えたときは `pushState` を使う。

### 遷移図
```
            ┌──────────────── ヘッダー「宣伝ページ →」 ────────────────┐
            │                                                          ▼
 ┌──────────────────────────┐                          ┌──────────────────────────┐
 │ S1 図鑑 /                 │ ◀── CTA「図鑑を見る」 ── │ S2 宣伝 /promo           │
 │  ├ タブ: キングダム        │ ◀── ヘッダー「図鑑」 ── │  ├ Hero (MP4 / 代替)     │
 │  ├ タブ: オーブンブレイク  │                          │  ├ 走り抜けセクション     │
 │  └ view: card ⇄ stage     │                          │  └ CTA                   │
 └──────────────────────────┘                          └──────────────────────────┘
画面内の状態遷移 (S1):
  一覧で選択 / ←→ ─▶ キャラ切替演出 ─▶ 待機（浮遊）
  待機 ─ドラッグ─▶ 回転 ─離す─▶ 慣性 ─▶ 待機
  待機 ─ダブルクリック / [正面]─▶ 正面に戻る
  待機 ─Enter / [スキル]─▶ SkillFx（約1.2秒、再入力で最初からやり直し）
```

---

## 2. レイアウト

### 2.1 ブレークポイントとグリッド

| 名前 | 幅 | 構成 |
|---|---|---|
| `xl`（主対象） | 1536px 以上 | 左 340 / 中央 可変 / 右 420、gap 24、外側余白 32 |
| `lg`（主対象） | 1280〜1535px | 左 320 / 中央 可変（最小 540）/ 右 380、gap 16、外側余白 24 |
| `md` | 1024〜1279px | 左 300 / 中央 可変。右パネルは右から出るドロワー（幅 380、オーバーレイ） |
| `sm` | 1023px 以下（375px まで崩れないこと） | 1カラム。ヘッダー → 横スクロールのサムネ列 → ステージ（正方形）→ 説明はボトムシート |

- ヘッダーの高さは 64px で固定する。本体の高さは `calc(100svh - 64px)` で、各ペインは中だけがスクロールする（ページ全体はスクロールしない）。
- カードの比率は 5:7。サイズは `clamp(260px, 32vw, 400px)` × 比率で決める。lg（1280px）では 360×504。

### 2.2 S1 図鑑（1440px の例）
```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ [ロゴ COOKIE DEX]   ( キングダム | オーブンブレイク )                    [宣伝ページ →]   │ 64px
├───────────────┬──────────────────────────────────────────────────┬───────────────────────┤
│ 一覧 320px     │ ステージ（可変）                                  │ 説明 380px            │
│┌─────────────┐│  ░░ 背景 L1: 等級テーマのグラデ（遅い）░░         │┌─────────────────────┐│
││🔍 クッキーを検索││   ·  ·  L2: 光の粒（中）   ·    ·               ││ 勇敢なクッキー        ││
│└─────────────┘│        L3: 前景のぼけ（速い）                     ││ 용감한 쿠키           ││
│ 等級            │           ┌───────────────┐                       ││ GingerBrave          ││
│ [すべて][Common]│           │               │  ← 浮遊 ±6px          ││ [Common] 突撃・前衛   ││
│ [Rare][Epic]... │           │    立ち絵      │                       │├─────────────────────┤│
│ 役割            │           │  (CSS 3D)     │  ドラッグで回転        ││[概要][スキル][登場]  ││
│ [突撃][防御]... │           │   + ホロ光沢   │                       │├─────────────────────┤│
│ 該当 10件       │           │               │                       ││ 特徴                 ││
│┌──┬──┬──┐     │           └───────────────┘                       ││ ・…                  ││
││▣ │▣ │▣ │ 88px│        ⟲ ドラッグで回転（初回のみ）                 ││ ・…                  ││
│├──┼──┼──┤     │                                                  ││                      ││
││▣ │▣ │▣ │     │  [◀ 前] [裏返す] [正面] [スキル ⏎] [次 ▶]          │├─────────────────────┤│
│├──┼──┼──┤     │  ( カード | ステージ表示 )                         ││出典: cookierun.wiki  ││
││▣ │▣ │▣ │     │  ステージ表示のとき:                               ││CC BY-SA 4.0 ↗        ││
│└──┴──┴──┘     │  [待機][走る][スキル1][スキル2][喜ぶ]    3 / 10    │└─────────────────────┘│
└───────────────┴──────────────────────────────────────────────────┴───────────────────────┘
```
- サムネイルのグリッド: `grid-template-columns: repeat(auto-fill, minmax(88px, 1fr))`、gap 8。セルは正方形で、中に名前を1行入れる（省略表示）。
- ステージ下の操作バー: ボタンの高さは 44px で、中央揃え。下端から 24px 上に置く。
- 右パネル: `bg-surface/80` に `backdrop-blur(16px)` を重ねる。どの背景色の上でも文字のコントラストが保てるよう、不透明度は 0.80 を下限にする。

### 2.3 S1 の sm 幅（375px）
```
┌─────────────────────────┐
│ ロゴ            [宣伝 →]  │ 56
│ (キングダム|オーブン…)     │ 44
│ 🔍 検索    [フィルタ ▾]   │ 44  ← チップはシートの中に入れる
│ ▣ ▣ ▣ ▣ ▣ → 横スクロール   │ 72
├─────────────────────────┤
│      ┌─────────┐         │
│      │  カード  │  幅70vw │
│      └─────────┘         │
│ [◀][裏][正面][技][▶]     │ 44
├─────────────────────────┤
│ ▔▔ 説明（ボトムシート） ▔▔ │ 半分 ⇄ 全画面
└─────────────────────────┘
```
回転のドラッグはカードの上だけで受け付ける（`touch-action: none`）。それ以外の場所では縦スクロールを妨げない。スマホ最適化は v1 の対象外で、崩れないことだけを確保する。

### 2.4 S2 宣伝 `/promo`
```
┌────────────────────────────────────────────────┐
│ [ロゴ]                            [図鑑を見る]   │ 64 (半透明・固定)
├────────────────────────────────────────────────┤
│                                                │
│   PromoHero 100svh                             │
│   <video hero.mp4 muted loop playsInline>      │
│   ない場合: ポスター + タイトル文字のばねアニメ   │
│              COOKIE RUN DEX                     │
│              ↓ スクロール                        │
├────────────────────────────────────────────────┤
│ TimelineSection 高さ 400vh（中身は sticky 100svh）│
│ ┌────────────────────────────────────────────┐ │
│ │ L1 空 0.2x  L2 遠景マップ 0.5x  L3 地面 1.0x │ │
│ │                                            │ │
│ │  [2013 カード]   [2016 カード]   [2021 …]    │ │ ← 進捗に応じて順に出す
│ │                                            │ │
│ │ 🍪→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→→   │ │ ← 勇敢なクッキーが -20vw から 120vw へ
│ └────────────────────────────────────────────┘ │
├────────────────────────────────────────────────┤
│ CTA 60svh   「さあ、オーブンの外へ」  [ 図鑑を見る → ] │
│ フッター: 出典・ライセンス表記                      │
└────────────────────────────────────────────────┘
```
年表カードは幅 280px、gap 24。sm 幅では縦に積み、クッキーは画面下に固定して走らせる。

---

## 3. デザイントークン

### 3.1 方針
**ダークを基調にする（テーマ名「夜のオーブン」）。** 理由は3つ。
- ホロ光沢、フラッシュ、粒子がよく映える。
- 等級ごとのテーマ色を背景に流しても、白飛びしにくい。
- 立ち絵の白いフチが沈まない。

ライト（「朝のベーカリー」）は任意の切り替えとして、トークンだけ定義しておく。

### 3.2 色（基本）
CSS変数は Tailwind 4 の `@theme` で定義する。

| トークン | Dark | Light | 用途 |
|---|---|---|---|
| `--color-bg` | `#1A1210` ココア | `#FFF6EA` 生地 | ページの背景 |
| `--color-surface` | `#2A1E19` | `#FFFFFF` | パネル |
| `--color-surface-2` | `#3A2A22` | `#FBE9D3` | チップ、入力欄 |
| `--color-border` | `#5A4234` | `#E5CDB0` | 区切り線（装飾） |
| `--color-text` | `#FFF4E6` | `#3B2418` | 本文 |
| `--color-text-muted` | `#CDB8A3` | `#7A5A44` | 補足 |
| `--color-primary` | `#FF8A3D` オレンジクッキー | `#E8742A` | 主ボタンの背景（文字は `--color-on-primary`） |
| `--color-on-primary` | `#1A1210` | `#3B2418` | 主ボタンの文字 |
| `--color-accent` | `#FFC845` バター | `#B45309` | リンク、フォーカス、強調 |
| `--color-jelly` | `#FF6FA8` ゼリーピンク | `#C2185B` | 装飾、粒子 |
| `--color-mint` | `#7BD88F` | `#2E7D32` | 成功 |
| `--color-danger` | `#FF7A6B` | `#C62828` | エラー |
| `--color-focus` | `#FFC845` | `#B45309` | フォーカスリング |

**コントラストの計算値（WCAG の相対輝度で試算）**

| 組み合わせ | 比率 |
|---|---|
| text / surface（Dark） | 約 16:1 |
| text-muted / surface（Dark） | 約 8.5:1 |
| on-primary / primary（Dark） | 約 7.8:1 |
| accent / surface（Dark） | 約 10:1 |
| text / bg（Light） | 約 13:1 |
| text-muted / bg（Light） | 約 5.8:1 |
| on-primary / primary（Light） | 約 4.9:1 |
| accent / bg（Light） | 約 4.7:1 |

いずれも 4.5:1 以上。実装後に axe などのツールで実測する。

### 3.3 等級の色
- バッジの文字はすべて `#1A1210` で、バッジ背景とのコントラストは 4.5:1 以上にする。
- `stage` 列はステージ背景に使う暗めのグラデーション（L1 レイヤー）。

| 等級 | badge | stage（上 → 下） | 備考 |
|---|---|---|---|
| Common | `#BFB3A6` | `#3A3029` → `#1A1210` | |
| Rare | `#4FA8E8` | `#163A57` → `#0F1A24` | |
| Epic | `#C065E6` | `#3D1A4F` → `#170D1F` | |
| Super Epic | `#F0587C` | `#4F1426` → `#1F0A10` | |
| Legendary | `#FFD24A` | `#4A3A10` → `#1A1408` | バッジに虹色のシマー（静止画では金色） |
| Dragon | `#F06A3A` | `#521A0C` → `#1C0A06` | 鱗風のノイズ（任意） |
| Ancient | `#F4EBD0` | `#4A4330` → `#16140E` | 光輪の粒子 |
| Beast | `#8F7BFF` | `#24184F` → `#0C0A1C` | |
| Witch | `#5ED3C2` | `#0F3D38` → `#071715` | 仮。データにあれば使う |
| Special | `#FF9ED1` | `#4F1A35` → `#1C0A13` | 仮。データにあれば使う |

- 等級の一覧はデータ側から受け取る。未知の等級は Common の色で代用する。
- 色だけで等級を区別させないよう、バッジには必ず等級名を文字で入れる。

### 3.4 文字（Google Fonts）
1つのフォントで日本語と韓国語の両方を満たすのは難しいため、`lang` 属性ごとにフォントを切り替える。

| 役割 | 日本語 | 韓国語 | 英数字 |
|---|---|---|---|
| 見出し・ロゴ | M PLUS Rounded 1c（800） | Jua（400） | Fredoka（600–700） |
| 本文 | Noto Sans JP（400/700） | Noto Sans KR（400/700） | 日本語・韓国語の本文フォントと同じ |
| 数値（件数・年） | Fredoka（`tabular-nums`） | 同左 | 同左 |

```css
--font-display: "Fredoka", "M PLUS Rounded 1c", sans-serif;
--font-body: "Noto Sans JP", system-ui, sans-serif;
:lang(ko) { --font-display: "Fredoka", "Jua", sans-serif; --font-body: "Noto Sans KR", system-ui, sans-serif; }
```
韓国語の名前を表示する要素には `lang="ko"`、英語名には `lang="en"` を付ける。

**文字サイズ（rem 基準 16px）**

| トークン | px / 行高 | 用途 |
|---|---|---|
| `text-xs` | 12 / 16 | バッジ、注記（太字のときのみ使う） |
| `text-sm` | 14 / 20 | チップ、補足 |
| `text-base` | 16 / 26 | 本文 |
| `text-lg` | 18 / 28 | スキル名 |
| `text-xl` | 20 / 28 | パネル見出し |
| `text-2xl` | 24 / 32 | キャラ名（日本語） |
| `text-4xl` | 40 / 44 | 宣伝ページの見出し |
| `text-6xl` | 56 / 60 | ヒーローのタイトル、カットイン |

### 3.5 余白・角丸・影
- **余白**（4px 単位）: `1=4` `2=8` `3=12` `4=16` `5=20` `6=24` `8=32` `10=40` `12=48` `16=64`
- **角丸**: `sm=8`（チップ）、`md=12`（サムネ、ボタン）、`lg=16`（パネル）、`xl=24`（カード）、`full`（ピル型のタブ）
- **影（Dark）**

| トークン | 値 |
|---|---|
| `shadow-sm` | `0 1px 2px rgb(0 0 0 / .4)` |
| `shadow-md` | `0 4px 12px rgb(0 0 0 / .45)` |
| `shadow-card` | `0 24px 48px -12px rgb(0 0 0 / .6), 0 0 0 1px rgb(255 255 255 / .06)` |
| `shadow-glow-{grade}` | `0 0 32px {grade色}/.45`（選択中のサムネ、カードの縁） |

### 3.6 モーション
**時間（duration）**

| トークン | ms |
|---|---|
| `instant` | 80 |
| `xs` | 120 |
| `sm` | 180 |
| `md` | 250 |
| `lg` | 400 |
| `xl` | 600 |
| `fx` | 1200（スキル演出の全体） |

**イージング**

| トークン | 値 | 用途 |
|---|---|---|
| `ease-out` | `cubic-bezier(.22, 1, .36, 1)` | 入る動き |
| `ease-in` | `cubic-bezier(.55, 0, 1, .45)` | 出る動き |
| `ease-in-out` | `cubic-bezier(.65, 0, .35, 1)` | 往復 |

**ばね（Motion の transition）**

| トークン | 値 | 用途 |
|---|---|---|
| `spring.pop` | `{ type: "spring", visualDuration: 0.35, bounce: 0.35 }` | キャラの入場、ボタンの押下 |
| `spring.snappy` | `{ type: "spring", stiffness: 400, damping: 32 }` | 正面に戻る、タブの下線 |
| `spring.tilt` | `{ type: "spring", stiffness: 150, damping: 18, mass: 0.6 }` | マウスへの追従による傾き |
| `spring.soft` | `{ type: "spring", stiffness: 120, damping: 20 }` | パネル、ドロワー |
| `inertia.spin` | `{ type: "inertia", power: 0.6, timeConstant: 600 }` | 回転の慣性（velocity は deg/s で渡す） |

---

## 4. コンポーネント一覧

props は型の概要。`Cookie` などの共有型は ARCHITECTURE の定義に従う。

| コンポーネント | 主な props | 状態 |
|---|---|---|
| **AppHeader** | `game`, `onGameChange`, `route` | 通常 / スクロール時は半透明（promo） |
| **GameTabs** | `value: 'kingdom'\|'ovenbreak'`, `onChange` | 選択 / 非選択 / フォーカス |
| **SearchBox** | `value`, `onChange`, `resultCount` | 空 / 入力中 / クリアボタンあり |
| **FilterBar** | `grades: Grade[]`, `roles?: Role[]`, `selected`, `onToggle`, `onReset` | チップ: off / on / disabled（0件） |
| **FilterChip** | `label`, `pressed`, `color?`, `count?` | `aria-pressed`、高さ 36（当たり判定は 44） |
| **ResultCount** | `count`, `total` | `aria-live="polite"` |
| **CharacterGrid** | `items`, `selectedId`, `onSelect`, `status` | loading / empty / ready |
| **CharacterThumb** | `cookie`, `selected`, `onClick` | 通常 / ホバー（持ち上げ 2px）/ 選択（等級色のグローと 3px の枠）/ 画像エラー（シルエット） |
| **Stage** | `cookie`, `view: 'card'\|'stage'`, `theme` | 子に ParallaxBg、CharacterCard3D または ActionStage、SkillFx |
| **ParallaxBg** | `theme`, `layers: 2\|3`, `pointer` | reduced のときは静止 |
| **CharacterCard3D** | `cookie`, `onFlip`, `resetSignal`, `interactive` | idle（浮遊）/ dragging / inertia / resetting / front・back / image-error |
| **CardFront** | `imageSrc`, `name`, `grade` | 読込中 / 表示 / エラー |
| **CardBack** | `stats`, `grade`, `role`, `position` | データなしのときは「—」を出す |
| **HoloSheen** | `pointer: {x, y}`, `intensity` | reduced のときは固定の淡い光沢 |
| **DragHint** | `visible`, `onDismiss` | 初回のみ表示。localStorage の `dex.hintSeen` で管理 |
| **StageControls** | `onPrev`, `onNext`, `onFlip`, `onReset`, `onSkill`, `index`, `total` | スキル演出中もスキルボタンは押せる（押すと最初からやり直し） |
| **ViewToggle** | `value`, `onChange` | card / stage |
| **ActionStage** | `cookie`, `game`, `action`, `onActionChange` | asset-loading / playing / fallback（代替演出）/ error |
| **ActionSelector** | `actions: Action[]`, `value`, `available: Record<Action, boolean>` | 素材がない動作には「代替」の小さなラベルを付ける |
| **FallbackActor** | `imageSrc`, `action` | 立ち絵を跳ねさせたり伸縮させたりする代替演出 |
| **SkillFx** | `trigger: number`（連番）, `skillName`, `color`, `reduced` | idle / playing。Canvas は `aria-hidden` |
| **ParticleCanvas** | `burst(options)` を ref で公開, `maxParticles=160` | DPR に対応。タブが非表示のときは止める |
| **SkillCutIn** | `name`, `color` | 表示中 / 非表示 |
| **DetailPanel** | `cookie`, `tab`, `onTabChange`, `status` | loading / ready / error |
| **NameBlock** | `ja`, `ko`, `en`, `grade`, `role`, `position` | ko と en がないときは行ごと省く |
| **GradeBadge** | `grade`, `size: 'sm'\|'md'` | Legendary はシマーあり（reduced のときは止める） |
| **SkillList** | `skills: {name, description, icon?}[]` | 空のときは「スキル情報なし」 |
| **AppearanceInfo** | `releaseDate`, `notes` | |
| **SourceCredit** | `url`, `license='CC BY-SA 4.0'` | 常に表示 |
| **PromoHero** | `videoSrc?`, `posterSrc`, `title` | video / fallback / reduced（自動再生しない） |
| **TimelineSection** | `items: {year, title, blurb}[]`, `runnerSrc`, `mapLayers` | scroll / reduced（静的な一覧） |
| **TimelineCard** | `year`, `title`, `blurb`, `active` | 非表示 / 出現 / 表示済み |
| **CtaSection** | `to='/'`, `label='図鑑を見る'` | |
| **Skeleton** | `shape: 'rect'\|'circle'\|'text'`, `w`, `h` | シマー（reduced のときは静止） |
| **EmptyState** / **ErrorState** | `title`, `description`, `action?` | |
| **CookieSilhouette** | `tint` | SVG（ジンジャーブレッドの形）。画像の代わりに使う |

フックは次の2つを想定している。新しいライブラリは追加しない。
- `useMotionPreference()`: Motion の `useReducedMotion()` を元に判定する（OS の設定にのみ従う）。
- `useGlobalShortcuts()`: ←/→/Enter のキー操作を受け付ける。

**注意:** `<MotionConfig reducedMotion="user">` で止まるのは transform 系のアニメーションだけ。Canvas の粒子、画面の揺れ、慣性は、上のフックを見て自分で止める。

---

## 5. 状態ごとの表示

| 領域 | 読み込み中 | 空 | エラー | 素材なし |
|---|---|---|---|---|
| **一覧** | 88px のスケルトンを 12個。件数欄は「— 件」 | 下の「検索で0件」を参照 | データ取得の失敗: ErrorState「図鑑データを読み込めませんでした」と[再読み込み] | — |
| **サムネ** | 正方形のスケルトン | — | CookieSilhouette（等級色で着色）と名前。`alt` は名前のまま | — |
| **ステージ（カード）** | カード形のスケルトンと、浮遊なしの淡い明滅 | 未選択: 「左の一覧からクッキーを選んでください」 | 立ち絵の失敗: 表面に CookieSilhouette と「画像を読み込めませんでした」、[再試行]。回転はできる | — |
| **ステージ（動作）** | 立ち絵を仮表示し、右上に小さなスピナー | — | WebP の失敗: その動作だけ FallbackActor に切り替え、トーストで「動作素材を読み込めませんでした」 | 動作素材なし: FallbackActor で代わりにする。セレクタに「代替」ラベル。演出の対応は下表 |
| **説明パネル** | 名前3行、バッジ、本文5行のスケルトン | 各項目がないときは「情報なし」（muted） | 「詳細を表示できません」と[再試行] | — |
| **宣伝・ヒーロー** | ポスターを先に表示する | — | 動画の `error` イベントや 404 のときは代替表示 | 動画なし: ポスターとタイトルのばねアニメ（1文字ずつ 40ms 間隔）で代わりにする |
| **宣伝・ランナー** | — | — | 走る WebP の失敗: 立ち絵と FallbackActor の「走る」 | — |

### 検索で0件のとき
```
┌───────────────────────┐
│   (シルエット 64px)      │
│ 「ほいっぷ」に一致する     │
│ クッキーはいません          │
│ [条件をリセット]           │
└───────────────────────┘
```
ステージと説明パネルには、選択中のキャラをそのまま残す。一覧の上部に「表示中のクッキーはフィルタ条件の外にあります」と注記し、←/→ では切り替えない（0件のため）。

### FallbackActor の動作ごとの演出
すべて transform だけで動かす。

| 動作 | 動き |
|---|---|
| 待機 | scale 1↔1.02 を 2秒でループ（呼吸） |
| 走る | y 0↔-6px と scaleY 1.04↔0.96 を 300ms でループ、前傾 rotate -4° |
| ジャンプ | y 0→-80→0 を 600ms。着地で scaleX 1.15 / scaleY 0.85 を 120ms |
| 二段ジャンプ | 2回跳ねる。2回目の頂点で rotate 360° |
| スライド | scaleY 0.6 / scaleX 1.2、y +20% を 500ms 保ってから戻る |
| スキル1・2 | scale 1→1.15→1（spring.pop）と SkillFx |
| 喜ぶ | 2回跳ねながら rotate ±8° |

---

## 6. アクセシビリティ

### フォーカス
- `:focus-visible` のときだけ、`outline: 3px solid var(--color-focus); outline-offset: 2px` を出す。
- カードやサムネの上では、外側にさらに 2px の bg 色の影を足し、どの背景の上でも 3:1 以上を確保する。

### 当たり判定
- ボタン、チップ、サムネ、タブは、いずれも 44×44px 以上にする。チップは見た目が 36px でも、padding で 44px にする。

### ドラッグの代わりの操作（WCAG 2.5.7）
- 回転には [裏返す] ボタン（180° 回転）を、ダブルクリックには [正面] ボタンを代わりに用意する。
- カードにフォーカスがあるときは、`Space` で裏返し、`Home` で正面に戻す。

### グローバルショートカット
- ←/→ でキャラを切り替え、Enter でスキルを発動する。
- 次の場所にフォーカスがあるときは無効にする: `input`、`textarea`、`[role=tablist]`、`button`、`a`、`video`。tablist は矢印キーを自分で使うため。Enter はボタン本来の動きを優先する。
- ステージ下に `⏎ スキル / ← → 切替` のヒントを表示する。

### aria
| 対象 | 指定 |
|---|---|
| GameTabs、DetailPanel のタブ | `role="tablist"`、`tab`、`tabpanel`。矢印キーで移動 |
| CharacterGrid | `role="list"` の中にボタンを並べ、選択中は `aria-current="true"` |
| フィルタチップ | `aria-pressed` |
| CharacterCard3D | `role="group"`、`aria-roledescription="回転できるカード"`、`aria-label="勇敢なクッキー、表面"`（裏返すと「裏面: ステータス」に更新） |
| 状態の読み上げ | 非表示の live region（`aria-live="polite"`）で「勇敢なクッキー（3/10）を表示中」「スキル: 勇敢な突撃」「該当 4件」を通知 |
| 装飾要素 | 粒子の Canvas、パララックス層、ホロ光沢は `aria-hidden="true"` |
| 動画 | `muted` を前提にし、[一時停止] ボタンを常に表示（WCAG 2.2.2）。音声がないため字幕は付けない |
| 出典リンク | `target="_blank" rel="noopener"` と「（新しいタブ）」の非表示テキスト |

### 光の点滅（WCAG 2.3.1）
- フラッシュは1回の発動につき1回だけにし、不透明度は最大 0.6 とする。連打したときも 1秒に3回を超えないよう間引く。
- 画面いっぱいを赤く光らせることはしない。

### コントラスト
- 3.2 と 3.3 の値で、本文は 4.5:1 以上、UI の境界とフォーカスは 3:1 以上を守る。
- 半透明パネルは不透明度 0.80 以上とし、最も明るい等級背景の上でも本文が 4.5:1 以上になるよう実測する。

---

## 7. モーション仕様一覧

| # | トリガー | 対象 | 動き | 時間 / 値 | reduced-motion 時 |
|---|---|---|---|---|---|
| M1 | 待機中 | カード | y 0↔-6px、rotateZ ±0.5° | 3.2秒のループ（ease-in-out） | 止める |
| M2 | ポインタ移動 | カード | rotateX/Y で最大 ±12° 傾ける | spring.tilt | 最大 ±3° に弱める |
| M3 | ポインタ移動 | HoloSheen | 光沢の中心を `--mx/--my` で追わせ、不透明度 0→0.55 | spring.tilt | 固定位置で不透明度 0.2 |
| M4 | ドラッグ | カード | rotateY を移動量 ×0.5°/px で回す | 追従（即時） | 同じ（ユーザー自身の操作のため） |
| M5 | ドラッグ終了 | カード | 慣性で回り続ける | inertia.spin（上限 ±1440°/s） | 慣性なし。最も近い 0°/180° へ spring.snappy で寄せる |
| M6 | ダブルクリック / [正面] | カード | rotateX/Y を 0 に戻す | spring.snappy | 180ms で即座に戻す |
| M7 | [裏返す] / Space | カード | rotateY を +180° | spring.pop | 180ms のクロスフェードで表裏を入れ替える |
| M8 | ポインタ移動 / 時間経過 | ParallaxBg L1〜L3 | 平行移動。係数 0.02/0.05/0.1、最大 ±24px | spring.soft | 止める |
| M9 | キャラ切替（退場） | 前のカード | scale 1→0.85、opacity 1→0 | 180ms（ease-in） | opacity のみ 120ms |
| M10 | キャラ切替（入場） | 次のカード | scale 0.8→1、opacity 0→1 | spring.pop（見た目の時間 350ms） | opacity のみ 180ms |
| M11 | キャラ切替 | ステージ背景 | 等級のグラデへ補間 | 400ms（ease-out） | 即時に切り替え |
| M12 | 切替を連打 | M9〜M11 | 実行中のものを中断し、最新の値に向けて続ける（`AnimatePresence mode="popLayout"`） | — | 同じ |
| M13 | Enter / [スキル] | 画面のフラッシュ | 白い重ね、opacity 0→0.6→0 | 0〜150ms | 等級色のぼかしを opacity 0.25 で 200ms |
| M14 | 同上 | ステージの揺れ | x/y を最大 8px から減衰させる | 0〜300ms | なし |
| M15 | 同上 | ParticleCanvas | 中心から 80〜120 個を放射。重力あり、等級色とゼリー色 | 0〜900ms | なし（またはその場で光る点 8個のフェード） |
| M16 | 同上 | SkillCutIn | 左から skewX(-12°) で滑り込み、止まってから右へ抜ける | 100ms 開始 → 250 入 → 600 停止 → 250 出（合計約1.2秒） | 中央でフェードインとフェードアウト（合計 800ms） |
| M17 | 動作の切替 | ActionStage | 前の動作と次の動作をクロスフェード | 120ms | 同じ。ただしアニメ WebP は静止画（`still`）に置き換え |
| M18 | 動作素材なし | FallbackActor | 5章の表のとおり | 300〜600ms のループ | 静止した立ち絵。スキルは scale 1.05 を1回だけ |
| M19 | 初回の表示 | DragHint | 手のアイコンを左右に 24px スワイプ。3回で消える。ユーザーが操作したら即座に消す | 1.2秒 × 3 | アイコンは動かさず、文字だけ表示（4秒後に消す） |
| M20 | ホバー | サムネ / ボタン | y -2px と影を強める | 120ms（ease-out） | 色の変化のみ |
| M21 | タブ切替 | タブの下線 / パネル内容 | 下線は layoutId で移動、内容は opacity と y 8px | spring.snappy / 180ms | 下線は即時、内容は opacity のみ |
| M22 | /promo の表示 | PromoHero の代替タイトル | 1文字ずつ y -40→0 のばね | spring.pop、40ms 間隔 | フェードのみ 300ms |
| M23 | /promo の表示 | ヒーロー動画 | 自動再生（muted loop） | — | 自動再生しない。ポスターと[再生]ボタン |
| M24 | スクロール | 走る勇敢なクッキー | `useScroll` の進捗 0→1 を x -20vw→120vw に対応させる | スクロールに連動 | 中央に静止画を置く |
| M25 | スクロール | マップ L1〜L3 | 視差。係数 0.2/0.5/1.0 | スクロールに連動 | 止める（L3 だけを通常のスクロールで流す） |
| M26 | スクロール進捗 0.15 / 0.35 / 0.55 / 0.75 | TimelineCard | y 24→0、opacity 0→1 | spring.soft | 最初から全部表示（または opacity 200ms） |
| M27 | ビューポートに入る | CTA ボタン | scale 0.95→1、1回だけ光沢が走る | spring.pop と 600ms | フェードのみ |

**共通ルール**
- アニメーションさせるのは `transform` と `opacity` だけにし、レイアウトの再計算を起こさない。
- Canvas はタブが非表示（`visibilitychange`）のときに止める。
- 粒子の数は 160 を上限にし、DPR は 2 を上限にする。

---

## 8. リードへの相談事項（デザイン担当から。未解決・仮定）

1. **ARCHITECTURE.md を読めていなかった。** ルーティング（React Router か自前か）、URL クエリ方式、共有型（`Cookie`、`Grade`、`Action`、ステータス項目）の名前を確認したい。
2. **reduced-motion のときのアニメ WebP。** アニメ WebP は `<img>` では一時停止できない。素材を作る工程で、各動作の静止画（例: `*_still.webp`）も書き出してよいか。これは素材の契約に関わるためリードの判断が必要。
3. **オーブンブレイクの役割フィルタ。** オーブンブレイクには、キングダムのような役割やポジションの区分がないと仮定し、等級のチップだけを出す。データ側の項目に合わせて調整する。
4. **等級の一覧。** Witch と Special は仮で入れている。実データにある等級を確定させてほしい。
5. **フォントの読み込み方法。** Google Fonts の CDN（`<link>`）を想定している。オフラインで動かす必要があるなら、セルフホストするかどうかの判断が必要。新しいパッケージは追加しない。
6. **宣伝動画の置き場所。** 「Claude Motion」の書き出し方法を把握できていないため、置き場所を `public/promo/hero.mp4` と `hero-poster.webp` と仮定している。
7. **MotionPrefToggle（演出を自動 / 減らす / フル から選ぶ機能）。** 依頼にはない追加の提案。不要なら削る。
8. **権利表記。** 立ち絵や GIF の著作権は Devsisters にあるため、非公開・ローカル利用の前提を README などに明記することを提案する。テキストは cookierun.wiki（CC BY-SA 4.0）から出典を表記する。
9. **Motion 13.5.0 の API。** `visualDuration`、`bounce`、`type: "inertia"`、`useScroll`、`layoutId` の書き方は、Motion の公式ドキュメント（motion.dev）で確認しておらず、このバージョンでの互換性は実装担当の確認が必要。

入力にも出力にも個人情報は含まれていない。

---

## 9. リードの決定事項

1. **MotionPrefToggle は作らない。** 演出の強さは OS の prefers-reduced-motion にだけ従う。本文中の MotionPrefToggle に関する記述（ヘッダーの演出切替など）は、実装対象から外す。
2. **reduced-motion 用の静止画 `still` を素材に含める。** 各動作について、素材変換スクリプトがアニメーション WebP と一緒に1コマ目の静止画 `*_still.webp` を書き出す。`MotionAsset` に `still` を持たせる（ARCHITECTURE.md の契約）。
3. URL は ARCHITECTURE.md の契約（`/?game=kingdom|ovenbreak&c=<id>&view=card|stage`）に合わせる。ルーティングは自前の小さなルーターとする。
4. 等級の列挙値は、取得スクリプトの実データで確定する。未知の等級は Common の色で代用する。Witch と Special は、データにあるときだけ使う。
5. フォントは Google Fonts の CDN を使う。
6. 宣伝動画は `public/promo/hero.mp4` と `public/promo/hero-poster.webp` に置く（gitignore 対象）。ない場合は代替表示にする。
