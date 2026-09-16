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
  autoStart: false,
};

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

/** French human date + time for lists */
export function frDateTime(iso: string | number): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
