import { Link, useRoute } from "./router";

// 土台のみ。図鑑(/)は画面担当A、/promo は画面担当Bが features/ 以下に実装して差し替える。
export function App() {
  const { route, navigate } = useRoute();

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link to="/" navigate={navigate} className="font-display text-xl font-bold">
          COOKIE DEX
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link to="/" navigate={navigate}>
            図鑑
          </Link>
          <Link to="/promo" navigate={navigate}>
            宣伝ページ →
          </Link>
        </nav>
      </header>
      <main className="flex-1 p-6">
        {route === "/" && <p data-testid="page-dex">図鑑（実装予定）</p>}
        {route === "/promo" && <p data-testid="page-promo">宣伝ページ（実装予定）</p>}
        {route === "notfound" && (
          <div data-testid="page-notfound">
            <p>ページが見つかりません</p>
            <Link to="/" navigate={navigate} className="text-accent underline">
              図鑑へ戻る
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
