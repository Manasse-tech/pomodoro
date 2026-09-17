# 📋 Note de sortie — Focusly (r12-c)

**Date** : 17 septembre 2026 · **Périmètre** : déployabilité, efficacité, conformité Google AdSense
**Verdict** : 🟢 **Déployable sous conditions** (checklist §4) · 🟢 **Efficace (QA complète verte)** · 🟡 **AdSense : éligible après mise en ligne réelle** — 3 actions recommandées avant candidature (§3)

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
1. **Domaine réel** — remplacer le placeholder `focusly.example` dans :
   - `src/app/layout.tsx` (`metadataBase`, OpenGraph)
   - `public/robots.txt` (URL sitemap) · `public/sitemap.xml` (17 URLs)
2. **Mentions légales** — compléter les champs `[Éditeur]`, `[Directeur de publication]`, `[Hébergeur]` (page déjà structurée avec encart « À compléter avant mise en ligne »).
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

### ⚠️ À faire (recommandé avant / juste après candidature)
1. **Contenu plus profond** — moyenne ~310 mots/article : étendre chaque article à 600–800+ mots et publier régulièrement. *« Low value content » = motif de refus n°1 d'AdSense.*
2. **CMP certifiée TCF** — obligatoire pour les annonces personnalisées EEE/UK. La politique annonce déjà le consentement ; implémenter le bandeau (ex. Google-certified CMP) **avant** d'activer la personnalisation.
3. **ads.txt** — à déposer à la racine du domaine **après** validation du compte : `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`.
4. **Mise en ligne réelle** — AdSense exige un site public sur domaine en propre en HTTPS (le sandbox de prévisualisation ne suffit pas).
5. Minor : les routes sont en `#hash` (single-page). Acceptable pour AdSense, mais pour un SEO optimal envisager plus tard des routes réelles (`/blog/[slug]`).

### Verdict AdSense
🟡 **Éligible dès la mise en ligne** sur domaine réel : la conformité « pages + confidentialité + contenu original » est acquise ; prioriser l'enrichissement éditorial (action 1) pour maximiser les chances d'acceptation.

---

## 4. Checklist de mise en ligne (ordre recommandé)

- [ ] Domaine + DNS + HTTPS (hébergeur Node/Bun)
- [ ] `metadataBase`, `robots.txt`, `sitemap.xml` → domaine réel
- [ ] Mentions légales complétées
- [ ] Env de prod : `ADMIN_KEY` fort, `DATABASE_URL` (volume persistant)
- [ ] `bun run build` + `bun run start` → smoke-test des 12 routes
- [ ] Soumission Google Search Console (sitemap)
- [ ] Candidature AdSense → puis ads.txt + CMP + codes d'annonce
- [ ] Sauvegarde planifiée de la base SQLite

*Généré lors de l'audit de sortie r12-c — détails d'exécution dans `worklog.md`.*
