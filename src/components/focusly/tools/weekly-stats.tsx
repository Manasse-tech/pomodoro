"use client";

import { useMemo } from "react";
import { Flame, Timer, TrendingUp, Award, ArrowRight } from "lucide-react";
import { useFocusly } from "@/lib/focusly/store";
import { computeStreaks } from "@/lib/focusly/streaks";
import { todayKey, type DailyStat } from "@/lib/focusly/types";

interface DayPoint {
  key: string;
  label: string;
  stat: DailyStat;
  isToday: boolean;
}

export function WeeklyStats() {
  const daily = useFocusly((s) => s.daily);
  const streaks = useMemo(() => computeStreaks(daily), [daily]);

  const week = useMemo<DayPoint[]>(() => {
    const out: DayPoint[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = todayKey(d);
      out.push({
        key,
        label: d.toLocaleDateString("fr-FR", { weekday: "narrow" }),
        stat: daily[key] ?? { pomodoros: 0, focusSeconds: 0, breaks: 0 },
        isToday: i === 0,
      });
    }
    return out;
  }, [daily]);

  const totalPomos = week.reduce((a, d) => a + d.stat.pomodoros, 0);
  const totalSeconds = week.reduce((a, d) => a + d.stat.focusSeconds, 0);
  const best = week.reduce(
    (a, d) => (d.stat.pomodoros > a ? d.stat.pomodoros : a),
    0,
  );
  const max = Math.max(1, ...week.map((d) => d.stat.pomodoros));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return (
    <section
      aria-label="Statistiques de la semaine"
      className="flex flex-col gap-5 rounded-3xl border bg-card p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-base font-bold tracking-tight">Cette semaine</h2>
        <span className="text-xs text-faint">7 derniers jours</span>
      </div>

      <div className="flex items-end justify-between gap-2 sm:gap-3" role="img"
        aria-label={`Graphique des pomodoros sur 7 jours, total ${totalPomos}`}>
        {week.map((d) => {
          const h = Math.round((d.stat.pomodoros / max) * 100);
          return (
            <div key={d.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground">
                {d.stat.pomodoros || ""}
              </span>
              <div className="flex h-28 w-full items-end rounded-lg bg-secondary p-1">
                <div
                  className={`w-full rounded-md transition-all duration-500 ${
                    d.isToday
                      ? "bg-brand shadow-[0_0_10px_-2px_var(--brand-glow)]"
                      : "bg-[var(--surface-3)]"
                  }`}
                  style={{ height: `${Math.max(d.stat.pomodoros ? 8 : 2, h)}%` }}
                  title={`${d.key} — ${d.stat.pomodoros} pomodoro(s), ${Math.floor(
                    d.stat.focusSeconds / 60,
                  )} min`}
                />
              </div>
              <span
                className={`text-[11px] font-semibold ${
                  d.isToday ? "text-brand" : "text-faint"
                }`}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 border-t pt-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <Flame className="size-4 text-brand" aria-hidden />
          <span className="time-display text-lg font-semibold">{totalPomos}</span>
          <small className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            Pomodoros
          </small>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <Timer className="size-4 text-brand" aria-hidden />
          <span className="time-display text-lg font-semibold">
            {hours > 0 ? `${hours} h ${String(minutes).padStart(2, "0")}` : `${minutes} min`}
          </span>
          <small className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            Concentration
          </small>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <TrendingUp className="size-4 text-brand" aria-hidden />
          <span className="time-display text-lg font-semibold">{best}</span>
          <small className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
            Meilleur jour
          </small>
        </div>
      </div>

      <div
        className="flex items-center justify-center gap-2 rounded-xl border bg-secondary px-3 py-2 text-[13px]"
        aria-label={`Série actuelle : ${streaks.current} jour${streaks.current > 1 ? "s" : ""}. Record : ${streaks.best} jour${streaks.best > 1 ? "s" : ""}.`}
      >
        <Award className="size-4 text-brand" aria-hidden />
        <span className="text-soft">
          Série en cours : <strong className="font-semibold text-foreground">{streaks.current} jour{streaks.current > 1 ? "s" : ""}</strong>
        </span>
        <span className="text-faint" aria-hidden>·</span>
        <span className="text-soft">
          Record : <strong className="font-semibold text-foreground">{streaks.best} jour{streaks.best > 1 ? "s" : ""}</strong>
        </span>
      </div>

      <a
        href="#statistiques"
        className="group inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl text-[13.5px] font-semibold text-brand transition-colors hover:text-foreground hover:no-underline"
      >
        Voir toutes les statistiques
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </a>
    </section>
  );
}
