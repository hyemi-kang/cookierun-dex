import { gradeStyle } from "./constants";

/** 色だけで区別しないよう、等級名を必ず文字で入れる */
export function GradeBadge({ grade, className = "" }: { grade: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${className}`}
      style={{ background: gradeStyle(grade).badge, color: "#1A1210" }}
    >
      {grade}
    </span>
  );
}
