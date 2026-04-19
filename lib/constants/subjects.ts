/**
 * 国内旅行業務取扱管理者 科目マスタ
 * - 将来Firestoreへ移しても型は変わらないよう、値オブジェクト化
 */
export const SUBJECTS = {
  law: {
    id: 'law',
    name: '旅行業法令',
    shortName: '法令',
    colorVar: 'subject-law',
    description: '登録制度・営業保証金・旅程管理等',
  },
  terms: {
    id: 'terms',
    name: '約款',
    shortName: '約款',
    colorVar: 'subject-terms',
    description: '標準旅行業約款・運送約款・宿泊約款',
  },
  practice: {
    id: 'practice',
    name: '国内旅行実務',
    shortName: '実務',
    colorVar: 'subject-practice',
    description: 'JR運賃・地理・国内観光資源',
  },
} as const;

export type SubjectId = keyof typeof SUBJECTS;
export const SUBJECT_IDS: SubjectId[] = ['law', 'terms', 'practice'];
