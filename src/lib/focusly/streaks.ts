import type { DailyStat } from "./types";

export interface Streaks {
  /** Consecutive days with ≥1 pomodoro ending today (or yesterday if today is empty) */
  current: number;
  /** Longest streak across all recorded days */
  best: number;
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
  const key = (d: Date) =>
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0");
  const today = new Date();
  const todayKey = key(today);
  const yesterdayKey = key(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1));

  let current = 0;
  let cursor: string | null = activeDays.includes(todayKey)
    ? todayKey
    : activeDays.includes(yesterdayKey)
      ? yesterdayKey
      : null;
  while (cursor) {
    current++;
    const [y, m, d] = cursor.split("-").map(Number);
    const prev = key(new Date(y, m - 1, d - 1));
    cursor = activeDays.includes(prev) ? prev : null;
  }

  return { current, best };
}

function isNextDay(a: string, b: string): boolean {
  const [y, m, d] = a.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  const nk =
    next.getFullYear() +
    "-" +
    String(next.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(next.getDate()).padStart(2, "0");
  return nk === b;
}
