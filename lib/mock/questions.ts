import type { BinaryQuestion, QuadQuestion } from '@/lib/types/question';

/** 実試験のテイストを踏襲したダミー問題。文体と難易度感も本試験寄せ。 */

export const MOCK_BINARY_QUESTIONS: BinaryQuestion[] = [
  {
    id: 'b-001',
    format: 'binary',
    subject: 'law',
    topic: '登録業務範囲',
    statement:
      '第3種旅行業者は、営業所のある市町村に隣接する市町村内で実施する募集型企画旅行を催行することができる。',
    answer: true,
    explanation:
      '第3種旅行業者は、拠点区域内（営業所所在市町村および隣接市町村等）であれば、募集型企画旅行を実施できます。',
    difficulty: 2,
  },
  {
    id: 'b-002',
    format: 'binary',
    subject: 'law',
    topic: '営業保証金',
    statement:
      '旅行業者は、営業保証金を主たる営業所の最寄りの供託所に供託しなければならない。',
    answer: true,
    explanation:
      '旅行業法第7条に定められた供託義務です。主たる営業所の最寄りの供託所に供託します。',
    difficulty: 1,
  },
  {
    id: 'b-003',
    format: 'binary',
    subject: 'terms',
    topic: '標準旅行業約款',
    statement:
      '募集型企画旅行契約において、契約締結後に旅行者が契約を解除する場合、いかなる場合も取消料は発生しない。',
    answer: false,
    explanation:
      '旅行開始日から起算して定められた日数内に解除すると、区分ごとに定められた取消料が発生します。',
    difficulty: 1,
  },
  {
    id: 'b-004',
    format: 'binary',
    subject: 'terms',
    topic: '旅程保証',
    statement:
      '旅程保証は、旅行業者の故意又は過失の有無にかかわらず、契約内容の重要な変更があった場合に変更補償金を支払う制度である。',
    answer: true,
    explanation:
      '旅程保証は無過失責任型の補償制度です。一方、損害賠償は過失責任となります。',
    difficulty: 2,
  },
  {
    id: 'b-005',
    format: 'binary',
    subject: 'practice',
    topic: 'JR運賃',
    statement:
      '営業キロが片道601キロメートル以上の普通乗車券は、往復割引（1割引）が適用される。',
    answer: true,
    explanation:
      '片道601キロ以上のとき往復割引10%（端数切捨）が適用されます。',
    difficulty: 2,
  },
  {
    id: 'b-006',
    format: 'binary',
    subject: 'practice',
    topic: '国内観光資源',
    statement: '「三保の松原」は富士山構成資産として静岡県に所在する。',
    answer: true,
    explanation:
      '三保の松原は静岡市清水区にあり、2013年に富士山の構成資産として世界文化遺産に登録されました。',
    difficulty: 1,
  },
  {
    id: 'b-007',
    format: 'binary',
    subject: 'law',
    topic: '旅程管理主任者',
    statement:
      '旅程管理主任者の資格を取得するには、旅程管理業務を2回以上かつ1年以上の実務経験が必要である。',
    answer: false,
    explanation:
      '研修修了＋実務経験（1回以上かつ2か月以上または2回以上で要件を満たす）が必要で、設問の数値は誤り。',
    difficulty: 3,
  },
  {
    id: 'b-008',
    format: 'binary',
    subject: 'terms',
    topic: '受注型企画旅行',
    statement:
      '受注型企画旅行は、旅行者からの依頼により、旅行業者が旅行計画を作成する契約である。',
    answer: true,
    explanation:
      '受注型（オーダーメイド）は旅行者の依頼に基づき企画する契約です。',
    difficulty: 1,
  },
];

export const MOCK_QUAD_QUESTIONS: QuadQuestion[] = [
  {
    id: 'q-001',
    format: 'quad',
    subject: 'law',
    topic: '登録制度',
    prompt:
      '旅行業の登録に関する次の記述のうち、旅行業法に照らして正しいものはどれか。',
    choices: [
      '第1種旅行業の登録は都道府県知事が行う。',
      '第2種旅行業者は海外の募集型企画旅行を実施できる。',
      '第3種旅行業者は拠点区域内において募集型企画旅行を実施できる。',
      '地域限定旅行業者は他社の受託販売を行うことはできない。',
    ],
    answerIndex: 2,
    explanation:
      '第1種は観光庁長官、第2種は海外の募集型企画旅行不可、地域限定は一定要件下で受託販売可。第3種は拠点区域内で募集型企画旅行可。',
    difficulty: 2,
  },
  {
    id: 'q-002',
    format: 'quad',
    subject: 'terms',
    topic: '取消料',
    prompt:
      '標準旅行業約款（募集型企画旅行）に定める取消料に関する次の記述のうち、誤っているものはどれか。',
    choices: [
      '旅行開始日の前日に取り消した場合、旅行代金の40%が取消料となる。',
      '旅行開始日当日の旅行開始前の取消は旅行代金の50%が取消料となる。',
      '旅行開始後の取消又は無連絡不参加は旅行代金の100%が取消料となる。',
      '旅行開始日の21日前までの取消はいかなる場合も取消料は発生しない。',
    ],
    answerIndex: 3,
    explanation:
      '21日前までの取消でも、貸切船舶利用の場合等は取消料が発生します。原則と例外を分けて覚えるのが重要。',
    difficulty: 3,
  },
  {
    id: 'q-003',
    format: 'quad',
    subject: 'practice',
    topic: 'JR料金計算',
    prompt:
      '東京〜新大阪間（営業キロ 552.6km）を新幹線「のぞみ」普通車指定席で旅行する。通常期の運賃・料金の組合せとして正しいものはどれか。（金額はダミー）',
    choices: [
      '運賃 8,910円・特急料金 5,490円',
      '運賃 9,790円・特急料金 5,490円',
      '運賃 8,910円・特急料金 5,810円',
      '運賃 9,790円・特急料金 5,810円',
    ],
    answerIndex: 1,
    explanation:
      '営業キロに基づく幹線運賃の計算、および「のぞみ」指定席料金の加算を押さえましょう。※金額は学習用ダミー。',
    difficulty: 3,
  },
  {
    id: 'q-004',
    format: 'quad',
    subject: 'practice',
    topic: '国内観光資源',
    prompt: '次の世界遺産と所在都道府県の組合せのうち、誤っているものはどれか。',
    choices: [
      '白川郷・五箇山の合掌造り集落 — 岐阜県・富山県',
      '石見銀山遺跡とその文化的景観 — 島根県',
      '琉球王国のグスク及び関連遺産群 — 沖縄県',
      '紀伊山地の霊場と参詣道 — 奈良県・和歌山県・京都府',
    ],
    answerIndex: 3,
    explanation:
      '紀伊山地の霊場と参詣道は、三重県・奈良県・和歌山県の3県にまたがる世界遺産です。',
    difficulty: 2,
  },
  {
    id: 'q-005',
    format: 'quad',
    subject: 'law',
    topic: '弁済業務保証金',
    prompt:
      '旅行業協会の保証社員制度に関する次の記述のうち、正しいものはどれか。',
    choices: [
      '保証社員は、営業保証金を供託する必要はなく、弁済業務保証金分担金を協会に納付する。',
      '弁済業務保証金分担金は、主たる営業所の最寄りの供託所に供託する。',
      '保証社員でない旅行業者は、営業保証金を協会に納付する。',
      '弁済業務保証金の取戻しは、債権者への公告を要しない。',
    ],
    answerIndex: 0,
    explanation:
      '保証社員は営業保証金の供託義務を免除され、協会に分担金を納付します。金額は営業保証金より低く設定されています。',
    difficulty: 2,
  },
];
