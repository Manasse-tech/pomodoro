/**
 * Configuration publicité / mesure d'audience — Focusly.
 *
 * TOUT le socle de consentement (bandeau, préférences, emplacement des
 * scripts) est déjà en place, mais le commutateur reste OFF tant qu'aucun
 * script AdSense/analytics réel n'est intégré : un bandeau sans traceur
 * ne ferait que dégrader l'expérience.
 *
 * Procédure à la validation AdSense (voir RELEASE-NOTE.md §3) :
 *  1. Mettre `enabled: true` et renseigner `publisherId` ("pub-…").
 *  2. Intégrer le script gtag dans layout.tsx — CONDITIONNÉ au consentement :
 *     ne charger le script que si useConsent.getState().ads === "granted"
 *     (et re-exécuter onConsentChange à chaque évolution du choix).
 *  3. Compléter public/ads.txt avec la ligne fournie par Google.
 *  4. Pour la publicité personnalisée EEE/UK : raccorder une CMP certifiée
 *     TCF (le store ci-dessous sert alors de source de vérité UI).
 */
export const ADS_CONFIG = {
  /** Commutateur maître : bannières et scripts restent OFF par défaut. */
  enabled: false,
  /** Identifiant éditeur AdSense ("pub-XXXXXXXXXXXXXXXX") — vide avant validation. */
  publisherId: "",
  /** Lien vers la politique de confidentialité (route hash de l'app). */
  policyRoute: "confidentialite",
} as const;
