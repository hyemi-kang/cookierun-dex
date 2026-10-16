import { useCallback, useState } from "react";
import timeline from "../../data/timeline.json";
import { useReducedMotion } from "../../lib/useMotionPreference";
import type { TimelineItem } from "../../types/timeline";
import { AccentContext, CursorFollower, ScrollProgress } from "./chrome";
import { FeatureFan } from "./FeatureFan";
import { Finale } from "./Finale";
import { Intro } from "./Intro";
import { Marquee } from "./Marquee";
import { PromoHero } from "./PromoHero";
import { Showcase } from "./Showcase";
import { Stats } from "./Stats";
import { TimelineSection } from "./TimelineSection";
import "./promo.css";

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

/** 冒頭の演出は、最初の1回だけ（同じ読み込みの中で再訪しても再生しない） */
let introPlayed = false;

export function PromoPage({ navigate }: { navigate: (to: string) => void }) {
  const reduced = useReducedMotion();
  const [introPlaying, setIntroPlaying] = useState(() => !reduced && !introPlayed);
  const [accent, setAccent] = useState("#FF8A3D");
  const done = useCallback(() => {
    introPlayed = true;
    setIntroPlaying(false);
  }, []);
  const setAccentStable = useCallback((a: string) => setAccent(a), []);

  return (
    <AccentContext.Provider value={setAccentStable}>
      <div
        data-testid="page-promo"
        className="promo-root"
        style={{ ["--promo-accent" as string]: accent }}
      >
        {!reduced && <ScrollProgress />}
        <CursorFollower reduced={reduced} />
        <Intro playing={introPlaying} onDone={done} />
        <PromoHero reduced={reduced} ready={!introPlaying} />
        <TimelineSection items={ITEMS} reduced={reduced} />
        <Showcase reduced={reduced} />
        <FeatureFan reduced={reduced} navigate={navigate} />
        <Marquee reduced={reduced} navigate={navigate} />
        <Stats reduced={reduced} />
        <Finale reduced={reduced} navigate={navigate} />
        <footer className="border-t border-border bg-bg px-4 py-8 text-center text-sm text-text-muted">
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
    </AccentContext.Provider>
  );
}
