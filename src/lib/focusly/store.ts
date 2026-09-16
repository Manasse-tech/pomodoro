"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  clamp,
  DEFAULT_SETTINGS,
  todayKey,
  uid,
  type DailyStat,
  type HistoryEntry,
  type Mode,
  type NoteItem,
  type TaskItem,
  type Theme,
  type TimerSettings,
} from "./types";

export const STORAGE_KEY = "focusly.v4";

export const EMPTY_STAT: DailyStat = { pomodoros: 0, focusSeconds: 0, breaks: 0 };

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
  theme: Theme;
}

export interface ExportShape extends PersistShape {
  version: number;
  exportedAt: string;
}

interface FocuslyState extends PersistShape {
  /** transient — ticker timestamp, not persisted */
  lastTick: number;
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

  addTask: (text: string, estimate?: number) => void;
  toggleTask: (id: string, done: boolean) => void;
  removeTask: (id: string) => void;
  clearDoneTasks: () => void;
  setActiveTask: (id: string | null) => void;
  /** Set the pomodoro estimate of a task (clamped 1–12) */
  setTaskEstimate: (id: string, estimate: number) => void;

  addNote: (title: string, body: string) => void;
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

      addTask: (text, estimate) => {
        const v = text.trim();
        if (!v) return;
        const est = clamp(Math.round(estimate ?? 1), 1, 12);
        set({
          tasks: [
            ...get().tasks,
            { id: uid(), text: v, done: false, created: Date.now(), estimate: est, spent: 0 },
          ].slice(-200),
        });
      },

      toggleTask: (id, done) =>
        set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, done } : t)) }),

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
              if (v && typeof v.pomodoros === "number") daily[k] = v;
            });
          }
          set({
            settings,
            daily,
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
      storage: createJSONStorage(() => localStorage),
      /** Deep-merge settings so newly added fields keep their defaults after an update */
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<FocuslyState>;
        return {
          ...current,
          ...p,
          settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
        } as FocuslyState;
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
        theme: s.theme,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const key = todayKey();
        const patch: Partial<FocuslyState> = { hydrated: true };
        // A running timer that survived reload keeps counting down
        if (state.running && state.endTime > Date.now()) {
          patch.timeLeft = Math.max(0, Math.round((state.endTime - Date.now()) / 1000));
        } else {
          patch.running = false;
          patch.endTime = 0;
          patch.timeLeft = durationOf(state.settings, state.mode);
        }
        // Sessions may span midnight: fold stale stats into their own day
        if (state.daily[key]) {
          patch.timeLeft =
            patch.running === false ? durationOf(state.settings, state.mode) : patch.timeLeft;
        }
        useFocusly.setState(patch);
      },
    },
  ),
);

/** Selector: today's live stats */
export function useTodayStat(): DailyStat {
  return useFocusly((s) => s.daily[todayKey()] ?? EMPTY_STAT);
}
