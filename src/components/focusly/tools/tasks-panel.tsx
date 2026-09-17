"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowDownWideNarrow,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crosshair,
  GripVertical,
  Minus,
  Pencil,
  Plus,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFocusly } from "@/lib/focusly/store";
import {
  clampRecurrenceDays,
  daysUntil,
  DEFAULT_RECURRENCE_DAYS,
  frDate,
  frDateShort,
  nextDueDate,
  RECURRENCE_DAYS_MAX,
  RECURRENCE_DAYS_MIN,
  RECURRENCE_LABELS,
  RECURRENCE_SHORT,
  todayKey,
  type TaskItem,
  type TaskRecurrence,
} from "@/lib/focusly/types";

/** Full French date from a local YYYY-MM-DD key — built from local parts, never UTC */
function dueDateLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  return frDate(new Date(y, m - 1, d).getTime());
}

/** View-level filters — « Aujourd’hui » = due today or overdue, « En retard » = overdue only */
type TaskFilter = "toutes" | "aujourdhui" | "retard";

/** Local YYYY-MM-DD key offset by N days from today — same local-parts arithmetic as todayKey
 *  (new Date(y, m-1, d + N) auto-normalizes month/year overflow; never ISO/UTC) */
function dayKeyFromToday(offsetDays: number): string {
  const now = new Date();
  return todayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays));
}

/** Quick-reschedule destinations offered on every task row */
type RescheduleChoice = "today" | "tomorrow" | "week" | "none";

/** Short French confirmation toast for each quick-reschedule choice */
const RESCHEDULE_TOASTS: Record<RescheduleChoice, string> = {
  today: "Tâche reprogrammée pour aujourd’hui.",
  tomorrow: "Tâche reprogrammée pour demain.",
  week: "Tâche reprogrammée dans une semaine.",
  none: "Échéance retirée.",
};

/** Due-date key written by each quick-reschedule choice (day-key format, same as addTask) */
function rescheduleKey(choice: Exclude<RescheduleChoice, "none">): string {
  return dayKeyFromToday(choice === "today" ? 0 : choice === "tomorrow" ? 1 : 7);
}

/**
 * Row-level quick reschedule (closes the R9+R10 « glisser une tâche dans
 * Échéances du jour » need — fast replanning to today, no cross-filter DnD):
 * - overdue to-do → the dominant case is a one-click « back to today », no menu;
 * - every other row → a compact dropdown menu (Aujourd’hui / Demain /
 *   Dans une semaine / Retirer l’échéance). Pure view: mutation happens
 *   through onReschedule so the panel keeps a single updateTask call site.
 * The icon matches the other row icons (size-4, ghost hover); the 44 px hit
 * area comes from symmetric padding cancelled by negative margins, so the
 * visual layout of the row is unchanged and the target stays ≥ 44 px on touch.
 */
function RescheduleControl({
  task,
  onReschedule,
}: {
  task: TaskItem;
  onReschedule: (choice: RescheduleChoice) => void;
}) {
  const dueDays = task.dueDate ? daysUntil(task.dueDate) : null;
  if (!task.done && dueDays !== null && dueDays < 0) {
    return (
      <button
        type="button"
        onClick={() => onReschedule("today")}
        aria-label={`Reprogrammer pour aujourd’hui : ${task.text}`}
        title="Reprogrammer pour aujourd’hui"
        className="grid size-11 -m-3.5 place-items-center text-faint transition-colors hover:text-foreground"
      >
        <CalendarClock className="size-4" />
      </button>
    );
  }
  /* « Aujourd’hui » is pointless when the due date already is today */
  const showToday = !task.dueDate || (dueDays !== null && dueDays !== 0);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Reprogrammer : ${task.text}`}
          title="Reprogrammer"
          className="grid size-11 -m-3.5 place-items-center text-faint transition-colors hover:text-foreground"
        >
          <CalendarClock className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {showToday && (
          <DropdownMenuItem className="justify-between" onSelect={() => onReschedule("today")}>
            <span>Aujourd’hui</span>
            <span aria-hidden className="text-xs text-faint">
              {frDateShort(dayKeyFromToday(0))}
            </span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="justify-between" onSelect={() => onReschedule("tomorrow")}>
          <span>Demain</span>
          <span aria-hidden className="text-xs text-faint">
            {frDateShort(dayKeyFromToday(1))}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem className="justify-between" onSelect={() => onReschedule("week")}>
          <span>Dans une semaine</span>
          <span aria-hidden className="text-xs text-faint">
            {frDateShort(dayKeyFromToday(7))}
          </span>
        </DropdownMenuItem>
        {task.dueDate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onReschedule("none")}>
              Retirer l’échéance
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const TASK_FILTERS: Array<{ value: TaskFilter; label: string }> = [
  { value: "toutes", label: "Toutes" },
  { value: "aujourdhui", label: "Aujourd’hui" },
  { value: "retard", label: "En retard" },
];

/** Compact recurrence selector — « Aucune / Quotid. / Ouvrés / Hebdo / X j » chips (add form + inline edit) */
function RecurrencePicker({
  value,
  onChange,
  label,
  days,
  onDaysChange,
}: {
  value: TaskRecurrence | null;
  onChange: (next: TaskRecurrence | null) => void;
  label: string;
  /** Interval in days for the « custom » recurrence (2–365) */
  days: number;
  onDaysChange: (next: number) => void;
}) {
  /* Raw text while typing — partial input (« 1 » en route to « 12 ») must not be clamped mid-keystroke */
  const [rawDays, setRawDays] = useState<string | null>(null);

  /* Derived from RECURRENCE_SHORT so every recurrence kind gets its pill automatically */
  const options: Array<{ value: TaskRecurrence | null; label: string }> = [
    { value: null, label: "Aucune" },
    ...(Object.entries(RECURRENCE_SHORT) as Array<[TaskRecurrence, string]>).map(
      ([v, l]) => ({
        value: v,
        // Once selected, the custom pill echoes the live interval (e.g. « 3 j »)
        label: v === "custom" && value === "custom" ? `${days} j` : l,
      }),
    ),
  ];

  const commitDays = (text: string) => {
    const n = Number.parseInt(text, 10);
    if (Number.isFinite(n)) onDaysChange(clampRecurrenceDays(n));
  };

  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <span aria-hidden className="text-[11px] text-faint">
        Répétition
      </span>
      {options.map((o) => (
        <button
          key={o.value ?? "none"}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
            value === o.value
              ? "border-brand/40 bg-brand/15 font-medium text-brand"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
      {value === "custom" && (
        <label
          title="Répéter tous les N jours (2 à 365)"
          className="inline-flex items-center gap-1 rounded-full border border-brand/40 bg-brand/15 px-2.5 py-1 text-xs font-medium text-brand"
        >
          <span aria-hidden>Tous les</span>
          <input
            type="number"
            inputMode="numeric"
            min={RECURRENCE_DAYS_MIN}
            max={RECURRENCE_DAYS_MAX}
            step={1}
            value={rawDays ?? String(days)}
            aria-label="Nombre de jours entre chaque répétition, entre 2 et 365"
            onChange={(e) => {
              setRawDays(e.target.value);
              commitDays(e.target.value);
            }}
            onBlur={() => setRawDays(null)}
            className="tnum w-11 rounded-full bg-transparent text-center text-xs font-semibold text-brand outline-none [appearance:textfield] focus-visible:ring-2 focus-visible:ring-brand/60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span aria-hidden>jours</span>
        </label>
      )}
    </div>
  );
}

export function TasksPanel() {
  const tasks = useFocusly((s) => s.tasks);
  const addTask = useFocusly((s) => s.addTask);
  const updateTask = useFocusly((s) => s.updateTask);
  const toggleTask = useFocusly((s) => s.toggleTask);
  const removeTask = useFocusly((s) => s.removeTask);
  const clearDoneTasks = useFocusly((s) => s.clearDoneTasks);
  const setActiveTask = useFocusly((s) => s.setActiveTask);
  const setTaskEstimate = useFocusly((s) => s.setTaskEstimate);
  const moveTask = useFocusly((s) => s.moveTask);
  const moveTaskTo = useFocusly((s) => s.moveTaskTo);
  const [value, setValue] = useState("");
  const [estimate, setEstimate] = useState(1);
  const [dueDate, setDueDate] = useState("");
  const [recurrence, setRecurrence] = useState<TaskRecurrence | null>(null);
  const [recDays, setRecDays] = useState(DEFAULT_RECURRENCE_DAYS);
  /* inline edit — only one task at a time */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editRec, setEditRec] = useState<TaskRecurrence | null>(null);
  const [editDays, setEditDays] = useState(DEFAULT_RECURRENCE_DAYS);
  /* drag-and-drop reorder state (id of the dragged task / hovered target) */
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  /* view-level filter — never reorders or mutates the store */
  const [filter, setFilter] = useState<TaskFilter>("toutes");

  /* PWA shortcut « /?tache=nouvelle#outils » — focus the new-task input once, then clean the URL */
  const newTaskInputRef = useRef<HTMLInputElement | null>(null);
  const deepLinkFired = useRef(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tache") !== "nouvelle") return;
    const id = window.setTimeout(() => {
      if (deepLinkFired.current) return;
      deepLinkFired.current = true;
      newTaskInputRef.current?.focus();
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    }, 400);
    return () => window.clearTimeout(id);
  }, []);

  const remaining = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.length - remaining;
  const plannedTotal = tasks.reduce((a, t) => a + (t.done ? 0 : t.estimate ?? 1), 0);
  const spentTotal = tasks.reduce((a, t) => a + (t.done ? 0 : t.spent ?? 0), 0);

  /* « Aujourd’hui » keeps due-today + overdue, « En retard » only overdue — done tasks included */
  const visibleTasks =
    filter === "toutes"
      ? tasks
      : tasks.filter((t) => {
          if (!t.dueDate) return false;
          const d = daysUntil(t.dueDate);
          return filter === "aujourdhui" ? d <= 0 : d < 0;
        });

  /* Sectioned « Aujourd’hui » view — the three groups partition visibleTasks exactly */
  const overdueTasks = visibleTasks.filter(
    (t) => !t.done && t.dueDate && daysUntil(t.dueDate) < 0,
  );
  const dueTodayTasks = visibleTasks.filter(
    (t) => !t.done && t.dueDate && daysUntil(t.dueDate) === 0,
  );
  const doneInView = visibleTasks.filter((t) => t.done);

  const clearDrag = () => {
    setDragId(null);
    setOverId(null);
  };

  const startTaskEdit = (t: TaskItem) => {
    setEditingId(t.id);
    setEditText(t.text);
    setEditDue(t.dueDate ?? "");
    setEditRec(t.recurrence ?? null);
    setEditDays(t.recurrenceDays ?? DEFAULT_RECURRENCE_DAYS);
  };

  const cancelTaskEdit = () => setEditingId(null);

  /**
   * Quick reschedule (R9+R10 follow-up — « replanifier vite vers aujourd’hui »):
   * writes a fresh due-date day key (or clears it) through the existing
   * updateTask patch. Recurrence is untouched by the partial patch, so a
   * rescheduled recurring task keeps spawning — anchored on its NEW due date.
   */
  const rescheduleTask = (id: string, choice: RescheduleChoice) => {
    updateTask(id, choice === "none" ? { dueDate: "" } : { dueDate: rescheduleKey(choice) });
    toast.success(RESCHEDULE_TOASTS[choice]);
  };

  const saveTaskEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingId || !editText.trim()) return;
    // dueDate "" clears the due date, editRec null clears the recurrence (store contract);
    // the custom interval is saved only when the recurrence is « custom », cleared otherwise
    updateTask(editingId, {
      text: editText,
      dueDate: editDue,
      recurrence: editRec,
      recurrenceDays: editRec === "custom" ? editDays : null,
    });
    setEditingId(null);
    toast.success("Tâche mise à jour.");
  };

  /** One-shot sort: due dates first (ascending, YYYY-MM-DD keys sort chronologically), stable otherwise */
  const sortByDueDate = () => {
    if (!tasks.some((t) => t.dueDate)) {
      toast.info("Aucune échéance définie.");
      return;
    }
    useFocusly.setState((s) => {
      const withDue = s.tasks.filter((t) => t.dueDate);
      const without = s.tasks.filter((t) => !t.dueDate);
      withDue.sort((a, b) => {
        const ka = a.dueDate ?? "";
        const kb = b.dueDate ?? "";
        if (ka === kb) return 0;
        return ka < kb ? -1 : 1;
      });
      return { tasks: [...withDue, ...without] };
    });
    toast.success("Tâches triées par échéance.");
  };

  /** One task row — shared by the flat list and the sectioned « Aujourd’hui » view */
  const renderTask = (t: TaskItem) => {
    const editing = t.id === editingId;
    const due = t.dueDate ?? null;
    const dueDays = due ? daysUntil(due) : null;
    /* chevron bounds follow the store order — the filter is view-level only */
    const storeIndex = tasks.findIndex((x) => x.id === t.id);
    return (
      <li
        key={t.id}
        draggable={!editing}
        onDragStart={(e) => {
          setDragId(t.id);
          e.dataTransfer.effectAllowed = "move";
          try {
            e.dataTransfer.setData("text/plain", t.id);
          } catch {
            /* some engines forbid setData — the local state is enough */
          }
        }}
        onDragEnd={clearDrag}
        onDragOver={(e) => {
          if (t.done) {
            // Never drop onto a completed task (keeps to-do / done zones separate)
            e.dataTransfer.dropEffect = "none";
            return;
          }
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setOverId((v) => (dragId && dragId !== t.id ? t.id : v));
        }}
        onDragLeave={() => setOverId((v) => (v === t.id ? null : v))}
        onDrop={(e) => {
          e.preventDefault();
          if (t.done || !dragId || dragId === t.id) {
            clearDrag();
            return;
          }
          moveTaskTo(dragId, t.id);
          clearDrag();
        }}
        className={`flex flex-wrap items-start gap-x-2 gap-y-2 rounded-xl border px-3 py-3 transition-[opacity,box-shadow,border-color,transform] duration-150 ${
          editing ? "bg-brand/5 ring-1 ring-brand" : "bg-secondary"
        } ${t.done ? "opacity-55" : ""} ${
          !editing && t.active ? "border-brand/60 ring-1 ring-brand/40" : ""
        } ${dragId === t.id ? "scale-[0.99] opacity-40" : ""} ${
          overId === t.id && dragId !== t.id ? "border-brand/70 ring-2 ring-brand/35" : ""
        } ${dragId && t.done ? "cursor-not-allowed" : ""}`}
      >
        {editing ? (
          <form
            className="flex w-full flex-col gap-2"
            autoComplete="off"
            onSubmit={saveTaskEdit}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                cancelTaskEdit();
              }
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor={`task-edit-text-${t.id}`} className="sr-only">
                Texte de la tâche
              </label>
              <Input
                id={`task-edit-text-${t.id}`}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                maxLength={200}
                className="min-h-11 min-w-[140px] flex-1 rounded-xl"
              />
              <Input
                type="date"
                value={editDue}
                onChange={(e) => setEditDue(e.target.value)}
                aria-label="Échéance de la tâche"
                className="h-11 w-[122px] rounded-xl border bg-secondary/60 px-2 text-xs [color-scheme:light] dark:bg-secondary/60 dark:[color-scheme:dark] sm:h-9"
              />
              {editDue && (
                <button
                  type="button"
                  onClick={() => setEditDue("")}
                  aria-label="Retirer l’échéance"
                  title="Retirer l’échéance"
                  className="grid size-8 place-items-center rounded-md text-faint transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <RecurrencePicker
              value={editRec}
              onChange={setEditRec}
              label="Répétition de la tâche"
              days={editDays}
              onDaysChange={setEditDays}
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={!editText.trim()}
                className="min-h-11 flex-1 rounded-xl active:scale-[0.98]"
              >
                <Check className="size-4" /> Enregistrer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={cancelTaskEdit}
                className="min-h-11 rounded-xl"
              >
                <X className="size-4" /> Annuler
              </Button>
            </div>
          </form>
        ) : (
          <>
            <GripVertical
              aria-hidden
              className="mt-0.5 size-4 shrink-0 cursor-grab text-faint/60 transition-colors hover:text-muted-foreground active:cursor-grabbing"
            />
            <Checkbox
              checked={t.done}
              onCheckedChange={(v) => {
                const nextDone = v === true;
                if (nextDone && !t.done && t.recurrence) {
                  toggleTask(t.id, true);
                  toast.info(
                    `Prochaine occurrence planifiée : ${frDateShort(
                      nextDueDate(t.dueDate, t.recurrence, t.recurrenceDays),
                    )}`,
                  );
                } else {
                  toggleTask(t.id, nextDone);
                }
              }}
              aria-label={t.done ? "Marquer comme à faire" : "Marquer comme terminée"}
              className="mt-0.5 size-5"
            />
            <span
              className={`min-w-[140px] flex-1 basis-[140px] break-words text-sm leading-relaxed ${
                t.done ? "line-through" : ""
              }`}
            >
              {t.text}
            </span>
            {due && dueDays !== null && (
              <span
                title={`Échéance : ${dueDateLabel(due)}`}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                  dueDays < 0
                    ? "border-destructive/30 bg-destructive/15 text-destructive"
                    : dueDays === 0
                      ? "border-brand/30 bg-brand/15 text-brand"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                {dueDays === 0 ? (
                  <CalendarClock className="size-[11px]" />
                ) : (
                  <Calendar className="size-[11px]" />
                )}
                {frDateShort(due)}
              </span>
            )}
            {t.recurrence && (
              <span
                title={
                  t.recurrence === "custom"
                    ? `Répétition tous les ${t.recurrenceDays ?? DEFAULT_RECURRENCE_DAYS} jours`
                    : `Répétition ${RECURRENCE_LABELS[t.recurrence].toLowerCase()}`
                }
                className="inline-flex shrink-0 items-center gap-1 rounded-full border bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                <Repeat className="size-3" />
                {t.recurrence === "custom"
                  ? `${t.recurrenceDays ?? DEFAULT_RECURRENCE_DAYS} j`
                  : RECURRENCE_SHORT[t.recurrence]}
              </span>
            )}
            <RescheduleControl task={t} onReschedule={(choice) => rescheduleTask(t.id, choice)} />
            {!t.done && (
              <div
                role="group"
                aria-label={`Estimation de la tâche : ${t.text}`}
                className="flex shrink-0 items-center gap-0.5 rounded-lg border bg-background/60"
              >
                <button
                  type="button"
                  aria-label="Diminuer l’estimation"
                  onClick={() => setTaskEstimate(t.id, (t.estimate ?? 1) - 1)}
                  disabled={(t.estimate ?? 1) <= 1}
                  className="grid size-6 place-items-center rounded-l-md text-faint transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Minus className="size-3" />
                </button>
                <span
                  title={`Estimation : ${t.estimate ?? 1} pomodoro${(t.estimate ?? 1) > 1 ? "s" : ""} · Effectués : ${t.spent ?? 0}`}
                  className={`w-9 text-center text-[11px] font-semibold tabular-nums ${
                    (t.spent ?? 0) >= (t.estimate ?? 1) ? "text-brand" : "text-muted-foreground"
                  }`}
                >
                  {t.spent ?? 0}/{t.estimate ?? 1}
                </span>
                <button
                  type="button"
                  aria-label="Augmenter l’estimation"
                  onClick={() => setTaskEstimate(t.id, (t.estimate ?? 1) + 1)}
                  disabled={(t.estimate ?? 1) >= 12}
                  className="grid size-6 place-items-center rounded-r-md text-faint transition-colors hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Plus className="size-3" />
                </button>
              </div>
            )}
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
              type="button"
              onClick={() => startTaskEdit(t)}
              aria-label={`Modifier la tâche : ${t.text}`}
              title="Modifier la tâche"
              className="text-faint transition-colors hover:text-foreground"
            >
              <Pencil className="size-4" />
            </button>
            <button
              onClick={() => removeTask(t.id)}
              aria-label={`Supprimer la tâche : ${t.text}`}
              className="text-faint transition-colors hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
            {tasks.length > 1 && (
              <div
                role="group"
                aria-label={`Déplacer la tâche : ${t.text}`}
                className="flex shrink-0 flex-col gap-0.5"
              >
                <button
                  type="button"
                  onClick={() => moveTask(t.id, -1)}
                  disabled={storeIndex === 0}
                  aria-label={`Monter la tâche : ${t.text}`}
                  className="grid size-4 place-items-center text-faint transition-colors hover:text-foreground disabled:opacity-25 disabled:hover:text-faint"
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveTask(t.id, 1)}
                  disabled={storeIndex === tasks.length - 1}
                  aria-label={`Descendre la tâche : ${t.text}`}
                  className="grid size-4 place-items-center text-faint transition-colors hover:text-foreground disabled:opacity-25 disabled:hover:text-faint"
                >
                  <ChevronDown className="size-3.5" />
                </button>
              </div>
            )}
            {t.done && t.recurrence && (
              <p className="w-full text-xs text-faint">
                Prochaine occurrence : {frDateShort(nextDueDate(t.dueDate, t.recurrence, t.recurrenceDays))}
              </p>
            )}
          </>
        )}
      </li>
    );
  };

  return (
    <section
      aria-label="Tâches"
      className="flex flex-col gap-4 rounded-3xl border bg-card p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 text-base font-bold tracking-tight">Tâches</h2>
        <div className="flex items-center gap-1.5">
          {tasks.length >= 2 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={sortByDueDate}
              className="text-muted-foreground"
            >
              <ArrowDownWideNarrow className="size-4" />
              Trier par échéance
            </Button>
          )}
          <span className="text-xs font-semibold text-muted-foreground">
            {remaining} / {tasks.length}
          </span>
          {filter !== "toutes" && (
            <span className="text-xs text-faint">
              · {visibleTasks.length} affichée{visibleTasks.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div
        role="group"
        aria-label="Filtrer les tâches"
        className="-mt-2 flex flex-wrap items-center gap-1.5"
      >
        {TASK_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
              filter === f.value
                ? "border-brand/40 bg-brand/15 font-medium text-brand"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {tasks.length > 0 && remaining > 0 && (
        <p className="-mt-2 text-[11.5px] text-faint" aria-live="polite">
          Progression : {spentTotal} sur {plannedTotal} pomodoro{plannedTotal > 1 ? "s" : ""}{" "}
          estimé{plannedTotal > 1 ? "s" : ""} — tâches en cours
        </p>
      )}

      <form
        className="flex flex-wrap gap-2"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          if (!value.trim()) return;
          addTask(
            value,
            estimate,
            dueDate,
            recurrence ?? undefined,
            recurrence === "custom" ? recDays : undefined,
          );
          setValue("");
          setEstimate(1);
          setDueDate("");
          setRecurrence(null);
          setRecDays(DEFAULT_RECURRENCE_DAYS);
        }}
      >
        <label htmlFor="task-input" className="sr-only">
          Nouvelle tâche
        </label>
        <Input
          ref={newTaskInputRef}
          id="task-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ajouter une tâche…"
          maxLength={200}
          className="min-h-11 min-w-[200px] flex-1 rounded-xl"
        />
        <div
          role="group"
          aria-label="Estimation en pomodoros"
          className="flex items-center rounded-xl border bg-secondary"
        >
          <button
            type="button"
            aria-label="Diminuer l’estimation"
            onClick={() => setEstimate((v) => Math.max(1, v - 1))}
            disabled={estimate <= 1}
            className="grid size-9 place-items-center rounded-l-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-35 disabled:hover:bg-transparent"
          >
            <Minus className="size-3.5" />
          </button>
          <span
            aria-live="polite"
            title={`${estimate} pomodoro${estimate > 1 ? "s" : ""} estimé${estimate > 1 ? "s" : ""}`}
            className="w-9 text-center text-[13px] font-semibold tabular-nums"
          >
            {estimate}
          </span>
          <button
            type="button"
            aria-label="Augmenter l’estimation"
            onClick={() => setEstimate((v) => Math.min(12, v + 1))}
            disabled={estimate >= 12}
            className="grid size-9 place-items-center rounded-r-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-35 disabled:hover:bg-transparent"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-label="Échéance (optionnelle)"
          className="h-9 w-[122px] rounded-xl border bg-secondary/60 px-2 text-xs [color-scheme:light] dark:bg-secondary/60 dark:[color-scheme:dark]"
        />
        <RecurrencePicker
          value={recurrence}
          onChange={setRecurrence}
          label="Répétition de la nouvelle tâche"
          days={recDays}
          onDaysChange={setRecDays}
        />
        <Button type="submit" className="min-h-11 rounded-xl active:scale-[0.98]">
          <Plus className="size-4" /> Ajouter
        </Button>
      </form>

      {filter === "aujourdhui" ? (
        /* Sectioned « Aujourd’hui » — overdue first, then today's due dates, then done.
           Empty sections are never rendered (no header without content). */
        <div className="slim-scroll flex max-h-96 flex-col gap-4 overflow-y-auto">
          {overdueTasks.length > 0 && (
            <section aria-labelledby="tasks-overdue-heading" className="flex flex-col gap-2">
              <h3
                id="tasks-overdue-heading"
                className="m-0 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint"
              >
                <span aria-hidden className="size-1.5 rounded-full bg-destructive/70" />
                En retard · {overdueTasks.length}
              </h3>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {overdueTasks.map(renderTask)}
              </ul>
            </section>
          )}
          {dueTodayTasks.length > 0 && (
            <section aria-labelledby="tasks-today-heading" className="flex flex-col gap-2">
              <h3
                id="tasks-today-heading"
                className="m-0 text-[11px] font-semibold uppercase tracking-wide text-faint"
              >
                Échéances du jour · {dueTodayTasks.length}
              </h3>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {dueTodayTasks.map(renderTask)}
              </ul>
            </section>
          )}
          {doneInView.length > 0 && (
            <section aria-labelledby="tasks-done-heading" className="flex flex-col gap-2">
              <h3
                id="tasks-done-heading"
                className="m-0 text-[11px] font-semibold uppercase tracking-wide text-faint"
              >
                Terminées · {doneInView.length}
              </h3>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {doneInView.map(renderTask)}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <ul className="slim-scroll flex max-h-96 list-none flex-col gap-2 overflow-y-auto p-0 m-0">
          {visibleTasks.map(renderTask)}
        </ul>
      )}

      {tasks.length === 0 && (
        <div className="rounded-xl border border-dashed px-4 py-6 text-center text-[13.5px] text-faint">
          Aucune tâche pour le moment. Ajoutez-en une pour la lier au minuteur.
        </div>
      )}

      {tasks.length > 0 && visibleTasks.length === 0 && filter !== "toutes" && (
        filter === "retard" ? (
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-6 text-center text-[13.5px] text-faint">
            <CheckCircle2 aria-hidden className="size-5 text-brand" />
            Aucune tâche en retard. Vous êtes à jour.
          </div>
        ) : (
          <div className="rounded-xl border border-dashed px-4 py-6 text-center text-[13.5px] text-faint">
            Rien de prévu aujourd’hui. Profitez-en ou planifiez une échéance.
          </div>
        )
      )}

      {doneCount > 0 && (
        <Button variant="ghost" size="sm" className="self-start" onClick={clearDoneTasks}>
          Effacer les tâches terminées ({doneCount})
        </Button>
      )}
    </section>
  );
}
