"use client";

import { useCallback, useEffect, useState } from "react";
import { getPost } from "./blog";

/** All known hash routes of the app */
export const ROUTES = [
  "accueil",
  "outils",
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

/**
 * Hash-based router: returns the current route (e.g. "blog/pauses-cerveau")
 * and a navigate() helper. Updates document.title and scrolls to top on change.
 */
export function useHashRoute() {
  // Initial state must match SSR ("accueil") — the real hash is synced
  // right after hydration to avoid any hydration mismatch on deep links.
  const [route, setRoute] = useState<string>("accueil");

  useEffect(() => {
    const onChange = () => {
      setRoute(getHashRoute());
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    onChange();
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  useEffect(() => {
    // Article routes get their own title from the blog data
    if (route.startsWith("blog/")) {
      const post = getPost(route.slice(5));
      document.title = post ? `${post.title} — Focusly` : "Page introuvable — Focusly";
      return;
    }
    document.title = ROUTE_TITLES[route] ?? "Page introuvable — Focusly";
  }, [route]);

  const go = useCallback((r: string) => navigate(r), []);

  return { route, navigate: go };
}

/** True when the route matches the given nav entry (exact or prefix for blog articles) */
export function isNavActive(route: string, nav: string): boolean {
  return route === nav || route.startsWith(nav + "/");
}
