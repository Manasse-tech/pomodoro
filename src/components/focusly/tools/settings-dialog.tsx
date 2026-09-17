"use client";

import { useState, type ReactNode } from "react";
import { Minus, Play, Plus, Volume2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useFocusly } from "@/lib/focusly/store";
import {
  notificationPermission,
  playEndSound,
  requestNotificationPermission,
} from "@/lib/focusly/chime";
import { SETTINGS_FIELDS, SOUND_KINDS, type SoundKind } from "@/lib/focusly/types";

/* Section groupings (visual only): the fields themselves stay defined in
 * types.ts (imported SETTINGS_FIELDS) — same keys, labels, min/max and
 * render order as before. */
const DURATION_FIELDS = SETTINGS_FIELDS.filter(
  (f) => f.key === "focus" || f.key === "short" || f.key === "long",
);
const GOAL_FIELDS = SETTINGS_FIELDS.filter(
  (f) => f.key === "longEvery" || f.key === "dailyGoal",
);

/* Small uppercase French section label (round 11 dialog rhythm) */
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">
      {children}
    </p>
  );
}

export function SettingsDialog() {
  const open = useFocusly((s) => s.settingsOpen);
  const setOpen = useFocusly((s) => s.setSettingsOpen);
  const settings = useFocusly((s) => s.settings);
  const updateSettings = useFocusly((s) => s.updateSettings);

  /* Vibration API support. Lazy initializer: the dialog subtree renders only
   * when open, so the SSR/client difference never reaches the DOM. */
  const [vibrateSupported] = useState(
    () => typeof navigator !== "undefined" && typeof navigator.vibrate === "function",
  );

  const stepSetting = (key: (typeof SETTINGS_FIELDS)[number]["key"], delta: number) => {
    updateSettings({ [key]: Math.round(settings[key]) + delta } as never);
  };

  const handleNotifications = async (enabled: boolean) => {
    if (!enabled) {
      updateSettings({ notifications: false });
      return;
    }
    const current = notificationPermission();
    if (current === "granted") {
      updateSettings({ notifications: true });
      return;
    }
    const res = await requestNotificationPermission();
    if (res === "granted") {
      updateSettings({ notifications: true });
      toast.success("Notifications activées.");
    } else {
      updateSettings({ notifications: false });
      toast.error(
        "Notifications refusées par le navigateur. Autorisez-les dans les réglages du site.",
      );
    }
  };

  /* One settings row (stepper cluster). Shared verbatim by the two grouped
     sections — same markup, ids and handlers as the previous flat list. */
  const renderField = (f: (typeof SETTINGS_FIELDS)[number]) => (
    <div key={f.key} className="flex items-center justify-between gap-3">
      <Label htmlFor={`set-${f.key}`} className="text-sm text-soft">
        {f.label}
      </Label>
      <div className="flex items-center gap-0.5 rounded-xl border bg-secondary p-0.5">
        <button
          type="button"
          aria-label={`Diminuer ${f.label}`}
          onClick={() => stepSetting(f.key, -1)}
          className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Minus className="size-4" />
        </button>
        <input
          id={`set-${f.key}`}
          type="number"
          inputMode="numeric"
          min={f.min}
          max={f.max}
          step={1}
          value={settings[f.key]}
          onChange={(e) =>
            updateSettings({ [f.key]: Number(e.target.value) } as never)
          }
          className="w-[52px] bg-transparent text-center text-[15px] font-semibold text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label={`Augmenter ${f.label}`}
          onClick={() => stepSetting(f.key, 1)}
          className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] w-[min(440px,calc(100vw-2rem))] overflow-y-auto rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[13px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Réglages du minuteur
          </DialogTitle>
          <DialogDescription className="sr-only">
            Personnalisez les durées, le son et les notifications.
          </DialogDescription>
        </DialogHeader>

        {/* Grouped sections (round 11): Durées / Objectifs / Sons et alertes /
            Comportement — pure visual grouping, same rows, ids and logic. */}
        <div role="group" aria-label="Durées" className="flex flex-col gap-2.5">
          <SectionLabel>Durées</SectionLabel>
          {DURATION_FIELDS.map(renderField)}
        </div>

        <Separator />

        <div role="group" aria-label="Objectifs" className="flex flex-col gap-2.5">
          <SectionLabel>Objectifs</SectionLabel>
          {GOAL_FIELDS.map(renderField)}
        </div>

        <Separator />

        <div role="group" aria-label="Sons et alertes" className="flex flex-col gap-2.5">
          <SectionLabel>Sons et alertes</SectionLabel>

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="set-sound" className="text-sm text-soft">
              Sonnerie de fin
            </Label>
            <Switch
              id="set-sound"
              checked={settings.sound}
              onCheckedChange={(v) => updateSettings({ sound: v })}
            />
          </div>

          {settings.sound && (
            <>
              <div className="flex flex-col gap-2 px-0.5">
                <Label className="text-sm text-soft">Son de fin de session</Label>
                <div
                  role="group"
                  aria-label="Choix du son de fin"
                  className="grid grid-cols-3 gap-1 rounded-xl border bg-secondary p-1"
                >
                  {SOUND_KINDS.map((k) => (
                    <div key={k.value} className="flex items-center gap-0.5">
                      <button
                        type="button"
                        aria-pressed={settings.soundKind === k.value}
                        onClick={() => updateSettings({ soundKind: k.value as SoundKind })}
                        className={`min-h-9 flex-1 whitespace-nowrap rounded-lg px-1 text-[12.5px] font-semibold transition-colors ${
                          settings.soundKind === k.value
                            ? "bg-brand text-[#14161a] shadow-[0_2px_10px_-3px_var(--brand)]"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {k.label}
                      </button>
                      <button
                        type="button"
                        aria-label={`Écouter le son : ${k.label}`}
                        title="Écouter"
                        onClick={() => playEndSound(k.value, settings.volume)}
                        className={`grid size-7 shrink-0 place-items-center rounded-md transition-colors ${
                          settings.soundKind === k.value
                            ? "text-[#14161a]/70 hover:text-[#14161a]"
                            : "text-faint hover:text-foreground"
                        }`}
                      >
                        <Play className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 px-0.5">
                <Label htmlFor="set-volume" className="flex items-center gap-1.5 text-sm text-soft">
                  <Volume2 className="size-3.5 text-faint" aria-hidden />
                  Volume
                </Label>
                <Slider
                  id="set-volume"
                  min={0}
                  max={100}
                  step={5}
                  value={[Math.round(settings.volume * 100)]}
                  onValueChange={([v]) => updateSettings({ volume: v / 100 })}
                  className="w-40"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label htmlFor="set-tick" className="text-sm text-soft">
                    Tic des dernières secondes
                  </Label>
                  <p className="text-[11px] text-faint">
                    Un tic discret pendant les 5 dernières secondes.
                  </p>
                </div>
                <Switch
                  id="set-tick"
                  checked={settings.tickLast}
                  onCheckedChange={(v) => updateSettings({ tickLast: v })}
                />
              </div>
            </>
          )}
        </div>

        <Separator />

        <div role="group" aria-label="Comportement" className="flex flex-col gap-2.5">
          <SectionLabel>Comportement</SectionLabel>

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="set-notif" className="text-sm text-soft">
              Notifications navigateur
            </Label>
            <Switch
              id="set-notif"
              checked={settings.notifications}
              onCheckedChange={handleNotifications}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="set-vibrate" className="text-sm text-soft">
                Vibration (mobile)
              </Label>
              <p className="text-[11px] text-faint">
                {vibrateSupported
                  ? "Brève secousse à la fin d’une session."
                  : "Non prise en charge par ce navigateur."}
              </p>
            </div>
            <Switch
              id="set-vibrate"
              checked={settings.vibrate && vibrateSupported}
              disabled={!vibrateSupported}
              onCheckedChange={(v) => updateSettings({ vibrate: v })}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="set-auto" className="text-sm text-soft">
                Démarrage automatique
              </Label>
              <p className="text-[11px] text-faint">
                Enchaîner la session suivante sans clic.
              </p>
            </div>
            <Switch
              id="set-auto"
              checked={settings.autoStart}
              onCheckedChange={(v) => updateSettings({ autoStart: v })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary" className="w-full rounded-xl">
                Réinitialiser les statistiques du jour
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Réinitialiser les statistiques du jour ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Les pomodoros, minutes et pauses d&apos;aujourd&apos;hui ainsi que le cycle en
                  cours seront remis à zéro. L&apos;historique est conservé.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    useFocusly.getState().resetTodayStats();
                    toast.success("Statistiques du jour réinitialisées.");
                  }}
                >
                  Réinitialiser
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Réinitialiser toutes mes données
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tout réinitialiser ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Réglages, statistiques, historique, tâches et notes seront définitivement
                  effacés de votre appareil. Pensez à exporter vos données avant.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => {
                    useFocusly.getState().resetAll();
                    toast.success("Toutes les données ont été réinitialisées.");
                  }}
                >
                  Tout effacer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <p className="mt-1 text-center text-xs leading-relaxed text-faint">
            Toutes vos données sont stockées uniquement sur votre appareil.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
