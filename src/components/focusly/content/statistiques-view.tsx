"use client";

import { useMemo, useState } from "react";
import {
  Award,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Flame,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { dailyToCsv, downloadTextFile } from "@/lib/focusly/csv";
import { computeStreaks } from "@/lib/focusly/streaks";
import { EMPTY_STAT, useFocusly } from "@/lib/focusly/store";
import { todayKey } from "@/lib/focusly/types";

import { Breadcrumb } from "./breadcrumb";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Monday-first weekday labels (fr-FR). 2024-01-01 was a Monday, so
 * the reference week is deterministic across server and client. */
const WEEKDAY_LABELS: string[] = Array.from({ length: 7 }, (_, i) =>
  new Date(2024, 0, 1 + i)
    .toLocaleDateString("fr-FR", { weekday: "short" })
    .replace(".", ""),
);

/** The 5 intensity levels of the heatmap (empty → 7+ pomodoros). */
const LEVELS = [
  "bg-secondary",
  "bg-brand/25",
  "bg-brand/45",
  "bg-brand/70",
  "bg-brand shadow-[0_0_10px_-2px_var(--brand-glow)]",
];

function levelIndex(pomodoros: number): number {
  if (pomodoros <= 0) return 0;
  if (pomodoros <= 2) return 1;
  if (pomodoros <= 4) return 2;
  if (pomodoros <= 6) return 3;
  return 4;
}

/** Local-date key — same decomposition as todayKey() in types.ts. */
function dayKeyOf(y: number, m0: number, d: number): string {
  return `${y}-${String(m0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

interface MonthCell {
  key: string;
  pomodoros: number;
  isFuture: boolean;
  isToday: boolean;
  title: string;
}

interface ViewMonth {
  y: number;
  /** 0-based month index (Date constructor convention) */
  m: number;
}

/* ------------------------------------------------------------------ */
/* View                                                                */
/* ------------------------------------------------------------------ */

export function StatistiquesView() {
  const daily = useFocusly((s) => s.daily);
  const [view, setView] = useState<ViewMonth>(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });

  /* ----- Grand totals across all recorded days ----- */
  const totals = useMemo(() => {
    let pomodoros = 0;
    let seconds = 0;
    let activeDays = 0;
    const recorded = Object.keys(daily).length;
    Object.values(daily).forEach((s) => {
      pomodoros += s.pomodoros;
      seconds += s.focusSeconds;
      if (s.pomodoros > 0) activeDays += 1;
    });
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return {
      pomodoros,
      activeDays,
      recorded,
      focusLabel:
        hours > 0 ? `${hours} h ${String(minutes).padStart(2, "0")} min` : `${minutes} min`,
    };
  }, [daily]);

  const streaks = useMemo(() => computeStreaks(daily), [daily]);

  /* ----- Current month grid ----- */
  const monthLabel = useMemo(() => {
    const raw = new Date(view.y, view.m, 1).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [view]);

  const month = useMemo(() => {
    const now = new Date();
    const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    // French weeks start Monday: JS Sunday=0 → Monday-first index
    const leading = (new Date(view.y, view.m, 1).getDay() + 6) % 7;

    const cells: MonthCell[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const key = dayKeyOf(view.y, view.m, d);
      const stat = daily[key] ?? EMPTY_STAT;
      const pomodoros = stat.pomodoros;
      const minutes = Math.floor(stat.focusSeconds / 60);
      const dateStr = new Date(view.y, view.m, d).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      cells.push({
        key,
        pomodoros,
        isFuture: new Date(view.y, view.m, d) > todayMid,
        isToday: key === todayKey(),
        title:
          pomodoros === 0
            ? `${dateStr} — aucun pomodoro`
            : `${dateStr} — ${pomodoros} pomodoro${pomodoros > 1 ? "s" : ""}, ${minutes} min de concentration`,
      });
    }

    const monthPomodoros = cells.reduce((a, c) => a + c.pomodoros, 0);
    const trailing = (7 - ((leading + daysInMonth) % 7)) % 7;
    return { leading, trailing, cells, monthPomodoros };
  }, [daily, view]);

  const now = new Date();
  const isCurrentMonth = view.y === now.getFullYear() && view.m === now.getMonth();

  const goPrevMonth = () =>
    setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { ...v, m: v.m - 1 }));
  const goNextMonth = () =>
    setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { ...v, m: v.m + 1 }));

  const gridAria = `${monthLabel} : ${month.monthPomodoros} ${
    month.monthPomodoros === 1 ? "pomodoro" : "pomodoros"
  } sur ${totals.pomodoros} ${totals.pomodoros === 1 ? "pomodoro" : "pomodoros"} enregistré${
    totals.pomodoros === 1 ? "" : "s"
  }`;

  const hasData = totals.recorded > 0;

  const handleExport = () => {
    if (Object.keys(daily).length === 0) {
      toast.info("Aucune donnée à exporter.");
      return;
    }
    downloadTextFile(dailyToCsv(daily), `focusly-statistiques-${todayKey()}.csv`);
    toast.success("Export CSV téléchargé.");
  };

  /* ----- KPI cards ----- */
  const kpis: Array<{ icon: LucideIcon; value: string; label: string; hint?: string }> = [
    {
      icon: Flame,
      value: String(totals.pomodoros),
      label: "Pomodoros au total",
    },
    {
      icon: Timer,
      value: totals.focusLabel,
      label: "Temps de concentration",
    },
    {
      icon: CalendarCheck,
      value: String(totals.activeDays),
      label: "Jours actifs",
      hint: `/ ${totals.recorded} jour${totals.recorded > 1 ? "s" : ""} enregistré${
        totals.recorded > 1 ? "s" : ""
      }`,
    },
    {
      icon: Award,
      value: String(streaks.best),
      label: "Série record",
      hint: `actuelle : ${streaks.current} j`,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[920px] px-5 py-8 sm:py-10">
      <Breadcrumb
        items={[{ label: "Accueil", href: "accueil" }, { label: "Statistiques" }]}
      />

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Statistiques</h1>
      <p className="mt-3 max-w-[680px] text-[17px] text-muted-foreground">
        Vue mensuelle de votre concentration. Vos données restent sur votre appareil.
      </p>

      {!hasData && (
        <div className="mt-6 rounded-3xl border border-dashed p-8 text-center">
          <p className="text-[15px] text-soft">
            Aucune donnée pour l’instant. Terminez votre premier Pomodoro pour voir
            votre calendrier se remplir.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-5">
        {/* ----- KPI row ----- */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="flex flex-col gap-2 rounded-3xl border bg-card p-5">
              <k.icon className="size-5 text-brand" aria-hidden />
              <span className="time-display text-2xl font-bold">{k.value}</span>
              <small className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">
                {k.label}
              </small>
              {k.hint ? <span className="text-[11px] text-faint">{k.hint}</span> : null}
            </div>
          ))}
        </div>

        {/* ----- Monthly heatmap ----- */}
        <section className="flex flex-col gap-5 rounded-3xl border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-base font-bold tracking-tight">Calendrier mensuel</h2>
              <p className="mt-0.5 text-[13px] font-semibold text-brand">{monthLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-lg"
                aria-label="Mois précédent"
                onClick={goPrevMonth}
              >
                <ChevronLeft aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-lg"
                aria-label="Mois suivant"
                onClick={goNextMonth}
                disabled={isCurrentMonth}
              >
                <ChevronRight aria-hidden />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div
              role="img"
              aria-label={gridAria}
              className="mx-auto grid min-w-[320px] max-w-[420px] grid-cols-7 gap-1.5"
            >
              {WEEKDAY_LABELS.map((w) => (
                <div
                  key={w}
                  className="pb-1 text-center text-[11px] font-semibold text-faint"
                >
                  {w}
                </div>
              ))}

              {Array.from({ length: month.leading }, (_, i) => (
                <div key={`lead-${i}`} className="aspect-square" />
              ))}

              {month.cells.map((c) => (
                <div
                  key={c.key}
                  title={c.title}
                  className={
                    "aspect-square w-full rounded-md transition-transform hover:scale-110 " +
                    (c.isFuture
                      ? "invisible"
                      : LEVELS[levelIndex(c.pomodoros)] +
                        (c.isToday
                          ? " ring-2 ring-brand ring-offset-2 ring-offset-card"
                          : ""))
                  }
                />
              ))}

              {Array.from({ length: month.trailing }, (_, i) => (
                <div key={`trail-${i}`} className="aspect-square" />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 text-[11px] text-faint">
            <span>Moins</span>
            {LEVELS.map((l) => (
              <span key={l} aria-hidden className={`size-3 rounded-[4px] ${l}`} />
            ))}
            <span>Plus</span>
          </div>

          <div
            className="flex items-center justify-center gap-2 rounded-xl border bg-secondary px-3 py-2 text-[13px]"
            aria-label={`Série actuelle : ${streaks.current} jour${
              streaks.current > 1 ? "s" : ""
            }. Record : ${streaks.best} jour${streaks.best > 1 ? "s" : ""}.`}
          >
            <Award className="size-4 text-brand" aria-hidden />
            <span className="text-soft">
              Série en cours :{" "}
              <strong className="font-semibold text-foreground">
                {streaks.current} jour{streaks.current > 1 ? "s" : ""}
              </strong>
            </span>
            <span className="text-faint" aria-hidden>
              ·
            </span>
            <span className="text-soft">
              Record :{" "}
              <strong className="font-semibold text-foreground">
                {streaks.best} jour{streaks.best > 1 ? "s" : ""}
              </strong>
            </span>
          </div>
        </section>

        {/* ----- Actions ----- */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" className="rounded-xl" onClick={handleExport}>
            <Download aria-hidden />
            Exporter en CSV
          </Button>
          <Button variant="ghost" asChild className="rounded-xl">
            <a href="#outils">← Retour aux outils</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
