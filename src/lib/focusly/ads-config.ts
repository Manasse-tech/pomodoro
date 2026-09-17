/**
 * Configuration publicité / mesure d'audience — Focusly.
 *
 * ÉTAT (r12-e) — AdSense ACTIVÉ avec l'identifiant éditeur réel :
 *  1. ✅ `enabled: true` + `publisherId` ("pub-6410999448746776").
 *  2. ✅ Script AdSense intégré dans `src/app/layout.tsx`
 *     (next/script, strategy "beforeInteractive" → tag `ca-pub-…` présent
 *     dans le HTML brut du <head>, exigence de vérification de site Google).
 *  3. ✅ `public/ads.txt` contient la ligne officielle Google.
 *  4. ✅ Consentement RGPD actif (`consent-banner.tsx`) : sans décision ou
 *     en cas de refus, `requestNonPersonalizedAds = 1` (annonces non
 *     personnalisées uniquement) via `ad-consent-sync.tsx` ; après
 *     « Tout accepter », la personnalisation est autorisée (NPA = 0).
 *
 * Reste externe (hors code) :
 *  - Mise en ligne sur le domaine réel en HTTPS (le sandbox ne suffit pas).
 *  - Publicité personnalisée EEE/UK : raccorder une CMP certifiée TCF
 *    (obligation Google) — le store `consent.ts` sert alors de source de
 *    vérité UI. Sans CMP, seules les annonces non personnalisées sont
 *    conformes en Europe.
 *  - Après validation Google : Auto Ads / unités d'annonces configurables
 *    depuis le compte AdSense (aucun code supplémentaire nécessaire).
 */
export const ADS_CONFIG = {
  /** Commutateur maître : script + bandeau de consentement + lien footer. */
  enabled: true,
  /** Identifiant éditeur AdSense réel (sans le préfixe "ca-"). */
  publisherId: "pub-6410999448746776",
  /** Lien vers la politique de confidentialité (route hash de l'app). */
  policyRoute: "confidentialite",
} as const;
