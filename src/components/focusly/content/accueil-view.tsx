"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, History, ListChecks, NotebookPen, Timer } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BLOG_POSTS } from "@/lib/focusly/blog";

const OUTILS: Array<{ tag: string; title: string; desc: string; icon: LucideIcon }> = [
  {
    tag: "Concentration",
    title: "Minuteur Pomodoro",
    desc: "Sessions personnalisables, cycle de pauses, statistiques du jour.",
    icon: Timer,
  },
  {
    tag: "Organisation",
    title: "Gestionnaire de tâches",
    desc: "Liste simple, efficace, persistante entre les sessions.",
    icon: ListChecks,
  },
  {
    tag: "Notes",
    title: "Bloc-notes rapide",
    desc: "Idées, réflexions, points à revoir. Sauvegarde automatique.",
    icon: NotebookPen,
  },
  {
    tag: "Suivi",
    title: "Historique et export",
    desc: "Consultez vos sessions et exportez vos données en JSON ou CSV.",
    icon: History,
  },
];

const ACCUEIL_SLUGS = [
  "methode-pomodoro-debutant",
  "pauses-cerveau",
  "comparaison-methodes",
  "erreurs-pomodoro",
] as const;

const CARD_CLASS =
  "group block rounded-2xl border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-input hover:shadow-lg hover:shadow-black/10";
const CARD_TAG_CLASS =
  "mb-2 inline-block text-[11px] font-bold uppercase tracking-[0.08em] text-brand";
const CARD_TITLE_CLASS = "text-[17px] font-semibold tracking-tight";
const CARD_TEXT_CLASS = "mt-1 text-sm leading-relaxed text-muted-foreground";

export function AccueilView() {
  const articles = BLOG_POSTS.filter((p) =>
    (ACCUEIL_SLUGS as readonly string[]).includes(p.slug)
  );

  return (
    <div className="relative mx-auto w-full max-w-[920px] px-5 py-8 sm:py-10">
      <div className="hero-glow" aria-hidden />
      {/* Héros */}
      <section>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Concentrez-vous.
          <br />
          <em className="text-brand not-italic">Un Pomodoro à la fois.</em>
        </h1>
        <p className="mt-3 max-w-[680px] text-[17px] text-muted-foreground">
          Focusly réunit un minuteur Pomodoro, un gestionnaire de tâches et des
          guides pratiques. Gratuit, sans compte, respectueux de votre vie
          privée.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="#outils">Ouvrir les outils</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="#guide">Lire le guide</Link>
          </Button>
        </div>
      </section>

      {/* Pourquoi Focusly ? */}
      <section className="my-12">
        <h2 className="mb-5 text-2xl font-semibold tracking-tight">
          Pourquoi Focusly ?
        </h2>
        <p className="max-w-[760px] leading-relaxed text-soft">
          La méthode Pomodoro, créée par Francesco Cirillo à la fin des années
          1980, consiste à alterner des blocs de concentration intense et de
          courtes pauses. Des décennies de recherche en neurosciences
          cognitives ont confirmé son efficacité : notre attention est une
          ressource limitée, et la fragmenter en blocs délimités réduit la
          fatigue mentale tout en améliorant la qualité du travail produit.
        </p>
        <p className="mt-4 max-w-[760px] leading-relaxed text-soft">
          Focusly est volontairement minimaliste : pas de compte à créer, pas
          de publicité intrusive, pas de collecte de données. Vos sessions,
          tâches et notes sont enregistrées uniquement dans votre navigateur.
        </p>
      </section>

      {/* Vos outils */}
      <section className="my-12">
        <h2 className="mb-5 text-2xl font-semibold tracking-tight">
          Vos outils
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {OUTILS.map((outil) => (
            <Link key={outil.title} href="#outils" className={CARD_CLASS}>
              <outil.icon className="mb-3 size-5 text-brand" aria-hidden />
              <span className={CARD_TAG_CLASS}>{outil.tag}</span>
              <h3 className={CARD_TITLE_CLASS}>{outil.title}</h3>
              <p className={CARD_TEXT_CLASS}>{outil.desc}</p>
            </Link>
          ))}
          <Link
            href="#statistiques"
            className={`${CARD_CLASS} sm:col-span-2`}
          >
            <BarChart3 className="mb-3 size-5 text-brand" aria-hidden />
            <span className={CARD_TAG_CLASS}>Analyse</span>
            <h3 className={CARD_TITLE_CLASS}>Statistiques mensuelles</h3>
            <p className={CARD_TEXT_CLASS}>
              Calendrier de votre concentration, séries de jours actifs et export CSV.
              <ArrowRight
                className="ml-1.5 inline size-4 text-faint transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand"
                aria-hidden
              />
            </p>
          </Link>
        </div>
      </section>

      {/* À lire sur le blog */}
      <section className="my-12">
        <h2 className="mb-5 text-2xl font-semibold tracking-tight">
          À lire sur le blog
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {articles.map((post) => (
            <Link
              key={post.slug}
              href={`#blog/${post.slug}`}
              className={CARD_CLASS}
            >
              <span className={CARD_TAG_CLASS}>{post.tag}</span>
              <h3 className={CARD_TITLE_CLASS}>{post.title}</h3>
              <p className={CARD_TEXT_CLASS}>{post.excerpt}</p>
              <ArrowRight
                className="mt-3 size-4 text-faint transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand"
                aria-hidden
              />
            </Link>
          ))}
        </div>
        <Button variant="secondary" asChild className="mt-4 w-full">
          <Link href="#blog">Voir tous les articles →</Link>
        </Button>
      </section>
    </div>
  );
}
