import { useEffect, useState } from "react";
import type { GameTitle } from "../../types/character";

export type DexView = "card" | "stage";

interface UrlState {
  game: GameTitle;
  selectedId: string | null;
  view: DexView;
}

function parse(): UrlState {
  const p = new URLSearchParams(window.location.search);
  const game = p.get("game") === "ovenbreak" ? "ovenbreak" : "kingdom";
  const view = p.get("view") === "stage" ? "stage" : "card";
  return { game, selectedId: p.get("c") || null, view };
}

function toSearch(s: UrlState): string {
  const p = new URLSearchParams();
  p.set("game", s.game);
  if (s.selectedId) p.set("c", s.selectedId);
  p.set("view", s.view);
  return `?${p.toString()}`;
}

/**
 * `?game=&c=&view=` と状態を同期する（docs/詳細設計書.md 3章）。
 * ゲーム切替は pushState、それ以外（キャラ・表示）は replaceState。
 */
export function useDexUrl() {
  const [state, setState] = useState<UrlState>(parse);

  useEffect(() => {
    const onPop = () => setState(parse());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (window.location.pathname !== "/") return;
    const next = toSearch(state);
    if (next === window.location.search) return;
    const gameChanged = parse().game !== state.game;
    const url = `${window.location.pathname}${next}`;
    if (gameChanged) window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  }, [state]);

  return {
    game: state.game,
    selectedId: state.selectedId,
    view: state.view,
    setGame: (game: GameTitle) => setState((s) => ({ ...s, game, selectedId: null })),
    setSelectedId: (selectedId: string | null) =>
      setState((s) => (s.selectedId === selectedId ? s : { ...s, selectedId })),
    setView: (view: DexView) => setState((s) => (s.view === view ? s : { ...s, view })),
  };
}
