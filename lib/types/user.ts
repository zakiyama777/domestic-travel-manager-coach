export interface UserProfile {
  id: string;
  /** 呼ばれたい名前（ニックネーム可） */
  displayName: string;
  /** 試験日（ISO文字列） */
  examDate: string;
  /** 1日の学習目標: 分 */
  dailyGoalMinutes: number;
  /** 1日の学習目標: 問題数 */
  dailyGoalQuestions: number;
  /** オンボーディング完了フラグ */
  onboarded: boolean;
  createdAt: string;
}

export interface OnboardingInput {
  displayName: string;
  examDate: string;
  dailyGoalMinutes: number;
  dailyGoalQuestions: number;
}
