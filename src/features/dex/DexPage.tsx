import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { filterCharacters } from "../../lib/search";
import { useGlobalShortcuts } from "../../lib/useGlobalShortcuts";
import { useReducedMotion } from "../../lib/useMotionPreference";
import type { GameTitle } from "../../types/character";
import { CharacterGrid, FilterBar, SearchBox } from "./CharacterList";
import {
  compareGrade,
  FX_DURATION_MS,
  FX_DURATION_REDUCED_MS,
  GAME_LABEL,
  TOAST_MS,
} from "./constants";
import { DetailPanel } from "./DetailPanel";
import { characters } from "./data";
import { Stage } from "./Stage";
import { TabList } from "./TabList";
import { useDexUrl } from "./useDexUrl";
import "./dex.css";

const GAME_TABS = [
  { id: "kingdom", label: GAME_LABEL.kingdom },
  { id: "ovenbreak", label: GAME_LABEL.ovenbreak },
] as const;

const EMPTY: ReadonlySet<string> = new Set();

function toggled(set: ReadonlySet<string>, v: string): ReadonlySet<string> {
  const n = new Set(set);
  if (n.has(v)) n.delete(v);
  else n.add(v);
  return n;
}

// 画面 `/`: 左に一覧、中央にステージ、右に説明（docs/UI.md 2.2）
export function DexPage({ navigate: _navigate }: { navigate: (to: string) => void }) {
  const reduced = useReducedMotion();
  const { game, selectedId, view, setGame, setSelectedId, setView } = useDexUrl();

  const [query, setQuery] = useState("");
  const [grades, setGrades] = useState<ReadonlySet<string>>(EMPTY);
  const [roles, setRoles] = useState<ReadonlySet<string>>(EMPTY);
  const [skillTrigger, setSkillTrigger] = useState(0);
  const [skillBusy, setSkillBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const gameChars = useMemo(() => characters.filter((c) => c.title === game), [game]);
  const gradeOptions = useMemo(
    () => [...new Set(gameChars.map((c) => c.rarity))].sort(compareGrade),
    [gameChars],
  );
  // データに role がなければ役割フィルタは出さない（AC-42）
  const roleOptions = useMemo(
    () => [...new Set(gameChars.flatMap((c) => (c.role ? [c.role] : [])))],
    [gameChars],
  );

  const visible = useMemo(
    () => filterCharacters(characters, { game, query, grades, roles }),
    [game, query, grades, roles],
  );
  const selected = visible.find((c) => c.id === selectedId) ?? visible[0] ?? null;
  const index = selected ? visible.indexOf(selected) : -1;

  // 選択中が一覧から消えたら先頭を選ぶ。0件なら未選択（AC-41）
  useEffect(() => {
    setSelectedId(selected?.id ?? null);
  }, [selected, setSelectedId]);

  const clearFilters = () => {
    setQuery("");
    setGrades(EMPTY);
    setRoles(EMPTY);
  };

  const changeGame = (g: GameTitle) => {
    if (g === game) return;
    setGrades(EMPTY);
    setRoles(EMPTY);
    setGame(g);
  };

  const step = useCallback(
    (d: number) => {
      if (visible.length === 0) return;
      const i = index < 0 ? 0 : (index + d + visible.length) % visible.length; // 端で循環（AC-44）
      setSelectedId(visible[i].id);
    },
    [visible, index, setSelectedId],
  );

  const fxTimer = useRef<number | undefined>(undefined);
  const busyRef = useRef(false);
  const fireSkill = useCallback(() => {
    if (!selected || busyRef.current) return;
    busyRef.current = true;
    setSkillBusy(true);
    setSkillTrigger((t) => t + 1);
    setAnnouncement(`スキル: ${selected.skill?.name ?? "スキル"}`);
    window.clearTimeout(fxTimer.current);
    fxTimer.current = window.setTimeout(
      () => {
        busyRef.current = false;
        setSkillBusy(false);
      },
      reduced ? FX_DURATION_REDUCED_MS : FX_DURATION_MS,
    );
  }, [selected, reduced]);
  useEffect(() => () => window.clearTimeout(fxTimer.current), []);

  useGlobalShortcuts({
    onPrev: () => step(-1),
    onNext: () => step(1),
    onSkill: fireSkill,
  });

  const toastTimer = useRef<number | undefined>(undefined);
  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), TOAST_MS);
  }, []);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  // スクリーンリーダー向けの通知
  const selectedKey = selected?.id;
  useEffect(() => {
    if (selected && selectedKey) {
      setAnnouncement(`${selected.names.ja}（${index + 1}/${visible.length}）を表示中`);
    }
  }, [selected, selectedKey, index, visible.length]);

  return (
    <div
      data-testid="page-dex"
      className="h-full overflow-y-auto p-4 min-[1280px]:grid min-[1280px]:grid-cols-[320px_minmax(0,1fr)_380px] min-[1280px]:gap-4 min-[1280px]:overflow-hidden min-[1280px]:p-6 min-[1536px]:grid-cols-[340px_minmax(0,1fr)_420px] min-[1536px]:gap-6 min-[1536px]:px-8"
    >
      <section
        aria-label="クッキー一覧"
        className="flex min-h-0 flex-col gap-3 pb-4 min-[1280px]:overflow-y-auto min-[1280px]:pb-0"
      >
        <TabList
          tabs={GAME_TABS}
          value={game}
          onChange={changeGame}
          label="ゲームの切替"
          layoutId="game-tab-underline"
          idPrefix="game-tab"
          panelId="dex-list"
          reduced={reduced}
          variant="pill"
        />
        <div
          id="dex-list"
          role="tabpanel"
          aria-labelledby={`game-tab-${game}`}
          className="flex flex-col gap-3"
        >
          <SearchBox value={query} onChange={setQuery} />
          <FilterBar
            grades={gradeOptions}
            roles={roleOptions}
            selectedGrades={grades}
            selectedRoles={roles}
            onToggleGrade={(g) => setGrades((s) => toggled(s, g))}
            onToggleRole={(r) => setRoles((s) => toggled(s, r))}
          />
          <p
            data-testid="result-count"
            aria-live="polite"
            className="font-display text-sm tabular-nums text-text-muted"
          >
            該当 {visible.length}件
          </p>
          <CharacterGrid
            items={visible}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
            onClear={clearFilters}
          />
        </div>
      </section>

      <div className="min-h-0 pb-4 min-[1280px]:pb-0">
        <Stage
          character={selected}
          view={view}
          onViewChange={setView}
          index={index}
          total={visible.length}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onSkill={fireSkill}
          skillBusy={skillBusy}
          skillTrigger={skillTrigger}
          reduced={reduced}
          onToast={showToast}
        />
      </div>

      <div className="min-h-0 min-[1280px]:overflow-y-auto">
        <DetailPanel character={selected} reduced={reduced} />
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {toast && (
        <div
          data-testid="toast"
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md border border-danger bg-surface px-4 py-3 text-sm font-bold text-text shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
