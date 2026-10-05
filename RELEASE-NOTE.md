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



### ✅ Fait (r12-d / r12-e)
1. **Contenu enrichi** — les 6 articles dépassent désormais 600 mots (775 / 622 / 625 / 640 / 671 / 693 mots, ~4 000 mots au total, sections expertes originales : FAQ, plans d'action, méthode des trois passes, transitions, auto-diagnostic…). Sommaires auto-générés enrichis en conséquence.
2. **Socle de consentement CMP-ready** — bandeau RGPD complet (`consent-banner.tsx` + store `focusly.consent.v1`) : Tout accepter / Continuer sans publicité personnalisée / réouverture via le lien « Cookies & publicité » du pied de page. **Inactif par défaut** (`ADS_CONFIG.enabled: false`) — la procédure d'activation pas-à-pas (script gtag conditionné au consentement, CMP TCF, ads.txt) est documentée dans `src/lib/focusly/ads-config.ts`. Flux validé E2E en navigateur.
3. **ads.txt** — `public/ads.txt` contient la ligne officielle `google.com, pub-6410999448746776, DIRECT, f08c47fec0942fa0` (déposée en r12-e).
4. **Intégration AdSense réelle (r12-e)** — identifiant éditeur `pub-6410999448746776` : script `adsbygoogle.js` chargé dans le `<head>` du HTML servi (`layout.tsx`, `beforeInteractive` → tag `ca-pub-…` visible du crawler de vérification Google) ; `ADS_CONFIG.enabled: true` ; bannière de consentement désormais **active** ; sans décision ou en cas de refus → `requestNonPersonalizedAds = 1` (annonces non personnalisées uniquement, défaut RGPD-safe via `ad-consent-sync.tsx`).
5. **Contact éditeur centralisé (r12-e, email réel r12-f)** — `src/lib/focusly/site-config.ts` alimente la page Contact (encart email direct cliquable), les mentions légales et la politique de confidentialité. Email renseigné : `ephrainguetta@gmail.com`. Hébergeur déclaré : Vercel Inc. (r12-h).
6. **Identité éditeur + Search Console (r12-g)** — `SITE_INFO.editorName = "Erik"` câblé dans les mentions légales (Éditeur + Directeur de la publication) ; fichier de vérification Google `public/google0be7b3a266557144.html` servi à la racine (contenu exact vérifié, 200).


