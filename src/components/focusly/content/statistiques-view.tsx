"use client";

import { useMemo, useState } from "react";
import {
  Award,
  BarChart3,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

/** Full weekday names for insights (same deterministic reference week). */
const WEEKDAY_LONG: string[] = Array.from({ length: 7 }, (_, i) =>
  new Date(2024, 0, 1 + i).toLocaleDateString("fr-FR", { weekday: "long" }),
);

/** The 5 intensity levels of the heatmaps (empty → 7+ pomodoros). */
const LEVELS = [
  "bg-secondary",
  "bg-brand/25",
  "bg-brand/45",
  "bg-brand/70",
  "bg-brand shadow-[0_0_10px_-2px_var(--brand-glow)]",
];

/** Smaller cells for the year heatmap (no glow — too dense for shadows). */
const LEVELS_SM = ["bg-secondary", "bg-brand/25", "bg-brand/45", "bg-brand/70", "bg-brand"];

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

function capitalize(v: string): string {
  return v.charAt(0).toUpperCase() + v.slice(1);
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

interface YearDayCell {
  key: string;
  pomodoros: number;
  /** belongs to the displayed year (else invisible filler) */
  inYear: boolean;
  isFuture: boolean;
  isToday: boolean;
  title: string;
}

interface MonthMark {
  label: string;
  week: number;
}

/* ------------------------------------------------------------------ */
/* View                                                                */
/* ------------------------------------------------------------------ */

export function StatistiquesView() {
  const daily = useFocusly((s) => s.daily);
  const [calendarTab, setCalendarTab] = useState<"mensuel" | "annuel">("mensuel");
  const [view, setView] = useState<ViewMonth>(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const [viewYear, setViewYear] = useState<number>(() => new Date().getFullYear());

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
    return capitalize(
      new Date(view.y, view.m, 1).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      }),
    );
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

  /* ----- Year heatmap (53 weeks × 7 days, Monday-first) ----- */
  const yearData = useMemo(() => {
    const now = new Date();
    const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const first = new Date(viewYear, 0, 1);
    // Start on the Monday on or before January 1st
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const end = new Date(viewYear, 11, 31);

    const weeks: YearDayCell[][] = [];
    const cur = new Date(start);
    let yearPomodoros = 0;
    let yearActiveDays = 0;

    while (cur <= end) {
      const week: YearDayCell[] = [];
      for (let i = 0; i < 7; i++) {
        const inYear = cur.getFullYear() === viewYear;
        const key = dayKeyOf(cur.getFullYear(), cur.getMonth(), cur.getDate());
        const pomodoros = (daily[key] ?? EMPTY_STAT).pomodoros;
        const isFuture = cur > todayMid;
        const isToday = key === todayKey();
        if (inYear && !isFuture && pomodoros > 0) {
          yearPomodoros += pomodoros;
          yearActiveDays += 1;
        }
        const minutes = Math.floor((daily[key] ?? EMPTY_STAT).focusSeconds / 60);
        const dateStr = new Date(cur).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        week.push({
          key,
          pomodoros,
          inYear,
          isFuture,
          isToday,
          title:
            !inYear || isFuture
              ? ""
              : pomodoros === 0
                ? `${dateStr} — aucun pomodoro`
                : `${dateStr} — ${pomodoros} pomodoro${pomodoros > 1 ? "s" : ""}, ${minutes} min de concentration`,
        });
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
    }

    // Month marks: week index of the 1st of each month, thinned to avoid overlap
    const marks: MonthMark[] = [];
    let lastWeek = -99;
    for (let m = 0; m < 12; m++) {
      const firstDay = new Date(viewYear, m, 1);
      const diff = Math.round((firstDay.getTime() - start.getTime()) / 86400000);
      const week = Math.floor(diff / 7);
      if (week - lastWeek >= 3) {
        marks.push({
          label: capitalize(
            firstDay.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
          ),
          week,
        });
        lastWeek = week;
      }
    }

    return { weeks, yearPomodoros, yearActiveDays, marks };
  }, [daily, viewYear]);

  /* ----- Weekday distribution (Monday-first) ----- */
  const weekday = useMemo(() => {
    const totals: number[] = Array(7).fill(0);
    Object.entries(daily).forEach(([k, v]) => {
      const parts = k.split("-");
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      totals[(d.getDay() + 6) % 7] += v.pomodoros;
    });
    const max = Math.max(...totals);
    const bestIndex = totals.indexOf(max);
    return { totals, max, bestIndex };
  }, [daily]);

  const now = new Date();
  const isCurrentMonth = view.y === now.getFullYear() && view.m === now.getMonth();
  const isCurrentYear = viewYear === now.getFullYear();

  const goPrevMonth = () =>
    setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { ...v, m: v.m - 1 }));
  const goNextMonth = () =>
    setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { ...v, m: v.m + 1 }));

  const gridAria = `${monthLabel} : ${month.monthPomodoros} ${
    month.monthPomodoros === 1 ? "pomodoro" : "pomodoros"
  } sur ${totals.pomodoros} ${totals.pomodoros === 1 ? "pomodoro" : "pomodoros"} enregistré${
    totals.pomodoros === 1 ? "" : "s"
  }`;

  const yearAria = `Année ${viewYear} : ${yearData.yearPomodoros} ${
    yearData.yearPomodoros === 1 ? "pomodoro" : "pomodoros"
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
        Vos calendriers de concentration, mois après mois et année après année. Vos
        données restent sur votre appareil.
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

        {/* ----- Calendar (monthly / yearly) ----- */}
        <section className="flex flex-col gap-5 rounded-3xl border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-base font-bold tracking-tight">Calendrier</h2>
              <p className="mt-0.5 text-[13px] text-faint">
                Chaque case représente un jour de pratique.
              </p>
            </div>
            <Tabs
              value={calendarTab}
              onValueChange={(v) => setCalendarTab(v as "mensuel" | "annuel")}
            >
              <TabsList aria-label="Type de calendrier">
                <TabsTrigger value="mensuel" className="rounded-lg px-3 text-[12.5px]">
                  Mensuel
                </TabsTrigger>
                <TabsTrigger value="annuel" className="rounded-lg px-3 text-[12.5px]">
                  Annuel
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {calendarTab === "mensuel" ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="m-0 text-[13px] font-semibold text-brand">{monthLabel}</p>
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
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="m-0 text-[13px] font-semibold text-brand">
                    Année {viewYear}
                  </p>
                  <p className="mt-0.5 text-[12px] text-faint">
                    {yearData.yearPomodoros} pomodoro
                    {yearData.yearPomodoros === 1 ? "" : "s"} ·{" "}
                    {yearData.yearActiveDays} jour
                    {yearData.yearActiveDays === 1 ? "" : "s"} actif
                    {yearData.yearActiveDays === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-lg"
                    aria-label="Année précédente"
                    onClick={() => setViewYear((y) => y - 1)}
                  >
                    <ChevronLeft aria-hidden />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-lg"
                    aria-label="Année suivante"
                    onClick={() => setViewYear((y) => y + 1)}
                    disabled={isCurrentYear}
                  >
                    <ChevronRight aria-hidden />
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto pb-1">
                <div className="mx-auto w-max min-w-full">
                  {/* Month labels row */}
                  <div
                    aria-hidden
                    className="mb-1.5 grid gap-x-[3px]"
                    style={{ gridTemplateColumns: `repeat(${yearData.weeks.length}, 11px)` }}
                  >
                    {yearData.marks.map((m) => (
                      <span
                        key={`${m.label}-${m.week}`}
                        style={{ gridColumnStart: m.week + 1, gridRow: 1 }}
                        className="text-[10px] font-semibold text-faint"
                      >
                        {m.label}
                      </span>
                    ))}
                  </div>
                  {/* Day cells: one column per week, Monday-first */}
                  <div
                    role="img"
                    aria-label={yearAria}
                    className="flex gap-[3px]"
                  >
                    {yearData.weeks.map((week, wi) => (
                      <div key={`week-${wi}`} className="flex flex-col gap-[3px]">
                        {week.map((c) => (
                          <div
                            key={c.key}
                            title={c.title}
                            className={
                              "size-[11px] rounded-[3px] " +
                              (!c.inYear || c.isFuture
                                ? "invisible"
                                : LEVELS_SM[levelIndex(c.pomodoros)] +
                                  (c.isToday
                                    ? " ring-1 ring-brand ring-offset-1 ring-offset-card"
                                    : ""))
                            }
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 text-[11px] text-faint">
                <span>Moins</span>
                {LEVELS_SM.map((l) => (
                  <span key={l} aria-hidden className={`size-3 rounded-[3px] ${l}`} />
                ))}
                <span>Plus</span>
              </div>
            </>
          )}

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

        {/* ----- Weekday distribution ----- */}
        <section className="flex flex-col gap-4 rounded-3xl border bg-card p-6">
          <div>
            <h2 className="m-0 flex items-center gap-2 text-base font-bold tracking-tight">
              <BarChart3 className="size-4 text-brand" aria-hidden />
              Répartition par jour de la semaine
            </h2>
            <p className="mt-0.5 text-[13px] text-faint">
              Total de pomodoros réalisés pour chaque jour, toutes semaines confondues.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {WEEKDAY_LABELS.map((w, i) => {
              const value = weekday.totals[i];
              const pct = weekday.max > 0 ? Math.max((value / weekday.max) * 100, 2) : 0;
              const isBest = weekday.max > 0 && value === weekday.max;
              return (
                <div key={w} className="flex items-center gap-3">
                  <span className="w-9 shrink-0 text-right text-[11px] font-semibold uppercase tracking-wide text-faint">
                    {w}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={
                        "h-full rounded-full bg-brand transition-[width] duration-500 ease-out " +
                        (isBest ? "shadow-[0_0_8px_-1px_var(--brand-glow)]" : "")
                      }
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span
                    className={`w-9 shrink-0 text-right text-xs font-semibold tabular-nums ${
                      isBest ? "text-brand" : "text-muted-foreground"
                    }`}
                  >
                    {value}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="m-0 text-[13px] text-soft" aria-live="polite">
            {weekday.max > 0 ? (
              <>
                Votre jour le plus productif :{" "}
                <strong className="font-semibold text-foreground">
                  {WEEKDAY_LONG[weekday.bestIndex]}
                </strong>{" "}
                <span className="text-faint">
                  ({weekday.max} pomodoro{weekday.max > 1 ? "s" : ""} au total)
                </span>
              </>
            ) : (
              <span className="text-faint">
                Terminez quelques sessions pour découvrir vos jours les plus productifs.
              </span>
            )}
          </p>
        </section>

        {/* ----- Actions ----- */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            className="rounded-xl active:scale-[0.98]"
            onClick={handleExport}
          >
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
