# 📋 Note de sortie — Focusly (r12-c)

**Date** : 17 septembre 2026 · **Périmètre** : déployabilité, efficacité, conformité Google AdSense · **Révision r12-d** : socle AdSense implémenté (contenus 600+, bandeau consentement, ads.txt) · **Révision r12-e** : intégration AdSense réelle (script `ca-pub-6410999448746776`, ads.txt officiel, consentement actif, contact éditeur centralisé)
**Verdict** : 🟢 **Déployable sous conditions** (checklist §4) · 🟢 **Efficace (QA complète verte)** · 🟢 **Site EN LIGNE** (Netlify HTTPS) · 🟡 **AdSense : 1 redéploiement + validation Google restants** — r12-f : domaine réel branché + email éditeur renseigné ; CMP TCF requise pour la pub personnalisée EEE/UK

---

## 1. Déployabilité

### ✅ Prêt
| Élément | État |
|---|---|
| Build | `output: "standalone"` configuré (`next build` → `bun .next/standalone/server.js`) |
| Base de données | Prisma + SQLite via `DATABASE_URL` (env) — contact only, schéma minimal |
| API `/api/contact` | Zod validation, honeypot anti-spam, case de consentement RGPD, rate-limit 5/15 min/IP, anti brute-force admin 10/15 min |
| SEO | robots.txt + sitemap.xml + metadata complètes (OG/Twitter) + JSON-LD + manifest PWA |
| PWA | manifest + icônes + sw.js **v5** (auto-guérison caches hérités, jamais de bundles périmés servis) |
| Robustesse | 404 gérée, offline.html, export/import données utilisateur, rehydration corruption-guard |
| Qualité | `tsc --noEmit` 0 erreur · `eslint` 0 erreur · console navigateur 0 erreur sur les 12 routes |

### ⚠️ Conditions de mise en production (bloquantes)
1. ✅ **Domaine réel** (r12-f) — URL Netlify `https://tangerine-cactus-866ff3.netlify.app` branchée dans `src/app/layout.tsx` (`metadataBase`, OpenGraph), `public/robots.txt` et `public/sitemap.xml` (17 URLs). Un domaine personnalisé reste optionnel (image de marque) — un seul endroit à changer le cas échéant : `SITE_INFO.siteUrl`.
2. **Mentions légales** — ✅ r12-f : email éditeur (`ephrainguetta@gmail.com`) + hébergeur (Netlify, Inc., San Francisco) renseignés ; restent : nom/adresse de l'éditeur et directeur de publication.
3. **Secrets de prod** — définir `ADMIN_KEY` fort (la clé par défaut n'est **plus affichée** en production — corrigé r12-c : le message « Clé de développement » n'apparaît que dans les builds dev) et `DATABASE_URL` pointant vers un volume persistant (chemin absolu actuel lié au sandbox).
4. **Vérifier le build de prod** : `bun run build && bun run start` (impossible dans le sandbox dev — les règles d'environnement interdisent le build ici ; tsc/lint/ESLint verts servent de garantie statique).
5. Recommandé : passer `typescript.ignoreBuildErrors: false` dans `next.config.ts` une fois le build prod validé (le code actuel est déjà clean).
6. Note infra : le rate-limit est en mémoire (valide pour une instance unique ; prévoir un store partagé si scaling multi-instances). Sauvegarder `db/custom.db` (messages de contact = seules données persistées).

---

## 2. Efficacité (QA sortie)

- **12 routes** (`accueil, outils, statistiques, guide, blog×6, a-propos, contact, 3 pages légales, plan-du-site, admin` + 404) : rendu OK, **console 0 erreur**, 375 px zéro overflow horizontal, footer collant/poussé naturellement.
- **Interactions vérifiées en navigateur** : navigation hash (4 routes), dialogues Réglages/Raccourcis, palette Ctrl+K, minuteur Démarrer→Pause→Réinitialiser, burger menu mobile, formulaire de contact (validation + consentement), admin (gate + liste + réponses + export CSV).
- **Résilience** : scénario d'empoisonnement SW v4 reproduit puis **auto-guéri** par sw.js v5 (skipWaiting + purge + reload) — la cause du bug « tous les boutons morts » signalé par l'utilisateur est éliminée structurellement.
- **Correction intégrée à cette note** : politique de confidentialité désormais exacte sur les données du formulaire de contact (transparence RGPD/AdSense).

---

## 3. Conformité Google AdSense

### ✅ Déjà conforme
| Exigence AdSense | État |
|---|---|
| Pages obligatoires | ✅ À propos · Contact (formulaire fonctionnel) · Confidentialité · Conditions · Mentions légales · Plan du site |
| Politique de confidentialité | ✅ Section publicité **AdSense explicite** (§4, lien Paramètres des annonces), cookies publicitaires « avec consentement » (§3), droits RGPD + CNIL (§6) — mise à jour r12-c sur les données collectées |
| Contenu original | ✅ Guide 694 mots + 6 articles de blog originaux, zéro contenu dupliqué |
| Contenus interdits | ✅ Aucun (productivité — thématique « advertiser-friendly ») |
| UX | ✅ Rapide, responsive, pas d'interstitiels intrusifs, navigation claire |
| robots.txt | ✅ `Allow: /` — le crawler AdSense/Mediapartners n'est pas bloqué |

### ✅ Fait (r12-d / r12-e)
1. **Contenu enrichi** — les 6 articles dépassent désormais 600 mots (775 / 622 / 625 / 640 / 671 / 693 mots, ~4 000 mots au total, sections expertes originales : FAQ, plans d'action, méthode des trois passes, transitions, auto-diagnostic…). Sommaires auto-générés enrichis en conséquence.
2. **Socle de consentement CMP-ready** — bandeau RGPD complet (`consent-banner.tsx` + store `focusly.consent.v1`) : Tout accepter / Continuer sans publicité personnalisée / réouverture via le lien « Cookies & publicité » du pied de page. **Inactif par défaut** (`ADS_CONFIG.enabled: false`) — la procédure d'activation pas-à-pas (script gtag conditionné au consentement, CMP TCF, ads.txt) est documentée dans `src/lib/focusly/ads-config.ts`. Flux validé E2E en navigateur.
3. **ads.txt** — `public/ads.txt` contient la ligne officielle `google.com, pub-6410999448746776, DIRECT, f08c47fec0942fa0` (déposée en r12-e).
4. **Intégration AdSense réelle (r12-e)** — identifiant éditeur `pub-6410999448746776` : script `adsbygoogle.js` chargé dans le `<head>` du HTML servi (`layout.tsx`, `beforeInteractive` → tag `ca-pub-…` visible du crawler de vérification Google) ; `ADS_CONFIG.enabled: true` ; bannière de consentement désormais **active** ; sans décision ou en cas de refus → `requestNonPersonalizedAds = 1` (annonces non personnalisées uniquement, défaut RGPD-safe via `ad-consent-sync.tsx`).
5. **Contact éditeur centralisé (r12-e, email réel r12-f)** — `src/lib/focusly/site-config.ts` alimente la page Contact (encart email direct cliquable), les mentions légales et la politique de confidentialité. Email renseigné : `ephrainguetta@gmail.com`. Hébergeur déclaré : Netlify, Inc.

### ⚠️ Reste à faire (nécessite infos/action utilisateur)
1. **Redéploiement Netlify** — le site est en ligne (HTTPS, API `/api/contact` fonctionnelle = 401 sans clé, SW v5) mais la version déployée date d'avant r12-e : ads.txt y est encore le modèle commenté et le tag AdSense est absent du HTML. Un redéploiement publie d'un coup : script `ca-pub-…` dans le head, ads.txt officiel, bandeau de consentement, email/contact et domaine réel.
2. Minor : les routes sont en `#hash` (single-page). Acceptable pour AdSense, mais pour un SEO optimal envisager plus tard des routes réelles (`/blog/[slug]`).

### Verdict AdSense
🟡 **Éligible après redéploiement + validation Google** : le site est en ligne (Netlify HTTPS), et tout est prêt côté code — pages obligatoires, politique de confidentialité exacte, contenus profonds (600+ mots/article), consentement RGPD actif, identifiant éditeur intégré (script + ads.txt), domaine réel branché. Restent : redéploiement Netlify, validation Google, CMP certifiée TCF pour la publicité **personnalisée** EEE/UK (sinon, annonces non personnalisées conformes).

---

## 4. Checklist de mise en ligne (ordre recommandé)

- [ ] **Redéployer sur Netlify** (publie d'un coup r12-e + r12-f : AdSense, ads.txt, consentement, email, domaine)
- [x] Hébergement : Netlify HTTPS en ligne (r12-f — sous-domaine netlify.app ; domaine personnalisé optionnel)
- [x] `metadataBase`, `robots.txt`, `sitemap.xml` → domaine réel (r12-f : URL Netlify)
- [ ] Mentions légales : email + hébergeur faits (r12-f) — restent nom/adresse éditeur + directeur de publication
- [ ] Env de prod : `ADMIN_KEY` fort, `DATABASE_URL` (volume persistant)
- [ ] `bun run build` + `bun run start` → smoke-test des 12 routes
- [ ] Soumission Google Search Console (sitemap)
- [x] AdSense côté code (r12-e) : script `ca-pub-6410999448746776` dans le `<head>` + ads.txt officiel + consentement actif (NPA=1 sans acceptation)
- [ ] CMP certifiée TCF (obligatoire pour la publicité personnalisée EEE/UK — sinon annonces non personnalisées uniquement)
- [x] Email de contact réel (r12-f : renseigné dans `src/lib/focusly/site-config.ts`)
- [ ] Sauvegarde planifiée de la base SQLite

*Généré lors de l'audit de sortie r12-c — détails d'exécution dans `worklog.md`.*
