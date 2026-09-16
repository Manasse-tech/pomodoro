"use client";

import { useState } from "react";
import { Crosshair, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useFocusly } from "@/lib/focusly/store";

export function TasksPanel() {
  const tasks = useFocusly((s) => s.tasks);
  const addTask = useFocusly((s) => s.addTask);
  const toggleTask = useFocusly((s) => s.toggleTask);
  const removeTask = useFocusly((s) => s.removeTask);
  const clearDoneTasks = useFocusly((s) => s.clearDoneTasks);
  const setActiveTask = useFocusly((s) => s.setActiveTask);
  const [value, setValue] = useState("");

  const remaining = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.length - remaining;

  return (
    <section
      aria-label="Tâches"
      className="flex flex-col gap-4 rounded-3xl border bg-card p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-base font-bold tracking-tight">Tâches</h2>
        <span className="text-xs font-semibold text-muted-foreground">
          {remaining} / {tasks.length}
        </span>
      </div>

      <form
        className="flex flex-wrap gap-2"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim()) return;
          addTask(value);
          setValue("");
        }}
      >
        <label htmlFor="task-input" className="sr-only">
          Nouvelle tâche
        </label>
        <Input
          id="task-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ajouter une tâche…"
          maxLength={200}
          className="min-h-11 flex-1 rounded-xl"
        />
        <Button type="submit" className="min-h-11 rounded-xl">
          <Plus className="size-4" /> Ajouter
        </Button>
      </form>

      <ul className="slim-scroll flex max-h-96 list-none flex-col gap-2 overflow-y-auto p-0 m-0">
        {tasks.map((t) => (
          <li
            key={t.id}
            className={`flex items-start gap-2.5 rounded-xl border bg-secondary px-3.5 py-3 transition-opacity ${
              t.done ? "opacity-55" : ""
            } ${t.active ? "border-brand/60 ring-1 ring-brand/40" : ""}`}
          >
            <Checkbox
              checked={t.done}
              onCheckedChange={(v) => toggleTask(t.id, v === true)}
              aria-label={t.done ? "Marquer comme à faire" : "Marquer comme terminée"}
              className="mt-0.5 size-5"
            />
            <span
              className={`min-w-0 flex-1 break-words text-sm leading-relaxed ${
                t.done ? "line-through" : ""
              }`}
            >
              {t.text}
            </span>
            {!t.done && (
              <button
                onClick={() => setActiveTask(t.id)}
                aria-label="Lier au minuteur"
                title="Lier au minuteur"
                className={`transition-colors ${
                  t.active ? "text-brand" : "text-faint hover:text-foreground"
                }`}
              >
                <Crosshair className="size-4" />
              </button>
            )}
            <button
              onClick={() => removeTask(t.id)}
              aria-label={`Supprimer la tâche : ${t.text}`}
              className="text-faint transition-colors hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      {tasks.length === 0 && (
        <div className="rounded-xl border border-dashed px-4 py-6 text-center text-[13.5px] text-faint">
          Aucune tâche pour le moment. Ajoutez-en une pour la lier au minuteur.
        </div>
      )}

      {doneCount > 0 && (
        <Button variant="ghost" size="sm" className="self-start" onClick={clearDoneTasks}>
          Effacer les tâches terminées ({doneCount})
        </Button>
      )}
    </section>
  );
}
