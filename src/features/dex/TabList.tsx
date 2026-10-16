import { motion } from "motion/react";
import { useRef } from "react";
import { SPRING } from "./constants";

export interface TabItem<T extends string> {
  id: T;
  label: string;
}

interface Props<T extends string> {
  tabs: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  /** 下線の layoutId（画面内で一意） */
  layoutId: string;
  /** タブ要素の id 接頭辞。`${idPrefix}-${id}` */
  idPrefix: string;
  /** aria-controls に使う tabpanel の id */
  panelId: string;
  reduced: boolean;
  variant?: "pill" | "underline";
}

/** role=tablist。矢印キー・Home/End で移動（自動で選択）。 */
export function TabList<T extends string>({
  tabs,
  value,
  onChange,
  label,
  layoutId,
  idPrefix,
  panelId,
  reduced,
  variant = "underline",
}: Props<T>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const move = (index: number) => {
    const next = tabs[(index + tabs.length) % tabs.length];
    onChange(next.id);
    refs.current[next.id]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={variant === "pill" ? "flex gap-1 rounded-full bg-surface-2 p-1" : "flex gap-1"}
    >
      {tabs.map((t, i) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-${t.id}`}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") move(i + 1);
              else if (e.key === "ArrowLeft") move(i - 1);
              else if (e.key === "Home") move(0);
              else if (e.key === "End") move(tabs.length - 1);
              else return;
              e.preventDefault();
            }}
            className={`relative min-h-11 min-w-11 cursor-pointer px-4 text-sm font-bold ${
              variant === "pill" ? "rounded-full" : ""
            } ${selected ? "text-text" : "text-text-muted"}`}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                aria-hidden="true"
                transition={reduced ? { duration: 0 } : SPRING.snappy}
                className={
                  variant === "pill"
                    ? "absolute inset-0 -z-0 rounded-full bg-primary/30 ring-2 ring-primary"
                    : "absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-primary"
                }
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
