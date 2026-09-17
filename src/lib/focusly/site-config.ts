/**
 * Informations éditeur / contact — Focusly.
 *
 * ÉTAT (r12-f) : email + URL réelle renseignés d'après l'utilisateur.
 * Cette config unique alimente automatiquement :
 *  - le SEO (`metadataBase` du layout → URLs canoniques / OpenGraph),
 *  - la page Contact (encart « email direct » cliquable),
 *  - les mentions légales (section Éditeur),
 *  - la politique de confidentialité (responsable du traitement + droits RGPD).
 * Reste TODO : `editorName` (nom de l'éditeur pour les mentions légales).
 */
export const SITE_INFO = {
  /** URL publique réelle du site — déploiement Netlify (HTTPS). */
  siteUrl: "https://tangerine-cactus-866ff3.netlify.app",
  /** Email public de contact — renseigné r12-f (demande utilisateur). */
  contactEmail: "ephrainguetta@gmail.com",
  /** Nom de l'éditeur (personne physique) — TODO utilisateur : nom réel. */
  editorName: "",
} as const;
