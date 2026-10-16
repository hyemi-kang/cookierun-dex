import { useReducedMotion } from "motion/react";
import timeline from "../../data/timeline.json";
import type { TimelineItem } from "../../types/timeline";
import { CtaSection } from "./CtaSection";
import { PromoHero } from "./PromoHero";
import { TimelineSection } from "./TimelineSection";

/** データが空・不完全でも壊れないよう、必須項目が揃った要素だけを使う。 */
function sanitize(raw: unknown): TimelineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (x): x is TimelineItem =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as TimelineItem).year === "number" &&
        typeof (x as TimelineItem).title === "string" &&
        typeof (x as TimelineItem).summary === "string",
    )
    .map((x) => ({ ...x, sourceUrl: typeof x.sourceUrl === "string" ? x.sourceUrl : "" }));
}

const ITEMS = sanitize(timeline);

export function PromoPage({ navigate }: { navigate: (to: string) => void }) {
  const reduced = useReducedMotion() ?? false;

  return (
    <div data-testid="page-promo">
      <PromoHero reduced={reduced} />
      <TimelineSection items={ITEMS} reduced={reduced} />
      <CtaSection navigate={navigate} reduced={reduced} />
      <footer className="border-t border-border px-4 py-8 text-center text-sm text-text-muted">
        <p>© Devsisters. 本ページは個人利用の非公開・非商用の図鑑です。</p>
        <p>
          出典:{" "}
          <a
            href="https://cookierun.wiki/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-accent underline"
          >
            cookierun.wiki
            <span className="sr-only">（新しいタブ）</span>
          </a>{" "}
          （CC BY-SA 4.0）
        </p>
      </footer>
    </div>
  );
}
