'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/features/user/user-provider';
import { useAuth } from '@/lib/hooks/use-auth';
import { useSyncStatus } from '@/features/sync/sync-status';
import { progressRepository, sessionRepository } from '@/lib/repositories';
import { cn } from '@/lib/utils/cn';
import { examStatus, formatJPDate, isValidDate } from '@/lib/utils/date';

const APP_VERSION = '0.1.0 (UI 基盤 v2 — Firebase 同期)';

const GOAL_PRESETS = [
  { q: 15, m: 10, label: 'ライト', desc: '毎日 3 分から' },
  { q: 20, m: 15, label: 'スタンダード', desc: '通勤のスキマで' },
  { q: 30, m: 20, label: 'しっかり', desc: '合格を本気で' },
  { q: 50, m: 30, label: 'ストイック', desc: '短期集中' },
] as const;

/**
 * プロフィール設定 (暫定・最小実装)。
 * - オンボーディングで入力した内容をいつでも編集できる唯一の入り口。
 * - 次スプリントで「通知 / テーマ / サブスク」等を追加していく。
 */
export default function SettingsPage() {
  const router = useRouter();
  const { user, updateProfile } = useUser();
  const auth = useAuth();
  const sync = useSyncStatus();

  const [displayName, setDisplayName] = useState('');
  const [examDateInput, setExamDateInput] = useState('');
  const [goal, setGoal] = useState<{ m: number; q: number }>({ m: 15, q: 20 });
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [justReset, setJustReset] = useState(false);

  const resetLearningData = () => {
    progressRepository.resetAll();
    sessionRepository.clear();
    // クラウド側も初期化済みを反映 (debounce 書き込み)
    void import('@/lib/repositories/firebase/progress.firebase').then((m) =>
      m.flushPushProgress(),
    );
    void import('@/lib/repositories/firebase/session.firebase').then((m) =>
      m.pushSession(),
    );
    setConfirmReset(false);
    setJustReset(true);
    setTimeout(() => setJustReset(false), 1800);
  };

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName);
    const d = new Date(user.examDate);
    setExamDateInput(isValidDate(d) ? d.toISOString().slice(0, 10) : '');
    setGoal({ m: user.dailyGoalMinutes, q: user.dailyGoalQuestions });
  }, [user]);

  const status = useMemo(
    () => examStatus(examDateInput ? examDateInput + 'T00:00:00' : null),
    [examDateInput],
  );

  const dirty = useMemo(() => {
    if (!user) return false;
    const orig = new Date(user.examDate);
    const origISO = isValidDate(orig) ? orig.toISOString().slice(0, 10) : '';
    return (
      displayName.trim() !== user.displayName ||
      examDateInput !== origISO ||
      goal.m !== user.dailyGoalMinutes ||
      goal.q !== user.dailyGoalQuestions
    );
  }, [user, displayName, examDateInput, goal]);

  const canSave = dirty && displayName.trim().length > 0 && !!examDateInput;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        examDate: new Date(examDateInput + 'T00:00:00').toISOString(),
        dailyGoalMinutes: goal.m,
        dailyGoalQuestions: goal.q,
      });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1600);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-5 w-5 animate-pulse-soft rounded-full bg-primary/20" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-3 animate-fade-in-up">
      {/* ヘッダ */}
      <header className="flex items-center gap-3 pt-1">
        <button
          onClick={() => router.back()}
          aria-label="前の画面へ戻る"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/70 tap-highlight"
        >
          <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2.2} />
        </button>
        <div>
          <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
            SETTINGS
          </p>
          <h1 className="font-display text-[20px] font-semibold leading-tight tracking-tight">
            プロフィール
          </h1>
        </div>
      </header>

      {/* 名前 */}
      <Section label="呼び名" hint="アプリ内の挨拶に使います。">
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="例：山崎"
          maxLength={16}
          enterKeyHint="done"
        />
      </Section>

      {/* 試験日 */}
      <Section
        label="試験日"
        hint="逆算して毎日の学習量をご提案します。"
      >
        <Input
          type="date"
          value={examDateInput}
          onChange={(e) => setExamDateInput(e.target.value)}
          className="text-[16px] tabular-nums"
        />
        <ExamPreview status={status} />
      </Section>

      {/* 学習目標 */}
      <Section label="1 日の学習量" hint="いつでも変更できます。">
        <div className="space-y-2">
          {GOAL_PRESETS.map((p) => {
            const active = goal.m === p.m && goal.q === p.q;
            return (
              <button
                key={p.label}
                onClick={() => setGoal({ m: p.m, q: p.q })}
                aria-pressed={active}
                className={cn(
                  'flex w-full items-center justify-between rounded-2xl border bg-white p-4 text-left tap-highlight transition-all',
                  active
                    ? 'border-primary border-[1.5px] ring-2 ring-primary/15 shadow-soft'
                    : 'border-border/70 shadow-soft hover:border-primary/30',
                )}
              >
                <div>
                  <p className="font-display text-[14.5px] font-semibold tracking-tight">
                    {p.label}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{p.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-display text-[14.5px] font-semibold tabular-nums">
                      {p.q}
                      <span className="ml-0.5 text-[11px] font-medium text-muted-foreground">問</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      約 {p.m} 分 / 日
                    </p>
                  </div>
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full border transition-all',
                      active
                        ? 'border-primary bg-primary text-white'
                        : 'border-border text-transparent',
                    )}
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* 同期ステータス (クラウド保存) */}
      <Section
        label="データの保存先"
        hint="学習の記録は端末に保存され、可能ならクラウドにも自動で同期されます。"
      >
        <SyncStatusCard auth={auth} sync={sync} />
      </Section>

      {/* 将来の差込口 (プレースホルダ) */}
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-4 text-center">
        <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
          COMING SOON
        </p>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          通知リマインド · ダークモード · プレミアムプランは次回アップデートで。
        </p>
      </div>

      {/* Danger Zone : 学習データを初期化 */}
      <Section label="学習データの管理" hint="端末に保存された進捗のみを初期化します。">
        <div className="rounded-2xl border border-warning/30 bg-warning/[0.06] p-4">
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-warning"
              strokeWidth={2.2}
            />
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-foreground/90">
                学習の履歴を初期化
              </p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
                日次進捗 · 連続日数 · 問題ごとの正答率 · 再開情報を、この端末から削除します。
                アカウントや呼び名は残ります。
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {justReset ? (
              <p className="text-[12px] font-medium text-accent">
                初期化しました。お疲れさまでした。
              </p>
            ) : !confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="rounded-full border border-warning/60 bg-white px-3 py-1.5 font-display text-[12px] font-semibold text-warning tap-highlight hover:bg-warning/10"
              >
                初期化する
              </button>
            ) : (
              <>
                <button
                  onClick={resetLearningData}
                  className="rounded-full bg-warning px-3 py-1.5 font-display text-[12px] font-semibold text-white shadow-soft tap-highlight"
                >
                  本当に初期化する
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="rounded-full bg-muted px-3 py-1.5 font-display text-[12px] font-medium text-foreground/70 tap-highlight"
                >
                  やめる
                </button>
              </>
            )}
          </div>
        </div>
      </Section>

      {/* アプリ情報 */}
      <div className="px-1 pb-4 text-center">
        <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
          TABI · STUDY
        </p>
        <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground/80">
          version {APP_VERSION}
        </p>
      </div>

      {/* 保存ボタン (親指ゾーン固定) */}
      <div
        className="sticky -mx-5 border-t border-border/40 bg-background/90 px-5 pt-4 backdrop-blur-xl"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)',
          paddingBottom: '14px',
        }}
      >
        <Button
          size="lg"
          className="h-[58px] w-full text-[15px]"
          onClick={save}
          disabled={!canSave || saving}
        >
          {justSaved ? (
            <>
              <Check className="h-5 w-5" strokeWidth={2.6} />
              保存しました
            </>
          ) : saving ? (
            '保存中…'
          ) : (
            '変更を保存する'
          )}
        </Button>
      </div>
    </div>
  );
}

function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 px-0.5">
        <p className="font-display text-[11px] font-bold tracking-[0.2em] text-foreground/70">
          {label}
        </p>
        {hint && (
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function ExamPreview({ status }: { status: ReturnType<typeof examStatus> }) {
  if (status.kind === 'unset') {
    return (
      <p className="mt-2 px-1 text-[11.5px] text-muted-foreground">
        日付を選ぶと、残り日数を表示します。
      </p>
    );
  }
  if (status.kind === 'today') {
    return (
      <p className="mt-2 px-1 text-[12px] font-medium text-primary">
        本日、試験当日です。
      </p>
    );
  }
  if (status.kind === 'past') {
    return (
      <p className="mt-2 px-1 text-[11.5px] text-muted-foreground">
        この日付は過去のため、残り日数は表示されません。
        ({formatJPDate(status.date)})
      </p>
    );
  }
  return (
    <p className="mt-2 px-1 text-[12px] text-foreground/80 tabular-nums">
      試験まであと{' '}
      <span className="font-display font-semibold text-primary">{status.days}</span> 日
      <span className="ml-1 text-muted-foreground">({formatJPDate(status.date)})</span>
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* 同期ステータス表示                                                   */
/* ------------------------------------------------------------------ */
function SyncStatusCard({
  auth,
  sync,
}: {
  auth: ReturnType<typeof useAuth>;
  sync: ReturnType<typeof useSyncStatus>;
}) {
  // Firebase 未設定
  if (!auth.firebaseConfigured) {
    return (
      <div className="rounded-2xl border border-border/70 bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" aria-hidden />
          <p className="font-display text-[11px] font-bold tracking-[0.2em] text-foreground/70">
            ローカル保存
          </p>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
          現在この端末にのみ学習データを保存しています。
          クラウド同期を有効にするには、管理者が Firebase 環境変数を設定する必要があります。
        </p>
      </div>
    );
  }

  // 初期化中 or local-only (接続失敗)
  if (auth.status === 'initializing') {
    return (
      <div className="rounded-2xl border border-border/70 bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse-soft rounded-full bg-primary" aria-hidden />
          <p className="font-display text-[11px] font-bold tracking-[0.2em] text-primary">
            接続中…
          </p>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
          クラウドへの接続を確認しています。
        </p>
      </div>
    );
  }

  if (auth.status === 'local-only') {
    return (
      <div className="rounded-2xl border border-border/70 bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" aria-hidden />
          <p className="font-display text-[11px] font-bold tracking-[0.2em] text-foreground/70">
            ローカル保存
          </p>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
          現在はこの端末にのみ保存しています。オンラインに戻ると自動でクラウド同期を再開します。
        </p>
      </div>
    );
  }

  // anonymous / authenticated
  const label =
    sync.state === 'syncing'
      ? '同期中…'
      : sync.state === 'failed'
        ? '同期を一時停止'
        : '同期済み';
  const dotClass =
    sync.state === 'syncing'
      ? 'bg-primary animate-pulse-soft'
      : sync.state === 'failed'
        ? 'bg-warning'
        : 'bg-accent';
  const textClass =
    sync.state === 'failed' ? 'text-warning' : 'text-accent';

  const description =
    auth.status === 'anonymous'
      ? '匿名ユーザーとしてクラウドに記録しています。'
      : 'クラウドに記録しています。';

  return (
    <div className="rounded-2xl border border-border/70 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', dotClass)} aria-hidden />
          <p
            className={cn(
              'font-display text-[11px] font-bold tracking-[0.2em]',
              textClass,
            )}
          >
            {label}
          </p>
        </div>
        <p className="font-display text-[10px] font-bold tracking-[0.2em] text-muted-foreground/80">
          CLOUD
        </p>
      </div>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
        {description}
        {sync.state === 'failed' &&
          ' ネットワーク状況が改善すると自動で再試行されます。'}
      </p>
      {auth.uid && (
        <p className="mt-2 truncate text-[10.5px] tabular-nums text-muted-foreground/70">
          id: {auth.uid.slice(0, 8)}…
        </p>
      )}
    </div>
  );
}
