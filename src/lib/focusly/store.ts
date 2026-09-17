"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  clamp,
  clampRecurrenceDays,
  DEFAULT_SETTINGS,
  nextDueDate,
  todayKey,
  uid,
  type DailyStat,
  type HistoryEntry,
  type Mode,
  type NoteItem,
  type TaskItem,
  type TaskRecurrence,
  type Theme,
  type TimerSettings,
} from "./types";

export const STORAGE_KEY = "focusly.v4";

export const EMPTY_STAT: DailyStat = { pomodoros: 0, focusSeconds: 0, breaks: 0 };

/** Plausible ceiling for recorded focus time in a single day (24 h) — guards against corrupted stats. */
const MAX_FOCUS_SECONDS_PER_DAY = 86_400;

/**
 * Repair daily stats loaded from localStorage or an import file:
 * non-finite/negative numbers become 0 and focusSeconds is capped at 24 h.
 * Prevents a legacy bug (running timer rehydrated with lastTick === 0)
 * from displaying ~1.8 billion "seconds of focus" forever.
 */
export function sanitizeDaily(daily: Record<string, DailyStat>): Record<string, DailyStat> {
  const out: Record<string, DailyStat> = {};
  for (const [key, value] of Object.entries(daily)) {
    if (!value || typeof value !== "object") continue;
    const pomodoros = Number(value.pomodoros);
    const focusSeconds = Number(value.focusSeconds);
    const breaks = Number(value.breaks);
    out[key] = {
      pomodoros: Number.isFinite(pomodoros) && pomodoros > 0 ? Math.floor(pomodoros) : 0,
      focusSeconds:
        Number.isFinite(focusSeconds) && focusSeconds > 0
          ? Math.min(focusSeconds, MAX_FOCUS_SECONDS_PER_DAY)
          : 0,
      breaks: Number.isFinite(breaks) && breaks > 0 ? Math.floor(breaks) : 0,
    };
  }
  return out;
}

export interface PersistShape {
  settings: TimerSettings;
  daily: Record<string, DailyStat>;
  history: HistoryEntry[];
  tasks: TaskItem[];
  notes: NoteItem[];
  cycle: number;
  mode: Mode;
  timeLeft: number;
  running: boolean;
  endTime: number;
  /**
   * Ticker timestamp. Persisted so a session that survives a reload keeps
   * accruing focus time from the unload moment (up to endTime) instead of
   * re-reading the whole elapsed time since epoch (lastTick === 0).
   */
  lastTick: number;
  theme: Theme;
}

export interface ExportShape extends PersistShape {
  version: number;
  exportedAt: string;
}

interface FocuslyState extends PersistShape {
  /** true once the persisted store has been rehydrated on the client */
  hydrated: boolean;
  /** transient — mobile navigation menu open */
  navOpen: boolean;
  /** transient — settings dialog open */
  settingsOpen: boolean;
  /** transient — help dialog open */
  helpOpen: boolean;

  setHydrated: (v: boolean) => void;
  setNavOpen: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  setHelpOpen: (v: boolean) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;

  durationFor: (m: Mode) => number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setMode: (m: Mode) => void;
  skipMode: () => void;
  /** Advance the running timer. Returns "completed" when the session just ended. */
  tick: () => "completed" | null;
  /** Record the finished session and switch to the next mode. Returns next mode. */
  completeSession: () => Mode;

  /** Add a task; empty dueDate is ignored, a recurrence respawns the task on completion */
  addTask: (
    text: string,
    estimate?: number,
    dueDate?: string,
    recurrence?: TaskRecurrence,
    recurrenceDays?: number,
  ) => void;
  toggleTask: (id: string, done: boolean) => void;
  removeTask: (id: string) => void;
  clearDoneTasks: () => void;
  setActiveTask: (id: string | null) => void;
  /** Set the pomodoro estimate of a task (clamped 1–12) */
  setTaskEstimate: (id: string, estimate: number) => void;
  /** Edit a task's text and/or due date (null clears the due date); recurrence: null clears it;
   *  recurrenceDays: null clears the custom interval, a number is clamped to 2–365 */
  updateTask: (
    id: string,
    patch: Partial<Pick<TaskItem, "text" | "dueDate" | "estimate">> & {
      recurrence?: TaskRecurrence | null;
      recurrenceDays?: number | null;
    },
  ) => void;
  /** Move a task up (-1) or down (+1) by one position */
  moveTask: (id: string, direction: -1 | 1) => void;
  /** Reorder: drop task `fromId` at the position of task `toId` */
  moveTaskTo: (fromId: string, toId: string) => void;

  addNote: (title: string, body: string) => void;
  /** Edit an existing note's title and/or body */
  updateNote: (id: string, patch: Partial<Pick<NoteItem, "title" | "body">>) => void;
  removeNote: (id: string) => void;

  clearHistory: () => void;

  updateSettings: (patch: Partial<TimerSettings>) => void;
  resetTodayStats: () => void;
  resetAll: () => void;
  exportData: () => string;
  importData: (json: string) => { ok: boolean; error?: string };
}

function durationOf(settings: TimerSettings, m: Mode): number {
  return Math.round(settings[m]) * 60;
}

export const nextModeAfterFocus = (cycle: number, longEvery: number): Mode =>
  (cycle + 1) % longEvery === 0 ? "long" : "short";

export const useFocusly = create<FocuslyState>()(
  persist(
    (set, get) => ({
      settings: { ...DEFAULT_SETTINGS },
      daily: {},
      history: [],
      tasks: [],
      notes: [],
      cycle: 0,
      mode: "focus",
      running: false,
      timeLeft: DEFAULT_SETTINGS.focus * 60,
      endTime: 0,
      theme: "dark",
      lastTick: 0,
      hydrated: false,
      navOpen: false,
      settingsOpen: false,
      helpOpen: false,

      setHydrated: (v) => set({ hydrated: v }),
      setNavOpen: (v) => set({ navOpen: v }),
      setSettingsOpen: (v) => set({ settingsOpen: v }),
      setHelpOpen: (v) => set({ helpOpen: v }),

      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),

      durationFor: (m) => durationOf(get().settings, m),

      startTimer: () => {
        const s = get();
        if (s.running || s.timeLeft <= 0) return;
        const now = Date.now();
        set({ running: true, endTime: now + s.timeLeft * 1000, lastTick: now });
      },

      pauseTimer: () => {
        const s = get();
        if (!s.running) return;
        const now = Date.now();
        set({
          running: false,
          timeLeft: Math.max(0, Math.round((s.endTime - now) / 1000)),
          endTime: 0,
        });
      },

      resetTimer: () => {
        const s = get();
        set({ running: false, endTime: 0, timeLeft: durationOf(s.settings, s.mode) });
      },

      setMode: (m) => {
        const s = get();
        if (m === s.mode && !s.running) return;
        set({
          running: false,
          endTime: 0,
          mode: m,
          timeLeft: durationOf(s.settings, m),
        });
      },

      skipMode: () => {
        const s = get();
        let next: Mode;
        if (s.mode === "focus") next = nextModeAfterFocus(s.cycle, s.settings.longEvery);
        else next = "focus";
        set({ running: false, endTime: 0, mode: next, timeLeft: durationOf(s.settings, next) });
      },

      tick: () => {
        const s = get();
        if (!s.running) return null;
        const now = Date.now();
        const remainMs = s.endTime - now;
        const elapsed = Math.max(0, Math.min(now, s.endTime) - s.lastTick) / 1000;

        if (s.mode === "focus" && elapsed > 0) {
          const key = todayKey();
          const day = s.daily[key] ?? { ...EMPTY_STAT };
          // Round to 0.1s to avoid float drift (e.g. 59.99999999 breaking floor())
          day.focusSeconds = Math.round((day.focusSeconds + elapsed) * 10) / 10;
          set({ lastTick: now, daily: { ...s.daily, [key]: day } });
        } else {
          set({ lastTick: now });
        }

        const next = Math.max(0, Math.ceil(remainMs / 1000));
        if (next !== get().timeLeft) set({ timeLeft: next });

        if (remainMs <= 0) {
          get().completeSession();
          return "completed";
        }
        return null;
      },

      completeSession: () => {
        const s = get();
        const key = todayKey();
        const day = { ...(s.daily[key] ?? EMPTY_STAT) };
        const history = [
          ...s.history,
          {
            id: uid(),
            date: new Date().toISOString(),
            mode: s.mode,
            duration: durationOf(s.settings, s.mode) / 60,
          },
        ].slice(-200);

        let next: Mode;
        if (s.mode === "focus") {
          day.pomodoros += 1;
          next = nextModeAfterFocus(s.cycle, s.settings.longEvery);
          set({
            running: false,
            endTime: 0,
            cycle: s.cycle + 1,
            mode: next,
            timeLeft: durationOf(s.settings, next),
            daily: { ...s.daily, [key]: day },
            history,
            // Credit the linked task for the completed pomodoro
            tasks: s.tasks.map((t) =>
              t.active ? { ...t, spent: (t.spent ?? 0) + 1 } : t,
            ),
          });
        } else {
          day.breaks += 1;
          next = "focus";
          set({
            running: false,
            endTime: 0,
            mode: next,
            timeLeft: durationOf(s.settings, next),
            daily: { ...s.daily, [key]: day },
            history,
          });
        }
        return next;
      },

      addTask: (text, estimate, dueDate, recurrence, recurrenceDays) => {
        const v = text.trim();
        if (!v) return;
        const est = clamp(Math.round(estimate ?? 1), 1, 12);
        const task: TaskItem = {
          id: uid(),
          text: v,
          done: false,
          created: Date.now(),
          estimate: est,
          spent: 0,
        };
        if (dueDate) task.dueDate = dueDate;
        if (recurrence) task.recurrence = recurrence;
        if (recurrence === "custom" && recurrenceDays != null)
          task.recurrenceDays = clampRecurrenceDays(recurrenceDays);
        set({
          tasks: [...get().tasks, task].slice(-200),
        });
      },

      toggleTask: (id, done) => {
        const prev = get().tasks;
        const tasks = prev.map((t) => (t.id === id ? { ...t, done } : t));
        const src = done ? prev.find((t) => t.id === id) : undefined;
        if (src && src.recurrence) {
          // Recurring task completed: spawn its next occurrence inside the same
          // set() as the flip (inherently once per completion — flipping back to
          // false never spawns). The original keeps its active flag as-is and the
          // fresh copy starts unlinked, not done, with the next due date.
          tasks.push({
            id: uid(),
            text: src.text,
            done: false,
            created: Date.now(),
            estimate: src.estimate,
            spent: 0,
            dueDate: nextDueDate(src.dueDate, src.recurrence, src.recurrenceDays),
            recurrence: src.recurrence,
            recurrenceDays: src.recurrenceDays,
          });
        }
        set({ tasks: tasks.slice(-200) });
      },

      removeTask: (id) => set({ tasks: get().tasks.filter((t) => t.id !== id) }),

      clearDoneTasks: () => set({ tasks: get().tasks.filter((t) => !t.done) }),

      setActiveTask: (id) =>
        set({
          tasks: get().tasks.map((t) => ({ ...t, active: t.id === id ? !t.active : false })),
        }),

      setTaskEstimate: (id, estimate) =>
        set({
          tasks: get().tasks.map((t) =>
            t.id === id ? { ...t, estimate: clamp(Math.round(estimate), 1, 12) } : t,
          ),
        }),

      updateTask: (id, patch) =>
        set({
          tasks: get().tasks.map((t) => {
            if (t.id !== id) return t;
            const next = { ...t };
            if (patch.text !== undefined) {
              const v = patch.text.trim();
              if (v) next.text = v;
            }
            if (patch.estimate !== undefined) {
              next.estimate = clamp(Math.round(patch.estimate), 1, 12);
            }
            if (patch.dueDate !== undefined) {
              next.dueDate = patch.dueDate === null || patch.dueDate === "" ? undefined : patch.dueDate;
            }
            if (patch.recurrence !== undefined) {
              // Explicit null clears the recurrence; a value sets it. An absent
              // key (partial patch) leaves it untouched.
              if (patch.recurrence) next.recurrence = patch.recurrence;
              else delete next.recurrence;
            }
            if (patch.recurrenceDays !== undefined) {
              // Explicit null clears the custom interval (e.g. recurrence
              // switched away from "custom"); a number is clamped to 2–365.
              if (patch.recurrenceDays != null)
                next.recurrenceDays = clampRecurrenceDays(patch.recurrenceDays);
              else delete next.recurrenceDays;
            }
            return next;
          }),
        }),

      moveTask: (id, direction) => {
        const tasks = [...get().tasks];
        const i = tasks.findIndex((t) => t.id === id);
        const j = i + direction;
        if (i < 0 || j < 0 || j >= tasks.length) return;
        const [item] = tasks.splice(i, 1);
        tasks.splice(j, 0, item);
        set({ tasks });
      },

      moveTaskTo: (fromId, toId) => {
        if (fromId === toId) return;
        const tasks = [...get().tasks];
        const from = tasks.findIndex((t) => t.id === fromId);
        const to = tasks.findIndex((t) => t.id === toId);
        if (from < 0 || to < 0) return;
        const [item] = tasks.splice(from, 1);
        tasks.splice(to, 0, item);
        set({ tasks });
      },

      addNote: (title, body) => {
        const v = title.trim();
        if (!v) return;
        set({
          notes: [
            ...get().notes,
            { id: uid(), title: v, body: body.trim(), created: Date.now() },
          ].slice(-200),
        });
      },

      removeNote: (id) => set({ notes: get().notes.filter((n) => n.id !== id) }),

      updateNote: (id, patch) =>
        set({
          notes: get().notes.map((n) => {
            if (n.id !== id) return n;
            const next = { ...n };
            if (patch.title !== undefined) {
              const v = patch.title.trim();
              if (v) next.title = v;
            }
            if (patch.body !== undefined) next.body = patch.body.trim();
            return next;
          }),
        }),

      clearHistory: () => set({ history: [] }),

      updateSettings: (patch) => {
        const s = get();
        const settings = { ...s.settings };
        const numeric: Array<keyof TimerSettings> = [
          "focus",
          "short",
          "long",
          "longEvery",
          "dailyGoal",
        ];
        (Object.keys(patch) as Array<keyof TimerSettings>).forEach((k) => {
          const v = patch[k];
          if (v === undefined) return;
          if (numeric.includes(k)) {
            const bounds =
              k === "focus"
                ? [1, 180]
                : k === "short"
                  ? [1, 60]
                  : k === "long"
                    ? [1, 90]
                    : k === "longEvery"
                      ? [2, 12]
                      : [1, 20];
            settings[k] = clamp(Math.round(v as number), bounds[0], bounds[1]) as never;
          } else {
            settings[k] = v as never;
          }
        });
        // If the current mode duration changed while idle, refresh timeLeft
        const affected = ["focus", "short", "long"].includes(s.mode)
          ? (["focus", "short", "long"] as Mode[]).some(
              (m) => m === s.mode && durationOf(settings, m) !== durationOf(s.settings, m),
            )
          : false;
        set({
          settings,
          ...(affected && !s.running ? { timeLeft: durationOf(settings, s.mode) } : {}),
        });
      },

      resetTodayStats: () => {
        const key = todayKey();
        const daily = { ...get().daily };
        delete daily[key];
        set({ daily, cycle: 0 });
      },

      resetAll: () =>
        set({
          settings: { ...DEFAULT_SETTINGS },
          daily: {},
          history: [],
          tasks: [],
          notes: [],
          cycle: 0,
          mode: "focus",
          running: false,
          endTime: 0,
          timeLeft: DEFAULT_SETTINGS.focus * 60,
        }),

      exportData: () => {
        const s = get();
        const data: ExportShape = {
          version: 4,
          exportedAt: new Date().toISOString(),
          settings: s.settings,
          daily: s.daily,
          history: s.history,
          tasks: s.tasks,
          notes: s.notes,
          cycle: s.cycle,
          mode: s.mode,
          timeLeft: s.timeLeft,
          running: false,
          endTime: 0,
          lastTick: 0,
          theme: s.theme,
        };
        return JSON.stringify(data, null, 2);
      },

      importData: (json) => {
        try {
          const d = JSON.parse(json) as Partial<ExportShape>;
          if (typeof d !== "object" || d === null) return { ok: false, error: "Fichier invalide." };
          const s = get();
          const settings = { ...s.settings, ...(d.settings ?? {}) };
          const daily = { ...s.daily };
          if (d.daily && typeof d.daily === "object") {
            Object.entries(d.daily).forEach(([k, v]) => {
              if (v && typeof v.pomodoros === "number") daily[k] = v as DailyStat;
            });
          }
          set({
            settings,
            daily: sanitizeDaily(daily),
            history: Array.isArray(d.history) ? d.history.slice(-200) : s.history,
            tasks: Array.isArray(d.tasks) ? d.tasks.slice(-200) : s.tasks,
            notes: Array.isArray(d.notes) ? d.notes.slice(-200) : s.notes,
            cycle: typeof d.cycle === "number" && d.cycle >= 0 ? d.cycle : s.cycle,
            running: false,
            endTime: 0,
            timeLeft: durationOf(settings, s.mode),
          });
          return { ok: true };
        } catch {
          return { ok: false, error: "Fichier illisible ou JSON invalide." };
        }
      },
    }),
    {
      name: STORAGE_KEY,
      /** Bumped from the implicit 0 so future schema changes get a real migration path. */
      version: 4,
      /** Permissive: shape repair is handled by sanitizeDaily + the settings deep-merge. */
      migrate: (persisted) => persisted ?? {},
      storage: createJSONStorage(() => localStorage),
      /** Deep-merge settings so newly added fields keep their defaults after an update */
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<FocuslyState>;
        const merged = {
          ...current,
          ...p,
          // Repair stats corrupted by pre-fix versions (e.g. focusSeconds
          // inflated to epoch scale when a running timer was rehydrated
          // with lastTick === 0).
          daily: p.daily ? sanitizeDaily(p.daily) : current.daily,
          settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
        } as FocuslyState;

        // Normalize mid-session timer leftovers HERE rather than in the
        // post-rehydrate callback: with a synchronous storage the callback
        // runs while this module is still initializing, so referencing
        // `useFocusly` there throws a TDZ ReferenceError that zustand's
        // persist middleware silently swallows — the normalization was
        // never applied (audit 2026-09-17: a paused mid-session timer came
        // back as "01:00" with a 96%-elapsed ring, and the lastTick
        // corruption guard below was inert).
        const safeMode: Mode =
          merged.mode === "short" || merged.mode === "long" ? merged.mode : "focus";
        merged.mode = safeMode;
        const now = Date.now();
        if (merged.running && merged.endTime > now) {
          // A running timer that survived the reload keeps counting down
          merged.timeLeft = Math.max(0, Math.round((merged.endTime - now) / 1000));
          // Guard against a missing or incoherent ticker timestamp: without
          // this, the first tick() would accrue (now − lastTick) ≈ epoch.
          if (!merged.lastTick || merged.lastTick > merged.endTime) {
            merged.lastTick = now;
          }
        } else {
          merged.running = false;
          merged.endTime = 0;
          merged.timeLeft = durationOf(merged.settings, safeMode);
        }
        merged.hydrated = true;
        return merged;
      },
      partialize: (s): PersistShape => ({
        settings: s.settings,
        daily: s.daily,
        history: s.history,
        tasks: s.tasks,
        notes: s.notes,
        cycle: s.cycle,
        mode: s.mode,
        timeLeft: s.timeLeft,
        running: s.running,
        endTime: s.endTime,
        lastTick: s.lastTick,
        theme: s.theme,
      }),
      onRehydrateStorage: () => (_state, error) => {
        // zustand's persist delivers hydration failures ONLY through this
        // callback — log them instead of letting them vanish silently.
        // All state normalization lives in `merge` (see the comment there:
        // calling setState from here would throw a TDZ ReferenceError).
        if (error) {
          console.error("[focusly] Échec de la rehydration du store :", error);
        }
      },
    },
  ),
);

/** Selector: today's live stats */
export function useTodayStat(): DailyStat {
  return useFocusly((s) => s.daily[todayKey()] ?? EMPTY_STAT);
}
