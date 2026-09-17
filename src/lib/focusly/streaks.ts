import type { DailyStat } from "./types";

export interface Streaks {
  /** Consecutive days with ≥1 pomodoro ending today (or yesterday if today is empty) */
  current: number;
  /** Longest streak across all recorded days */
  best: number;
}

/** Fallback for missing days (mirrors EMPTY_STAT in store.ts without importing it). */
const EMPTY_DAY: DailyStat = { pomodoros: 0, focusSeconds: 0, breaks: 0 };

/** Local YYYY-MM-DD key — same format as todayKey() in types.ts. */
function dayKey(d: Date): string {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

/**
 * Compute current and best streaks from the daily record.
 * A day counts when it has at least one completed pomodoro.
 */
export function computeStreaks(daily: Record<string, DailyStat>): Streaks {
  const activeDays = Object.entries(daily)
    .filter(([, s]) => s.pomodoros > 0)
    .map(([k]) => k)
    .sort();
  if (activeDays.length === 0) return { current: 0, best: 0 };

  // Best: longest run of consecutive days
  let best = 1;
  let run = 1;
  for (let i = 1; i < activeDays.length; i++) {
    if (isNextDay(activeDays[i - 1], activeDays[i])) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }

  // Current: count backwards from today (or yesterday if today is still empty)
  const today = new Date();
  const todayKey = dayKey(today);
  const yesterdayKey = dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1));

  let current = 0;
  let cursor: string | null = activeDays.includes(todayKey)
    ? todayKey
    : activeDays.includes(yesterdayKey)
      ? yesterdayKey
      : null;
  while (cursor) {
    current++;
    const [y, m, d] = cursor.split("-").map(Number);
    const prev = dayKey(new Date(y, m - 1, d - 1));
    cursor = activeDays.includes(prev) ? prev : null;
  }

  return { current, best };
}

/** Local Date (00:00) from a YYYY-MM-DD key — inverse of dayKey(). */
function parseDayKey(k: string): Date {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isNextDay(a: string, b: string): boolean {
  const [y, m, d] = a.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  return dayKey(next) === b;
}

/* ------------------------------------------------------------------ */
/* Goal streaks (weekly / monthly)                                     */
/* ------------------------------------------------------------------ */

export interface GoalStreak {
  /** Consecutive achieved periods ending with the current one; 0 when the
   * in-progress period is not met yet (it only counts once already achieved). */
  current: number;
  /** Pomodoro total of the current in-progress period so far */
  currentTotal: number;
  /** Pomodoro goal for one full period (dailyGoal × period length in days) */
  periodGoal: number;
  /** Whether the in-progress period already meets the goal */
  currentMet: boolean;
}

/** Monday 00:00 (local) of the Monday-first week containing d. */
function mondayOf(d: Date): Date {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

/** Sum of pomodoros over the 7 local days starting at `start` (00:00). */
function weekPomodoros(daily: Record<string, DailyStat>, start: Date): number {
  let sum = 0;
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  for (let i = 0; i < 7; i++) {
    sum += (daily[dayKey(cur)] ?? EMPTY_DAY).pomodoros;
    cur.setDate(cur.getDate() + 1);
  }
  return sum;
}

/** Sum of pomodoros over a whole local month (m0: 0-based month index). */
function monthPomodoros(daily: Record<string, DailyStat>, y: number, m0: number): number {
  const days = new Date(y, m0 + 1, 0).getDate();
  let sum = 0;
  for (let d = 1; d <= days; d++) {
    sum += (daily[dayKey(new Date(y, m0, d))] ?? EMPTY_DAY).pomodoros;
  }
  return sum;
}

/**
 * Current streak of consecutive weeks whose pomodoro total reaches
 * dailyGoal × 7 (Monday-first weeks). The in-progress week counts only when
 * its goal is already met — otherwise the streak is 0; a past week below the
 * goal breaks the run. Weeks are walked back in exact 7-day steps, so year
 * boundaries are handled naturally (no ISO week-number arithmetic).
 */
export function weekGoalStreak(
  daily: Record<string, DailyStat>,
  dailyGoal: number,
  today: Date = new Date(),
): GoalStreak {
  const periodGoal = dailyGoal * 7;
  const monday = mondayOf(today);
  const currentTotal = weekPomodoros(daily, monday);
  if (dailyGoal <= 0 || currentTotal < periodGoal) {
    return { current: 0, currentTotal, periodGoal, currentMet: false };
  }
  let current = 1;
  const cursor = new Date(monday);
  cursor.setDate(cursor.getDate() - 7);
  while (weekPomodoros(daily, cursor) >= periodGoal) {
    current++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return { current, currentTotal, periodGoal, currentMet: true };
}

/**
 * Current streak of consecutive months whose pomodoro total reaches
 * dailyGoal × (days in month). The in-progress month counts only when its
 * goal is already met — otherwise the streak is 0; a past month below its
 * own goal (shorter or longer) breaks the run. Months are walked back with
 * the Date constructor, so lengths and leap years are handled naturally.
 */
export function monthGoalStreak(
  daily: Record<string, DailyStat>,
  dailyGoal: number,
  today: Date = new Date(),
): GoalStreak {
  const y = today.getFullYear();
  const m0 = today.getMonth();
  const daysInMonth = new Date(y, m0 + 1, 0).getDate();
  const periodGoal = dailyGoal * daysInMonth;
  const currentTotal = monthPomodoros(daily, y, m0);
  if (dailyGoal <= 0 || currentTotal < periodGoal) {
    return { current: 0, currentTotal, periodGoal, currentMet: false };
  }
  let current = 1;
  let cy = y;
  let cm = m0;
  for (;;) {
    cm -= 1;
    if (cm < 0) {
      cm = 11;
      cy -= 1;
    }
    if (monthPomodoros(daily, cy, cm) < dailyGoal * new Date(cy, cm + 1, 0).getDate()) break;
    current += 1;
  }
  return { current, currentTotal, periodGoal, currentMet: true };
}

/* ------------------------------------------------------------------ */
/* Records (longest-ever goal streaks) & year helpers                  */
/* ------------------------------------------------------------------ */

/**
 * Longest run of consecutive weeks whose pomodoro total reaches
 * dailyGoal × 7, scanned across the whole daily record (Monday-first,
 * exact 7-day steps so year boundaries are handled naturally). The
 * in-progress week counts toward the record only when its goal is already
 * met; returns 0 when dailyGoal ≤ 0 or no week was ever met.
 */
export function bestWeekGoalStreak(
  daily: Record<string, DailyStat>,
  dailyGoal: number,
  today: Date = new Date(),
): number {
  if (dailyGoal <= 0) return 0;
  const keys = Object.keys(daily).sort();
  if (keys.length === 0) return 0;
  const periodGoal = dailyGoal * 7;
  const last = mondayOf(today);
  let best = 0;
  let run = 0;
  // Walk forward from the Monday of the earliest recorded day: any met week
  // must contain at least one recorded day, so nothing earlier can qualify.
  for (let cur = mondayOf(parseDayKey(keys[0])); cur <= last; cur.setDate(cur.getDate() + 7)) {
    if (weekPomodoros(daily, cur) >= periodGoal) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

/**
 * Longest run of consecutive months whose pomodoro total reaches
 * dailyGoal × (days in month), scanned across the whole daily record with
 * each month's real length (leap-aware). The in-progress month counts
 * toward the record only when its goal is already met; returns 0 when
 * dailyGoal ≤ 0 or no month was ever met.
 */
export function bestMonthGoalStreak(
  daily: Record<string, DailyStat>,
  dailyGoal: number,
  today: Date = new Date(),
): number {
  if (dailyGoal <= 0) return 0;
  const keys = Object.keys(daily).sort();
  if (keys.length === 0) return 0;
  const [firstY, firstM] = keys[0].split("-").map(Number);
  let cy = firstY;
  let cm = firstM - 1; // 0-based month index
  let best = 0;
  let run = 0;
  while (cy < today.getFullYear() || (cy === today.getFullYear() && cm <= today.getMonth())) {
    const days = new Date(cy, cm + 1, 0).getDate();
    if (monthPomodoros(daily, cy, cm) >= dailyGoal * days) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
    cm += 1;
    if (cm > 11) {
      cm = 0;
      cy += 1;
    }
  }
  return best;
}

/** Number of days in a year (sum of month lengths — leap years included). */
export function daysInYear(y: number): number {
  let days = 0;
  for (let m = 0; m < 12; m++) days += new Date(y, m + 1, 0).getDate();
  return days;
}

/**
 * Years offered by the annual goal selector: the current year plus every
 * year present in the daily record — deduped, sorted descending, capped at
 * `max` options. Malformed keys are ignored.
 */
export function availableGoalYears(
  daily: Record<string, DailyStat>,
  currentYear: number,
  max = 5,
): number[] {
  const years = new Set<number>([currentYear]);
  for (const key of Object.keys(daily)) {
    const y = Number(key.slice(0, 4));
    if (y >= 1000 && y <= 9999) years.add(y);
  }
  return Array.from(years)
    .sort((a, b) => b - a)
    .slice(0, max);
}
