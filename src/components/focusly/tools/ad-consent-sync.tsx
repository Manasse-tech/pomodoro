"use client";

import { useEffect } from "react";

import { ADS_CONFIG } from "@/lib/focusly/ads-config";
import { useConsent } from "@/lib/focusly/consent";

/* Comportement du loader Google (constaté au débogage r12-e) :
 *  1. adsbygoogle.js REMPLACE window.adsbygoogle par son propre objet
 *     quand il arrive (non-Array) — un flag posé trop tôt sur l'array
 *     initial est perdu au remplacement.
 *  2. Sur cet objet, `requestNonPersonalizedAds` est un SETTER pur
 *     (Object.getOwnPropertyDescriptor : hasGet=false, hasSet=true) —
 *     l'écriture fonctionne, la relecture renvoie undefined par design.
 * La synchronisation se fait donc en deux temps : application immédiate
 * (array inline posé par layout.tsx ou loader déjà présent), puis
 * ré-application à l'événement `load` du script si le loader n'était pas
 * encore arrivé au moment du rendu. */

type AdsQueue = { requestNonPersonalizedAds?: number } & unknown[];

function adsWindow(w: Window): { adsbygoogle?: AdsQueue } {
  return w as Window & { adsbygoogle?: AdsQueue };
}

/** True une fois que le loader Google a remplacé l'array initial. */
function loaderArrived(w: Window): boolean {
  const q = adsWindow(w).adsbygoogle;
  return Boolean(q) && !Array.isArray(q);
}

/**
 * Synchronise le choix de consentement avec l'API Google AdSense.
 *
 * Aucun rendu (composant effet pur) — donc aucun risque de mismatch SSR
 * même si le store persisté change entre serveur et client (leçon r12-a).
 *
 * Sémantique RGPD adoptée :
 *  - `ads === "granted"`  → `requestNonPersonalizedAds = 0`
 *    (personnalisation autorisée, choix explicite de l'utilisateur) ;
 *  - sans décision ou `ads === "denied"` → `requestNonPersonalizedAds = 1`
 *    (annonces NON personnalisées uniquement — défaut conservateur posé
 *    dès le HTML par le script inline de layout.tsx).
 *
 * Le script `adsbygoogle.js` lui-même est chargé dans `layout.tsx`
 * (beforeInteractive) : il est nécessaire pour servir la publicité (qui
 * finance le service) ; la personnalisation, elle, reste sous consentement.
 */
export function AdConsentSync() {
  const ads = useConsent((s) => s.ads);

  useEffect(() => {
    if (!ADS_CONFIG.enabled) return;
    const w = window;
    const npa: 0 | 1 = ads === "granted" ? 0 : 1;
    const apply = () => {
      const q = (adsWindow(w).adsbygoogle = adsWindow(w).adsbygoogle ?? []);
      try {
        // Setter pur côté loader Google (valeur non relisible par design) —
        // une écriture suffit ; le catch protège d'un objet inattendu.
        q.requestNonPersonalizedAds = npa;
      } catch {
        /* API AdSense indisponible — ignorer */
      }
    };
    apply();

    if (loaderArrived(w)) return;
    const script = document.querySelector('script[src*="adsbygoogle"]');
    if (!script) return;
    const onLoad = () => {
      if (loaderArrived(w)) apply();
    };
    script.addEventListener("load", onLoad, { once: true });
    return () => script.removeEventListener("load", onLoad);
  }, [ads]);

  return null;
}
