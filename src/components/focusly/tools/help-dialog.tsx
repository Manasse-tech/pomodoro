"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFocusly } from "@/lib/focusly/store";

const SHORTCUTS: Array<[string, string]> = [
  ["Démarrer / pause", "Espace"],
  ["Réinitialiser", "R"],
  ["Mode suivant", "S"],
  ["Palette de commandes", "Ctrl K"],
  ["Réglages", ","],
  ["Thème clair / sombre", "T"],
  ["Fermer une fenêtre", "Échap"],
];

export function HelpDialog() {
  const open = useFocusly((s) => s.helpOpen);
  const setOpen = useFocusly((s) => s.setHelpOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[min(440px,calc(100vw-2rem))] rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[13px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Raccourcis clavier
          </DialogTitle>
          <DialogDescription className="sr-only">
            Liste des raccourcis clavier disponibles.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2.5">
          {SHORTCUTS.map(([label, key]) => (
            <div key={key} className="flex items-center justify-between gap-3 text-sm text-soft">
              <span>{label}</span>
              <kbd>{key}</kbd>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-faint">
          Les raccourcis sont désactivés pendant la saisie de texte.
        </p>
      </DialogContent>
    </Dialog>
  );
}
