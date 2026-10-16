import { useRef, useState } from "react";
import type { Character } from "../../types/character";
import { useVisible } from "./hooks";
import { CHARS, charUrl, gradeColor } from "./util";

function Thumb({
  cookie,
  navigate,
  decoy,
}: {
  cookie: Character;
  navigate: (to: string) => void;
  decoy: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const color = gradeColor(cookie.rarity);
  return (
    <a
      href={charUrl(cookie)}
      tabIndex={decoy ? -1 : 0}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(charUrl(cookie));
      }}
      className="promo-thumb mx-2 flex w-[148px] shrink-0 flex-col items-center gap-2 rounded-xl p-2"
    >
      <span
        className="relative block h-[112px] w-[112px] overflow-hidden rounded-xl border-2 bg-surface"
        style={{ borderColor: color, boxShadow: `0 0 20px ${color}55` }}
      >
        {failed || !cookie.images.thumbnail ? (
          <span
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center font-display text-4xl font-bold"
            style={{ color }}
          >
            {cookie.names.ja.slice(0, 1)}
          </span>
        ) : (
          <img
            src={cookie.images.thumbnail}
            alt=""
            draggable={false}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
      </span>
      <span className="w-full truncate text-center text-sm font-bold">{cookie.names.ja}</span>
    </a>
  );
}

function Row({
  list,
  dir,
  navigate,
  running,
  label,
}: {
  list: Character[];
  dir: "l" | "r";
  navigate: (to: string) => void;
  running: boolean;
  label: string;
}) {
  // 半分の幅が画面より広くなるよう繰り返す
  const reps = Math.max(1, Math.ceil(2400 / (Math.max(1, list.length) * 164)));
  const half = Array.from({ length: reps }, () => list).flat();
  return (
    <div
      className="promo-marquee-row overflow-hidden py-2"
      data-running={running ? "true" : "false"}
      style={{
        maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <ul className="promo-marquee-track m-0 list-none p-0" data-dir={dir} aria-label={label}>
        {half.map((c, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 繰り返し表示
          <li key={`a-${c.id}-${i}`}>
            <Thumb cookie={c} navigate={navigate} decoy={i >= list.length} />
          </li>
        ))}
        {half.map((c, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 繰り返し表示
          <li key={`b-${c.id}-${i}`} aria-hidden="true">
            <Thumb cookie={c} navigate={navigate} decoy />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** キャラ紹介の帯。2段を逆方向に流す。ホバー/フォーカスで止まる。動きを減らす設定では静的な一覧。 */
export function Marquee({
  reduced,
  navigate,
}: {
  reduced: boolean;
  navigate: (to: string) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const visible = useVisible(ref);
  if (CHARS.length === 0) return null;
  const rev = [...CHARS].reverse();
  return (
    <section
      ref={ref}
      aria-label="キャラクター一覧"
      className="flex flex-col gap-4 overflow-hidden py-14"
      style={{ background: "linear-gradient(to bottom, #1a1210, #2a1226 50%, #1a1210)" }}
    >
      <h3 className="px-4 text-center font-display text-2xl font-bold">
        全員集合 <span className="text-base font-normal text-text-muted">クリックで図鑑へ</span>
      </h3>
      {reduced ? (
        <ul className="m-0 flex list-none flex-wrap justify-center gap-2 p-0 px-4">
          {CHARS.map((c) => (
            <li key={c.id}>
              <Thumb cookie={c} navigate={navigate} decoy={false} />
            </li>
          ))}
        </ul>
      ) : (
        <>
          <Row
            list={CHARS}
            dir="l"
            navigate={navigate}
            running={visible}
            label="キャラクター（上段）"
          />
          <Row
            list={rev}
            dir="r"
            navigate={navigate}
            running={visible}
            label="キャラクター（下段）"
          />
        </>
      )}
    </section>
  );
}
