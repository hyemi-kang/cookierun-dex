import { useState } from "react";
import type { Character } from "../../types/character";
import { gradeStyle } from "./constants";

export function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="search"
      aria-label="クッキーを検索"
      placeholder="🔍 クッキーを検索"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-11 w-full rounded-md border border-border bg-surface-2 px-3 text-base text-text placeholder:text-text-muted"
    />
  );
}

function FilterChip({
  testId,
  label,
  pressed,
  color,
  onClick,
}: {
  testId: string;
  label: string;
  pressed: boolean;
  color?: string;
  onClick: () => void;
}) {
  // 見た目は 36px、当たり判定は 44px
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={pressed}
      onClick={onClick}
      className="inline-flex min-h-11 cursor-pointer items-center"
    >
      <span
        className={`inline-flex h-9 items-center gap-1.5 rounded-sm border px-3 text-sm font-bold transition-transform duration-120 ease-out ${
          pressed
            ? "border-accent bg-accent text-on-primary"
            : "border-border bg-surface-2 text-text"
        }`}
      >
        {color && (
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full"
            style={{ background: color }}
          />
        )}
        {label}
      </span>
    </button>
  );
}

export function FilterBar({
  grades,
  roles,
  selectedGrades,
  selectedRoles,
  onToggleGrade,
  onToggleRole,
}: {
  grades: string[];
  /** 空なら役割フィルタを出さない（AC-42） */
  roles: string[];
  selectedGrades: ReadonlySet<string>;
  selectedRoles: ReadonlySet<string>;
  onToggleGrade: (g: string) => void;
  onToggleRole: (r: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <fieldset
        aria-label="等級で絞り込み"
        className="m-0 min-w-0 border-0 p-0 flex flex-wrap items-center gap-x-1"
      >
        <span className="mr-1 text-sm text-text-muted">等級</span>
        {grades.map((g) => (
          <FilterChip
            key={g}
            testId={`filter-grade-${g}`}
            label={g}
            color={gradeStyle(g).badge}
            pressed={selectedGrades.has(g)}
            onClick={() => onToggleGrade(g)}
          />
        ))}
      </fieldset>
      {roles.length > 0 && (
        <fieldset
          aria-label="役割で絞り込み"
          className="m-0 min-w-0 border-0 p-0 flex flex-wrap items-center gap-x-1"
        >
          <span className="mr-1 text-sm text-text-muted">役割</span>
          {roles.map((r) => (
            <FilterChip
              key={r}
              testId={`filter-role-${r}`}
              label={r}
              pressed={selectedRoles.has(r)}
              onClick={() => onToggleRole(r)}
            />
          ))}
        </fieldset>
      )}
    </div>
  );
}

function CharacterThumb({
  character,
  selected,
  onSelect,
}: {
  character: Character;
  selected: boolean;
  onSelect: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const style = gradeStyle(character.rarity);
  const src = character.images.thumbnail ?? character.images.illustration;
  return (
    <li className="list-none max-[1279px]:w-[76px] max-[1279px]:shrink-0">
      <button
        type="button"
        data-testid={`thumb-${character.id}`}
        data-shortcuts="arrows"
        aria-current={selected ? "true" : undefined}
        onClick={onSelect}
        className={`flex aspect-square w-full cursor-pointer flex-col items-center overflow-hidden rounded-md border-[3px] bg-surface p-1 transition-transform duration-120 ease-out hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${
          selected ? "" : "border-transparent"
        }`}
        style={
          selected
            ? { borderColor: style.badge, boxShadow: `0 0 32px ${style.badge}73` }
            : undefined
        }
      >
        <span className="relative flex min-h-0 w-full flex-1 items-center justify-center">
          {failed ? (
            <span
              data-testid="initial-placeholder"
              aria-hidden="true"
              className="flex size-full items-center justify-center rounded-sm text-2xl font-bold text-on-primary"
              style={{ background: style.badge }}
            >
              {[...character.names.ja][0]}
            </span>
          ) : (
            <img
              src={src}
              alt=""
              loading="lazy"
              onError={() => setFailed(true)}
              className="max-h-full max-w-full object-contain"
            />
          )}
        </span>
        <span className="w-full truncate text-center text-xs font-bold text-text">
          {character.names.ja}
        </span>
      </button>
    </li>
  );
}

export function CharacterGrid({
  items,
  selectedId,
  onSelect,
  onClear,
}: {
  items: Character[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  if (items.length === 0) {
    return (
      <div
        data-testid="empty-state"
        className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-6 text-center"
      >
        <p className="font-bold">該当するクッキーが見つかりません</p>
        <p className="text-sm text-text-muted">検索語や絞り込みを変えてみてください。</p>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex min-h-11 cursor-pointer items-center rounded-md bg-primary px-4 text-sm font-bold text-on-primary"
        >
          条件をクリア
        </button>
      </div>
    );
  }
  return (
    <ul
      aria-label="クッキー一覧"
      className="m-0 flex gap-2 overflow-x-auto p-1 min-[1280px]:grid min-[1280px]:grid-cols-[repeat(auto-fill,minmax(88px,1fr))] min-[1280px]:overflow-x-visible"
    >
      {items.map((c) => (
        <CharacterThumb
          key={c.id}
          character={c}
          selected={c.id === selectedId}
          onSelect={() => onSelect(c.id)}
        />
      ))}
    </ul>
  );
}
