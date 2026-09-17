"use client";

import { useCallback, useEffect, useState } from "react";
import { getPost } from "./blog";

/** All known hash routes of the app */
export const ROUTES = [
  "accueil",
  "outils",
  "statistiques",
  "guide",
  "blog",
  "a-propos",
  "contact",
  "confidentialite",
  "conditions",
  "mentions-legales",
  "plan-du-site",
] as const;

export type TopRoute = (typeof ROUTES)[number];

export const ROUTE_TITLES: Record<string, string> = {
  accueil: "Focusly — Minuteur Pomodoro et outils de concentration",
  outils: "Outils — Focusly",
  statistiques: "Statistiques — Focusly",
  guide: "Guide de la méthode Pomodoro — Focusly",
  blog: "Blog — Focusly",
  "a-propos": "À propos — Focusly",
  contact: "Contact — Focusly",
  confidentialite: "Politique de confidentialité — Focusly",
  conditions: "Conditions d'utilisation — Focusly",
  "mentions-legales": "Mentions légales — Focusly",
  "plan-du-site": "Plan du site — Focusly",
};

export function getHashRoute(): string {
  if (typeof window === "undefined") return "accueil";
  const h = window.location.hash.replace(/^#\/?/, "").replace(/\/+$/, "");
  return h || "accueil";
}

export function navigate(route: string) {
  if (typeof window === "undefined") return;
  window.location.hash = route;
}

/** Resolve the document title for a route (blog articles get their own). */
export function titleFor(route: string): string {
  if (route.startsWith("blog/")) {
    const post = getPost(route.slice(5));
    return post ? `${post.title} — Focusly` : "Page introuvable — Focusly";
  }
  return ROUTE_TITLES[route] ?? "Page introuvable — Focusly";
}

/**
 * Hash-based router: returns the current route (e.g. "blog/pauses-cerveau")
 * and a navigate() helper. Updates document.title and scrolls to top on change.
 */
export function useHashRoute() {
  // Initial state must match SSR ("accueil") — the real hash is synced
  // right after hydration to avoid any hydration mismatch on deep links.
  const [route, setRoute] = useState<string>("accueil");

  useEffect(() => {
    let raf = 0;
    const timers: number[] = [];
    const onChange = () => {
      const next = getHashRoute();
      setRoute(next);
      // Set imperatively: deep-link reloads must not depend on effect ordering.
      const applyTitle = () => {
        document.title = titleFor(next);
      };
      applyTitle();
      // Next.js' client router re-asserts the pathname metadata (hash-stripped,
      // i.e. the accueil title) right after hydration — re-assert our
      // hash-route title over the following frames so deep links keep it.
      raf = requestAnimationFrame(applyTitle);
      timers.push(window.setTimeout(applyTitle, 0), window.setTimeout(applyTitle, 250));
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    onChange();
    window.addEventListener("hashchange", onChange);
    return () => {
      window.removeEventListener("hashchange", onChange);
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    document.title = titleFor(route);
  }, [route]);

  const go = useCallback((r: string) => navigate(r), []);

  return { route, navigate: go };
}

/** True when the route matches the given nav entry (exact or prefix for blog articles) */
export function isNavActive(route: string, nav: string): boolean {
  return route === nav || route.startsWith(nav + "/");
}
