"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BLOG_POSTS } from "@/lib/focusly/blog";
import { frDate } from "@/lib/focusly/types";
import { Breadcrumb } from "./breadcrumb";

/* .lift (r7-d) remplace l’ancien trio transition-all/hover — même traitement
   que les cartes de l’accueil. .fade-up-soft (r9) : entrée en cascade sans
   fill « forwards », sinon l’animation écraserait le :hover de .lift. */
const CARD_CLASS = "group flex h-full flex-col rounded-2xl border bg-card p-5 lift";

/** Entrée en cascade plafonnée à 3 niveaux de délai (recommence à la rangée suivante). */
const FADE_STEPS: readonly string[] = ["", " fade-up-1", " fade-up-2"];

const CHIP_SHAPE =
  "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors";
const CHIP_ACTIVE = `${CHIP_SHAPE} bg-brand text-[#14161a]`;
const CHIP_INACTIVE = `${CHIP_SHAPE} border bg-card text-soft hover:text-foreground`;

/** Unique tags, in first-appearance order. */
const TAGS: string[] = [...new Set(BLOG_POSTS.map((p) => p.tag))];

/** Case-insensitive and accent-insensitive form of a string. */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function BlogView() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = fold(query.trim());
    return BLOG_POSTS.filter((post) => {
      if (activeTag !== null && post.tag !== activeTag) return false;
      if (!needle) return true;
      return (
        fold(post.title).includes(needle) ||
        fold(post.excerpt).includes(needle) ||
        fold(post.tag).includes(needle)
      );
    });
  }, [query, activeTag]);

  const isFiltering = query.trim() !== "" || activeTag !== null;

  /** Switching tag resets the filters state: query cleared, new tag applied. */
  const switchTag = (tag: string | null) => {
    setQuery("");
    setActiveTag(tag);
  };

  const resetFilters = () => {
    setQuery("");
    setActiveTag(null);
  };

  return (
    <div className="mx-auto w-full max-w-[920px] px-5 py-8 sm:py-10">
      <Breadcrumb
        items={[{ label: "Accueil", href: "accueil" }, { label: "Blog" }]}
      />
      <h1 className="fade-up text-3xl font-bold tracking-tight sm:text-4xl">
        Le blog de Focusly
      </h1>
      <p className="fade-up fade-up-1 mt-3 text-[17px] text-muted-foreground">
        Articles et guides sur la concentration, la productivité et la gestion
        du temps.
      </p>

      {/* Barre d’outils : recherche + filtre par tag (collante au défilement sur écran large) */}
      <div className="fade-up-soft fade-up-2 mt-8 sm:sticky sm:top-[65px] sm:z-20 sm:-mb-4 sm:bg-background/95 sm:pb-4 sm:backdrop-blur-sm">
        <div className="relative max-w-[380px]">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un article…"
            aria-label="Rechercher un article"
            className="pl-9"
          />
        </div>

        <div
          className="mt-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrer par tag"
        >
          <button
            type="button"
            onClick={() => switchTag(null)}
            aria-pressed={activeTag === null}
            className={activeTag === null ? CHIP_ACTIVE : CHIP_INACTIVE}
          >
            Tous
          </button>
          {TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => switchTag(tag)}
              aria-pressed={activeTag === tag}
              className={activeTag === tag ? CHIP_ACTIVE : CHIP_INACTIVE}
            >
              {tag}
            </button>
          ))}
        </div>

        <p aria-live="polite" className="tnum mt-4 text-[13px] text-faint">
          {isFiltering
            ? `${filtered.length} article${filtered.length > 1 ? "s" : ""} trouvé${filtered.length > 1 ? "s" : ""}`
            : `${BLOG_POSTS.length} articles`}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="fade-up mt-4 rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun article ne correspond à votre recherche.
          </p>
          <Button variant="ghost" className="press mt-4" onClick={resetFilters}>
            Réinitialiser les filtres
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post, i) => (
            <Link
              key={post.slug}
              href={`#blog/${post.slug}`}
              className={`${CARD_CLASS} fade-up-soft${FADE_STEPS[i % 3]}`}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand">
                {post.tag}
              </span>
              <h2 className="mt-2 text-[17px] font-semibold tracking-tight">
                {post.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-2 pt-4">
                <Badge variant="secondary" className="tnum">
                  ~{post.readMinutes} min de lecture
                </Badge>
                <span className="tnum text-[12px] text-faint">
                  {frDate(post.date)}
                </span>
                <ArrowRight
                  className="ml-auto size-4 text-faint transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand"
                  aria-hidden
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
