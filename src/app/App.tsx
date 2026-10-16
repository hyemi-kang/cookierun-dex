import { DexPage } from "../features/dex/DexPage";
import { PromoPage } from "../features/promo/PromoPage";
import { Link, useRoute } from "./router";

export function App() {
  const { route, navigate } = useRoute();

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
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
      <main className="min-h-0 flex-1">
        {route === "/" && <DexPage navigate={navigate} />}
        {route === "/promo" && <PromoPage navigate={navigate} />}
        {route === "notfound" && (
          <div data-testid="page-notfound" className="p-6">
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
