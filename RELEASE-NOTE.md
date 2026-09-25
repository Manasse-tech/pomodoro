# 📋 Note de sortie — Focusly (r12-c)

**Date** : 17 septembre 2026 · **Périmètre** : déployabilité, efficacité, conformité Google AdSense · **Révision r12-d** : socle AdSense implémenté (contenus 600+, bandeau consentement, ads.txt) · **Révision r12-e** : intégration AdSense réelle (script `ca-pub-6410999448746776`, ads.txt officiel, consentement actif, contact éditeur centralisé) · **Révision r12-f** : site en ligne vérifié, domaine réel + email éditeur + hébergeur · **Révision r12-g** : éditeur nommé (Erik) + fichier de vérification Google Search Console · **Révision r12-h** : migration Netlify → **Vercel** (https://pomodoro-sage-chi-32.vercel.app) — déploiement Vercel vérifié à jour (r12-g inclus : preuve de propriété Google EN LIGNE)
**Verdict** : 🟢 **Déployable sous conditions** (checklist §4) · 🟢 **Efficace (QA complète verte)** · 🟢 **Site EN LIGNE sur Vercel** (HTTPS, version r12-g vérifiée en ligne) · 🟡 **AdSense : validation Google restante** — r12-h : domaine canonique basculé sur Vercel ; CMP TCF requise pour la pub personnalisée EEE/UK

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
1. ✅ **Domaine réel** (r12-f, migré r12-h) — URL Vercel `https://pomodoro-sage-chi-32.vercel.app` branchée dans `src/lib/focusly/site-config.ts` (`siteUrl` → `metadataBase`, OpenGraph), `public/robots.txt` et `public/sitemap.xml` (17 URLs). Un domaine personnalisé reste optionnel — un seul endroit à changer le cas échéant : `SITE_INFO.siteUrl`.
2. **Mentions légales** — ✅ r12-f/r12-g/r12-h : email éditeur (`ephrainguetta@gmail.com`), nom de l'éditeur et directeur de publication (**Erik**), hébergeur **Vercel Inc.** (Covina, CA) renseignés ; reste : adresse postale de l'éditeur (seul champ encore en placeholder).
3. **Secrets de prod** — définir `ADMIN_KEY` fort (la clé par défaut n'est **plus affichée** en production — corrigé r12-c : le message « Clé de développement » n'apparaît que dans les builds dev) et `DATABASE_URL` pointant vers un volume persistant (chemin absolu actuel lié au sandbox).
4. **Vérifier le build de prod** : `bun run build && bun run start` (impossible dans le sandbox dev — les règles d'environnement interdisent le build ici ; tsc/lint/ESLint verts servent de garantie statique).
5. Recommandé : passer `typescript.ignoreBuildErrors: false` dans `next.config.ts` une fois le build prod validé (le code actuel est déjà clean).
6. Note infra : le rate-limit est en mémoire (valide pour une instance unique ; prévoir un store partagé si scaling multi-instances). Sauvegarder `db/custom.db` (messages de contact = seules données persistées).

---

## 2. Efficacité (QA sortie)

- **12 routes** (`accueil, outils, statistiques, guide, blog×6, a-propos, contact, 3 pages légales, plan-du-site, admin` + 404) : rendu OK, **console 0 erreur**, 375 px zéro overflow horizontal, footer collant/poussé naturellement.
- **Interactions vérifiées en navigateur** : navigation hash (4 routes), dialogues Réglages/Raccourcis, palette Ctrl+K, minuteur Démarrer→Pause→Réinitialiser, burger menu mobile, contact (r12-j : email direct + copie presse-papiers ; formulaire retiré sur demande de l'éditeur), admin (gate + liste + réponses + export CSV).
- **Résilience** : scénario d'empoisonnement SW v4 reproduit puis **auto-guéri** par sw.js v5 (skipWaiting + purge + reload) — la cause du bug « tous les boutons morts » signalé par l'utilisateur est éliminée structurellement.
- **Correction intégrée à cette note** : politique de confidentialité exacte — r12-j : contact par email direct uniquement, aucune donnée personnelle stockée sur les serveurs (transparence RGPD/AdSense).

---

## 3. Conformité Google AdSense

### ✅ Déjà conforme
| Exigence AdSense | État |
|---|---|
| Pages obligatoires | ✅ À propos · Contact (r12-j : email direct avec bouton copier) · Confidentialité · Conditions · Mentions légales · Plan du site |
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
5. **Contact éditeur centralisé (r12-e, email réel r12-f)** — `src/lib/focusly/site-config.ts` alimente la page Contact (encart email direct cliquable), les mentions légales et la politique de confidentialité. Email renseigné : `ephrainguetta@gmail.com`. Hébergeur déclaré : Vercel Inc. (r12-h).
6. **Identité éditeur + Search Console (r12-g)** — `SITE_INFO.editorName = "Erik"` câblé dans les mentions légales (Éditeur + Directeur de la publication) ; fichier de vérification Google `public/google0be7b3a266557144.html` servi à la racine (contenu exact vérifié, 200).

### ⚠️ Reste à faire (nécessite infos/action utilisateur)
1. ✅ **Déploiement Vercel effectué et vérifié en ligne (r12-h)** — accueil 200, tag AdSense ×2, NPA inline, ads.txt officielle 200, **fichier de vérification Search Console 200 avec contenu exact**, sw v5. Reste : **1 redéploiement Vercel** pour publier r12-h (bascule SEO canonique metadataBase/OG/robots/sitemap → Vercel + hébergeur Vercel dans les mentions légales).
1b. Netlify reste en ligne (version r12-f, ancien og:image) — recommandé : désactiver le site Netlify ou le rediriger vers Vercel pour éviter tout contenu dupliqué aux yeux de Google.
2. Minor : les routes sont en `#hash` (single-page). Acceptable pour AdSense, mais pour un SEO optimal envisager plus tard des routes réelles (`/blog/[slug]`).

### Verdict AdSense
🟡 **Éligible après validation Google** : le site en ligne sert déjà le tag AdSense, l'ads.txt officiel, les contenus profonds (600+ mots/article), le consentement RGPD actif, l'identifiant éditeur intégré et le domaine réel branché. Restent : validation Google du site, CMP certifiée TCF pour la publicité **personnalisée** EEE/UK (sinon, annonces non personnalisées conformes).

---

## 4. Checklist de mise en ligne (ordre recommandé)

- [x] **Redéployer** — effectué : site EN LIGNE sur Vercel, version r12-g vérifiée (AdSense + ads.txt + preuve de propriété Google 200)
- [ ] **Redéployer sur Vercel après r12-h** (publie : domaine canonique Vercel dans metadataBase/OG/robots/sitemap + hébergeur Vercel mentions légales)
- [x] Hébergement : Vercel HTTPS en ligne (r12-h — migration depuis Netlify ; sous-domaine vercel.app, domaine personnalisé optionnel)
- [x] `metadataBase`, `robots.txt`, `sitemap.xml` → domaine réel (r12-h : URL Vercel — publie au prochain redéploiement)
- [ ] Mentions légales : email + hébergeur (Vercel) + nom Éditeur/Directeur faits (r12-f/r12-g/r12-h) — reste l'adresse postale de l'éditeur
- [ ] Env de prod : `ADMIN_KEY` fort, `DATABASE_URL` (volume persistant)
- [ ] `bun run build` + `bun run start` → smoke-test des 12 routes
- [ ] Soumission Google Search Console (sitemap) — **preuve de propriété déjà EN LIGNE sur Vercel (200)** : validation immédiate possible ; soumettre ensuite https://pomodoro-sage-chi-32.vercel.app/sitemap.xml
- [x] AdSense côté code (r12-e) : script `ca-pub-6410999448746776` dans le `<head>` + ads.txt officiel + consentement actif (NPA=1 sans acceptation)
- [ ] CMP certifiée TCF (obligatoire pour la publicité personnalisée EEE/UK — sinon annonces non personnalisées uniquement)
- [x] Email de contact réel (r12-f : renseigné dans `src/lib/focusly/site-config.ts`)
- [ ] Sauvegarde planifiée de la base SQLite

*Généré lors de l'audit de sortie r12-c — détails d'exécution dans `worklog.md`.*
