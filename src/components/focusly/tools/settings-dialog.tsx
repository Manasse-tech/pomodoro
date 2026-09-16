"use client";

import { Minus, Plus } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useFocusly } from "@/lib/focusly/store";
import {
  notificationPermission,
  requestNotificationPermission,
} from "@/lib/focusly/chime";
import { SETTINGS_FIELDS } from "@/lib/focusly/types";

export function SettingsDialog() {
  const open = useFocusly((s) => s.settingsOpen);
  const setOpen = useFocusly((s) => s.setSettingsOpen);
  const settings = useFocusly((s) => s.settings);
  const updateSettings = useFocusly((s) => s.updateSettings);

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

        <div className="flex flex-col gap-2.5">
          {SETTINGS_FIELDS.map((f) => (
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
          ))}

          <div className="mt-2 flex items-center justify-between gap-3">
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
            <div className="flex items-center justify-between gap-4 px-0.5">
              <Label htmlFor="set-volume" className="text-sm text-soft">
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
          )}

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

        <div className="mt-4 flex flex-col gap-2">
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
