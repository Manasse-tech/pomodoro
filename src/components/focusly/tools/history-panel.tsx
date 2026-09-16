"use client";

import { useRef } from "react";
import { Download, Trash2, Upload } from "lucide-react";
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
import { useFocusly } from "@/lib/focusly/store";
import { frDateTime, MODE_LABELS, todayKey } from "@/lib/focusly/types";

export function HistoryPanel() {
  const history = useFocusly((s) => s.history);
  const clearHistory = useFocusly((s) => s.clearHistory);
  const exportData = useFocusly((s) => s.exportData);
  const importData = useFocusly((s) => s.importData);
  const fileRef = useRef<HTMLInputElement>(null);

  const ordered = [...history].reverse();

  const doExport = () => {
    try {
      const blob = new Blob([exportData()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `focusly-export-${todayKey()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Export téléchargé.");
    } catch {
      toast.error("L'export a échoué.");
    }
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = importData(String(reader.result ?? ""));
      if (res.ok) toast.success("Import réussi. Vos données ont été fusionnées.");
      else toast.error(res.error ?? "Import impossible.");
    };
    reader.onerror = () => toast.error("Fichier illisible.");
    reader.readAsText(file);
  };

  return (
    <section
      aria-label="Historique des sessions"
      className="flex flex-col gap-4 rounded-3xl border bg-card p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-base font-bold tracking-tight">Historique des sessions</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" className="rounded-lg" onClick={doExport}>
            <Download className="size-3.5" /> Exporter (JSON)
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-lg"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-3.5" /> Importer
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) doImport(f);
              e.target.value = "";
            }}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={history.length === 0}
              >
                <Trash2 className="size-3.5" /> Effacer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Effacer tout l&apos;historique ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Les {history.length} sessions enregistrées seront définitivement supprimées de
                  votre appareil. Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => {
                    clearHistory();
                    toast.success("Historique effacé.");
                  }}
                >
                  Effacer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <ul className="slim-scroll flex max-h-96 list-none flex-col gap-2 overflow-y-auto p-0 m-0">
        {ordered.map((h) => (
          <li
            key={h.id}
            className="flex items-start gap-2.5 rounded-xl border bg-secondary px-3.5 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">
                {MODE_LABELS[h.mode] ?? h.mode} · {Math.round(h.duration)} min
              </div>
              <div className="mt-0.5 text-[11px] text-faint">{frDateTime(h.date)}</div>
            </div>
          </li>
        ))}
      </ul>

      {history.length === 0 && (
        <div className="rounded-xl border border-dashed px-4 py-6 text-center text-[13.5px] text-faint">
          Aucune session enregistrée. Terminez un Pomodoro pour alimenter l&apos;historique.
        </div>
      )}
    </section>
  );
}
