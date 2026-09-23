/**
 * Informations éditeur / contact — Focusly.
 *
 * ÉTAT (r12-h) : email + nom éditeur + URL réelle (migration Netlify → Vercel).
 * Cette config unique alimente automatiquement :
 *  - le SEO (`metadataBase` du layout → URLs canoniques / OpenGraph),
 *  - la page Contact (encart « email direct » cliquable),
 *  - les mentions légales (section Éditeur),
 *  - la politique de confidentialité (responsable du traitement + droits RGPD).
 * Reste TODO : adresse postale de l'éditeur (mentions légales, LCEN).
 */
export const SITE_INFO = {
  /** URL publique réelle du site — déploiement Vercel (HTTPS). */
  siteUrl: "https://pomodoro-sage-chi-32.vercel.app",
  /** Email public de contact — renseigné r12-f (demande utilisateur). */
  contactEmail: "ephrainguetta@gmail.com",
  /** Nom de l'éditeur (personne physique) — renseigné r12-g (« nom erik »). */
  editorName: "Erik",
} as const;
