"use client";

import { HashLink } from "./hash-link";

const COLS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Navigation",
    links: [
      { label: "Accueil", href: "accueil" },
      { label: "Outils", href: "outils" },
      { label: "Guide", href: "guide" },
      { label: "Blog", href: "blog" },
    ],
  },
  {
    title: "Informations",
    links: [
      { label: "À propos", href: "a-propos" },
      { label: "Contact", href: "contact" },
      { label: "Plan du site", href: "plan-du-site" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Confidentialité", href: "confidentialite" },
      { label: "Conditions", href: "conditions" },
      { label: "Mentions légales", href: "mentions-legales" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer
      className="mt-auto border-t pt-10 pb-[calc(var(--spacing)*10_+_env(safe-area-inset-bottom))] text-[13.5px] text-muted-foreground"
    >
      <div className="mx-auto w-full max-w-[920px] px-5">
        <div className="mb-7 grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-soft">
              <span
                className="inline-block size-2 rounded-full bg-brand shadow-[0_0_10px_var(--brand-glow)]"
                aria-hidden
              />
              Focusly
            </h4>
            <p className="max-w-[340px] leading-relaxed">
              Minuteur Pomodoro gratuit et ressources sur la concentration. Sans compte, sans
              tracking intrusif. Vos données restent sur votre appareil.
            </p>
          </div>
          {COLS.map((col) => (
            <nav key={col.title} aria-label={`Liens ${col.title}`}>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-soft">
                {col.title}
              </h4>
              <ul className="space-y-1.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <HashLink
                      href={`#${l.href}`}
                      className="transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </HashLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-[12.5px] text-faint">
          <span>© {year} Focusly. Tous droits réservés.</span>
          <span>Conçu pour la concentration, sans distraction.</span>
        </div>
      </div>
    </footer>
  );
}
