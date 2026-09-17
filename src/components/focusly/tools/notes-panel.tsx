"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Check, Download, Pencil, Plus, Search, StickyNote, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { downloadTextFile } from "@/lib/focusly/csv";
import { useFocusly } from "@/lib/focusly/store";
import { frDateTime, type NoteItem } from "@/lib/focusly/types";

/** Lowercase + strip diacritics — « Élève » matches « eleve » */
function fold(v: string): string {
  return v
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Non-empty whitespace-separated tokens */
function wordCount(v: string): number {
  return v.split(/\s+/).filter((t) => t.length > 0).length;
}

/** Estimated reading time at ~200 words/min, always at least 1 minute */
function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

/** ASCII-folded, hyphenated filename slug — « Élèves & Profs ! » → « eleves-profs » */
function slugify(v: string): string {
  return (
    fold(v)
      .replace(/œ/g, "oe")
      .replace(/æ/g, "ae")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "note"
  );
}

type NoteSort = "recent" | "title";

const NOTE_SORTS: Array<{ value: NoteSort; label: string }> = [
  { value: "recent", label: "Récentes" },
  { value: "title", label: "Titre A–Z" },
];

export function NotesPanel() {
  const notes = useFocusly((s) => s.notes);
  const addNote = useFocusly((s) => s.addNote);
  const updateNote = useFocusly((s) => s.updateNote);
  const removeNote = useFocusly((s) => s.removeNote);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");
  /* sort choice is view-local on purpose (never persisted in the store) */
  const [sort, setSort] = useState<NoteSort>("recent");
  /* inline edit — only one note at a time */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const ordered = useMemo(() => [...notes].reverse(), [notes]);

  const filtered = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return ordered;
    return ordered.filter(
      (n) => fold(n.title).includes(q) || fold(n.body).includes(q),
    );
  }, [ordered, query]);

  /* sort applies on top of the search filter; « Récentes » keeps the current order */
  const sorted = useMemo(() => {
    if (sort === "recent") return filtered;
    return [...filtered].sort((a, b) =>
      a.title.localeCompare(b.title, "fr", { sensitivity: "base" }),
    );
  }, [filtered, sort]);

  const isFiltering = query.trim().length > 0;

  const composerWords = wordCount(body);

  const startEdit = (n: NoteItem) => {
    setEditingId(n.id);
    setEditTitle(n.title);
    setEditBody(n.body);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editingId || !editTitle.trim()) return;
    updateNote(editingId, { title: editTitle, body: editBody });
    setEditingId(null);
    toast.success("Note mise à jour.");
  };

  const exportNote = (n: NoteItem) => {
    if (typeof Blob === "undefined" || typeof URL?.createObjectURL !== "function") {
      toast.error("L’export n’est pas disponible dans ce navigateur.");
      return;
    }
    downloadTextFile(
      `${n.title}\n\n${n.body}\n`,
      `${slugify(n.title)}.txt`,
      "text/plain;charset=utf-8",
    );
    toast.success("Note exportée.");
  };

  return (
    <section
      aria-label="Notes rapides"
      className="flex flex-col gap-4 rounded-3xl border bg-card p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-base font-bold tracking-tight">Notes rapides</h2>
        <span className="text-xs font-semibold text-muted-foreground">
          {isFiltering ? `${filtered.length} / ${notes.length}` : notes.length}
        </span>
      </div>

      {notes.length > 0 && (
        <div className="-mt-1 flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 basis-44">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher dans les notes…"
              aria-label="Rechercher dans les notes"
              className="min-h-10 rounded-xl pl-9 pr-9"
            />
            {isFiltering && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Effacer la recherche"
                className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-faint transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div role="group" aria-label="Trier les notes" className="flex items-center gap-1.5">
            {NOTE_SORTS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={sort === o.value}
                onClick={() => setSort(o.value)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  sort === o.value
                    ? "border-brand/40 bg-brand/15 font-medium text-brand"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        className="flex flex-col gap-2"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addNote(title, body);
          setTitle("");
          setBody("");
        }}
      >
        <label htmlFor="note-title" className="sr-only">
          Titre de la note
        </label>
        <Input
          id="note-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre…"
          maxLength={100}
          className="min-h-11 rounded-xl"
        />
        <label htmlFor="note-body" className="sr-only">
          Contenu de la note
        </label>
        <Textarea
          id="note-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Contenu…"
          maxLength={5000}
          className="min-h-[100px] resize-y rounded-xl"
        />
        {body.length > 0 && (
          /* Decorative live counters — announcing them on every keystroke would
             be noisy for screen readers, so the region is explicitly inert. */
          <p aria-live="off" className="m-0 text-xs text-faint">
            {`${composerWords} ${composerWords > 1 ? "mots" : "mot"} · ${body.length} ${body.length > 1 ? "caractères" : "caractère"}`}
          </p>
        )}
        <Button type="submit" className="min-h-11 rounded-xl active:scale-[0.98]">
          <Plus className="size-4" /> Enregistrer
        </Button>
      </form>

      <ul className="slim-scroll flex max-h-96 list-none flex-col gap-2 overflow-y-auto p-0 m-0">
        {sorted.map((n) => {
          const editing = n.id === editingId;
          return (
            <li
              key={n.id}
              className={`group flex items-start gap-2.5 rounded-xl border px-3.5 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                editing ? "bg-brand/5 ring-1 ring-brand" : "bg-secondary"
              }`}
            >
              {editing ? (
                <form
                  className="flex w-full flex-col gap-2"
                  autoComplete="off"
                  onSubmit={saveEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      cancelEdit();
                    }
                  }}
                >
                  <label htmlFor="note-edit-title" className="sr-only">
                    Titre de la note
                  </label>
                  <Input
                    id="note-edit-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    maxLength={100}
                    className="min-h-11 rounded-xl"
                  />
                  <label htmlFor="note-edit-body" className="sr-only">
                    Contenu de la note
                  </label>
                  <Textarea
                    id="note-edit-body"
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    maxLength={5000}
                    className="min-h-[100px] resize-y rounded-xl"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={!editTitle.trim()}
                      className="min-h-11 flex-1 rounded-xl active:scale-[0.98]"
                    >
                      <Check className="size-4" /> Enregistrer
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEdit}
                      className="min-h-11 rounded-xl"
                    >
                      <X className="size-4" /> Annuler
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{n.title}</div>
                    {n.body && (
                      <div className="mt-0.5 whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-soft">
                        {n.body}
                      </div>
                    )}
                    <div className="mt-1 text-[11px] text-faint">
                      {frDateTime(n.created)}
                      {n.body.length > 0 &&
                        ` · ~${readingMinutes(wordCount(n.body))} min de lecture`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(n)}
                    aria-label={`Modifier la note : ${n.title}`}
                    className="grid size-8 shrink-0 place-items-center rounded-md text-faint transition-all duration-200 hover:bg-accent hover:text-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => exportNote(n)}
                    aria-label={`Exporter la note : ${n.title}`}
                    className="grid size-8 shrink-0 place-items-center rounded-md text-faint transition-all duration-200 hover:bg-accent hover:text-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Download className="size-4" />
                  </button>
                  <button
                    onClick={() => removeNote(n.id)}
                    aria-label={`Supprimer la note : ${n.title}`}
                    className="text-faint transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {isFiltering && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed px-4 py-6 text-center text-[13.5px] text-faint">
          Aucune note ne correspond à «&nbsp;{query.trim()}&nbsp;».
        </div>
      )}

      {notes.length === 0 && (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-6 text-center text-[13.5px] text-faint">
          <StickyNote aria-hidden className="size-5 text-brand" />
          <p className="m-0 text-sm font-medium text-foreground">
            Aucune note pour le moment.
          </p>
          <p className="m-0 text-[13px]">Idées, réflexions, points à revoir…</p>
        </div>
      )}
    </section>
  );
}
