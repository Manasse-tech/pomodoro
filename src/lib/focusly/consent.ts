"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Consentement RGPD pour la publicité (AdSense) et la mesure d'audience.
 *
 * Sécurité rehydration : pas de onRehydrateStorage ni de merge référencant
 * le store (piège TDZ documenté dans store.ts) — la normalisation inutile
 * ici, et le bandeau ne se rend qu'après montage (pattern `mounted`), donc
 * la valeur persistée ne provoque aucun mismatch SSR/CSR.
 */
export type ConsentValue = "granted" | "denied";

interface ConsentState {
  /** Publicité personnalisée (AdSense). null = pas encore de choix. */
  ads: ConsentValue | null;
  /** Mesure d'audience respectueuse de la vie privée. null = pas de choix. */
  analytics: ConsentValue | null;
  /** Horodatage de la décision (audit RGPD). */
  decidedAt: number | null;
  /** Bandeau visible (transient — jamais persisté). */
  open: boolean;
  setConsent: (next: { ads: ConsentValue; analytics: ConsentValue }) => void;
  /** Réouvrir le bandeau (lien « Cookies & publicité » du pied de page). */
  reopen: () => void;
  setOpen: (v: boolean) => void;
}

export const CONSENT_STORAGE_KEY = "focusly.consent.v1";

export const useConsent = create<ConsentState>()(
  persist(
    (set) => ({
      ads: null,
      analytics: null,
      decidedAt: null,
      open: false,
      setConsent: ({ ads, analytics }) =>
        set({ ads, analytics, decidedAt: Date.now(), open: false }),
      reopen: () => set({ open: true }),
      setOpen: (v) => set({ open: v }),
    }),
    {
      name: CONSENT_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        ads: s.ads,
        analytics: s.analytics,
        decidedAt: s.decidedAt,
      }),
    },
  ),
);
