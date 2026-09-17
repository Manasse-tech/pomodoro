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
      <DialogContent className="max-h-[90vh] w-[min(440px,calc(100vw-2rem))] overflow-y-auto rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[13px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Raccourcis clavier
          </DialogTitle>
          <DialogDescription className="sr-only">
            Liste des raccourcis clavier disponibles.
          </DialogDescription>
        </DialogHeader>
        {/* Editorial rhythm (round 11): hairline-divided rows, kbd pinned
           right (shrink-0 so « Ctrl K » never wraps). Global `kbd` styling
           untouched. */}
        <ul className="m-0 flex list-none flex-col divide-y divide-border p-0">
          {SHORTCUTS.map(([label, key]) => (
            <li
              key={key}
              className="flex items-center justify-between gap-3 py-2.5 text-sm text-soft first:pt-0 last:pb-0"
            >
              <span>{label}</span>
              <kbd className="shrink-0">{key}</kbd>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-center text-xs text-faint">
          Les raccourcis sont désactivés pendant la saisie de texte.
        </p>
      </DialogContent>
    </Dialog>
  );
}
