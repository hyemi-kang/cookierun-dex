import { motion } from "motion/react";
import { useState } from "react";
import type { Character } from "../../types/character";
import { POSITION_LABEL } from "./constants";
import { GradeBadge } from "./GradeBadge";
import { TabList } from "./TabList";

type DetailTab = "overview" | "skill" | "appearance";
const TABS = [
  { id: "overview", label: "概要" },
  { id: "skill", label: "スキル" },
  { id: "appearance", label: "登場" },
] as const;

const UNKNOWN = <span className="text-text-muted">不明</span>;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2">
      <dt className="w-24 shrink-0 text-sm text-text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 text-base">{children ?? UNKNOWN}</dd>
    </div>
  );
}

export function DetailPanel({
  character,
  reduced,
}: {
  character: Character | null;
  reduced: boolean;
}) {
  const [tab, setTab] = useState<DetailTab>("overview");

  if (!character) {
    return (
      <aside
        aria-label="キャラの説明"
        data-testid="detail-no-selection"
        className="rounded-lg border border-border bg-surface/80 p-6 text-text-muted backdrop-blur-lg"
      >
        キャラを選んでください
      </aside>
    );
  }

  const c = character;
  return (
    <aside
      aria-label="キャラの説明"
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface/80 p-5 backdrop-blur-lg"
    >
      <header className="flex flex-col gap-1">
        <h2 data-testid="detail-name" className="font-display text-2xl font-bold leading-8">
          {c.names.ja}
        </h2>
        {c.names.ko && (
          <p lang="ko" className="text-base text-text-muted">
            {c.names.ko}
          </p>
        )}
        <p lang="en" className="text-base text-text-muted">
          {c.names.en}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
          <GradeBadge grade={c.rarity} />
          {c.role && <span>{c.role}</span>}
          {c.position && <span>{POSITION_LABEL[c.position]}</span>}
        </p>
      </header>

      <TabList
        tabs={TABS}
        value={tab}
        onChange={setTab}
        label="説明の切替"
        layoutId="detail-tab-underline"
        idPrefix="detail-tab"
        panelId="detail-panel"
        reduced={reduced}
      />

      <motion.div
        key={`${c.id}-${tab}`}
        role="tabpanel"
        id="detail-panel"
        aria-labelledby={`detail-tab-${tab}`}
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="min-h-40"
      >
        {tab === "overview" && (
          <div className="flex flex-col gap-3">
            <p className="text-base">{c.summary || UNKNOWN}</p>
            <dl className="divide-y divide-border/50">
              <Row label="等級">{c.rarity}</Row>
              <Row label="ポジション">{c.position ? POSITION_LABEL[c.position] : undefined}</Row>
              <Row label="役割">{c.role}</Row>
            </dl>
          </div>
        )}
        {tab === "skill" && (
          <div className="flex flex-col gap-2">
            {c.skill ? (
              <>
                <h3 className="text-lg font-bold">{c.skill.name}</h3>
                <p className="text-base">{c.skill.summary}</p>
              </>
            ) : (
              <p className="text-text-muted">スキル情報なし</p>
            )}
          </div>
        )}
        {tab === "appearance" && (
          <dl className="divide-y divide-border/50">
            <Row label="初登場">{c.firstAppearance}</Row>
            <Row label="実装日">{c.releaseDate}</Row>
          </dl>
        )}
      </motion.div>

      <footer className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
        <a
          data-testid="source-link"
          href={c.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center text-accent underline"
        >
          出典: cookierun.wiki ↗<span className="sr-only">（新しいタブ）</span>
        </a>
        <p data-testid="credit" className="text-text-muted">
          {c.imageCredit} ／{" "}
          <a
            href={c.license.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline"
          >
            {c.license.text}
            <span className="sr-only">（新しいタブ）</span>
          </a>
        </p>
      </footer>
    </aside>
  );
}
