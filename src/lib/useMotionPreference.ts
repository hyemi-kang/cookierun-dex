import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** OS の「視差効果を減らす」設定。true のとき慣性・揺れ・粒子などを止める/弱める。 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia?.(QUERY).matches ?? false);

  useEffect(() => {
    const mq = window.matchMedia?.(QUERY);
    if (!mq) return;
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
