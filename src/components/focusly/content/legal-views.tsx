"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { BLOG_POSTS } from "@/lib/focusly/blog";
import { ROUTES, type TopRoute } from "@/lib/focusly/router";
import { ArticleBlocks, type Block } from "./article-blocks";
import { Breadcrumb } from "./breadcrumb";

/* Classes mirroring ArticleBlocks so hand-rendered sections blend in. */
const H2_CLASS = "mt-9 mb-3 text-2xl font-semibold tracking-tight";
const P_CLASS = "mb-4 leading-relaxed text-soft";
const LIST_CLASS = "mb-4 list-disc space-y-1.5 pl-6 text-soft";
const LINK_CLASS = "font-medium text-brand hover:underline";

/** Shared shell for the legal/informational pages. */
function LegalShell({
  crumb,
  title,
  meta,
  children,
}: {
  crumb: string;
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[920px] px-5 py-8 sm:py-10">
      <Breadcrumb
        items={[{ label: "Accueil", href: "accueil" }, { label: crumb }]}
      />
      {/* .prose-legal (globals.css round 10) : même traitement éditorial que
          .prose-guide/.prose-article — marqueurs de listes brand, titres
          équilibrés. Entrée en cascade h1 → filet → méta → contenu, OK
          prefers-reduced-motion (garde r7-d/r8-c). */}
      <article className="prose-legal max-w-[720px]">
        <h1 className="fade-up text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {title}
        </h1>
        {/* Filet décoratif de marque, aligné sur le guide et l’article (aria-hidden) */}
        <div
          className="fade-up fade-up-1 mt-5 h-0.5 w-14 rounded-full bg-brand/40"
          aria-hidden
        />
        {meta ? (
          <p className="tnum fade-up fade-up-2 mt-3 text-[13px] text-faint">
            {meta}
          </p>
        ) : null}
        <div className="fade-up fade-up-3 mt-6">{children}</div>
      </article>
    </div>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={LINK_CLASS}
    >
      {children}
    </a>
  );
}

export function ConfidentialiteView() {
  return (
    <LegalShell
      crumb="Confidentialité"
      title="Politique de confidentialité"
      meta="Dernière mise à jour : avril 2025"
    >
      <p className={P_CLASS}>
        La présente politique décrit la manière dont Focusly collecte, utilise
        et protège les informations lorsque vous utilisez notre site.
      </p>

      <h2 className={H2_CLASS}>1. Responsable du traitement</h2>
      <p className={P_CLASS}>
        Le responsable du traitement est Focusly. Contact : voir la{" "}
        <Link href="#contact" className={LINK_CLASS}>
          page de contact
        </Link>
        .
      </p>

      <h2 className={H2_CLASS}>2. Données collectées</h2>
      <p className={P_CLASS}>
        Focusly ne collecte aucune donnée personnelle identifiable directement.
        Les statistiques (Pomodoros, tâches, notes) sont stockées uniquement
        dans votre navigateur via <em>localStorage</em>. Elles ne sont jamais
        transmises à nos serveurs.
      </p>

      <h2 className={H2_CLASS}>3. Cookies et technologies similaires</h2>
      <ul className={LIST_CLASS}>
        <li className="leading-relaxed">
          Cookies techniques strictement nécessaires.
        </li>
        <li className="leading-relaxed">
          Cookies analytiques (avec consentement).
        </li>
        <li className="leading-relaxed">
          Cookies publicitaires via Google AdSense (avec consentement).
        </li>
      </ul>

      <h2 className={H2_CLASS}>4. Publicité et Google AdSense</h2>
      <p className={P_CLASS}>
        Ce site peut être financé par la publicité, notamment via Google
        AdSense. Vous pouvez désactiver la personnalisation des annonces sur{" "}
        <ExternalLink href="https://adssettings.google.com">
          Paramètres des annonces
        </ExternalLink>
        .
      </p>

      <h2 className={H2_CLASS}>5. Analyse d’audience</h2>
      <p className={P_CLASS}>
        Nous pouvons utiliser des outils d’analyse respectueux de la vie privée
        (Plausible ou Matomo anonymisé).
      </p>

      <h2 className={H2_CLASS}>6. Vos droits (RGPD)</h2>
      <p className={P_CLASS}>
        Vous disposez d’un droit d’accès, de rectification, d’effacement, de
        limitation, d’opposition et de portabilité. Contactez-nous via la{" "}
        <Link href="#contact" className={LINK_CLASS}>
          page de contact
        </Link>
        . Réclamation possible auprès de la{" "}
        <ExternalLink href="https://www.cnil.fr">CNIL</ExternalLink>.
      </p>

      <h2 className={H2_CLASS}>7. Sécurité</h2>
      <p className={P_CLASS}>
        Le site est servi en HTTPS. Les mesures techniques appropriées sont
        mises en œuvre.
      </p>
    </LegalShell>
  );
}

const CONDITIONS_BLOCKS: Block[] = [
  { type: "h2", text: "1. Acceptation" },
  {
    type: "p",
    text: "En utilisant Focusly, vous acceptez les présentes conditions dans leur intégralité.",
  },
  { type: "h2", text: "2. Description du service" },
  {
    type: "p",
    text: "Focusly propose un minuteur Pomodoro, un gestionnaire de tâches, un bloc-notes et des contenus éditoriaux. Service gratuit, sans garantie de disponibilité.",
  },
  { type: "h2", text: "3. Utilisation autorisée" },
  {
    type: "p",
    text: "Interdiction de contourner les mesures de sécurité, de surcharger le service, de reproduire le contenu sans autorisation.",
  },
  { type: "h2", text: "4. Propriété intellectuelle" },
  {
    type: "p",
    text: "L’ensemble des contenus est protégé par le droit d’auteur.",
  },
  { type: "h2", text: "5. Limitation de responsabilité" },
  {
    type: "p",
    text: "Focusly est fourni « en l’état ». Nous ne saurions être tenus responsables de tout dommage résultant de l’utilisation du site.",
  },
  { type: "h2", text: "6. Droit applicable" },
  { type: "p", text: "Droit français. Juridiction : tribunaux français." },
];

export function ConditionsView() {
  return (
    <LegalShell
      crumb="Conditions"
      title="Conditions d’utilisation"
      meta="Dernière mise à jour : avril 2025"
    >
      <ArticleBlocks blocks={CONDITIONS_BLOCKS} />
    </LegalShell>
  );
}

export function MentionsLegalesView() {
  return (
    <LegalShell
      crumb="Mentions légales"
      title="Mentions légales"
      meta="Conformément à la loi LCEN du 21 juin 2004"
    >
      <blockquote className="my-6 rounded-r-xl border-l-[3px] border-brand bg-brand/5 px-5 py-3.5 italic text-soft">
        <strong className="font-semibold text-foreground">
          À compléter avant mise en ligne.
        </strong>{" "}
        Remplissez ces champs avec vos informations réelles.
      </blockquote>

      <h2 className={H2_CLASS}>Éditeur du site</h2>
      <p className={P_CLASS}>
        <strong className="font-semibold text-foreground">Focusly</strong>
        <br />
        [Votre nom ou raison sociale]
        <br />
        [Adresse complète]
        <br />
        Email : contact [arobase] focusly.example
      </p>

      <h2 className={H2_CLASS}>Directeur de la publication</h2>
      <p className={P_CLASS}>[Nom du directeur]</p>

      <h2 className={H2_CLASS}>Hébergeur</h2>
      <p className={P_CLASS}>
        [Nom de l’hébergeur]
        <br />
        [Adresse]
        <br />
        [Téléphone]
      </p>

      <h2 className={H2_CLASS}>Propriété intellectuelle</h2>
      <p className={P_CLASS}>
        L’ensemble du site est protégé par le droit d’auteur.
      </p>

      <h2 className={H2_CLASS}>Données personnelles</h2>
      <p className={P_CLASS}>
        Voir notre{" "}
        <Link href="#confidentialite" className={LINK_CLASS}>
          politique de confidentialité
        </Link>
        .
      </p>
    </LegalShell>
  );
}

/* Sitemap entries are derived from ROUTES and BLOG_POSTS (single source of truth). */
const MAIN_PAGES: TopRoute[] = [
  "accueil",
  "outils",
  "statistiques",
  "guide",
  "blog",
  "a-propos",
  "contact",
];

const LEGAL_PAGES: TopRoute[] = [
  "confidentialite",
  "conditions",
  "mentions-legales",
];

const SITEMAP_LABELS: Record<string, string> = {
  accueil: "Accueil",
  outils: "Outils",
  statistiques: "Statistiques",
  guide: "Guide de la méthode Pomodoro",
  blog: "Blog",
  "a-propos": "À propos",
  contact: "Contact",
  confidentialite: "Confidentialité",
  conditions: "Conditions",
  "mentions-legales": "Mentions légales",
};

/* Liens du plan du site : flèche glissante au survol (transform uniquement,
   aucun reflow) ; la copie reste strictement identique. Pas de cartes .lift
   ici : le plan du site est une liste de liens (pas une grille de cartes) —
   on garde la structure sémantique et on anime seulement le survol. */
const SITEMAP_LINK_CLASS =
  "group inline-flex items-center gap-1 font-medium text-brand hover:underline";

function SitemapLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={SITEMAP_LINK_CLASS}>
      {children}
      <ArrowRight
        className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
        aria-hidden
      />
    </Link>
  );
}

export function PlanDuSiteView() {
  return (
    <LegalShell crumb="Plan du site" title="Plan du site">
      <h2 className={H2_CLASS}>Pages principales</h2>
      <ul className={LIST_CLASS}>
        {MAIN_PAGES.filter((r) => ROUTES.includes(r)).map((route) => (
          <li key={route} className="leading-relaxed">
            <SitemapLink href={`#${route}`}>{SITEMAP_LABELS[route]}</SitemapLink>
          </li>
        ))}
      </ul>

      <h2 className={H2_CLASS}>Articles</h2>
      <ul className={LIST_CLASS}>
        {BLOG_POSTS.map((post) => (
          <li key={post.slug} className="leading-relaxed">
            <SitemapLink href={`#blog/${post.slug}`}>{post.title}</SitemapLink>
          </li>
        ))}
      </ul>

      <h2 className={H2_CLASS}>Informations légales</h2>
      <ul className={LIST_CLASS}>
        {LEGAL_PAGES.filter((r) => ROUTES.includes(r)).map((route) => (
          <li key={route} className="leading-relaxed">
            <SitemapLink href={`#${route}`}>{SITEMAP_LABELS[route]}</SitemapLink>
          </li>
        ))}
      </ul>
    </LegalShell>
  );
}
