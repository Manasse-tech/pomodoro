"use client";

import { HistoryPanel } from "./history-panel";
import { NotesPanel } from "./notes-panel";
import { TasksPanel } from "./tasks-panel";
import { TimerCard } from "./timer-card";
import { WeeklyStats } from "./weekly-stats";
import { useFocusly } from "@/lib/focusly/store";

export function OutilsView() {
  const setSettingsOpen = useFocusly((s) => s.setSettingsOpen);

  return (
    <div className="mx-auto w-full max-w-[920px] px-5 py-8 sm:py-10">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Vos outils</h1>
      <p className="mb-8 mt-3 max-w-[660px] text-[17px] text-muted-foreground">
        Minuteur, tâches, notes et historique. Vos données restent sur votre appareil.
      </p>

      <TimerCard onOpenSettings={() => setSettingsOpen(true)} />

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TasksPanel />
        <NotesPanel />
        <div className="lg:col-span-2">
          <WeeklyStats />
        </div>
        <div className="lg:col-span-2">
          <HistoryPanel />
        </div>
      </div>
    </div>
  );
}
