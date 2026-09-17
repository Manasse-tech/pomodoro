"use client";

import { HashLink } from "./hash-link";
import { useEffect, useState } from "react";
import { Download, HelpCircle, Menu, Moon, Search, Settings2, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isNavActive } from "@/lib/focusly/router";
import { useFocusly } from "@/lib/focusly/store";

const NAV = [
  { route: "accueil", label: "Accueil" },
  { route: "outils", label: "Outils" },
  { route: "statistiques", label: "Stats" },
  { route: "guide", label: "Guide" },
  { route: "blog", label: "Blog" },
  { route: "a-propos", label: "À propos" },
  { route: "contact", label: "Contact" },
];

interface SiteHeaderProps {
  route: string;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  /** Runs the deferred install prompt (owned by FocuslyApp). */
  onInstallClick: () => void;
}

export function SiteHeader({ route, onOpenSettings, onOpenHelp, onInstallClick }: SiteHeaderProps) {
  const theme = useFocusly((s) => s.theme);
  const toggleTheme = useFocusly((s) => s.toggleTheme);
  const open = useFocusly((s) => s.navOpen);
  const setNavOpen = useFocusly((s) => s.setNavOpen);
  const [scrolled, setScrolled] = useState(false);
  /** PWA install availability, signalled by FocuslyApp via window events
   * ("focusly:install-available" / "focusly:install-hidden") — same lightweight
   * channel as the existing "focusly:open-command" event, no store involved. */
  const [installReady, setInstallReady] = useState(false);

  useEffect(() => {
    const showInstall = () => setInstallReady(true);
    const hideInstall = () => setInstallReady(false);
    window.addEventListener("focusly:install-available", showInstall);
    window.addEventListener("focusly:install-hidden", hideInstall);
    return () => {
      window.removeEventListener("focusly:install-available", showInstall);
      window.removeEventListener("focusly:install-hidden", hideInstall);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-[var(--header-bg)] backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? "site-header-scrolled" : ""
      }`}
    >
      <div className="mx-auto flex w-full max-w-[920px] flex-wrap items-center justify-between gap-3 px-5 py-3">
        <HashLink
          href="#accueil"
          aria-label="Focusly — accueil"
          className="flex items-center gap-2.5 text-[17px] font-extrabold tracking-tight hover:no-underline"
        >
          <span
            className="pulse-dot size-2.5 rounded-full bg-brand shadow-[0_0_12px_var(--brand-glow)]"
            aria-hidden
          />
          Focusly
        </HashLink>

        <nav
          aria-label="Navigation principale"
          className={`${
            open
              ? "flex"
              : "hidden"
          } order-3 basis-full flex-wrap items-center gap-0.5 sm:order-none sm:flex sm:basis-auto`}
        >
          {NAV.map((n) => {
            const active = isNavActive(route, n.route);
            return (
              <HashLink
                key={n.route}
                href={`#${n.route}`}
                aria-current={active ? "page" : undefined}
                className={`relative inline-flex min-h-9 items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors sm:after:absolute sm:after:-bottom-[6px] sm:after:left-1/2 sm:after:content-[''] sm:after:h-1 sm:after:w-1 sm:after:-translate-x-1/2 sm:after:rounded-full sm:after:bg-brand sm:after:transition sm:after:duration-200 ${
                  active
                    ? "bg-accent text-foreground sm:after:scale-100 sm:after:opacity-100"
                    : "text-soft hover:bg-secondary hover:text-foreground hover:underline hover:underline-offset-4 hover:decoration-brand/50 sm:after:scale-0 sm:after:opacity-0"
                }`}
                onClick={() => setNavOpen(false)}
              >
                {n.label}
              </HashLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            aria-label={theme === "dark" ? "Passer en thème clair" : "Passer en thème sombre"}
            title="Thème (T)"
            className="relative size-10 rounded-xl before:absolute before:content-[''] before:-inset-y-1 before:-inset-x-0.5"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Réglages du minuteur"
            title="Réglages (,)"
            className="relative hidden size-10 rounded-xl before:absolute before:content-[''] before:-inset-y-1 before:-inset-x-0.5 sm:inline-flex"
            onClick={onOpenSettings}
          >
            <Settings2 className="size-[18px]" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Ouvrir la palette de commandes"
            title="Recherche (Ctrl+K)"
            className="relative size-10 rounded-xl before:absolute before:content-[''] before:-inset-y-1 before:-inset-x-0.5"
            onClick={() => window.dispatchEvent(new CustomEvent("focusly:open-command"))}
          >
            <Search className="size-[18px]" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Raccourcis clavier"
            title="Raccourcis clavier"
            className="relative size-10 rounded-xl before:absolute before:content-[''] before:-inset-y-1 before:-inset-x-0.5"
            onClick={onOpenHelp}
          >
            <HelpCircle className="size-[18px]" />
          </Button>
          {installReady && (
            <Button
              variant="outline"
              size="icon"
              aria-label="Installer l’application"
              title="Installer l’application"
              className="relative size-10 rounded-xl before:absolute before:content-[''] before:-inset-y-1 before:-inset-x-0.5"
              onClick={onInstallClick}
            >
              <Download className="size-[18px]" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            className="relative size-10 rounded-xl before:absolute before:content-[''] before:-inset-y-1 before:-inset-x-0.5 sm:hidden"
            onClick={() => setNavOpen(!open)}
          >
            {open ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
