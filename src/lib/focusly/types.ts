// Shared types for Focusly
export type Mode = "focus" | "short" | "long";

export type Theme = "dark" | "light";

/** End-of-session alert sound */
export type SoundKind = "carillon" | "cloche" | "digital";

export const SOUND_KINDS: Array<{ value: SoundKind; label: string }> = [
  { value: "carillon", label: "Carillon" },
  { value: "cloche", label: "Cloche" },
  { value: "digital", label: "Digital" },
];

export interface TimerSettings {
  /** Focus session duration in minutes (1–180) */
  focus: number;
  /** Short break duration in minutes (1–60) */
  short: number;
  /** Long break duration in minutes (1–90) */
  long: number;
  /** Long break every N pomodoros (2–12) */
  longEvery: number;
  /** Daily pomodoro goal (1–20) */
  dailyGoal: number;
  /** Play a sound when a session ends */
  sound: boolean;
  /** Which end-of-session sound to play */
  soundKind: SoundKind;
  /** Chime volume 0–1 */
  volume: number;
  /** Play a soft tick during the last 5 seconds of a session */
  tickLast: boolean;
  /** Show a browser notification when a session ends */
  notifications: boolean;
  /** Vibrate the device when a session ends (mobile, if supported) */
  vibrate: boolean;
  /** Automatically start the next session after completion */
  autoStart: boolean;
}

export const DEFAULT_SETTINGS: TimerSettings = {
  focus: 25,
  short: 5,
  long: 15,
  longEvery: 4,
  dailyGoal: 8,
  sound: true,
  soundKind: "carillon",
  volume: 0.6,
  tickLast: false,
  notifications: false,
  vibrate: true,
  autoStart: false,
};

/** Recurrence plan for a task: completing it spawns a fresh copy with the next due date */
export type TaskRecurrence = "daily" | "weekdays" | "weekly" | "custom";

/** Bounds of the custom recurrence interval, in days */
export const RECURRENCE_DAYS_MIN = 2;
export const RECURRENCE_DAYS_MAX = 365;
/** Interval used for "custom" when no explicit day count was chosen yet */
export const DEFAULT_RECURRENCE_DAYS = 3;

export const RECURRENCE_LABELS: Record<TaskRecurrence, string> = {
  daily: "Quotidienne",
  weekdays: "Jours ouvrés",
  weekly: "Hebdomadaire",
  custom: "Tous les X jours…",
};

export const RECURRENCE_SHORT: Record<TaskRecurrence, string> = {
  daily: "Quotid.",
  weekdays: "Ouvrés",
  weekly: "Hebdo",
  custom: "X j",
};

/** Clamp a custom recurrence interval (in days) to the 2–365 range, rounded to whole days */
export function clampRecurrenceDays(v: number): number {
  return clamp(Math.round(v), RECURRENCE_DAYS_MIN, RECURRENCE_DAYS_MAX);
}

export interface TaskItem {
  id: string;
  text: string;
  done: boolean;
  created: number;
  /** Task currently linked to the timer */
  active?: boolean;
  /** Estimated number of pomodoros (default 1) */
  estimate?: number;
  /** Pomodoros completed while this task was linked (default 0) */
  spent?: number;
  /** Optional due date, as a local YYYY-MM-DD key (same format as todayKey) */
  dueDate?: string;
  /** Recurrence: on completion, a fresh not-done copy is spawned with the next due date */
  recurrence?: TaskRecurrence;
  /** Interval in days (2–365) when recurrence === "custom" — optional, backward compatible */
  recurrenceDays?: number;
}

export interface NoteItem {
  id: string;
  title: string;
  body: string;
  created: number;
}

export interface HistoryEntry {
  id: string;
  /** ISO date */
  date: string;
  mode: Mode;
  /** Duration in minutes */
  duration: number;
}

export interface DailyStat {
  pomodoros: number;
  focusSeconds: number;
  breaks: number;
}

export const MODE_LABELS: Record<Mode, string> = {
  focus: "Concentration",
  short: "Pause courte",
  long: "Pause longue",
};

export const MODE_HINTS: Record<Mode, string> = {
  focus: "Travaillez sans interruption jusqu'à la sonnerie.",
  short: "Éloignez-vous de l'écran, respirez, étirez-vous.",
  long: "Grande pause : marchez, hydratez-vous, déconnectez.",
};

export const SETTINGS_FIELDS: Array<{
  key: "focus" | "short" | "long" | "longEvery" | "dailyGoal";
  label: string;
  min: number;
  max: number;
}> = [
  { key: "focus", label: "Concentration", min: 1, max: 180 },
  { key: "short", label: "Pause courte", min: 1, max: 60 },
  { key: "long", label: "Pause longue", min: 1, max: 90 },
  { key: "longEvery", label: "Pause longue après", min: 2, max: 12 },
  { key: "dailyGoal", label: "Objectif quotidien", min: 1, max: 20 },
];

/** Utility: clamp a number between bounds */
export function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v));
}

/** Local-date key, e.g. 2025-05-31 */
export function todayKey(d = new Date()): string {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

/** Short unique id */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Format seconds as mm:ss or h:mm:ss */
export function formatTime(s: number): string {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return h + ":" + String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}

/** French human date, e.g. « 12 mars 2025 » */
export function frDate(iso: string | number): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** French short date from a local YYYY-MM-DD key, e.g. « 12 mars » (year if not current) */
export function frDateShort(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  const date = new Date(y, m - 1, d);
  const sameYear = y === new Date().getFullYear();
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** Days from today (local) to a YYYY-MM-DD key — negative = overdue */
export function daysUntil(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const due = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Next due-date key for a recurring task: daily → +1 day, weekly → +7 days,
 * custom → +N days (N = intervalDays clamped to 2–365, weekends NOT skipped),
 * weekdays → the next working day (Mon–Fri). The base is max(parsed dueDate,
 * today) so a late completion never plans the next occurrence in the past, and
 * the result is always strictly after that anchor: daily lands on tomorrow,
 * weekly on today + 7, custom on today + N (whatever weekday that is),
 * weekdays on the following working day — a Friday, Saturday or Sunday anchor
 * lands on Monday. Built from local Date parts —
 * new Date(y, m-1, d + N) auto-normalizes month/year overflow, then local
 * parts are read back (same key style as todayKey, never ISO/UTC).
 */
export function nextDueDate(
  fromKey: string | undefined,
  recurrence: TaskRecurrence,
  intervalDays?: number,
): string {
  let base: Date | null = null;
  if (fromKey) {
    const [y, m, d] = fromKey.split("-").map(Number);
    if (y && m && d) base = new Date(y, m - 1, d);
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const from = base !== null && base > today ? base : today;
  if (recurrence === "weekdays") {
    // Step one local day forward from the anchor, then skip the weekend:
    // the landing day is always a working day strictly after the anchor
    // (Friday → Monday, Saturday → Monday, Sunday → Monday, Mon–Thu → next day).
    const next = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
    const dow = next.getDay();
    const shift = dow === 6 ? 2 : dow === 0 ? 1 : 0;
    return todayKey(new Date(next.getFullYear(), next.getMonth(), next.getDate() + shift));
  }
  const step =
    recurrence === "weekly"
      ? 7
      : recurrence === "custom"
        ? clampRecurrenceDays(intervalDays ?? DEFAULT_RECURRENCE_DAYS)
        : 1;
  return todayKey(new Date(from.getFullYear(), from.getMonth(), from.getDate() + step));
}

/** French human date + time for lists */
export function frDateTime(iso: string | number): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
