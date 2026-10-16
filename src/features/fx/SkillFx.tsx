export interface SkillFxProps {
  /** 連番。値が変わるたびに演出を1回再生する（連打時は最初からやり直し） */
  trigger: number;
  skillName: string;
  /** 等級のテーマ色 (#RRGGBB) */
  color: string;
  /** 動きを減らす設定。true のときはスキル名の表示だけ */
  reduced: boolean;
}

// TODO(画面担当B): フラッシュ・揺れ・粒子(Canvas)・カットインを実装する。docs/詳細設計書.md 7章
export function SkillFx(_props: SkillFxProps) {
  return null;
}
