"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HelpCircle, Menu, Moon, Search, Settings2, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isNavActive } from "@/lib/focusly/router";
import { useFocusly } from "@/lib/focusly/store";

const NAV = [
  { route: "accueil", label: "Accueil" },
  { route: "outils", label: "Outils" },
  { route: "guide", label: "Guide" },
  { route: "blog", label: "Blog" },
  { route: "a-propos", label: "À propos" },
  { route: "contact", label: "Contact" },
];

interface SiteHeaderProps {
  route: string;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export function SiteHeader({ route, onOpenSettings, onOpenHelp }: SiteHeaderProps) {
  const theme = useFocusly((s) => s.theme);
  const toggleTheme = useFocusly((s) => s.toggleTheme);
  const open = useFocusly((s) => s.navOpen);
  const setNavOpen = useFocusly((s) => s.setNavOpen);
  const [scrolled, setScrolled] = useState(false);

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
        <Link
          href="#accueil"
          aria-label="Focusly — accueil"
          className="flex items-center gap-2.5 text-[17px] font-extrabold tracking-tight hover:no-underline"
        >
          <span
            className="pulse-dot size-2.5 rounded-full bg-brand shadow-[0_0_12px_var(--brand-glow)]"
            aria-hidden
          />
          Focusly
        </Link>

        <nav
          aria-label="Navigation principale"
          className={`${
            open
              ? "flex"
              : "hidden"
          } order-3 basis-full flex-wrap items-center gap-0.5 sm:order-none sm:flex sm:basis-auto`}
        >
          {NAV.map((n) => (
            <Link
              key={n.route}
              href={`#${n.route}`}
              aria-current={isNavActive(route, n.route) ? "page" : undefined}
              className={`inline-flex min-h-9 items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isNavActive(route, n.route)
                  ? "bg-accent text-foreground"
                  : "text-soft hover:bg-secondary hover:text-foreground"
              }`}
              onClick={() => setNavOpen(false)}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            aria-label={theme === "dark" ? "Passer en thème clair" : "Passer en thème sombre"}
            title="Thème (T)"
            className="size-10 rounded-xl"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Réglages du minuteur"
            title="Réglages (,)"
            className="hidden size-10 rounded-xl sm:inline-flex"
            onClick={onOpenSettings}
          >
            <Settings2 className="size-[18px]" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Ouvrir la palette de commandes"
            title="Recherche (Ctrl+K)"
            className="size-10 rounded-xl"
            onClick={() => window.dispatchEvent(new CustomEvent("focusly:open-command"))}
          >
            <Search className="size-[18px]" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Raccourcis clavier"
            title="Raccourcis clavier"
            className="size-10 rounded-xl"
            onClick={onOpenHelp}
          >
            <HelpCircle className="size-[18px]" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            className="size-10 rounded-xl sm:hidden"
            onClick={() => setNavOpen(!open)}
          >
            {open ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
