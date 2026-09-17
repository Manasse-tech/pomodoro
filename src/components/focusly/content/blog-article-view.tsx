"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, ListTree } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BLOG_POSTS, type BlogPost } from "@/lib/focusly/blog";
import { frDate } from "@/lib/focusly/types";
import {
  ArticleBlocks,
  collectHeadings,
  type HeadingRef,
} from "./article-blocks";
import { Breadcrumb } from "./breadcrumb";
import { NotView } from "./not-found-view";

/* Cartes précédent/suivant : .lift (r7-d), même élévation que les cartes
   du blog et de l’accueil (pas d’animation d’entrée : hors du premier écran). */
const NAV_CARD_CLASS = "group block rounded-2xl border bg-card p-4 lift";

/* Dégagement sous le header sticky (≈64px) + air : sert de bande au
   scroll-spy (rootMargin) et de scroll-margin-top sur les cibles
   (globals.css, bloc round 10). */
const HEADER_CLEARANCE = 88;

/** Shorten long titles for the breadcrumb trail. */
function truncate(text: string, max = 34): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/**
 * Navigation vers une section : location.hash EST le routeur (hash-based) —
 * un href="#section" natif serait interprété comme une route inconnue
 * (page introuvable). On intercepte donc le clic (href conservé pour
 * l’accessibilité : copie, lecteurs d’écran, navigation clavier) et on
 * défile nous-mêmes. scroll-margin-top (CSS round 10) place la cible sous
 * le header ; scrollIntoView le respecte.
 */
function followHeading(event: MouseEvent<HTMLAnchorElement>, id: string): void {
  event.preventDefault();
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

/**
 * État de lecture : progression de l’article + section active pour le
 * sommaire. Monté uniquement sur une vue d’article valide.
 */
function useArticleReading(tocIds: string[]) {
  const articleRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);

  /* Progression : scroll passif + throttle rAF (une mesure par frame).
     0 quand le haut de l’article atteint le haut du viewport, 1 quand son
     bas atteint le bas du viewport. Aucune écriture de style ici : la barre
     n’anime que transform: scaleX (zéro reflow). */
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const ratio =
        span > 40
          ? Math.min(Math.max(-rect.top / span, 0), 1)
          : rect.top < 0
            ? 1
            : 0;
      setProgress(ratio);
      // Fin de page : la dernière section peut être trop courte pour
      // atteindre la bande d’observation → on la force active.
      if (
        tocIds.length > 0 &&
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2
      ) {
        setActiveId(tocIds[tocIds.length - 1]);
      }
    };
    const schedule = () => {
      if (raf === 0) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (raf !== 0) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [tocIds]);

  /* Scroll-spy : IntersectionObserver avec une bande horizontale qui
     commence SOUS le header sticky (rootMargin haut négatif) et s’arrête
     au tiers du viewport. Le titre le plus haut présent dans la bande
     devient la section active (aria-current côté liens). */
  useEffect(() => {
    if (tocIds.length === 0) return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        for (const id of tocIds) {
          if (visible.has(id)) {
            setActiveId(id);
            break;
          }
        }
      },
      {
        rootMargin: `-${HEADER_CLEARANCE}px 0px -66% 0px`,
        threshold: 0,
      },
    );
    for (const id of tocIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [tocIds]);

  return { articleRef, progress, activeId };
}

/** Liste des entrées du sommaire (partagée : aside desktop + details mobile). */
function TocLinks({
  headings,
  activeId,
  onFollow,
}: {
  headings: HeadingRef[];
  activeId: string | undefined;
  onFollow: (event: MouseEvent<HTMLAnchorElement>, id: string) => void;
}) {
  return (
    <ul>
      {headings.map((h) => (
        <li key={h.id}>
          <a
            href={`#${h.id}`}
            aria-current={activeId === h.id ? "true" : undefined}
            onClick={(event) => onFollow(event, h.id)}
            className={h.level === 3 ? "toc-link toc-link-l3" : "toc-link"}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

function ArticleScreen({
  post,
  prev,
  next,
}: {
  post: BlogPost;
  prev?: BlogPost;
  next?: BlogPost;
}) {
  /* Sommaire dérivé du MÊME tableau de blocs que ArticleBlocks → ids
     identiques (collectHeadings/headingIds, round 10). */
  const headings = useMemo(() => collectHeadings(post.content), [post.content]);
  const tocIds = useMemo(() => headings.map((h) => h.id), [headings]);
  const { articleRef, progress, activeId } = useArticleReading(tocIds);
  const mobileTocRef = useRef<HTMLDetailsElement | null>(null);

  /* Sur mobile, on referme le sommaire AVANT le défilement : si on le
     refermait après, la hauteur libérée décalerait la cible pendant
     l'animation et le scroll atterrirait trop haut (vérifié en navigateur :
     cible à -145px au lieu de +88px). Refermer d'abord → scrollIntoView
     calcule la position finale (le layout est recalculé à l'appel). */
  const followAndClose = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    mobileTocRef.current?.removeAttribute("open");
    followHeading(event, id);
  };

  return (
    <>
      {/* Barre de progression de lecture — décorative (l’article n’est pas
          une tâche) : piste fixe plein écran au-dessus du header (z-60),
          remplissage transform-only scaleX (voir globals.css round 10).
          Montée uniquement ici → naturellement absente des autres routes. */}
      <div className="read-progress-track" aria-hidden="true">
        <div
          className="read-progress-bar"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      <div className="mx-auto w-full max-w-[920px] px-5 py-8 sm:py-10">
        <Breadcrumb
          items={[
            { label: "Accueil", href: "accueil" },
            { label: "Blog", href: "blog" },
            { label: truncate(post.title) },
          ]}
        />
        {/* Article + sommaire : à partir de lg, l’article (720px, mesure de
            lecture inchangée) laisse sa colonne de droite au sommaire sticky. */}
        <div className="lg:grid lg:grid-cols-[minmax(0,720px)_minmax(0,1fr)] lg:gap-6">
          <article ref={articleRef} className="prose-article max-w-[720px]">
            <h1 className="fade-up text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {post.title}
            </h1>
            {/* Filet décoratif de marque, aligné sur le guide (aria-hidden) */}
            <div
              className="fade-up fade-up-1 mt-5 h-0.5 w-14 rounded-full bg-brand/40"
              aria-hidden
            />
            <div className="fade-up fade-up-2 mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <Badge
                variant="secondary"
                className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand"
              >
                {post.tag}
              </Badge>
              <p className="tnum text-[13px] text-faint">
                Publié le {frDate(post.date)} · Lecture ~{post.readMinutes}{" "}
                minutes
              </p>
            </div>

            {/* Sommaire mobile (lg-) : <details> replié au-dessus du corps —
                garde le fil de lecture vierge tant qu’on ne le demande pas. */}
            {headings.length > 0 && (
              <details
                ref={mobileTocRef}
                className="toc-details fade-up fade-up-3 group mt-6 lg:hidden"
              >
                <summary className="flex items-center justify-between gap-2 px-4 py-3 text-[13px] font-semibold">
                  <span className="inline-flex items-center gap-2">
                    <ListTree className="size-4 text-brand" aria-hidden />
                    Sommaire
                  </span>
                  <ChevronDown
                    className="size-4 text-faint transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="border-t px-4 pb-3 pt-2">
                  <TocLinks
                    headings={headings}
                    activeId={activeId}
                    onFollow={followAndClose}
                  />
                </div>
              </details>
            )}

            {/* .prose-article : rythme scopé (marqueurs de listes brand, titres
                équilibrés) — voir globals.css round 9. Entrée en cascade OK
                prefers-reduced-motion. */}
            <div className="fade-up fade-up-3 mt-6">
              <ArticleBlocks blocks={post.content} />
            </div>
          </article>

          {/* Sommaire desktop (lg+) : rail sticky dans la colonne libre à
              droite de l’article ; scroll-spy via aria-current. */}
          {headings.length > 0 && (
            <aside className="hidden lg:block">
              <nav
                aria-label="Sommaire de l’article"
                className="toc-rail sticky top-20"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                  Sommaire
                </p>
                <div className="mt-3">
                  <TocLinks
                    headings={headings}
                    activeId={activeId}
                    onFollow={followHeading}
                  />
                </div>
              </nav>
            </aside>
          )}
        </div>

        <nav
          aria-label="Navigation entre articles"
          className="mt-12 border-t pt-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {prev ? (
              <Link href={`#blog/${prev.slug}`} className={NAV_CARD_CLASS}>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                  <ArrowLeft className="size-3.5" aria-hidden />
                  Article précédent
                </span>
                <span className="mt-1 block text-[15px] font-semibold tracking-tight">
                  {prev.title}
                </span>
                <span className="tnum mt-1 block text-[12px] text-faint">
                  ~{prev.readMinutes} min
                </span>
              </Link>
            ) : (
              <span className="hidden sm:block" aria-hidden />
            )}
            {next ? (
              <Link href={`#blog/${next.slug}`} className={NAV_CARD_CLASS}>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                  Article suivant
                  <ArrowRight className="size-3.5" aria-hidden />
                </span>
                <span className="mt-1 block text-[15px] font-semibold tracking-tight">
                  {next.title}
                </span>
                <span className="tnum mt-1 block text-[12px] text-faint">
                  ~{next.readMinutes} min
                </span>
              </Link>
            ) : (
              <span className="hidden sm:block" aria-hidden />
            )}
          </div>
          <div className="mt-6 flex justify-center">
            <Button variant="secondary" asChild className="press">
              <Link href="#blog">
                <ArrowLeft aria-hidden />
                Retour au blog
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}

export function BlogArticleView({ slug }: { slug: string }) {
  const index = BLOG_POSTS.findIndex((p) => p.slug === slug);
  if (index === -1) return <NotView />;

  const post = BLOG_POSTS[index];
  const prev = index > 0 ? BLOG_POSTS[index - 1] : undefined;
  const next = index < BLOG_POSTS.length - 1 ? BLOG_POSTS[index + 1] : undefined;

  /* Découpage hooks/vue : les hooks vivent dans ArticleScreen, monté
     seulement pour un slug valide — un slug qui devient invalide ne change
     jamais le nombre de hooks du composant exposé. */
  return <ArticleScreen post={post} prev={prev} next={next} />;
}
