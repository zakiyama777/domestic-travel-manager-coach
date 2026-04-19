'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/features/user/user-provider';
import { cn } from '@/lib/utils/cn';
import { daysUntil, formatJPDate } from '@/lib/utils/date';

type Step = 0 | 1 | 2 | 3;

interface Draft {
  displayName: string;
  examDate: string; // ISO (yyyy-mm-dd)
  dailyGoalMinutes: number;
  dailyGoalQuestions: number;
}

/** デフォルト試験日: 9月の第1日曜（簡易） */
function defaultExamDate(): string {
  const today = new Date();
  const year = today.getMonth() > 8 ? today.getFullYear() + 1 : today.getFullYear();
  const d = new Date(year, 8, 7);
  return d.toISOString().slice(0, 10);
}

const GOAL_PRESETS = [
  { q: 15, m: 10, label: 'ライト', desc: '毎日3分でOK' },
  { q: 20, m: 15, label: 'スタンダード', desc: '通勤のスキマで' },
  { q: 30, m: 20, label: 'しっかり', desc: '合格を本気で' },
  { q: 50, m: 30, label: 'ストイック', desc: '短期集中' },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, ready, completeOnboarding } = useUser();
  const [step, setStep] = useState<Step>(0);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    displayName: '',
    examDate: defaultExamDate(),
    dailyGoalMinutes: 15,
    dailyGoalQuestions: 20,
  });

  // 既にオンボーディング済みならダッシュボードへ
  useEffect(() => {
    if (ready && user?.onboarded) router.replace('/dashboard');
  }, [ready, user, router]);

  const goNext = () => setStep((s) => (Math.min(3, s + 1) as Step));
  const goBack = () => setStep((s) => (Math.max(0, s - 1) as Step));

  const canNext = useMemo(() => {
    if (step === 1) return draft.displayName.trim().length >= 1;
    if (step === 2) return !!draft.examDate;
    return true;
  }, [step, draft]);

  const submit = async () => {
    setSubmitting(true);
    try {
      await completeOnboarding({
        displayName: draft.displayName.trim(),
        examDate: new Date(draft.examDate + 'T00:00:00').toISOString(),
        dailyGoalMinutes: draft.dailyGoalMinutes,
        dailyGoalQuestions: draft.dailyGoalQuestions,
      });
      router.replace('/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSteps = 3;

  return (
    <div className="flex flex-1 flex-col py-6">
      {/* ヘッダ: ロゴ & プログレス */}
      <header className="flex items-center justify-between">
        {step > 0 && step < 3 ? (
          <button
            onClick={goBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/70 tap-highlight"
            aria-label="戻る"
          >
            <ArrowLeft className="h-4.5 w-4.5" strokeWidth={2} />
          </button>
        ) : (
          <div className="h-9 w-9" />
        )}

        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1 rounded-full transition-all duration-500 ease-soft',
                step >= i + 1 ? 'w-6 bg-primary' : 'w-3 bg-border',
              )}
            />
          ))}
        </div>

        <div className="h-9 w-9" />
      </header>

      <div className="relative flex-1 py-6">
        <AnimatePresence mode="wait">
          {step === 0 && <Welcome key="0" onNext={goNext} />}
          {step === 1 && (
            <NameStep
              key="1"
              value={draft.displayName}
              onChange={(v) => setDraft((d) => ({ ...d, displayName: v }))}
            />
          )}
          {step === 2 && (
            <ExamDateStep
              key="2"
              value={draft.examDate}
              onChange={(v) => setDraft((d) => ({ ...d, examDate: v }))}
              name={draft.displayName.trim()}
            />
          )}
          {step === 3 && (
            <GoalStep
              key="3"
              name={draft.displayName.trim()}
              value={{ m: draft.dailyGoalMinutes, q: draft.dailyGoalQuestions }}
              onChange={(m, q) =>
                setDraft((d) => ({ ...d, dailyGoalMinutes: m, dailyGoalQuestions: q }))
              }
            />
          )}
        </AnimatePresence>
      </div>

      {/* CTA (常に下部固定) */}
      <div
        className="mt-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        {step === 0 ? (
          <Button size="lg" className="h-[58px] w-full text-base" onClick={goNext}>
            はじめる <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
          </Button>
        ) : step === 3 ? (
          <Button
            size="lg"
            className="h-[58px] w-full text-base"
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? '準備中…' : (
              <>学習をはじめる <Sparkles className="h-4.5 w-4.5" /></>
            )}
          </Button>
        ) : (
          <Button
            size="lg"
            className="h-[58px] w-full text-base"
            onClick={goNext}
            disabled={!canNext}
          >
            次へ <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
          </Button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Steps                                                              */
/* ------------------------------------------------------------------ */

function StepShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

function Welcome({ onNext: _onNext }: { onNext: () => void }) {
  return (
    <StepShell>
      <div className="flex h-full flex-col items-center justify-center px-2 text-center">
        <div className="relative mb-8">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 h-32 w-32 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(hsl(var(--primary)/0.2), transparent 60%)' }}
          />
          <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-primary to-accent text-white shadow-premium">
            <Sparkles className="h-9 w-9" strokeWidth={1.6} />
          </div>
        </div>
        <p className="font-display text-[10.5px] font-bold tracking-[0.26em] text-muted-foreground">
          TABI · STUDY
        </p>
        <h1 className="mt-2 font-display text-[28px] font-semibold leading-tight tracking-tight text-foreground">
          あなた専属の、
          <br />
          合格コーチへようこそ。
        </h1>
        <p className="mt-5 max-w-[280px] text-[14px] leading-[1.85] text-muted-foreground">
          国内旅行業務取扱管理者試験のための、静かな学習体験。
          <br />
          まずは、あなたのことを少し教えてください。
        </p>
      </div>
    </StepShell>
  );
}

function NameStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <StepShell>
      <div className="flex h-full flex-col pt-4">
        <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-primary">
          STEP 1 / 3
        </p>
        <h1 className="mt-2 font-display text-[24px] font-semibold leading-tight tracking-tight">
          なんとお呼びしましょう？
        </h1>
        <p className="mt-2 text-[13.5px] leading-[1.75] text-muted-foreground">
          ニックネームで大丈夫です。アプリ内だけで使われます。
        </p>

        <div className="mt-8">
          <Input
            autoFocus
            placeholder="例：山崎"
            maxLength={16}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            enterKeyHint="next"
          />
          <p className="mt-2 px-1 text-[11px] text-muted-foreground">
            あとから設定でいつでも変更できます。
          </p>
        </div>

        {value.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-2xl border border-border/60 bg-muted/40 p-4"
          >
            <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
              PREVIEW
            </p>
            <p className="mt-1 text-[15px] font-medium text-foreground">
              {value.trim()}さん、おかえりなさい
            </p>
          </motion.div>
        )}
      </div>
    </StepShell>
  );
}

function ExamDateStep({
  value,
  onChange,
  name,
}: {
  value: string;
  onChange: (v: string) => void;
  name: string;
}) {
  const days = daysUntil(new Date(value + 'T00:00:00'));
  return (
    <StepShell>
      <div className="flex h-full flex-col pt-4">
        <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-primary">
          STEP 2 / 3
        </p>
        <h1 className="mt-2 font-display text-[24px] font-semibold leading-tight tracking-tight">
          試験日はいつですか？
        </h1>
        <p className="mt-2 text-[13.5px] leading-[1.75] text-muted-foreground">
          逆算して毎日の学習量をご提案します。
        </p>

        <div className="mt-8">
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="text-[17px] tabular-nums"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          key={value}
          className="mt-8 rounded-2xl border border-border/60 bg-muted/40 p-5 text-center"
        >
          <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-muted-foreground">
            残 り
          </p>
          <p className="mt-1 font-display text-[44px] font-semibold tabular-nums leading-none tracking-tight text-gradient-primary">
            {days}
            <span className="ml-1 align-middle text-xl text-foreground/70">日</span>
          </p>
          <p className="mt-2 text-[12px] text-muted-foreground tabular-nums">
            {formatJPDate(new Date(value + 'T00:00:00'))}
          </p>
          {name && (
            <p className="mt-4 text-[13px] text-foreground/80">
              {name}さんの試験日まで、静かに伴走します。
            </p>
          )}
        </motion.div>
      </div>
    </StepShell>
  );
}

function GoalStep({
  name,
  value,
  onChange,
}: {
  name: string;
  value: { m: number; q: number };
  onChange: (m: number, q: number) => void;
}) {
  return (
    <StepShell>
      <div className="flex h-full flex-col pt-4">
        <p className="font-display text-[10.5px] font-bold tracking-[0.22em] text-primary">
          STEP 3 / 3
        </p>
        <h1 className="mt-2 font-display text-[24px] font-semibold leading-tight tracking-tight">
          どのくらい進めますか？
        </h1>
        <p className="mt-2 text-[13.5px] leading-[1.75] text-muted-foreground">
          いつでも変更できます。無理のない量から。
        </p>

        <div className="mt-6 space-y-2.5">
          {GOAL_PRESETS.map((p) => {
            const active = value.m === p.m && value.q === p.q;
            return (
              <button
                key={p.label}
                onClick={() => onChange(p.m, p.q)}
                aria-pressed={active}
                className={cn(
                  'group flex w-full items-center justify-between rounded-2xl border bg-white p-4 text-left tap-highlight transition-all',
                  active
                    ? 'border-primary border-[1.5px] ring-2 ring-primary/15 shadow-soft'
                    : 'border-border/70 shadow-soft hover:border-primary/30',
                )}
              >
                <div>
                  <p className="font-display text-[15px] font-semibold tracking-tight">
                    {p.label}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{p.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-display text-[15px] font-semibold tabular-nums text-foreground">
                      {p.q}
                      <span className="ml-0.5 text-[11px] font-medium text-muted-foreground">問</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      約 {p.m}分 / 日
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

        {name && (
          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            {name}さん、それでは始めましょう。
          </p>
        )}
      </div>
    </StepShell>
  );
}
