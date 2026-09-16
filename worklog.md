# Focusly — Worklog

## Projet
Reconstruction du site HTML statique « Focusly » (minuteur Pomodoro FR, upload utilisateur) en une vraie application web Next.js 16 production-ready, avec toutes les fonctionnalités + backend (contact DB), SEO, PWA, et corrections des bugs du code source.

Source originale analysée : `/home/z/my-project/analysis/focusly-original.html` (copie de l'upload).

Bugs identifiés dans le code source original :
- `durationFor(m)` : `Math.round(state.settings])*60` → erreur de syntaxe
- `setMode` : `if(!MODES]||...)` → erreur de syntaxe
- `renderHistory` : `MODES.mode]?MODES.mode].label` → erreur de syntaxe
- CSS : `idden]{display:none!important}` → sélecteur cassé (devrait être `[hidden]`)
- Formulaire de contact : simple `mailto:`, aucun backend

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Fondations — types, store zustand, router, chime, thème globals.css, layout SEO, page.tsx

Work Log:
- Analyse complète du HTML original (structure, JS, CSS, contenu)
- Création des fondations partagées (voir Stage Summary)

Stage Summary:
- Contrats partagés définis dans `src/lib/focusly/types.ts`, `store.ts`, `router.ts`, `chime.ts`
- Thème Focusly porté dans `src/app/globals.css` (data-theme dark/light + --brand par mode)
- Layout avec métadonnées SEO FR + script anti-FOUC
- Les agents 2-a (contenu) et 2-b (backend) construisent sur ces contrats

---
Task ID: 2-a
Agent: frontend-styling-expert
Task: Vues de contenu (FR) — accueil, guide, blog (index + 6 articles), à propos, pages légales, 404 + données blog

Work Log:
- Lu le worklog, les contrats (types.ts, router.ts, breadcrumb.tsx, article-blocks.tsx) et extrait tout le contenu FR du HTML original (sections ACCUEIL, GUIDE, BLOG, ARTICLES, À PROPOS, CONFIDENTIALITE, CONDITIONS, MENTIONS LEGALES, PLAN DU SITE)
- Rempli `src/lib/focusly/blog.ts` avec les 6 articles complets (mêmes exports : BlogPost, BLOG_POSTS, getPost) — contenu porté fidèlement en Block[] (p/h2/h3/list ordered/cta « ← Retour au blog »), tags/dates/readMinutes/excerpt d'origine conservés
- Créé `accueil-view.tsx` : héros (h1 + em.text-brand, 2 CTA vers #outils/#guide), « Pourquoi Focusly ? », « Vos outils » (4 cartes avec icônes lucide → #outils), « À lire sur le blog » (4 cartes mappées sur BLOG_POSTS filtrés) + bouton pleine largeur « Voir tous les articles → »
- Créé `guide-view.tsx` : fil d'Ariane + article complet du guide via ArticleBlocks (cta final → #outils)
- Créé `blog-view.tsx` : fil d'Ariane + grille 6 cartes (sm:2/ lg:3 colonnes) → #blog/{slug}
- Créé `blog-article-view.tsx` : breadcrumb (titre tronqué), meta frDate + lecture, ArticleBlocks, nav précédent/suivant calculée sur BLOG_POSTS + bouton « Retour au blog » ; slug inconnu → NotView
- Créé `a-propos-view.tsx` : mission, approche (liste), équipe, lien contact inline
- Créé `legal-views.tsx` : ConfidentialiteView, ConditionsView (via ArticleBlocks), MentionsLegalesView (blockquote « À compléter avant mise en ligne. » conservée), PlanDuSiteView (listes dérivées de ROUTES + BLOG_POSTS) ; liens internes en #hash, liens externes target="_blank" rel="noopener noreferrer"
- Créé `not-found-view.tsx` : exporte NotFoundView + NotView réutilisable (404 FR, boutons vers #accueil et #plan-du-site)
- Vérifié : `bunx tsc --noEmit` → 0 erreur dans mes fichiers ; `bunx eslint src/components/focusly/content/ src/lib/focusly/blog.ts` → 0 erreur / 0 warning

Stage Summary:
- 8 fichiers créés : `src/lib/focusly/blog.ts` + 7 vues dans `src/components/focusly/content/` (accueil, guide, blog, blog-article, a-propos, legal-views, not-found)
- Design system respecté : conteneur max-w-[920px], cartes rounded-2xl avec hover -translate-y/shadow, tag text-brand uppercase, méta text-faint, titres text-3xl/4xl
- Apostrophes typographiques (’) partout dans le texte FR (évite react/no-unescaped-entities) ; pas d'emoji, pas de bleu
- ⚠️ Bug préexistant hors de mon périmètre : `article-blocks.tsx` ligne 4 n'importe que `import type { ReactNode }` mais utilise `Fragment` (ligne 100) → erreur TS2304 + react/jsx-no-undef. Correctif 1 ligne pour le propriétaire du contrat : `import { Fragment, type ReactNode } from "react"`
- ⚠️ `src/app/page.tsx` importe `@/components/focusly/focusly-app` qui n'existe pas encore (tâche 2-b / assemblage) — erreur TS2307 attendue, hors périmètre 2-a
- Écarts mineurs assumés : italiques <em> du HTML original rendus en texte simple (Block ne supporte que **gras**) ; « bouton ⚙ » du guide reformulé « via les réglages du minuteur » ; cartes accueil/blog alimentées par les excerpts de BLOG_POSTS (versions index du blog) ; libellés du plan du site = titres complets des articles

---
Task ID: 2-b
Agent: full-stack-developer
Task: Backend contact — modèle Prisma ContactMessage, API POST /api/contact (zod v4, honeypot, rate limit), vue ContactView (formulaire FR accessible)

Work Log:
- Lu worklog.md + contrats existants (router.ts, globals.css, breadcrumb.tsx de 2-a, ui/shadcn)
- Ajout du modèle `ContactMessage` dans prisma/schema.prisma (User/Post conservés) puis `bun run db:push` → OK (SQLite db/custom.db, Prisma Client v6.19.2 régénéré)
- Créé `src/app/api/contact/route.ts` : POST unique, runtime nodejs, zod v4 (messages FR), honeypot `website` (silencieux, non compté), rate limit mémoire Map<ip, timestamps> 5 req/15 min (x-forwarded-for 1re valeur sinon "local"), 400 = 1er message zod, 429 FR, 500 FR avec log console, succès 200 {ok:true,id}, subject vide → null en DB
- Créé `src/components/focusly/content/contact-view.tsx` : "use client", conteneur max-w-[920px], Breadcrumb (Accueil/Contact), h1 + sous-titre + note 48 h, formulaire max-w-[560px] (Input/Textarea/Checkbox/Label/Button shadcn, min-h-[44px], rounded-xl, bg-card), honeypot caché tabIndex -1, validation client FR par champ (text-destructive text-sm, aria-invalid + aria-describedby), compteur 0/5000, envoi fetch relatif /api/contact avec Loader2 "Envoi…", succès → toast.success sonner + reset + panneau CheckCircle2 text-brand avec bouton "Envoyer un autre message", erreur → toast.error, hint email direct text-faint, labels htmlFor + astérisques corail + sr-only "(obligatoire)"
- ESLint sur mes 2 fichiers : 0 erreur 0 warning (note : `article-blocks.tsx` de 2-a a 1 erreur préexistante 'Fragment' is not defined, ligne 100 — hors de mon périmètre)
- Vérifié le endpoint via script bun isolé (supprimé après) appelant POST() directement (le dev server renvoie 500 sur toutes les routes car page.tsx importe focusly-app pas encore créé par 2-a) : validation 400 ✓, honeypot 200 sans ligne DB ✓, création 200 {ok,id} ✓, subject null ✓, consent false → 400 ✓, rate limit 5 OK puis 429 ✓ (x-forwarded-for "10.0.0.99, ..." → 1re valeur bien utilisée) ; lignes de test nettoyées (deleteMany), DB propre
- Re-vérifié dev.log en fin de tâche : seule erreur restante = import focusly-app manquant (responsabilité agent 2-a / main)

Stage Summary:
- `prisma/schema.prisma` : + model ContactMessage (id cuid, name, email, subject?, message, createdAt) — poussé en DB
- `src/app/api/contact/route.ts` : contrat POST {name 2–100, email ≤200 valide, subject? ≤150 défaut "", message 10–5000, consent: literal true, website? honeypot vide} → 200 {ok:true,id} | 400 {error: message zod FR} | 429 {error:"Trop de messages envoyés. Réessayez plus tard."} | 500 {error:"Erreur serveur. Réessayez."} | honeypot rempli → 200 {ok:true} sans save ; rate limit 5/15 min par IP en mémoire ; export type ContactPayload
- `src/components/focusly/content/contact-view.tsx` : export function ContactView() prête à être montée par focusly-app sur la route "contact" (hash router)
- État DB : table ContactMessage vide (lignes de test supprimées)
- À signaler au main : page.tsx attend `@/components/focusly/focusly-app` (2-a) ; lint error préexistant dans article-blocks.tsx (2-a)

---
Task ID: 3+4+5
Agent: main (Z.ai Code)
Task: App shell, header/footer, timer, tools panels, dialogs, assets, SEO files

Work Log:
- focusly-app.tsx : shell (routeur hash, ticker 250ms, effets thème/mode, raccourcis clavier, JSON-LD)
- site-header.tsx / site-footer.tsx : nav responsive + menu mobile, footer sticky
- tools/ : timer-card (anneau SVG, points de cycle, tâche liée, stats du jour), weekly-stats (graphique 7 jours), tasks-panel, notes-panel, history-panel (export/import JSON), settings-dialog (durées, son+volume, notifications, démarrage auto, réinitialisations), help-dialog
- Images générées (icône tomate + bannière OG) via image-generation, redimensionnées avec sharp
- public/ : manifest.webmanifest, sitemap.xml, robots.txt, icon-192/512, og-image.png
- Correction import Fragment manquant dans article-blocks.tsx (bug signalé par 2-a)

Stage Summary:
- App complète assemblée, tsc clean sur src/, eslint 0 erreur
- À faire : démarrage dev server, vérification agent-browser de tous les parcours

---
Task ID: 6+7 (vérification)
Agent: main (Z.ai Code)
Task: Lint, serveur dev, vérification end-to-end agent-browser, corrections

Work Log:
- tsc --noEmit : 0 erreur sur src/ (erreurs restantes = dossiers examples/skills préexistants)
- eslint src : 0 erreur, 0 warning
- Vérification agent-browser complète :
  * Accueil, Outils, Guide (7 sections), Blog (6 liens), article, Contact, plan-du-site, 404 → tous OK
  * Minuteur : démarrage (25:00→24:57), pause, changement de mode, accents par mode (coral/teal #37d3b0/blue #6aa6ff)
  * Session complète 1 min : stats +1 pomodoro/68s, entrée historique, bascule auto vers pause courte, toast ✓
  * Tâches : ajout x2, liaison au minuteur (badge sur timer card) ✓ ; Notes : ajout ✓
  * Réglages : steppers, son+volume, switches ; focus=1 min synchronise le timer instantanément ✓
  * Raccourcis clavier : T (thème), , (réglages), Échap (fermer) ✓
  * Contact end-to-end : POST /api/contact 200 → enregistrement vérifié dans SQLite, toast + panneau succès ✓
  * Graphique hebdo : barre du jour avec données réelles ✓
  * Mobile 375px : menu hamburger, pas d'overflow horizontal ✓ ; footer sticky vérifié (2000px = vh sur page courte, poussé sur page longue)

Bugs trouvés et corrigés pendant la vérification :
1. Titre « Page introuvable » sur les articles de blog → titre dynamique par article dans router.ts
2. Erreur d'hydratation <body data-mode> (script anti-FOUC vs SSR) → suppressHydrationWarning sur <body>
3. Erreur d'hydratation nav active sur deep links (useState(getHashRoute())) → init "accueil" + sync en effet
4. scroll-behavior:smooth cause des courses de clic automatisés → retiré (aucune ancre dans la SPA)

Stage Summary:
- Site 100 % fonctionnel, vérifié de bout en bout, propre au lint et à l'hydratation
- Données de test supprimées de la DB (0 message en base)
- Prochaines étapes possibles : service worker PWA, i18n, comptes utilisateurs, export CSV, sons multiples

---
Task ID: r2-5
Agent: frontend-styling-expert
Task: Blog — recherche, filtre par tag, badges de lecture

Work Log:
- Lu worklog.md + contrats (blog.ts/BLOG_POSTS, types.ts/frDate, breadcrumb.tsx, ui/badge + ui/input + ui/button, tokens globals.css text-brand/text-soft/text-faint, site-header sticky z-50 hauteur ~65px)
- Réécrit blog-view.tsx : toolbar sticky-ish (sm+) avec input de recherche (icône Search lucide en absolute + pl-9, type="search", aria-label « Rechercher un article », placeholder « Rechercher un article… ») ; chips « Tous » + 5 tags uniques (Set sur BLOG_POSTS), boutons pill rounded-full px-3.5 py-1.5 text-[13px] font-semibold avec aria-pressed, actif bg-brand text-[#14161a], inactif border bg-card text-soft hover:text-foreground ; compteur de résultats aria-live polite text-[13px] text-faint (« 6 articles » hors filtre, « N article(s) trouvé(s) » sinon, singulier géré)
- Filtrage : fold() = normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase() ; recherche sur title + excerpt + tag, insensible casse ET accents (« etudiant » trouve « Étudiants ») ; combinée en ET avec le filtre tag exact ; états useState (query, activeTag: string|null) + useMemo ; changement de tag réinitialise la requête (spec « RESET filters state when switching tag ») ; « Réinitialiser les filtres » (Button ghost) remet query + tag à zéro
- Empty state : rounded-xl border border-dashed p-8 text-center, « Aucun article ne correspond à votre recherche. » + bouton reset
- Cartes : group flex h-full flex-col rounded-2xl border bg-card p-5 + hover conservés ; meta row mt-auto (Badge variant="secondary" « ~N min de lecture » + date frDate en text-[12px] text-faint + ArrowRight déplacé en ml-auto de cette row) ; grille grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ; liens #blog/{slug} inchangés
- Toolbar « sticky-ish » : position sticky uniquement en sm+ (top-[65px] calé sous le header sticky 65px, z-20 < z-50 du header, bg-background/95 + backdrop-blur-sm, pb-4/-mb-4 pour couvrir le défilement) ; statique sur mobile (page courte, ne pas consommer le viewport) ; textes/h1/sous-titre/breadcrumb d'origine conservés à l'identique
- blog-article-view.tsx (édition légère uniquement) : + import Badge ; meta = Badge secondary tag en style uppercase des cartes index (text-[11px] font-bold uppercase tracking-[0.08em] text-brand) devant « Publié le … · Lecture … » (texte inchangé), wrapper flex flex-wrap ; cartes précédent/suivant : ligne supplémentaire « ~N min » en text-[12px] text-faint ; rien d'autre restructuré
- Vérifié : bunx tsc --noEmit → 0 erreur dans src/ (seules erreurs = examples/ et skills/ préexistantes, hors périmètre) ; bunx eslint sur les 2 fichiers → 0 erreur, 0 warning ; pas de dev server ni build (consigne)

Stage Summary:
- 2 fichiers modifiés : src/components/focusly/content/blog-view.tsx (réécrit : recherche accent-tolérante + chips de filtre par tag + compteur aria-live + empty state + badge « ~N min de lecture » par carte) et src/components/focusly/content/blog-article-view.tsx (badge tag dans la meta line + « ~N min » dans les cartes de navigation précédent/suivant)
- Contrats respectés sans modification : BLOG_POSTS/BlogPost, frDate, Breadcrumb, Badge (variant secondary vérifié), design tokens (bg-brand via --color-brand) ; aucun autre fichier touché ; aucun `any`, aucun emoji, pas de bleu
- Interprétations à noter : « RESET filters state when switching tag » implémenté = changer de chip efface la requête (recherche + tag restent combinables en tapant après avoir choisi un tag) ; ArrowRight des cartes déplacé dans la meta row pour équilibrer le pied de carte ; sticky de la toolbar limitée à sm+ (header déjà sticky, hauteur dynamique sur mobile)

---
Task ID: r2-4
Agent: frontend-styling-expert
Task: Palette de commandes Ctrl+K

Work Log:
- Lu worklog.md, contrats confirmés : `@/components/ui/command` exporte bien CommandDialog/CommandInput/CommandList/CommandEmpty/CommandGroup/CommandItem/CommandSeparator (+ Command, CommandShortcut) ; `navigate()` et actions store (startTimer/pauseTimer/resetTimer/skipMode/toggleTheme/setSettingsOpen/setHelpOpen) conformes
- Vérifié versions : cmdk 1.1.1 (le Separator du cmdk se masque automatiquement dès qu'une recherche est active → pas de traits orphelins), lucide-react 0.525.0 (toutes les icônes + type LucideIcon existent)
- Vérifié focusly-app.tsx : le handler global de raccourcis ignore déjà ctrl/meta/alt → aucun conflit avec Ctrl+K/Cmd+K
- Créé `src/components/focusly/tools/command-palette.tsx` (seul fichier touché) : export function CommandPalette() sans props ; "use client" ; open en useState ; useEffect unique avec keydown global (Ctrl+K ou Meta+K → preventDefault + toggle, Échap laissé à CommandDialog/onOpenChange) + écoute CustomEvent window "focusly:open-command" → ouvre
- Groupes : Navigation (7 routes via navigate()), Minuteur (start/pause via getState() avec icône Play/Pause selon running lu au rendu, reset, skip), Application (toggleTheme, setSettingsOpen(true), setHelpOpen(true)) — chaque action ferme la palette
- Dialog FR : title "Palette de commandes" + description sr-only (remplace les défauts anglais du composant shadcn) ; CommandEmpty "Aucun résultat." ; placeholders/libellés FR avec apostrophes typographiques ; pas de style custom au-delà des icônes
- SSR-safe : tout accès window dans useEffect/handlers ; contenu du dialog uniquement rendu côté client à l'ouverture (portal) → aucun risque d'hydratation
- Self-check : `bunx tsc --noEmit` → 0 erreur dans src/ (seul bruit préexistant examples/skills) ; `bunx eslint src/components/focusly/tools/command-palette.tsx` → 0 erreur 0 warning

Stage Summary:
- `src/components/focusly/tools/command-palette.tsx` créé : `export function CommandPalette()` (aucune prop) — prêt à être monté par le main dans focusly-app (ex. <CommandPalette /> au niveau du shell) ; le bouton header doit dispatcher `window.dispatchEvent(new CustomEvent("focusly:open-command"))` pour l'ouvrir
- Raccourcis : Ctrl+K / Cmd+K bascule l'ouverture, Échap ferme (via onOpenChange de CommandDialog)

---
Task ID: R2 (cron webDevReview — tour 2)
Agent: main (Z.ai Code) + sous-agents frontend-styling-expert (r2-4, r2-5)
Task: Nouvelles fonctionnalités + polish styling + QA complète

## État du projet au départ
Stable : 0 erreur lint/tsc, hydratation propre, tous les parcours vérifiés au tour 1.

## Work Log
- QA smoke : dev.log 200, overlay Next.js clean, titre OK
- **Objectif quotidien** (nouveau) : `settings.dailyGoal` (1–20, défaut 8), stepper dans les réglages, barre de progression sous les stats du jour (« OBJECTIF 1 / 2 »), toast de célébration + carillon à l'atteinte (garde anti-doublon par ref)
- **Séries** (nouveau) : `src/lib/focusly/streaks.ts` (computeStreaks : série courante + record), bandeau « Série en cours : N jours · Record : N » dans le panneau hebdo
- **Palette de commandes** (nouveau, r2-4) : Ctrl+K / Cmd+K + bouton loupe header (CustomEvent), navigation 7 pages, actions minuteur, thème, réglages, aide — via shadcn CommandDialog (cmdk)
- **Blog recherche + filtres** (nouveau, r2-5) : recherche insensible casse/accents (title+excerpt+tag), chips de tags (Tous + 5 tags, aria-pressed), compteur aria-live, état vide + reset, badges « ~N min de lecture » + dates, badge tag sur les articles, prev/next enrichis
- **Styling (obligatoire)** : transitions de vues framer-motion (fade+slide 0.25s, respecte prefers-reduced-motion), pulsation de l'anneau pendant la course (.ring-pulse), ombre du header au scroll (.site-header-scrolled), halo de marque derrière le héros (.hero-glow), bouton loupe header
- Intégration : <CommandPalette /> dans focusly-app, aide enrichie (Ctrl K), SettingsDialog dédoublonné

## Bugs trouvés et corrigés ce tour
1. **SettingsDialog monté 2×** (focusly-app + outils-view) → ids dupliqués, fills Radiogroup incohérents → retiré de outils-view
2. **focusSeconds 59.9999…** (dérive flottante) → « 0 minutes » affiché malgré 60 s → arrondi 0,1 s à l'accumulation
3. Raccourci « , » ignoré si un bouton a le focus (comportement attendu, documenté dans l'aide)

## Vérifications agent-browser
- Ctrl+K ouvre la palette → clic « Guide » → #guide + titre OK
- Blog : « cerveau » → 1 article ; tag Neurosciences → 1 ; Tous → 6 ; compteur et badges OK
- Session 1 min (objectif 1) : pomodoros=1, barre 1/1 pleine, toast « Objectif du jour atteint, bravo ! », série 1 jour, bascule auto pause courte
- Retest (objectif 2) : minutes affichées = 1 (fix flottant OK), pas de double célébration
- tsc : 0 erreur src/ ; eslint : 0/0 ; overlay hydratation : clean

## Stage Summary
- 4 nouvelles fonctionnalités livrées et vérifiées, 2 bugs corrigés, styling enrichi
- Risques : aucun connu ; dev.log propre (200)

## Recommandations tour suivant
- Service worker PWA (cache offline) — à tester prudemment en sandbox
- Sons multiples + tick des 5 dernières secondes ; estimation pomodoros par tâche
- Page statistiques dédiée (heatmap mensuelle) ; export CSV en plus du JSON
