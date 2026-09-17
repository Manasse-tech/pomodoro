/**
 * Informations éditeur / contact — Focusly.
 *
 * ⚠️ À PERSONNALISER : `contactEmail` est encore un placeholder — remplacez-le
 * par l'adresse email réelle de l'éditeur (et complétez `editorName`).
 * Cette config unique alimente automatiquement :
 *  - la page Contact (encart « email direct » cliquable),
 *  - les mentions légales (section Éditeur),
 *  - la politique de confidentialité (responsable du traitement + droits RGPD).
 * Un seul endroit à modifier — aucune autre fichier à toucher.
 */
export const SITE_INFO = {
  /** Email public de contact — TODO utilisateur : adresse réelle. */
  contactEmail: "contact@focusly.example",
  /** Nom de l'éditeur (personne physique ou raison sociale) — TODO utilisateur. */
  editorName: "",
} as const;
