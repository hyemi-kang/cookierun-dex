/** 画像の代わりに出すジンジャーブレッド型のシルエット */
export function CookieSilhouette({
  tint,
  className = "",
  testId,
}: {
  tint: string;
  className?: string;
  testId?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 120"
      aria-hidden="true"
      data-testid={testId}
      className={className}
      fill={tint}
      opacity="0.85"
    >
      <circle cx="50" cy="24" r="18" />
      <rect x="30" y="44" width="40" height="42" rx="14" />
      <rect x="6" y="48" width="32" height="13" rx="6.5" />
      <rect x="62" y="48" width="32" height="13" rx="6.5" />
      <rect x="32" y="78" width="15" height="34" rx="7" />
      <rect x="53" y="78" width="15" height="34" rx="7" />
    </svg>
  );
}
