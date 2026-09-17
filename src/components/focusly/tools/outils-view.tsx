"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import { HistoryPanel } from "./history-panel";
import { NotesPanel } from "./notes-panel";
import { TasksPanel } from "./tasks-panel";
import { TimerCard } from "./timer-card";
import { WeeklyStats } from "./weekly-stats";
import { ZenMode } from "./zen-mode";
import { Button } from "@/components/ui/button";
import { useFocusly } from "@/lib/focusly/store";

export function OutilsView() {
  const setSettingsOpen = useFocusly((s) => s.setSettingsOpen);
  // Mode zen is view-local state on purpose: the store must not grow a flag for it
  const [zenOpen, setZenOpen] = useState(false);
  const zenTriggerRef = useRef<HTMLButtonElement>(null);

  const closeZen = useCallback(() => {
    setZenOpen(false);
    // The overlay unmounts, so the browser cannot restore focus naturally:
    // hand it back to the trigger button.
    zenTriggerRef.current?.focus();
  }, []);

  /* Palette bridge: the command palette dispatches « focusly:toggle-zen » —
   * same lightweight window-event channel as the existing
   * « focusly:open-command » (no store involvement). */
  useEffect(() => {
    const onToggle = () => setZenOpen((v) => !v);
    window.addEventListener("focusly:toggle-zen", onToggle);
    return () => window.removeEventListener("focusly:toggle-zen", onToggle);
  }, []);

  return (
    <div className="mx-auto w-full max-w-[920px] px-5 py-8 sm:py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Vos outils</h1>
        <Button
          ref={zenTriggerRef}
          variant="ghost"
          size="icon"
          aria-label="Activer le mode zen"
          title="Mode zen (plein écran)"
          className="press size-10 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
          onClick={() => setZenOpen(true)}
        >
          <Maximize2 className="size-[18px]" aria-hidden />
        </Button>
      </div>
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

      <ZenMode open={zenOpen} onClose={closeZen} />
    </div>
  );
}
