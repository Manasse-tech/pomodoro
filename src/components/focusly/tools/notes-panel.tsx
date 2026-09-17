"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFocusly } from "@/lib/focusly/store";
import { frDateTime } from "@/lib/focusly/types";

/** Lowercase + strip diacritics — « Élève » matches « eleve » */
function fold(v: string): string {
  return v
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function NotesPanel() {
  const notes = useFocusly((s) => s.notes);
  const addNote = useFocusly((s) => s.addNote);
  const removeNote = useFocusly((s) => s.removeNote);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [query, setQuery] = useState("");

  const ordered = useMemo(() => [...notes].reverse(), [notes]);

  const filtered = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return ordered;
    return ordered.filter(
      (n) => fold(n.title).includes(q) || fold(n.body).includes(q),
    );
  }, [ordered, query]);

  const isFiltering = query.trim().length > 0;

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
        <div className="relative -mt-1">
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
        <Button type="submit" className="min-h-11 rounded-xl active:scale-[0.98]">
          <Plus className="size-4" /> Enregistrer
        </Button>
      </form>

      <ul className="slim-scroll flex max-h-96 list-none flex-col gap-2 overflow-y-auto p-0 m-0">
        {filtered.map((n) => (
          <li
            key={n.id}
            className="flex items-start gap-2.5 rounded-xl border bg-secondary px-3.5 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{n.title}</div>
              {n.body && (
                <div className="mt-0.5 whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-soft">
                  {n.body}
                </div>
              )}
              <div className="mt-1 text-[11px] text-faint">{frDateTime(n.created)}</div>
            </div>
            <button
              onClick={() => removeNote(n.id)}
              aria-label={`Supprimer la note : ${n.title}`}
              className="text-faint transition-colors hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      {isFiltering && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed px-4 py-6 text-center text-[13.5px] text-faint">
          Aucune note ne correspond à «&nbsp;{query.trim()}&nbsp;».
        </div>
      )}

      {notes.length === 0 && (
        <div className="rounded-xl border border-dashed px-4 py-6 text-center text-[13.5px] text-faint">
          Aucune note pour le moment. Idées, réflexions, points à revoir…
        </div>
      )}
    </section>
  );
}
