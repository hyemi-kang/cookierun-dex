# RESEARCH: 調査結果（2026-10-16 時点）

Phase 1 で3つの観点を並列に調べた結果をまとめる。バージョンと公開日は npm レジストリ（`npm view`）で取得した値。「採用可」は公開から2週間以上たった版（公開日が 2026-10-02 以前）を指す。

- A: 類似サービスの UX、データ源、回転の見せ方、動作素材
- B: 技術スタック
- C: 核心機能のライブラリ（回転、アニメーション、検索、WebP 変換、パーティクル）

---

## 観点A: 類似サービスの UX・データ源・回転表現・動作素材

### A-1. 結論
- **データ源は cookierun.wiki を推奨。** Fandom の Cookie Run 系3Wikiは 2025年11月ごろに独立Wikiの cookierun.wiki へ統合・移行していた。旧 Fandom 側には「更新しないで」と告知されている。
- 本文のライセンスは CC BY-SA 4.0。MediaWiki API は `https://cookierun.wiki/mw/api.php` で使えることを実際に確認した。
- **回転表現は「ドラッグで Y 軸回転する3Dカード（表は立ち絵、裏は別面）」に、マウス追従のチルトと待機中の揺れを足す形を推奨。**

### A-2. 類似UIの例と良いレイアウト
原神公式などのキャラ紹介ページは SPA のため、取得ツールでは中身を描画・確認できなかった。次の表の観察は既知の構成をもとにした記述で、2026年10月時点の実ページとは照合していない（未確認）。

| 参考例 | 構成の特徴 | 取り入れたい点 |
|---|---|---|
| 原神 公式キャラ紹介 | 地域タブ → 下部にキャラのサムネ列。中央に大きな立ち絵、横に名前・説明・ボイス | 一覧と詳細を1画面にまとめる。切り替え時は立ち絵がスライドしながらフェードする |
| ポケモンずかん公式 | 検索と絞り込み（タイプ・地方など）が充実。詳細は別画面 | 検索・フィルタの作り方（チップ型の条件、該当件数の表示） |
| ゲームのキャラ選択画面全般 | 背景色やエフェクトがキャラ属性に連動し、選んだ瞬間に演出が入る | 等級ごとのテーマ色を背景グラデーションと光彩に反映する |

**このプロジェクト向けのレイアウト案（PC 1280px以上）**
- 左：一覧（検索欄、フィルタ用チップ、サムネのグリッド）。中央：ステージ（キャラ、背景エフェクト）。右：説明パネル（タブで「概要／スキル／登場」を切り替え）。
- キャラ切り替え時の演出：今のキャラは縮小しながらフェードアウトし、次のキャラはばね感のある拡大でフェードインする。背景色も同時に変える。演出の時間は 250〜400ms 程度に収め、途中で次の操作をしたら中断できるようにする。
- 同一ページ内の View Transitions（`document.startViewTransition()`）は、Firefox 144（2025年10月）の対応で Baseline Newly available になった。ライブラリを使わずにサムネから中央へのモーフ遷移が作れる。
- パララックス：背景を2〜3層（遠景の模様、光の粒、キャラの影）に分け、マウス位置に応じてずらす量を層ごとに変える。

### A-3. ユーザーが嫌がる点と対策

| 嫌がる点 | 典型的な原因 | 対策 |
|---|---|---|
| 重い | 原寸PNGの一括読み込み（例：Pure Vanilla の立ち絵は 1900×1693）、動画背景 | 一覧ではWikiのサムネURL（`/thumb/.../300px-`）を使う。原寸は選んだキャラだけ読み込み、ローカルで WebP に変換しておく。次の候補は事前に読み込む |
| 情報が読みにくい | 立ち絵や派手な背景の上に直接文字を置く | 半透明の背景とぼかしを敷いたパネルに載せる。文字のコントラストを確保し、長文は折りたたむ |
| 操作が分かりにくい | ドラッグで回転できることに気づかない | grab カーソルと「ドラッグで回転」のヒント表示。ダブルクリックで正面に戻す。左右キーでもキャラを切り替えられるようにする |
| 演出が長くて待たされる | 演出が終わるまで操作を受け付けない | 演出は中断可能にする。`prefers-reduced-motion` が有効なら演出を弱める |
| 検索の反応が鈍い | 入力のたびにページを読み直す | 数十〜200件ならクライアント側の即時フィルタで十分。0件のときの表示も用意する |

### A-4. データ源の比較

| 候補 | ライセンス | API | 収録状況 | 長所 | 短所・注意 |
|---|---|---|---|---|---|
| **cookierun.wiki（推奨）** | 本文は CC BY-SA 4.0（APIの rightsinfo で確認）。画像は「copyrighted to Devsisters」で、fair use を主張 | **あり**：MediaWiki 1.43.11、`/mw/api.php`。PageImages、TextExtracts、PortableInfobox、Scribunto が入っている | articles 13,512、images 158,080。Kingdom の一覧ページで「プレイ可能クッキー 193体」。Classic、OvenBreak、Tower of Adventures、OvenSmash などの一覧ページもある | 公式に近い画像（`Crk_illustration_*.png`）の原寸URLが API で取れる。インフォボックスが構造化されている | スキル説明は本文中にあり、インフォボックスには入っていない。TextExtracts の要約は Kingdom サブページで空だった。スキル節の構造は未確認 |
| Fandom（cookierun / cookierunkingdom.fandom.com） | Fandom の標準は CC BY-SA 3.0（namu.wiki のFAQにもそう書かれている、と Wikipedia に記載。Fandom 側での直接確認はできず未確認） | MediaWiki API はあるはずだが、HTTP 402 で取得できず未確認 | コミュニティは移行済みで、旧一覧は 175体と古い | — | 更新が止まっている、またはFandomが管理を引き継いだ状態。避けた方がよい |
| namu.wiki | CC BY-NC-SA 2.0 KR（Wikipedia経由で確認） | 公開APIは確認できず（未確認）。ページは 403 で取得できず。robots.txt は `Disallow: /` を基本に一部だけ許可 | 韓国語の設定や小ネタが豊富 | 韓国語名・設定の補助参照に使える | 自動取得には不向き。手作業での参照にとどめる |
| Devsisters 公式ファンキット | 公式の利用条項は**未確認**（第三者サイトの記事しか見つからず） | — | ロゴやクッキー画像などが含まれるとされる | 公式素材 | 配布元と条件を一次情報で確認できていない |

**cookierun.wiki のインフォボックス（`{{Crk cookie infobox}}`）で確認できた主なパラメータ**
- `name`、`image`、`rarity`、`position`、`role`、`first_appearance`、`releasedate`
- 声優（`va_jpn` など）、各言語名（`name_kor`、`name_jpn` など）

例：Pure Vanilla Cookie は rarity が Ancient、role が Healing、position が Rear、releasedate が 2021-04-08。数値（スキルの回復量など）は Global 版と中国版で違うので注意が必要。

**個人利用で数十キャラ分のJSONを作る現実的な手順（案）**
1. 対象キャラを決める。`List_of_Cookies/Kingdom` から選ぶ（APIの `action=parse&prop=links` でも取れる）。
2. 各キャラについて `action=parse&page=<名前>/Kingdom&prop=wikitext` でウィキテキストを取り、インフォボックスの値を取り出す。
3. 画像は `prop=pageimages&piprop=original` で原寸URLを得る（例：`https://cdn.wikimg.net/en/cookierunwiki/images/3/3d/Crk_illustration_pure_vanilla.png`）。ローカルに保存し、WebP に変換する。
4. スキル名と説明、紹介文は自動で取り出すのが不安定なので、**数十件なら手作業で要約して入れるのが確実**。
5. JSONには `sourceUrl` と `license: "CC BY-SA 4.0"` の欄を持たせて出典を残す。
- アクセスのマナーとして、リクエストは逐次実行し、1秒程度の間隔を空け、連絡先入りの User-Agent を付ける。一度取った結果はキャッシュする。

**権利面の注意**
- 画像の著作権は Devsisters にある。ローカルの非公開利用であれば実質的なリスクは低いと考えられる。ただし、画像を含むリポジトリを公開・配布しない（画像フォルダは `.gitignore` に入れる）。法的な評価ではない。
- 本文を要約せずにそのまま転載する場合、CC BY-SA の表示義務が生じる。公開しないのであれば継承（ShareAlike）の問題は事実上生じないが、出典は残しておくのが無難。

### A-5. 動作素材（アニメーション GIF）の調査
cookierun.wiki の API を実際に呼び出して確認した。

**結論**
- **cookierun.wiki にはクッキーの動作GIFが大量にある。** キングダムは待機・走り・スキル1/2・バトル待機など約50種類、オーブンブレイクは走る・ジャンプ・二段ジャンプ・スライドなど約20種類。
- **重い点と出どころに注意が必要。** キングダムのGIFは1ファイル0.2〜8MBある。説明欄に「Datamined」（ゲームのデータから抜き出した素材）と書かれたファイルがあり、どれも著作権はDevsisters。
- **推奨は「Wiki の GIF を主役に、プログラムで付ける演出を上乗せする」構成。** Spine は有料のエディタライセンスが必要なので使わない。YouTube の動画は埋め込みのみ可、ダウンロードは不可。

| ゲーム | 命名規則（実際に確認したもの） | 主な動作 | 1キャラあたりの件数・サイズ |
|---|---|---|---|
| キングダム（標準衣装） | `Cookie<ID4桁>-<動作>.gif`。例：Pure Vanilla は `Cookie0506-skill1.gif` | idle、idle_back、battle_idle、run、walk、jump_back、skill1、skill2（`skill2_loop` や `skill2_end` に分かれるキャラもある）、greeting、joy、die、lose、interaction など | 約50件（Cookie0002s01 で51件）。1件0.06〜8.5MB、幅と高さは100〜560px程度 |
| キングダム（衣装違い） | `Cookie<ID>s01-<動作>.gif`（s01〜s04） | 同上 | GingerBrave では s01 がタキシード衣装、s02 が誕生日衣装 |
| キングダム（例外） | GingerBrave の標準衣装は `Cookie0000_emotion-<動作>.gif`、一部は `Crk_<名前>_<動作>.gif` | — | 命名がそろっていない |
| オーブンブレイク | `Crob_<キャラ名>_<動作>.gif`。例：`Crob_abyss_monarch_run.gif` | run、run_fast、jump、double_jump、slide、landing、fever_run、fever_start_full、crash、exhausted、extra_1〜8 | 約13〜23件。1件15〜420KBと軽い |
| オーブンブレイク（例外） | GingerBrave だけ `Cookie0001_run.gif`、`_jump`、`_slide`、`_doublejump` | 同上 | `Crob_pure_vanilla*` と `Crob_g*ingerbrave` は0件で、全キャラ分そろってはいない |

- その他の形式：WebP や MP4 もあるが、ほとんどはイベントやカードの素材で、キャラの動作ではない。APNG やスプライトシートは確認できなかった。オーブンブレイクの Gallery ページは PNG のみ。
- 出どころの表示：`Crk_abby_idle.gif` の説明欄は「Author=Devsisters、Source=Datamined」で、ライセンスはWiki独自のテンプレート `{{CRF}}`（内容は未確認）。`Cookie0506-skill1.gif` などは自作素材を示す `{{Self}}` となっているが、ゲームから抜き出した素材と見るのが妥当。

**APIでの取り方（確認済み）**
- キャラごと（確実な方法）：`/mw/api.php?action=query&prop=images&titles=<名前>/Kingdom/Gallery&imlimit=500` を呼び、`.gif` で絞り込む。
- 命名規則で一覧を取る方法：`list=allimages&aiprefix=Cookie0506-&aimime=image/gif&aiprop=url|size|dimensions` を使う（`aimime` での絞り込みが効くことを確認）。続きは `aicontinue` で取る。
- 使えなかった方法：全文検索（`list=search` の `intitle:`）は0件で使えなかった。
- 未確認の点：キャラ名とキングダムの ID（例：Pure Vanilla = 0506）の対応表がWikiにあるかは未確認。Gallery ページから逆引きするのが確実。

### A-6. 「回転」の見せ方の比較
前提：公式の3Dモデルは公開されていない。ゲーム内アセット（Spine 等）を抜き出して使うのは利用規約違反の可能性があるため、選択肢から外した（ゲームが Spine を使っているかどうか自体も未確認）。

| 候補 | 長所 | 短所 | 実現難度 |
|---|---|---|---|
| **A. 3Dカードの回転**（CSS 3D の `rotateY` と `backface-visibility`。表は立ち絵、裏は紋章・シルエット・ステータス。ドラッグで自由回転し、慣性あり） | 軽い。ライブラリなしでも作れる。360°回しても破綻しない。裏面を「データ面」に使える | 回して見えるのはカードの裏で、キャラの背中ではない | 低 |
| **B. マウス追従チルト＋ホログラムの光沢＋層のパララックス**（±15°程度） | 一番「かっこいい」と感じやすい。立ち絵1枚で済む | 360°回転にはならない | 低 |
| C. Three.js の2.5D層表示（キャラ、エフェクト、背景を奥行き別の板に配置し、カメラを周回させる） | 本物の3D空間らしい奥行きと光の表現 | 板を真横から見ると線になるため、回転角の制限が必要。ライブラリ追加になる | 中 |
| D. 複数アングルのスプライト回転（商品の360°ビューアー方式） | 本当に回って見える | 公式の多方向画像が存在しない。素材が用意できない | 素材面で不可 |
| E. Live2D 風の揺れ（メッシュ変形） | 生きている感じが出る | パーツを分けた素材が必要で、作る手間が大きい | 高 |
| E'. 簡易版の揺れ（上下の浮遊、呼吸のような拡縮、影の伸縮） | ほぼ手間なしで動きが出る | 単独では地味 | 低 |
| F. 画像から3Dを生成するAIでモデルを自作 | 本当の3D回転ができる | 品質が不安定。二次的な著作物になる。工数が大きい | 高（非推奨） |

**推奨：A（3Dカード回転）に B（チルト・光沢・パララックス）と E'（待機中の揺れ）を組み合わせる。**
- 「ドラッグで回転できる」という要件を、立ち絵1枚と既存データだけで満たせる。
- 裏面を「ステータス面」にすれば、回すこと自体に意味が生まれる。
- 等級ごとのテーマ色や光沢を足すと、ゲームのカードらしい見栄えが出る。
- 軽いのでローカル実行でも快適。ライブラリ追加も不要になり得る。

**次点：C（Three.js の2.5D層表示）。** 見た目の上限は高いが、ライブラリ追加と回転角の制約がある。

### A-7. 動作の付け方（静止画1枚しかない場合）

| 案 | 見栄え | 難度 | 補足 |
|---|---|---|---|
| A. CSS や Motion で動きを付ける（呼吸のような拡縮、上下の浮遊、ジャンプ時のつぶれと伸び、走るときの傾きと上下動） | 中 | 低 | 足元を回転の中心にするのがコツ。全キャラに共通で使える |
| B. スキル演出（光のフラッシュ、画面の揺れ、放射状の光、Canvas のパーティクル） | 高 | 低〜中 | 等級や属性の色で変えるとそれらしく見える。静止画でも強く効く |
| C. PixiJS のメッシュ変形（画像を格子状に分割して頂点を波打たせ、髪や服が揺れるように見せる） | 中〜高 | 中 | パーツ分割は不要。ただし全体がぐにゃっとしやすい |
| D. パーツに分割して関節で回す（画像編集ソフトで頭・腕などを切り出して重ねる） | 高 | 高 | キャラごとの手作業で、隠れていた部分の描き足しも必要。数十キャラでは現実的でない |
| E. Spine | 最高 | 高 | ランタイムの利用には利用者それぞれが Spine Editor のライセンスを持つ必要がある（公式）。個人用途の例外は確認できず。**非推奨** |
| F. Wiki の GIF をそのまま表示 | 最高（本物の動き） | 低 | 重い、256色で縁がギザつく、一時停止やコマ単位の制御がしにくい。手元でアニメーションWebPに変換すれば軽くなる見込み |

**推奨**
- 主役は Wiki の GIF（案F）。キングダムは idle、battle_idle、run、skill1、skill2 を切り替え、オーブンブレイクは run、jump、double_jump、slide を切り替える。対象の数十キャラ分だけ取得し、手元でWebPに変換する。
- 上乗せする演出は案A＋案B。GIF がないキャラはこれだけで代用する。
- 次点は案C（PixiJS のメッシュ変形）。

### A-8. 公式 YouTube などの動画の扱い
- **埋め込みは規約上可能。** YouTube 利用規約に「埋め込み型 YouTube プレーヤーに YouTube 動画を表示させることもできます」とある。
- **ダウンロードは不可。** 同じ規約で、YouTube の明示的な承認や権利者の書面許可がない「複製、ダウンロード」は禁止されている。yt-dlp などで保存してローカルで再生する案はとらない。
- **技術的な注意：** 埋め込みプレーヤーは HTTP Referer で呼び出し元を確認する。`file://` で直接開くと Referer が付かず、Error 153 になるという報告がある。localhost の開発サーバーで動かし、iframe に `referrerpolicy="strict-origin-when-cross-origin"` を付ける必要がある。localhost で問題なく再生できるかは未確認。
- **データの持ち方：** JSON には動画IDだけを持たせる。

### A-9. 未確認事項
- Devsisters 公式ファンキットの利用条件
- Fandom 側の現在の状態と API
- namu.wiki の API の有無
- cookierun.wiki のアクセス頻度に関する方針
- スキル説明の節構造

### A-10. 出典
- [Cookie Run Wiki: Announcement（Fandom 3Wikiの統合・移行）](https://cookierun.wiki/w/Cookie_Run_Wiki:Announcement)
- [Cookie Run Wiki: General disclaimer](https://cookierun.wiki/w/Cookie_Run_Wiki:General_disclaimer)
- [cookierun.wiki API siteinfo（MediaWiki 1.43.11、CC BY-SA 4.0、統計）](https://cookierun.wiki/mw/api.php?action=query&meta=siteinfo&siprop=general|rightsinfo|statistics&format=json)
- [cookierun.wiki API extensions](https://cookierun.wiki/mw/api.php?action=query&meta=siteinfo&siprop=extensions&format=json)
- [Pure Vanilla Cookie/Kingdom](https://cookierun.wiki/w/Pure_Vanilla_Cookie/Kingdom)
- [List of Cookies/Kingdom](https://cookierun.wiki/w/List_of_Cookies/Kingdom)
- [Template:Classic cookie infobox](https://cookierun.wiki/w/Template:Classic_cookie_infobox)
- [File:Cookie Run Kingdom logo.png（画像の著作権表示）](https://cookierun.wiki/w/File:Cookie_Run_Kingdom_logo.png)
- [旧 Fandom: List of Cookies](https://cookierunkingdom.fandom.com/wiki/List_of_Cookies)
- [Namuwiki - Wikipedia（ライセンス CC BY-NC-SA 2.0 KR）](https://en.wikipedia.org/wiki/Namuwiki)
- [CC BY-NC-SA 2.0 KR（Creative Commons 公式）](https://creativecommons.org/licenses/by-nc-sa/2.0/kr/deed.ko)
- [namu.wiki robots.txt](https://namu.wiki/robots.txt)
- [web.dev: Same-document view transitions are now Baseline Newly available（2025-10-16）](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available)
- [Chrome for Developers: What's new in view transitions (2025 update)](https://developer.chrome.com/blog/view-transitions-in-2025)
- [TouchTapPlay: Cookie Run Kingdom Fan Kit（第三者記事・補助）](https://www.touchtapplay.com/how-to-use-the-cookie-run-kingdom-fan-kit/)
- [原神 公式キャラクター紹介（UXの参考、中身は未確認）](https://genshin.hoyoverse.com/ja/character/mondstadt)
- [cookierun.wiki API（allimages、mime=gif、Cookie0001）](https://cookierun.wiki/mw/api.php?action=query&list=allimages&aiprefix=Cookie0001&aimime=image/gif&ailimit=100&aiprop=size|dimensions|timestamp&format=json)
- [cookierun.wiki API（allimages、Crob_、gif）](https://cookierun.wiki/mw/api.php?action=query&list=allimages&aiprefix=Crob&aimime=image/gif&ailimit=100&aiprop=size&format=json)
- [cookierun.wiki API（Pure Vanilla Kingdom Gallery の画像一覧）](https://cookierun.wiki/mw/api.php?action=query&prop=images&titles=Pure_Vanilla_Cookie/Kingdom/Gallery&imlimit=500&format=json)
- [GingerBrave/Kingdom/Gallery](https://cookierun.wiki/w/GingerBrave/Kingdom/Gallery)
- [ファイル説明欄（Datamined、CRF、Self）の確認](https://cookierun.wiki/mw/api.php?action=query&titles=File:Cookie0001s01-skill1.gif|File:Crk_abby_idle.gif|File:Cookie0001_run.gif&prop=fileusage|categories|revisions&rvprop=content&rvslots=main&format=json)
- [Spine Runtimes License（Esoteric Software 公式）](https://en.esotericsoftware.com/spine-runtimes-license)
- [YouTube 利用規約](https://www.youtube.com/static?template=terms)
- [Simon Willison: YouTube embed の Referer 要件](https://simonwillison.net/b/9171)
- [TiddlyWiki フォーラム: file:// で Error 153](https://talk.tiddlywiki.org/t/youtube-error-153-when-using-utube-simple-annotations/15442)

---

## 観点B: 技術スタック

### B-1. 結論
推奨は **Vite + React + TypeScript、Tailwind CSS、React 標準の状態管理、Vitest + Testing Library + Playwright、Biome**。各パッケージは公開から2週間以上たった最新の安定版に固定する。

**調査結果の訂正（最終版）**
- 最初の報告で「1年以上更新がないので除外」とした `@testing-library/user-event` と `@testing-library/jest-dom` は誤りだった。両方とも最近更新されており、**使える**。
  - user-event の最新は 14.6.8（2026-10-13）。採用可の最新は **14.6.7**（2026-09-02）。
  - jest-dom の最新は **7.0.1**（2026-08-09）。7.0 はメジャー版（07-20 公開）なので、Vitest 5 との組み合わせは導入時に確認する。
- `@testing-library/react` は 16.3.3（08-27）が採用可の最新。実際に入れたのは 16.3.2 で、動作に問題はないのでそのままにしている。
- 並列実行で取得した値の一部が古いデータだった。@testing-library/jest-dom、@testing-library/user-event、@testing-library/react、vue、vitest、jsdom は、`--prefer-online` で再取得した値が正。

### B-2. 比較表
凡例: 最新安定版は npm の `dist-tags.latest`。人気度は npm の週間ダウンロード数（2026-10-06〜10-12）と GitHub のスター数。

| 区分 | 候補 | 最新安定版（公開日） | 採用可の最新版（公開日） | 最終更新 | ライセンス | 人気度（週DL / Stars） | 長所 | 短所 |
|---|---|---|---|---|---|---|---|---|
| FW | **Vite + React + TS** | vite 8.3.4 (10-08)、react 19.3.1 (10-14)、@vitejs/plugin-react 6.1.2 (10-05) | vite 8.3.2 (10-01)、react 19.3.0 (09-09)、plugin-react 6.1.1 (08-28) | GH 10-15 | MIT | vite 195M / 83k、react 188M / 251k | 起動が速く、ローカルの画面だけのアプリに合う。3D表示(react-three-fiber)やアニメーションのライブラリが一番多い | 画面遷移の仕組みは自分で用意する。ただ1画面なら不要 |
| FW | Next.js | 16.4.1 (10-14) | 16.3.8 (09-30) | GH 10-16 | MIT | 67M / 143k | 機能が全部入り | サーバー機能が中心で、今回の用途には大きすぎる |
| FW | Astro | 7.3.8 (10-08) | 7.3.5 (09-24) | GH 10-15 | npm にライセンス表記なし。GitHub 上は NOASSERTION | 7.3M / 63k | 静的なコンテンツ中心のサイトが得意 | 3D回転など動きの多い1画面アプリだと、結局 React などを組み込んで二重構成になる。ライセンスの記載が確認できない |
| FW | SvelteKit | kit 3.1.0 (10-14)、svelte 5.57.2 (10-06) | kit 3.0.0 (10-01)、svelte 5.57.1 (09-18) | GH 10-15 | MIT | kit 3.3M / 20.9k、svelte 6.8M / 88k | 軽くて書きやすい | **kit 3.0.0 はメジャー版が出た直後（15日前）**。周辺ライブラリがまだ追いついていない恐れがある |
| FW | Vite + Vue | vue 3.5.44 (10-13)、@vitejs/plugin-vue 6.0.10 (10-10) | vue 3.5.43 (09-17)。plugin-vue の採用可の版は未確認 | GH 10-14 | MIT | 17.6M / 54.6k | 学習しやすく安定している | 3D関連の周辺ライブラリは React より少ない |
| CSS | **Tailwind CSS**（@tailwindcss/vite 併用） | 4.3.3 (07-16) | 4.3.3 | npm 10-15 | MIT | 137M / 97.9k | 見た目の調整が速い。演出も書きやすい | クラス名が長くなる |
| CSS | CSS Modules | Vite に内蔵 | ― | ― | ― | ― | 依存が増えない | 演出を全部自分で書くことになる |
| 状態 | **React 標準**（useState / useReducer / Context） | react に含まれる | ― | ― | MIT | ― | 依存ゼロ。選択キャラとフィルタ程度なら十分 | 状態が増えると Context の扱いが煩雑になる |
| 状態 | Zustand | 5.0.15 (08-13) | 5.0.15 | 08-13 | MIT | 62.7M / 58.8k | 小さくて書き方が簡単 | 今の規模では不要 |
| 状態 | Jotai | 3.0.1 (09-29) | 3.0.1 | 09-29 | MIT | 6.7M / 21.3k | 状態を細かい単位で管理できる | 3.0 系は出てから日が浅い |
| テスト | **Vitest** | 5.0.5 (10-15) | 5.0.3 (09-30) | 10-15 | MIT | 125M / 17.2k | Vite と設定を共有できる | 5.0.3 は公開から16日。リリースが速いので固定が必要 |
| テスト | @testing-library/react | 16.3.3 (08-27) | 16.3.3 | 08-27 | MIT | 70.3M / 19.7k | 定番。React 19 に対応 | 更新頻度は低め |
| テスト | @testing-library/dom（上の必須依存） | 10.4.2 | 10.4.2 | npm 09-13 | MIT | 未確認 | ― | 版ごとの公開日は未確認 |
| テスト | @testing-library/user-event | 14.6.8 (10-13) | 14.6.7 (09-02) | 10-13 | MIT | 未確認 | ユーザー操作の再現に使う | 最新の 14.6.8 は公開から3日で、採用不可 |
| テスト | @testing-library/jest-dom | 7.0.1 (08-09) | 7.0.1 | 08-09 | MIT | 未確認 | 画面の状態を検証する関数を追加する | **7.0 はメジャー版（07-20 公開）**。Vitest との組み合わせの確認が必要 |
| テスト | jsdom | 30.1.3 (10-15) | 30.1.1 (09-22) | 10-15 | MIT | 未確認 | Vitest の画面テスト環境として定番 | 30.1.2 は10-04公開で12日しかたっていないので不可 |
| E2E | **Playwright**（@playwright/test） | 1.64.1 (10-14) | 1.63.0 (09-04) | 10-15 | Apache-2.0 | 76M / 97.8k | Windows でそのまま動く | ブラウザ本体のダウンロードが必要 |
| lint | ESLint + Prettier + typescript-eslint | eslint 10.12.0 (10-02)、prettier 3.9.10 (10-10)、ts-eslint 8.71.2 (10-12) | eslint 10.11.0 (09-18)、prettier 3.9.9 (09-23)、ts-eslint 8.71.0 (09-28) | 10月 | MIT | eslint 159M / 27.6k、prettier 139M / 52.4k | React hooks 用ルールなど拡張が豊富 | 依存が増える。**typescript-eslint 8.71.0 は TypeScript `>=4.8.4 <6.1.0` しか対応していない** |
| lint | **Biome** | 2.5.15 (09-30) | 2.5.15 | GH 10-15 | MIT OR Apache-2.0 | 17.9M / 26k | lint と整形が1つの道具で済み、速い。TypeScript の版に縛られない | ESLint ほどプラグインがない |
| 言語 | TypeScript | 7.0.2 (07-08) | 7.0.2 | npm 10-14 | Apache-2.0 | 307M | 7系は Go で書き直された高速版 | typescript-eslint が 7 系に対応していない。6系の最終は 6.0.3 (2026-04-16) |

### B-3. 推奨構成（バージョン固定）
```
vite 8.3.2 / @vitejs/plugin-react 6.1.1 (peer vite ^8.0.0)
react 19.3.0 / react-dom 19.3.0 / @types/react 19.3.0 / @types/react-dom 19.3.0
typescript 6.0.3
tailwindcss 4.3.3 / @tailwindcss/vite 4.3.3 (peer vite ^5.2||^6||^7||^8)
状態管理: React 標準（追加なし）
vitest 5.0.3 (peer vite ^6.4||^7||^8) / jsdom 30.1.1
@testing-library/react 16.3.3 / @testing-library/dom 10.4.2
@testing-library/user-event 14.6.7 / @testing-library/jest-dom 7.0.1（任意）
@playwright/test 1.63.0
@biomejs/biome 2.5.15
```

**理由**
1. 今回はローカルで動かす画面だけのアプリで、サーバー機能は要らない。Next.js や SvelteKit の強みは活きず、Vite で作る画面だけのアプリが一番シンプル。
2. 中央のキャラをドラッグで回すため、3D表示とアニメーションのライブラリが一番そろっている React が有利。
3. TypeScript は 7.0.2 も条件は満たす。ただ、ESLint 系の typescript-eslint が 7 系に対応していない。後で ESLint に切り替えられるように、6系の最終版 6.0.3 にした。7系の周辺ツール対応は未確認。
4. Biome は使い手が本人だけの構成で設定が少なく済み、TypeScript の版にも縛られない。
5. 状態は選択中のキャラとフィルタ程度なので、ライブラリを足さず React 標準で十分。

**次点**: lint/format を ESLint 10.11.0 + Prettier 3.9.9 + typescript-eslint 8.71.0 にする構成（TypeScript は 6.0.3 のまま）。フレームワークの次点は Vite + Vue 3.5.43。

### B-4. 未確認・リードへの相談事項
- vite 8.3.2、react 19.3.0、vitest 5.0.3 などは、最新から1つ戻した版。2週間ルールに従った結果。
- 次の項目は今回のバージョン確認の範囲では未確認：
  - jest-dom 7.0.1 と Vitest 5 の組み合わせでの動作
  - user-event と @testing-library/dom の peerDependencies
  - @testing-library/dom の版ごとの公開日
  - @plugin-vue の採用可の版
- 3D関連の最新版（範囲外なので採用可かどうかは未判定）：three 0.186.1 (09-24)、@react-three/fiber 9.8.2 (10-14 公開で2週間未満)、@react-three/drei 10.7.9 (09-25)。
- npm 10.9.8 は、`vitest` の peer 依存の解決で落ちる不具合（`Cannot read properties of null (reading 'edgesOut')`）がある。インストール時は `--legacy-peer-deps` を付ける。

### B-5. 出典
- npm レジストリ（`npm view` で取得）: 各 `https://www.npmjs.com/package/<pkg>`
- npm レジストリ API: https://registry.npmjs.org/@testing-library/jest-dom 、https://registry.npmjs.org/@testing-library/user-event
- npm 週間ダウンロード数: https://api.npmjs.org/downloads/point/last-week/vite,react,next,astro,vue,tailwindcss,zustand,jotai,vitest,eslint,prettier,typescript,svelte
- GitHub（スター数・最終 push）:
  - https://github.com/vitejs/vite
  - https://github.com/facebook/react
  - https://github.com/vercel/next.js
  - https://github.com/withastro/astro
  - https://github.com/sveltejs/kit
  - https://github.com/sveltejs/svelte
  - https://github.com/vuejs/core
  - https://github.com/tailwindlabs/tailwindcss
  - https://github.com/pmndrs/zustand
  - https://github.com/pmndrs/jotai
  - https://github.com/vitest-dev/vitest
  - https://github.com/testing-library/react-testing-library
  - https://github.com/microsoft/playwright
  - https://github.com/eslint/eslint
  - https://github.com/prettier/prettier
  - https://github.com/biomejs/biome

---

## 観点C: 核心機能のライブラリ

### C-1. 結論
ドラッグ回転は (b) CSS 3D transform（Motion で回転・慣性）、アニメーションは Motion 13.5.0 に固定、検索は単純な includes、パーティクルは自前 Canvas、GIF→WebP 変換は sharp を推奨する。

基準日は 2026-10-16（JST）。「2週間未満」の境目は 2026-10-02 01:00 UTC 頃として判定した（日時はすべて UTC）。

### C-2. ドラッグ回転の表示方式
方針が「GIF（WebP に変換）を主役にする」に決まったため、**動く画像との相性**が一番大きな比較点になった。

| 候補 | 採用可能な版・日付 | 最終更新 | ライセンス | 人気度 | 長所 | 短所 |
|---|---|---|---|---|---|---|
| (a) @react-three/fiber | **9.8.1**（09-24）。9.8.2 は 10-14 公開のため対象外 | 10-14 | MIT | 33.0k stars / 6.24M週 | ライティング、本格的な3D演出、カメラ揺れ | 動く GIF/WebP はテクスチャとして自動では再生されない（フレームを分解して canvas テクスチャを毎フレーム更新する処理が必要。実装量が大きい） |
| 　＋@react-three/drei | 10.7.9（09-25） | 09-25 | MIT | 10.0k / 4.42M | OrbitControls、Billboard、Sparkles など | peer は react ^19 / fiber ^9 |
| 　＋three | 0.186.1（09-24） | 09-24 | MIT | 116k / 21.4M | 実績が最大 | 上と同じ |
| **(b) CSS 3D transform + Motion** | Motion 13.5.0（後述） | ― | MIT | ― | `<img>` のアニメーション WebP がそのまま再生される。カードの表裏、つぶれ伸び、フラッシュ、画面揺れを DOM と Motion だけで書ける。実装量が最小 | 本物の3D照明はない（光沢はグラデーション重ねで代用） |
| 　@use-gesture/react | 10.3.1（**2024-03-21**） | repo push 2024-07 | MIT | 9.6k / 7.35M | 定番 | **最終リリースが1年以上前のため条件外**。Motion の `onPan` か Pointer Events で代わりができる |
| (c) 360° スプライトビューア | 未確認（調査を省略） | ― | ― | ― | 実写のような回転 | **多方向から見た画像が存在しないため成立しない**。不採用 |

**推奨は (b)。** 理由は次のとおり。
- GIF/WebP の再生をブラウザに任せられる。
- ドラッグは Motion の `useMotionValue` と `onPan` で回転させ、離したときの慣性も Motion で出せる。
- @use-gesture を入れずに済む。

**次点は (a)。** 背景だけを R3F（パーティクル・ライト）にして、キャラは DOM 層に重ねる構成なら、動く画像の問題を避けられる。ただし依存が増える。

### C-3. アニメーション

| 候補 | 採用可能な版・日付 | 最終更新 | ライセンス | 人気度 | React 19 | 長所 | 短所 |
|---|---|---|---|---|---|---|---|
| **motion** | **13.5.0（10-01 11:31）** | 14.3.0（10-15） | MIT | 34.2k stars / 25.2M週（framer-motion は 51.1M） | peer `^18 \|\| ^19` | `layout`/`AnimatePresence`、ドラッグ、spring を一つでまかなえる。13.4 以降は React 19.3 の ViewTransition を使う `AnimateView` もある | リリース間隔が非常に短い |
| gsap | 3.15.0（2026-04-13） | 04-13 | **独自の Standard "no charge" License（OSS ではない）** | 29.3k / 6.04M | 依存なし | タイムライン、SplitText などが強力 | **@gsap/react 2.1.2 は 2025-01-15 公開で1年以上前のため条件外**。React 連携は自分で書く必要がある |
| @react-spring/web | 10.1.2（06-24） | 06-24 | MIT | 29.2k / 5.76M | peer `^19` 含む | 物理ベースで自然な動き | レイアウトアニメや退場アニメは Motion より手間がかかる |

**Motion の版の特定：** 13.5.1（10-02 12:10）、14.0.0（10-02 13:15）、14.1.0、14.1.1、14.2.0、14.3.0（10-15）は、いずれも公開から2週間未満。条件を満たす最新版は **13.5.0**。
- 14.0.0 は破壊的変更として明記されているが、中身は内部 API（`observeTimeline` など）の削除。公開 API しか使わなければ影響は小さいと読める。
- 13.5.1 と 14.0.0 は 2026-10-16 JST 21〜22時頃に2週間を超える。それまで待って 14 系にする選択肢もある。
- `npm view` の結果は取得方法によって 14.2.0 と 14.3.0 で食い違った（キャッシュの可能性、未確認）。固定する版は 13.5.0 で変わらない。

**GSAP のライセンス：** Webflow による無料化で、SplitText などを含め商用でも無料になった。ただし次の条件がある。
- Webflow と競合するノーコードのアニメーション作成ツールへの利用は禁止
- Webflow が規約を一方的に改定できる

ローカルの図鑑用途なら問題ないが、社内標準にするなら法務確認が必要。

**推奨は Motion 13.5.0 を固定（`"motion": "13.5.0"`）。** 次点は React Spring。

### C-4. 検索

| 候補 | 版・日付 | ライセンス | 人気度 | 判断 |
|---|---|---|---|---|
| **単純な includes** | ― | ― | ― | **推奨。** 代表は約10体（数百件に増えても十分速い）。カタカナ・ひらがなの統一、NFKC 正規化、小文字化を自分で加える方が効果が大きい |
| fuse.js | 7.5.0（07-13） | Apache-2.0 | 20.5k / 14.6M | 次点。英語表記の打ち間違いまで許したくなったら追加する |
| minisearch | 7.2.0（**2025-09-16**） | MIT | ― | **最終リリースが1年以上前のため条件外** |

### C-5. GIF → アニメーション WebP の事前変換

| 候補 | 版・日付 | 最終更新 | ライセンス | 人気度 | 長所 | 短所 |
|---|---|---|---|---|---|---|
| **sharp** | 0.35.5（09-27） | repo push 10-15 | Apache-2.0 | 32.8k / 116M週 | `sharp(gif, {animated:true}).webp({quality, effort:6, loop:0})` で一括変換できる。Node スクリプトにしやすい | Node 20.9 以上が必要。GIF 入力の動作は公式の記述が WebP 入力の例しかなく、実機での確認が必要 |
| gif2webp（libwebp に付属する CLI） | v1.6.0（**2025-07**） | repo push 10-15 | BSD-3 | 2.4k | Google 純正で画質と容量の調整が細かい | **リリースが1年以上前のため条件外**。導入はバイナリを手で入れる |

**推奨は sharp。** 開発時のみの依存（devDependency）にして、変換スクリプトで一度だけ変換すれば十分。0.2〜8MB の GIF が約50種あるので、`effort`/`quality` を調整し、キャラを選んだときに遅延読み込みする前提が必要。

### C-6. パーティクル

| 候補 | 版・日付 | 最終更新 | ライセンス | 人気度 | 長所 | 短所 |
|---|---|---|---|---|---|---|
| @tsparticles/react ＋ @tsparticles/slim | 4.4.0（08-31） | repo push 10-15 | MIT | 9.0k / 25.6万週 | 背景や発光を設定だけで作れる。peer は react >=16.8 で React 19 も可 | engine を含むとバンドルが重い。スキルのたびに一瞬出すような演出には大げさ |
| canvas-confetti | 1.9.4（2025-10-25） | 2025-10-25 | ISC | 12.8k / 8.55M | 軽量で、一回だけ弾ける演出が簡単 | **あと約9日で最終リリースから1年を超える**。紙吹雪寄りの見た目 |
| **自前 Canvas（2D）** | ― | ― | ― | ― | 依存ゼロ。スキル時の破裂、フラッシュ、星などを自由に作れる。数百粒子なら PC で十分 | 実装に半日〜1日程度 |

**推奨は自前 Canvas。** フルスクリーンの `<canvas>` を1枚用意し、`requestAnimationFrame` で動かす。次点は tsParticles（背景の常時演出に凝りたい場合）。

### C-7. 推奨構成のまとめ
- React 19.3.0（09-09）。19.3.1 は 10-14 公開で2週間未満だが、変更は Server Components の通信部分のみで、Vite のクライアント側アプリには影響しない。
- Motion 13.5.0（表示・トランジション・ドラッグ・画面揺れ）
- includes ＋文字の正規化
- 自前 Canvas
- sharp 0.35.5（開発時のみ）
- 新しく増える実行時の依存は Motion だけ。

### C-8. 未解決・リードへの相談事項
1. **Motion の版：** 13.5.0 で固定するか、2週間を超えた 14.0.0 以降を待つか。（決定：13.5.0 で固定）
2. **3D をどこまでやるか：** (a) R3F を背景だけで併用するかは、見栄えの要求次第。（決定：使わない）
3. **素材の権利：** Wiki の GIF やキャラ画像の著作権は Devsisters にある。ローカル実行に限るとしても、取得元の利用規約を確認するよう前提に明記したい。
4. **データの扱い：** PII は扱っていない。
5. **未確認：** 360° ビューアのライブラリ（不採用のため省略）。sharp で GIF を入力したときの実際の挙動は、実装時に1ファイルで確かめる必要がある。
6. 追加の動作素材調査で見た npm の最新版：motion 14.3.0（または 14.2.0）、pixi.js 8.22.0（MIT）。公開日は未確認で、今回は採用しない。

### C-9. 出典
- npm レジストリ（`npm view` の実行結果）：https://www.npmjs.com/package/motion 、/@react-three/fiber 、/@react-three/drei 、/three 、/react 、/gsap 、/@gsap/react 、/@react-spring/web 、/@use-gesture/react 、/fuse.js 、/minisearch 、/sharp 、/@tsparticles/react 、/canvas-confetti
- npm downloads API：https://api.npmjs.org/downloads/point/last-week/
- Motion CHANGELOG：https://github.com/motiondivision/motion/blob/main/CHANGELOG.md
- React リリース：https://github.com/facebook/react/releases
- GSAP Standard License：https://gsap.com/standard-license
- GSAP 無料化の発表：https://webflow.com/blog/gsap-becomes-free
- sharp 出力オプション（WebP）：https://sharp.pixelplumbing.com/api-output/#webp
- libwebp タグ：https://github.com/webmproject/libwebp/tags
- GitHub リポジトリ（stars と最終 push）：https://github.com/pmndrs/react-three-fiber 、https://github.com/pmndrs/drei 、https://github.com/pmndrs/use-gesture 、https://github.com/greensock/GSAP 、https://github.com/pmndrs/react-spring 、https://github.com/krisk/Fuse 、https://github.com/lovell/sharp 、https://github.com/tsparticles/tsparticles 、https://github.com/catdad/canvas-confetti
- npm: motion latest（https://registry.npmjs.org/motion/latest）、pixi.js latest（https://registry.npmjs.org/pixi.js/latest）

---

## 補足: Claude Motion（宣伝動画の作り方）について

宣伝ページ `/promo` の冒頭に差し込む動画を、claude.ai の「Claude Motion」で作る案がある。

- 検索で見つかった報道（二次情報）によると、Anthropic は **2026年10月8日** に Claude Motion をベータ版として公開した。テキストやグラフを短いアニメーション動画にして MP4 で書き出せる機能で、動画生成モデルではなく、コードでアニメーションを定義する方式とされている。
- **確認できたのは報道記事だけで、Anthropic の公式発表は見つけられていない（未確認）。**
- 対象プランは記事によって食い違っている。Team と Enterprise が対象で Enterprise では既定でオフ（管理者が有効にする）とする記事と、全プランでベータ提供とする記事がある。社内アカウントで使えるかは情報システム部門に確認が必要。
- Claude Motion は claude.ai 側の機能で、Claude Code から直接は使えない。そのため、このプロジェクトでは `public/promo/hero.mp4` を差し込む枠と、動画がないときの代替表示までを作る。動画は本人が claude.ai で作る。絵コンテとプロンプト案は `docs/PROMO_VIDEO.md` に置く予定。
- 出典（いずれも二次情報）:
  - [Anthropic launches Claude Dashboards and Claude Motion in beta](https://pasqualepillitteri.it/en/news/21703/anthropic-launches-claude-dashboards-motion-beta)
  - [Claude Motion: what Anthropic's animation tool does in 2026](https://eesel.ai/blog/claude-motion)
  - [claude dashboards motion launch beta](https://emergent.sh/news/claude-dashboards-motion-launch-beta-all)
