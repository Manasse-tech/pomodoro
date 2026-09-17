"use client";

import { Play, Pause, RotateCcw, SkipForward, Settings2, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFocusly } from "@/lib/focusly/store";
import {
  formatTime,
  MODE_HINTS,
  MODE_LABELS,
  todayKey,
  type Mode,
} from "@/lib/focusly/types";

const CIRC = 2 * Math.PI * 118;
const MODES: Mode[] = ["focus", "short", "long"];

export function TimerCard({ onOpenSettings }: { onOpenSettings: () => void }) {
  const mode = useFocusly((s) => s.mode);
  const running = useFocusly((s) => s.running);
  const timeLeft = useFocusly((s) => s.timeLeft);
  const cycle = useFocusly((s) => s.cycle);
  const settings = useFocusly((s) => s.settings);
  const tasks = useFocusly((s) => s.tasks);
  const today = useFocusly((s) => s.daily[todayKey()] ?? null);
  const startTimer = useFocusly((s) => s.startTimer);
  const pauseTimer = useFocusly((s) => s.pauseTimer);
  const resetTimer = useFocusly((s) => s.resetTimer);
  const setMode = useFocusly((s) => s.setMode);
  const setActiveTask = useFocusly((s) => s.setActiveTask);

  const total = Math.round(settings[mode]) * 60;
  const progress = total > 0 ? Math.min(1, Math.max(0, (total - timeLeft) / total)) : 0;
  const isPartial = timeLeft > 0 && timeLeft < total;
  const activeTask = tasks.find((t) => t.active);

  const pomos = today?.pomodoros ?? 0;
  const goalPct = Math.min(100, Math.round((pomos / Math.max(1, settings.dailyGoal)) * 100));
  const goalReached = pomos >= settings.dailyGoal;

  const dots = Array.from({ length: settings.longEvery });
  const filledRaw = cycle % settings.longEvery;
  const filled = filledRaw === 0 && cycle > 0 && mode === "long" ? settings.longEvery : filledRaw;

  return (
    <div
      role="region"
      aria-label="Minuteur Pomodoro"
      className="mx-auto mb-10 flex w-full max-w-[440px] flex-col gap-5 rounded-3xl border bg-card p-6 pt-5 shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-[11.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Minuteur
        </h2>
        <Button
          variant="outline"
          size="icon"
          aria-label="Réglages du minuteur"
          title="Réglages (,)"
          className="size-8 rounded-lg"
          onClick={onOpenSettings}
        >
          <Settings2 className="size-[15px]" />
        </Button>
      </div>

      <nav
        role="tablist"
        aria-label="Mode du minuteur"
        className="flex gap-1 rounded-2xl border bg-secondary p-1"
      >
        {MODES.map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`min-h-9 flex-1 whitespace-nowrap rounded-xl px-1 py-2 text-[11.5px] font-semibold transition-colors sm:text-[12.5px] ${
              mode === m
                ? "bg-brand/12 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--brand)_35%,transparent)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </nav>

      <div className="relative mx-auto aspect-square w-[min(260px,68vw)]">
        <svg className="absolute inset-0 size-full" viewBox="0 0 260 260" aria-hidden>
          <circle
            className="stroke-border"
            cx="130"
            cy="130"
            r="118"
            fill="none"
            strokeWidth="8"
          />
          <circle
            className={`ring-fg stroke-brand ${running ? "ring-pulse" : ""}`}
            cx="130"
            cy="130"
            r="118"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * progress}
            transform="rotate(-90 130 130)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center">
          <div
            role="timer"
            aria-live="polite"
            aria-atomic
            className={`time-display text-[clamp(42px,12vw,54px)] font-light leading-none ${
              running ? "time-breathe" : ""
            }`}
          >
            {formatTime(timeLeft)}
          </div>
          <div className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {MODE_LABELS[mode]}
          </div>
          {/* Fixed-height slot for the partial-session hint: rendered empty
              when the session is at full duration so the centered stack never
              shifts mid-session. The chip itself is plain static text (the
              « Reprendre » button label already carries the state to AT). */}
          <div className="flex h-[18px] items-center justify-center">
            {isPartial && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/12 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-brand">
                <span aria-hidden className="size-1 rounded-full bg-brand" />
                Reprise
              </span>
            )}
          </div>
          <div className="flex h-1.5 gap-1.5" aria-hidden>
            {dots.map((_, i) => (
              <i
                key={i}
                className={`size-1.5 rounded-full transition-all ${
                  i < filled
                    ? "bg-brand shadow-[0_0_8px_-1px_var(--brand)]"
                    : "bg-input"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="text-center text-[12.5px] text-faint">
        {running ? "Session en cours…" : MODE_HINTS[mode]}
      </p>

      {activeTask && (
        <div className="flex items-center gap-2 rounded-xl border bg-secondary px-3 py-2 text-[13px]">
          <span className="text-faint">Tâche :</span>
          <span className="min-w-0 flex-1 truncate font-medium">{activeTask.text}</span>
          {(activeTask.spent ?? 0) > 0 || (activeTask.estimate ?? 1) > 1 ? (
            <span
              title={`Estimation : ${activeTask.estimate ?? 1} · Effectués : ${activeTask.spent ?? 0}`}
              className={`time-display shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                (activeTask.spent ?? 0) >= (activeTask.estimate ?? 1)
                  ? "bg-brand/20 text-brand"
                  : "bg-background/70 text-soft"
              }`}
            >
              {activeTask.spent ?? 0}/{activeTask.estimate ?? 1}
            </span>
          ) : null}
          <button
            onClick={() => setActiveTask(activeTask.id)}
            aria-label="Détacher la tâche du minuteur"
            className="text-faint transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="flex gap-2.5">
        <Button
          size="lg"
          className="flex-1 rounded-2xl bg-brand text-[15px] font-semibold text-[#14161a] shadow-[0_12px_32px_-14px_var(--brand)] transition-transform active:scale-[0.98] hover:bg-brand hover:brightness-110"
          onClick={running ? pauseTimer : startTimer}
        >
          {running ? (
            <>
              <Pause className="size-4" /> Pause
            </>
          ) : (
            <>
              <Play className="size-4" /> {isPartial ? "Reprendre" : "Démarrer"}
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="rounded-2xl transition-transform active:scale-95"
          onClick={resetTimer}
          aria-label="Réinitialiser le minuteur"
          title="Réinitialiser (R)"
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="rounded-2xl transition-transform active:scale-95"
          onClick={() => useFocusly.getState().skipMode()}
          aria-label="Passer au mode suivant"
          title="Mode suivant (S)"
        >
          <SkipForward className="size-4" />
        </Button>
      </div>

      <section
        aria-label="Statistiques du jour"
        className="grid grid-cols-3 gap-2 border-t pt-4"
      >
        <div className="flex flex-col items-center gap-0.5">
          <span className="time-display text-xl font-semibold">
            {today?.pomodoros ?? 0}
          </span>
          <small className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            Pomodoros
          </small>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="time-display text-xl font-semibold">
            {Math.floor((today?.focusSeconds ?? 0) / 60)}
          </span>
          <small className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            Minutes
          </small>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="time-display text-xl font-semibold">{today?.breaks ?? 0}</span>
          <small className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            Pauses
          </small>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
          <Target className="size-3.5 text-brand" aria-hidden />
          Objectif
        </div>
        <Progress
          value={goalPct}
          aria-label={`Objectif du jour : ${pomos} sur ${settings.dailyGoal} pomodoros`}
          className="h-1.5 flex-1 bg-secondary"
        />
        <span
          className={`time-display text-xs font-semibold ${
            goalReached ? "text-brand" : "text-muted-foreground"
          }`}
        >
          {pomos} / {settings.dailyGoal}
        </span>
      </div>
    </div>
  );
}
