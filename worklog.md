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

---
Task ID: r3-1
Agent: frontend-styling-expert
Task: Page « Statistiques » — heatmap mensuelle, KPI globaux, export CSV

Work Log:
- Lu worklog.md + contrats confirmés : store (useFocusly((s) => s.daily), EMPTY_STAT), types (todayKey = clé locale YYYY-MM-DD → décomposition locale obligatoire), streaks (computeStreaks → {current,best}), csv (dailyToCsv, downloadTextFile), Breadcrumb (items Accueil + page courante), Button (variant outline/secondary/ghost, size icon, asChild), tokens globals.css (bg-brand via --color-brand, text-soft/text-faint, --brand-glow, ring-offset-card)
- Créé `src/components/focusly/content/statistiques-view.tsx` (seul fichier touché) : "use client", export function StatistiquesView() sans props, conteneur mx-auto max-w-[920px] px-5 py-8 sm:py-10, Breadcrumb Accueil/Statistiques, h1 + sous-titre « Vos données restent sur votre appareil »
- KPI row : grid grid-cols-2 lg:grid-cols-4 gap-4, 4 cartes rounded-3xl border bg-card p-5 (icône lucide text-brand, valeur time-display text-2xl, label uppercase 10px) : Pomodoros au total (Flame), Temps de concentration « X h YY min / Y min » (Timer), Jours actifs + hint « / N jours enregistrés » (CalendarCheck), Série record + « actuelle : N j » (Award)
- Heatmap : carte p-6, h2 « Calendrier mensuel » + mois capitalisé (« Mars 2025 ») en text-brand, nav ChevronLeft/ChevronRight (Button outline size-icon rounded-lg, aria-labels FR), « Mois suivant » disabled sur le mois courant, retour arrière illimité ; grille grid-cols-7 gap-1 min-w-[320px] dans overflow-x-auto ; en-têtes lun mar mer jeu ven sam dim (toLocaleDateString fr-FR weekday short, point retiré, semaine de référence lundi 2024-01-01 déterministe) ; offset lundi-first = (getDay()+6)%7 + padding final pour compléter la dernière semaine
- Cellules : aspect-square rounded-md transition-transform hover:scale-110 ; intensité 5 niveaux (0 bg-secondary, 1–2 bg-brand/25, 3–4 bg-brand/45, 5–6 bg-brand/70, 7+ bg-brand + shadow var(--brand-glow)) ; jours futurs invisible ; aujourd’hui ring-2 ring-brand ring-offset-2 ring-offset-card ; title par cellule « 12 mars 2025 — 4 pomodoros, 100 min de concentration » / « aucun pomodoro » (date formatée depuis new Date(y, m, d) LOCAL, jamais new Date(key) UTC) ; grille role="img" + aria-label « Mars 2025 : N pomodoros sur M pomodoros enregistrés »
- Légende « Moins / Plus » (5 pastilles size-3, text-[11px] text-faint) ; bandeau série sous la grille identique au style weekly-stats (rounded-xl border bg-secondary px-3 py-2, Award)
- Actions : Button secondary rounded-xl « Exporter en CSV » (Download) → downloadTextFile(dailyToCsv(daily), focusly-statistiques-<todayKey>.csv) + toast.success, ou toast.info si aucun jour ; Button ghost asChild « ← Retour aux outils » (#outils)
- Empty state : carte border-dashed « Aucune donnée pour l’instant. … » affichée quand 0 jour enregistré (KPI + heatmap quand même rendus) ; toasts sonner, apostrophes typographiques, aucune couleur bleue, aucun emoji
- Vérifié : bunx tsc --noEmit → 0 erreur dans src/ (seul bruit préexistant examples/ et skills/) ; bunx eslint src/components/focusly/content/statistiques-view.tsx → 0 erreur 0 warning ; sanity-check bun des libellés fr (lun…dim, Mars 2025, offset 1er mars 2025 = 5) ; pas de dev server ni build (consigne)

Stage Summary:
- `src/components/focusly/content/statistiques-view.tsx` créé : vue « Statistiques » complète prête à être montée par focusly-app sur la route "statistiques" (déjà déclarée dans ROUTES + ROUTE_TITLES) — il ne reste qu’au main à ajouter `if (route === "statistiques") return <StatistiquesView />` dans CurrentView
- Données : totaux globaux (pomodoros, focusSeconds, jours actifs, jours enregistrés) + computeStreaks ; aucune modification des contrats, aucun autre fichier touché
- Détails d’implémentation : état de mois local {y, m} initialisé paresseusement (client-only, aucune route rendue en SSR), clés de jours reconstruites avec des parties locales (padStart) identiques à todayKey, WEEKDAY_LABELS constants module-scope déterministes

---
Task ID: r3 (cron webDevReview — tour 3)
Agent: main (Z.ai Code) + sous-agent frontend-styling-expert (r3-1)
Task: Assessment + QA agent-browser, nouvelles fonctionnalités (stats mensuelles, sons, estimations, PWA), polish styling

## État du projet au départ
Stable : 0 erreur lint/tsc, tous les parcours vérifiés aux tours 1-2. Décision : pas de bugs bloquants → avancer les fonctionnalités recommandées au tour 2.

## Work Log
- Fix lint : `analysis/**`, `download/**`, `mini-services/**` ajoutés aux ignores ESLint (fichier resize.js hérité de l'analyse)
- **Page Statistiques dédiée (#statistiques)** (r3-1) : heatmap mensuelle (5 niveaux d'intensité brand, navigation mois par mois bloquée vers le futur, lundi-first, tooltips FR, today cerclé, legend Moins/Plus), 4 KPI (pomodoros total, temps de concentration, jours actifs, série record), bandeau séries, export CSV, empty state, responsive (KPI 2×2 mobile, heatmap scroll interne)
- **Export CSV** : `src/lib/focusly/csv.ts` (dailyToCsv séparateur `;` FR + downloadTextFile) ; page stats + libellés accueil mis à jour (« JSON ou CSV »)
- **Moteur de sons** : `playEndSound(kind, volume)` — carillon (3 notes), cloche (2 frappes + partiels inharmoniques), digital (3 bips carrés) ; `playCountdownTick` (blip 740 Hz) ; sélecteur segmenté 3 sons + bouton écoute (preview) + switch « Tic des dernières secondes » dans les réglages ; tick joué une fois par seconde pendant les 5 dernières secondes (garde anti-doublon par ref)
- **Estimations de pomodoros par tâche** : `TaskItem.estimate` (1–12) + `spent` ; stepper −/+ dans le formulaire (reset après ajout), stepper compact 0/3 par ligne, ligne de progression « X sur Y pomodoros estimés », badge sur la tâche liée du minuteur (surbrillance brand quand atteint), crédit automatique du pomodoro à la complétion d'une session focus
- **PWA offline** : `public/sw.js` (v3) + `public/offline.html` + manifest enrichi (id, scope, categories, raccourcis Outils/Stats) ; enregistrement sécurisé (https/localhost uniquement, 1,5 s après chargement) ; sitemap.xml : + #statistiques
- **Intégration** : route « statistiques » (ROUTES, titres, CurrentView), nav header « Stats », palette Ctrl+K (BarChart3), lien « Voir toutes les statistiques → » dans le panneau hebdo, carte pleine largeur « Statistiques mensuelles » sur l'accueil, plan du site mis à jour
- **Migration store** : `merge` personnalisé dans zustand persist (settings = défauts + persistés) → les nouveaux champs (soundKind, tickLast) gardent leur défaut chez les utilisateurs existants

## Bugs trouvés et corrigés ce tour
1. **SW v1 cassait l'itération dev** (cache-first sur /_next/static → chunks JS périmés après recompile) → v2 : network-first pour /_next ; v3 : revalidation `cache: "no-cache"` sur navigations + /_next (garantit les mises à jour même avec un cache HTTP agressif), cache-first réservé aux icônes/manifest/fonts ; cleanup des vieux caches à l'activation
2. **Titre périmé sur deep-link reload** (le routeur client Next re-assert le titre du pathname sans hash après hydratation) → titre posé impérativement dans onChange + re-assertion rAF/0 ms/250 ms ; vérifié sur article blog, #statistiques, 404
3. Heatmap desktop : cellules ~125 px trop grandes → grille plafonnée max-w-[420px] centrée (cellules ~55 px)
4. Grammaire FR : « 1 pomodoros enregistrés » (aria heatmap) → accord singulier ; ligne de progression reformulée

## Vérifications agent-browser
- Stats : KPI réels (2 pomodoros, 2 min, 1 jour actif, série 1), navigation mois (sept → août → juillet, bouton suivant désactivé au mois courant), export CSV → toast « Export CSV téléchargé. »
- Session 1 min avec tâche liée « Rédiger le rapport » (estimation 3) : badge 0/3 → 1/3, ligne « 1 sur 3 pomodoros estimés », stats +1, bascule auto pause courte, objectif 2/2 atteint
- Réglages : sélecteur Carillon/Cloche/Digital (sélection persistée), switch tic activé, preview au clic
- PWA : SW v3 activé et contrôleur, caches v3 créés, /sw.js + /offline.html 200 ; accueil nav « Stats » active
- Mobile 375 px : aucun overflow horizontal (accueil, stats, outils) ; heatmap scroll interne
- Thème clair : heatmap/KPI vérifiés visuellement (screenshots desktop + mobile)
- Palette Ctrl+K : entrée « Statistiques » présente ; plan du site : lien « Statistiques » présent
- Contact honeypot : 200 sans ligne DB (DB vérifiée : 0 message) ; données locales de test effacées (état d'usine)
- tsc : 0 erreur src/ ; eslint : 0/0 ; dev.log : 200 propres, aucune erreur runtime

## Stage Summary
- 4 fonctionnalités livrées (stats mensuelles + CSV, 3 sons + tic, estimations de tâches, PWA offline), 4 bugs corrigés, intégration complète (nav, palette, accueil, plan du site, sitemap, manifest)
- Fichiers clés : `content/statistiques-view.tsx`, `lib/focusly/csv.ts`, `public/sw.js`, `public/offline.html`, `types.ts`/`store.ts`/`chime.ts` (contrats étendus)
- Risques : aucun connu ; le SW revalide /_next donc plus de chunks périmés en dev ; l'audio n'est pas vérifiable en headless (lecture seule du chemin de code)

## Recommandations tour suivant
- Vibration mobile à la fin de session (navigator.vibrate, garde feature-detect)
- Page statistiques : heatmap année complète (12 mois) + répartition par jour de la semaine
- Tâches : glisser-déposer pour réordonner ; notes : recherche
- Contact : sauvegarde optionnelle des exports côté serveur (endpoint POST chiffré) ou QR code de partage

---
Task ID: r4 (cron webDevReview — tour 4)
Agent: main (Z.ai Code)
Task: Assessment + QA agent-browser, nouvelles fonctionnalités (heatmap annuelle, répartition hebdo, DnD tâches, recherche notes, vibration, compte à rebours dans le titre), polish styling mobile

## État du projet au départ
Stable : 0 erreur lint/tsc, dev.log 200 propres, tous les parcours revérifiés (accueil, outils, stats, guide, blog, contact, 404 — titres corrects). Aucun bug bloquant → avancement des fonctionnalités recommandées au tour 3.

## Work Log
- QA initiale : routes + titles OK, snapshot outils OK, tsc/eslint 0/0
- **Vue annuelle (nouveau)** : onglets Mensuel/Annuel dans la carte Calendrier (shadcn Tabs) ; heatmap style GitHub 53 semaines × 7 jours (lundi-first), cellules 11 px 5 niveaux d'intensité, jour courant cerclé, jours futurs/hors année invisibles, marqueurs de mois allégés anti-chevauchement (écart ≥ 3 semaines), navigation année (suivante disabled sur l'année courante), total annuel + jours actifs affichés
- **Répartition par jour de la semaine (nouveau)** : 7 barres horizontales (lun→dim) proportionnelles au total de pomodoros, meilleur jour surligné text-brand + halo, ligne d'insight « Votre jour le plus productif : mardi (N pomodoros au total) », aria-live polite
- **Tâches réordonnables (nouveau)** : glisser-déposer natif HTML5 (li draggable, drop → moveTaskTo, retours visuels : dragged opacity-40, target ring-brand) + poignée GripVertical ; boutons chevron haut/bas accessibles clavier (moveTask), affichés si ≥ 2 tâches ; store : + moveTask / moveTaskTo
- **Recherche dans les notes (nouveau)** : input type=search avec icône + bouton effacer, filtrage insensible casse ET accents (fold NFD) sur titre+contenu, compteur « N / total », état vide « Aucune note ne correspond à « … ». »
- **Vibration fin de session (nouveau)** : réglage vibrate (défaut activé), vibrateDevice([180,90,180]) feature-detect dans chime.ts, appelé à chaque fin de session ; switch « Vibration (mobile) » dans les réglages avec hint de non-support (détection lazy, sans setState-in-effect)
- **Compte à rebours dans l'onglet (nouveau)** : document.title = « mm:ss · Mode — Focusly » pendant l'exécution, titre de route restauré à la pause/fin (titleFor exporté du routeur)
- **Polish styling** : active:scale-95 sur boutons reset/skip du minuteur et boutons Ajouter/Enregistrer/Exporter ; form tâches : input min-w-[200px] (wrap propre) ; texte de tâche min-w-[140px] basis-[140px] + li flex-wrap → plus d'écrasement du libellé sur mobile ; onglets de mode 11.5 px en mobile (fin de la troncature « Pause longue »)

## Bugs trouvés et corrigés ce tour
1. **Mobile 375 px : texte des tâches écrasé à ~47 px** (« Tâch e alph a ») → li flex-wrap + min-w sur le texte → 207 px, contrôles sur 2e ligne, 0 overflow
2. **Onglets de mode tronqués sur mobile** (« Pause lon… ») → texte 11.5 px en < sm
3. ESLint react-hooks/set-state-in-effect sur la détection de vibration → initialState lazy (dialog fermé en SSR, aucun DOM différent)
4. ring-1.5 inexistant en Tailwind → ring-1 (heatmap annuelle, today)

## Vérifications agent-browser
- DnD : alpha glissée sur gamma → ordre beta/gamma/alpha/bis ✓ ; chevrons : remontée ×2 → alpha en tête ✓
- Notes : « neurosciences » → 1 résultat ; « habitude » → match accent-insensible « habitudes » ; « zzz » → état vide FR ; compteur 1/2 ✓
- Stats : KPI réels (663 pomodoros, 276 h 15, 149 jours actifs, série 9) ; onglet Annuel → 371 cellules, 12 marqueurs, année −1 navigable, suivante disabled ; barres hebdo proportionnelles + insight mardi ✓ ; screenshots desktop dark + light + mobile
- Titre : démarrage 1 min → « 00:58 · Concentration — Focusly » ; pause (changement de mode) → titre restauré ; fin de session → titre restauré, mode auto pause courte, stats +1 ✓
- Réglages : switch Vibration présent, checked par défaut, hint support ✓
- Mobile 375 px : 0 overflow horizontal (accueil, outils, tâches corrigées, stats) ; screenshots
- Après nettoyage : localStorage vidé (état d'usine), re-smoke des 11 routes → titres tous corrects
- Final : tsc 0 erreur src/, eslint 0/0, dev.log GET / 200 (erreurs page.tsx = historiques pré-création de focusly-app)

## Stage Summary
- 6 fonctionnalités livrées (vue annuelle, répartition hebdo, DnD + réordonnancement tâches, recherche notes, vibration, titre dynamique) + 4 corrections dont 2 responsive
- Fichiers : statistiques-view.tsx (tabs + 2 nouvelles sections), tasks-panel.tsx (DnD), notes-panel.tsx (recherche), settings-dialog.tsx, timer-card.tsx, focusly-app.tsx, store.ts (+2 actions), types.ts (+vibrate), chime.ts (+vibrateDevice), router.ts (export titleFor)
- Risques : aucun connu ; HTML5 DnD inopérant au tactile → chevrons couvrent ce cas (toutes tailles) ; audio/vibration non vérifiables en headless (chemins de code feature-détectés)

## Recommandations tour suivant
- Rappel du palier : blocage du drag quand la cible = tâche terminée si l'on veut séparer zones à faire/terminées
- Notes : édition d'une note existante ; tâches : date d'échéance + tri par échéance
- Stats : filtre de période (30/90/365 j) sur les KPI ; partage d'image des statistiques
- Contact : réponses administrateur (mini back-office lecture des messages)

---
Task ID: 5-a
Agent: frontend-styling-expert
Task: Notes — édition inline ; Tâches — échéances + tri + garde-fou DnD

Work Log:
- Lu worklog.md, store.ts (updateNote / updateTask déjà en place), types.ts (TaskItem.dueDate, frDateShort, daysUntil, frDate) ; les panneaux vivent réellement dans `src/components/focusly/tools/` (et non directement dans focusly/) — même nom de fichiers, chemins ajustés
- **Notes — édition inline** (`tools/notes-panel.tsx`) : état editingId (une seule note éditable à la fois) + editTitle/editBody préremplis via startEdit ; la carte bascule vers un formulaire inline (Input titre + Textarea contenu) avec boutons « Enregistrer » (Check) / « Annuler » (X, variant outline) ; Enregistrer désactivé si titre vide (garde + store ignore les titres vides) ; Échap dans le formulaire annule l’édition ; toast.success(« Note mise à jour. ») ; updateNote(id, { title, body })
- Styling notes (conforme au cahier des charges) : carte en édition = ring-1 ring-brand + bg-brand/5 (remplace bg-secondary, pas de conflit de classes) ; cartes transition-all duration-200 + hover:-translate-y-0.5 hover:shadow-md (coins rounded-xl conservés) ; bouton crayon visible au toucher / révélé au survol desktop (group + opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100), cible 32 px grid rounded-md (cohérent avec le bouton effacer-recherche existant)
- **Tâches — échéances** (`tools/tasks-panel.tsx`) : input type=date compact (aria-label « Échéance (optionnelle) », h-9 w-[122px] rounded-xl border bg-secondary/60 px-2 text-xs + [color-scheme:light] dark:[color-scheme:dark] pour l’icône native en thème sombre) dans le formulaire d’ajout, réinitialisé après ajout ; la dueDate est attachée à la tâche créée via addTask puis updateTask(last.id, { dueDate }) (addTask n’expose pas encore le paramètre, store non modifié)
- Badge échéance par ligne : rounded-full border px-2 py-0.5 text-[11px] + icône size-[11px] ; en retard (daysUntil < 0) → bg-destructive/15 text-destructive border-destructive/30, aujourd’hui (= 0) → bg-brand/15 text-brand border-brand/30 + CalendarClock, futur → bg-secondary text-muted-foreground + Calendar ; libellé frDateShort (« 12 mars ») et title « Échéance : 12 mars 2025 » via dueDateLabel() qui reconstruit la date LOCALEMENT depuis les parties de la clé (new Date(y, m-1, d).getTime(), jamais new Date(« 2025-03-12 ») UTC)
- **Tâches — édition inline** : crayon (aria-label « Modifier la tâche : … ») → la ligne devient un formulaire : Input texte + Input date + bouton X « Retirer l’échéance » (affiché si une date est posée) + Enregistrer/Annuler ; Échap annule ; Enregistrer désactivé si texte vide ; updateTask(id, { text, dueDate }) — dueDate: "" (choisi plutôt que null : le typage du patch n’expose pas null, le store le convertit en undefined) ; toast.success(« Tâche mise à jour. ») ; drag désactivé (draggable={!editing}) pendant l’édition, carte en édition ring-1 ring-brand + bg-brand/5 (ring actif écarté pour éviter le conflit)
- **Tâches — garde-fou DnD** : onDragOver rejette les cibles done (dropEffect « none », pas de preventDefault → curseur d’interdiction natif), onDrop ignore t.done ; classe cursor-not-allowed ajoutée aux lignes terminées pendant un drag ; feedback visuel des cibles valides conservé (ring-brand)
- **Tâches — tri one-shot** : bouton ghost size-sm « Trier par échéance » (ArrowDownWideNarrow) dans l’en-tête, rendu si ≥ 2 tâches ; trie l’ordre stocké via useFocusly.setState : échéances d’abord (clés YYYY-MM-DD comparées lexicographiquement = chronologiques, comparateur stable retourne 0 à égalité), sans échéance après, ordre relatif conservé ; toast.success(« Tâches triées par échéance. ») ou toast.info(« Aucune échéance définie. ») ; aucun changement de store
- En-tête tâches passé en flex-wrap (bouton tri + compteur) pour garantir zéro overflow à 375 px ; vérifications : bunx tsc --noEmit filtré → 0 erreur src/ ; bunx eslint sur les deux fichiers → 0 erreur 0 warning ; dev.log → « ✓ Compiled » puis GET / 200 après hot-reload ; pas de dev server ni build lancés (consigne)

Stage Summary:
- 2 fichiers modifiés uniquement : `src/components/focusly/tools/notes-panel.tsx` (édition inline complète) et `src/components/focusly/tools/tasks-panel.tsx` (échéances + badges, édition inline, tri par échéance, garde-fou DnD sur tâches terminées) — contrats/store/types inchangés
- Décisions : chemins réels tools/ au lieu de focusly/ racine ; dueDate "" pour effacer (null non exposé par le type du patch) ; ajout d’échéance branché sur addTask + updateTask(getState) plutôt qu’une action store supplémentaire ; dark:[color-scheme:dark] sur les inputs date pour l’icône du sélecteur natif en thème sombre ; crayon des tâches toujours visible (style des contrôles de ligne existant) tandis que celui des notes suit le motif hover/touch imposé
- Risques : HTML5 DnD reste inopérant au tactile (les chevrons clavier couvrent déjà ce cas, r4) ; largeur 122 px des inputs date — à surveiller si Firefox variant ; tri one-shot mélange volontairement done/non-done conformément à la spec (échéances d’abord)

---
Task ID: 5-b
Agent: frontend-styling-expert
Task: Stats — filtre de période KPI ; back-office admin des messages de contact

Work Log:
- Lu worklog (contexte, conventions r3/r4), `statistiques-view.tsx`, `focusly-app.tsx`, `globals.css` (aucun token `--brand-contrast` → reprise du motif actif du sélecteur de sons des réglages : `bg-brand text-[#14161a] shadow-[0_2px_10px_-3px_var(--brand)]`), `types.ts` (todayKey accepte un Date → réutilisé pour la clé de coupe), `router.ts` (route "admin" + titre déjà déclarés), `api/contact/route.ts` (contrat GET/PATCH/DELETE + anti-force brute), `ui/` (button/badge/skeleton/input/alert-dialog)
- Feature 1 (statistiques-view.tsx, seul le bloc KPI touché) : état `period: 7 | 30 | 90 | null` (null = Tout, défaut = comportement actuel préservé) ; segmented control au-dessus de la grille KPI (`role="group"` + `aria-label="Période des statistiques"`, container `rounded-xl border bg-secondary/60 p-1`, 4 options « 7 jours / 30 jours / 90 jours / Tout », boutons natifs `aria-pressed` — même motif que le sélecteur de sons du settings-dialog pour éviter les conflits tailwind-merge sur les hover) ; titres de cartes gardés génériques (« Pomodoros », « Temps de concentration », « Jours actifs », « Série record ») + nouvelle ligne d’en-tête de section « Vue d’ensemble » avec sous-titre reflétant la période (aria-live polite) : « Sur l’ensemble de votre historique. » / « N derniers jours, aujourd’hui inclus. »
- Filtre : `periodTotals` useMemo — coupe = aujourd’hui − (N−1) jours en parties locales, clé `todayKey(cutoff)`, comparaison lexicographique sur les clés YYYY-MM-DD zero-padded (>= coupure) ; somme pomodoros/focusSeconds + jours actifs (pomodoros > 0) + jours enregistrés sur la période ; `shown = periodTotals ?? totals` ; hint « Jours actifs » recalculé sur la période ; carte Série record inchangée (globale) + 2e hint « indépendante de la période » uniquement quand une période est active (champ `hint2` optionnel)
- Feature 2 (admin-view.tsx, nouveau) : "use client", conteneur `mx-auto max-w-[920px] px-5 py-8 sm:py-10` + Breadcrumb Accueil/Administration ; porte : carte centrée max-w-md (Lock, h1 « Administration », « Espace réservé à l’équipe Focusly. », input type=password avec label + aria-label « Clé d’administration », aria-invalid, bouton « Déverrouiller », erreurs inline 401 « Clé incorrecte. » / 429 « Trop de tentatives, réessayez plus tard. » / réseau « Erreur réseau. » (role=alert), hint dev `text-faint text-xs` « Clé de développement par défaut : focusly-admin-2026 », lien ghost « Retour à l’accueil » → #accueil) ; clé stockée en sessionStorage ("focusly.adminKey") après vérification GET 200, input vidé après succès, jamais loguée ni affichée ; restauration de la clé au montage via useEffect (aucune lecture window au render → pas de mismatch SSR)
- Vue authentifiée : h1 + sous-titre, ligne d’en-tête ShieldCheck + h2 « Messages de contact », badge « N non lus » (bg-brand/15 text-brand, seulement si N > 0), bouton refresh icône (aria-label « Rafraîchir les messages », animate-spin pendant le chargement, disabled), « Se déconnecter » ghost (vide sessionStorage + state) ; chips de filtre « Tous / Non lus » (aria-pressed) ; liste scrollable `max-h-[70vh] overflow-y-auto pr-2` + motif scrollbar `[&::-webkit-scrollbar]:*` (+ classe slim-scroll pour Firefox) ; cartes `rounded-2xl border bg-card p-4` — non lu : `border-l-2 border-l-brand` + pastille brand, lu : opacity-75 ; nom font-semibold, email en mailto text-faint text-xs, sujet text-soft text-sm, corps whitespace-pre-wrap, date frDateTime sur `<time>` ; actions par message : « Marquer comme lu / non lu » (MailOpen/Mail, ghost sm) et suppression via AlertDialog (« Supprimer ce message ? » / « Cette action est définitive. » / Annuler / Supprimer destructif) ; PATCH/DELETE optimistes avec revert ciblé par message + toasts succès (« Message mis à jour. » / « Message supprimé. ») ou erreur (message API) ; squelettes Skeleton pendant le premier chargement ; états vides Inbox + border-dashed (« Aucun message pour le moment. » / « Aucun message non lu. ») ; normalisation défensive `read: m.read ?? false` au chargement
- Feature 2b (focusly-app.tsx, 2 lignes) : import AdminView + `if (route === "admin") return <AdminView />;` après plan-du-site, avant le fallback 404 — rien d’autre modifié
- Vérifié : `bunx tsc --noEmit` (filtré examples/skills) → vide ; `bunx eslint` sur les 3 fichiers → 0 erreur / 0 warning ; dev.log → recompilations propres, GET / 200 ; curl GET /api/contact avec la clé dev → 200 `{ok, messages}` (contrat conforme, lecture seule, aucune mutation des données de QA)

Stage Summary:
- Fichiers : `src/components/focusly/content/statistiques-view.tsx` (filtre de période KPI), `src/components/focusly/admin-view.tsx` (nouveau, back-office messages), `src/components/focusly/focusly-app.tsx` (montage route "admin", 2 ajouts)
- Décisions : libellés de cartes KPI génériques + période portée par le sous-titre de section (plus propre en FR que des libellés paramétrés) ; segmented control = motif natif du settings-dialog (pas de conflits de variantes hover) ; série record toujours globale avec hint « indépendante de la période » ; badge non lus masqué à 0
- ⚠️ Constaté (hors périmètre, à traiter par le main) : le process dev en cours tourne avec un client Prisma périmé — la DB (db/custom.db) ET le client généré sur disque connaissent bien `read`, mais GET /api/contact omet `read` du SELECT et PATCH renvoie 404 « Message introuvable. » (validation « unknown arg read »). Un redémarrage du dev server (après `bunx prisma generate`, déjà à jour sur disque) rétablit GET avec `read` et PATCH. Conséquence en attendant : tous les messages s’affichent comme non lus et le toggle lu/non lu revert avec le toast d’erreur API — la vue gère ce cas proprement (revert + toast) sans casser
- Risques : aucun connu côté code (tsc/eslint 0/0) ; QA navigateur à faire par le main : porte (401/429/réseau), liste, toggle lu, suppression, filtres, 375 px

---
Task ID: R5 (cron webDevReview — tour 5)
Agent: main (Z.ai Code) + sous-agents frontend-styling-expert (5-a, 5-b)
Task: Assessment + QA agent-browser, nouvelles fonctionnalités (édition notes, échéances tâches, filtre période stats, back-office admin), polish

## État du projet au départ
Stable : 0 erreur lint/tsc, dev.log 200, 13 routes titrés OK, contact API OK (validation/honeypot/rate-limit). Aucun bug bloquant → avancement des recommandations du tour 4.

## Work Log (main)
- QA initiale : routes/titres, snapshot outils, console errors 0, SW actif, POST /api/contact 200 (400 attendu sans consent)
- **Contrats étendus (main)** : `types.ts` (+ `TaskItem.dueDate?: string`, + `frDateShort`, + `daysUntil`), `store.ts` (+ `updateTask`, + `updateNote` avec trims/gardes), `router.ts` (+ route "admin" + titre), `prisma/schema.prisma` (+ `read Boolean @default(false)` sur ContactMessage + db:push), `api/contact/route.ts` (+ GET liste / PATCH read / DELETE par id, protégés par clé admin via header `x-admin-key` ou query, garde anti-force brute 10 échecs/15 min → 429), `.env` (+ `ADMIN_KEY=focusly-admin-2026`)
- **Incident dev server résolu** : le process dev tournait avec un client Prisma périmé (champ `read` inconnu → PATCH 404). Redémarrage requis, mais tout process lancé depuis une session Bash outil est tué à la fin de session (même setsid+nohup). Solution trouvée : **double-fork** `( setsid nohup bun run dev & )` → le process est reparenté à PID 1 et survit. Dev server relancé, PATCH read vérifié 200, GET renvoie `read`
- **Fausse piste hydratation** : un overlay « 1 Issue » (mismatch d'attributs useId Radix sur DialogTitle/Description de la CommandPalette) est apparu. Bissection git (stash → test sur code r4 → pop) : l'erreur existe aussi sur le code r4 ; en réalité c'était un artefact de la période « bundle périmé » (redémarrage serveur + vieux chunks côté navigateur, tag « stale » de l'overlay). Après purge SW/caches + rechargements : **0 erreur d'hydratation de façon déterministe** (SSR et DOM : ids identiques, 3 rechargements contrôlés). Aucune modification de code nécessaire
- **Fix FR (main)** : badge admin « 1 non lus » → accord singulier/pluriel `non lu{N>1 ? "s" : ""}`
- Vérifications finales : tsc 0 erreur src/, eslint 0/0, 13 routes + 1 article titrés OK, hydratation clean, console 0 erreur, DB remise à zéro (0 message), localStorage usine

## Fonctionnalités livrées ce tour (détails dans les sections 5-a / 5-b ci-dessus)
1. **Notes — édition inline** (crayon, préremplissage, Enregistrer/Annuler/Échap, ring-brand en édition, hover-lift des cartes) — vérifié navigateur : création → édition (titre + typo corrigée) → toast, Escape revert
2. **Tâches — échéances** (input date optionnel, badge 3 états : en retard destructif / aujourd'hui brand / futur muted, édition inline texte+date+retrait, « Trier par échéance » one-shot, garde-fou DnD sur tâches terminées) — vérifié navigateur : badges 19/16/17 sept avec styles corrects, tri 16→17→19, édition texte+date, toast
3. **Stats — filtre de période KPI** (segmented control 7/30/90/Tout, sous-titre aria-live, coupe locale lexicographique, série record globale + hint) — vérifié navigateur : 15/5 → 5/2 (7j) → 9/3 (30j) → 14/4 (90j) → 15/5 (Tout), temps 7j = 2 h 05 min, light + dark + 375 px sans overflow
4. **Back-office admin** (#admin, nouveau) : porte à clé (401 inline « Clé incorrecte. », 429, hint dev, sessionStorage), liste des messages (badge non lus, chips Tous/Non lus, accent brand non-lus, mailto, frDateTime), marquer lu/non lu, suppression avec AlertDialog + revert optimiste, squelettes, états vides — vérifié navigateur de bout en bout (mauvaise clé → erreur ; bonne clé → 3 messages ; toggle lu → badge 3→2 ; filtre Non lus → 2 ; suppression confirmée → 2 cartes + badge 1 + DB 2 ; déconnexion → clé effacée)

## QA Styling (obligatoire)
- Screenshots : r5-stats-filter.png (segmented control dark), r5-light-stats.png/r5-light-stats2.png (light), r5-light-admin.png (admin light 375 px), r5-mobile-tasks.png/r5-mobile-badge.png (badge échéance mobile), r5-issue.png/r5-issue2.png (overlay)
- 375 px : 0 px d'overflow horizontal sur accueil/outils/statistiques/blog/contact/admin ; formulaire tâches wrap OK ; badge échéance sur sa propre ligne lisible
- Light/dark : KPI + segmented control + admin vérifiés visuellement dans les deux thèmes

## Stage Summary
- 4 fonctionnalités majeures livrées et vérifiées agent-browser, 1 fix FR, 1 incident d'infra résolu (redémarrage dev server via double-fork), 1 fausse piste d'hydratation élucidée (artefact stale, code sain)
- Fichiers clés : tools/notes-panel.tsx, tools/tasks-panel.tsx, content/statistiques-view.tsx, admin-view.tsx (nouveau), focusly-app.tsx, api/contact/route.ts, store.ts, types.ts, router.ts, prisma/schema.prisma, .env
- **Accès back-office** : `#admin` (URL directe, volontairement non lié publiquement) ; clé dev `focusly-admin-2026` (variable ADMIN_KEY dans .env)
- Risques : aucun connu ; la clé admin a une valeur par défaut en code (fallback `focusly-admin`) — en production réelle, définir ADMIN_KEY et retirer le hint dev de la porte ; le rate-limit admin est en mémoire (par process)

## Recommandations tour suivant
- Partage d'image des statistiques (canvas → PNG) ; comparaison semaine vs semaine
- Back-office : réponses aux messages (brouillon envoyé par mailto), export CSV des messages
- Tâches : répéter les tâches (quotidien/hebdo), vue « Aujourd'hui » filtrée par échéance
- PWA : raccourci « Nouvelle tâche » dans le manifest, badge d'icône (navigator.setAppBadge) avec le compte de pomodoros du jour

---
Task ID: 6-b
Agent: frontend-styling-expert
Task: Tâches — filtres Aujourd'hui/En retard + deep-link nouvelle tâche ; Admin — export CSV + réponse mailto

Work Log:
- Lu worklog (r4, 5-a, 5-b, R5), `tasks-panel.tsx`, `admin-view.tsx`, `csv.ts`, `types.ts` (todayKey/frDateShort/daysUntil/frDateTime), `focusly-app.tsx` (montage OutilsView → TasksPanel, transition 0,25 s) ; manifest : raccourci « /?tache=nouvelle#outils » déjà présent côté main
- **Filtres de tâches** (`tasks-panel.tsx`) : type TaskFilter + TASK_FILTERS (« Toutes / Aujourd’hui / En retard ») au niveau module ; état `filter` (défaut « toutes ») ; `visibleTasks` calculé en vue seule — « Aujourd’hui » = dueDate définie ET daysUntil <= 0 (du jour + en retard), « En retard » = daysUntil < 0, tâches terminées incluses si elles matchent (spec) ; aucun réordonnancement ni mutation du store
- Chips : groupe `role="group"` + `aria-label="Filtrer les tâches"`, boutons natifs `aria-pressed`, classes spec (`rounded-full border px-2.5 py-1 text-xs transition-colors` ; actif `border-brand/40 bg-brand/15 font-medium text-brand`, inactif `text-muted-foreground hover:text-foreground`), ligne placée sous l’en-tête avec `-mt-2` (motif existant) et flex-wrap → 375 px propre ; libellés sans compteurs ; compteur d’affichage « · N affichée(s) » (accord pluriel, motif existant) ajouté à côté du « X / Y » uniquement si filtre ≠ toutes
- Rendu de liste basculé sur `visibleTasks` ; bornes des chevrons clavier recalculées sur l’ordre du STORE (`storeIndex = tasks.findIndex(...)`) pour rester exactes sous filtre (identiques à `index` quand « Toutes ») ; DnD déjà id-based → inchangé
- États vides par filtre (style dashed existant) : « Rien de prévu aujourd’hui. Profitez-en ou planifiez une échéance. » / « Aucune tâche en retard. Vous êtes à jour. » avec CheckCircle2 text-brand inline ; affichés seulement si des tâches existent mais qu’aucune ne matche ; pas d’auto-reset du filtre (l’état vide gère)
- **Deep-link nouvelle tâche** : `newTaskInputRef` sur l’input #task-input + useEffect SSR-safe : si `?tache=nouvelle` → setTimeout 400 ms (transition de vue 0,25 s), focus, puis `history.replaceState(pathname + hash)` pour ne pas re-déclencher au reload ; garde anti double-fire par ref posée DANS le callback (compatible double-invocation StrictMode : cleanup annule le 1er timer, le 2e tire une seule fois)
- **Export CSV admin** (`csv.ts`) : interface exportée `ContactCsvRow` (structuralement compatible ContactMsg de la vue), `csvField` (quote si `;`/`"`/`\r\n`, quotes intérieures doublées), `messagesToCsv` → en-tête `Date;Nom;Email;Sujet;Message;Lu`, date via frDateTime importé de types (aucun import circulaire), Lu = oui/non, sujet null → vide, même terminaison `\n` que dailyToCsv ; vérifié bun -e : séparateurs quotés, `""Citation""` doublé, null → vide, date FR 11/02/2026 09:30
- `admin-view.tsx` : bouton « Exporter en CSV » (variant outline size sm rounded-lg, Download, aria-label « Exporter les messages en CSV ») entre le refresh et « Se déconnecter » ; handleExportCsv → toast.info si 0 message, sinon downloadTextFile(messagesToCsv(messages), `focusly-messages-${todayKey()}.csv`) + toast.success ; en-tête déjà flex-wrap → 375 px OK (groupe d’actions ≈ 310 px < contenu utile)
- **Réponse mailto admin** : helper pur module-level `buildReplyHref(msg)` — normalise CRLF, tronque à 600 caractères (coupe le mot partiel via `/\s+\S*$/`) + « … » pour refermer proprement le bloc de citation, corps FR « Bonjour <name>, / Merci pour votre message : / > lignes quotées / Cordialement, / L’équipe Focusly » (testé bun -e : < 1500 chars, CRLF normalisé, message court intact, sujet « Re: … » ou « Re: Votre message Focusly ») ; bouton « Répondre » (Reply, ghost sm, aria-label « Répondre à <name> ») entre « Marquer comme lu » et « Supprimer », clic → `window.location.href = href` (pas de toast) ; rangée d’actions flex-wrap conservée
- Vérifications : `bunx tsc --noEmit` filtré → vide (0 erreur src/) ; `bunx eslint` sur les 3 fichiers → 0 erreur 0 warning ; dev.log → « ✓ Compiled » répétés sans erreur, GET / 200 ; pas de dev server ni build lancés, pas de QA navigateur (consigne — main en charge)

Stage Summary:
- 3 fichiers modifiés : `src/components/focusly/tools/tasks-panel.tsx` (chips de filtre vue Toutes/Aujourd’hui/En retard + compteur « N affichée(s) », états vides dédiés, deep-link PWA focus + nettoyage d’URL, chevrons bornés sur l’ordre store), `src/components/focusly/admin-view.tsx` (export CSV + réponse mailto), `src/lib/focusly/csv.ts` (ContactCsvRow + csvField + messagesToCsv, réutilise frDateTime/downloadTextFile)
- Décisions : filtre 100 % vue (jamais le store) ; bornes chevrons sur storeIndex pour rester justes sous filtre ; garde deep-link posée dans le callback du timer (StrictMode-safe) ; ContactCsvRow défini dans csv.ts (pas de type importé de la vue admin, zéro couplage) ; export = outline sm pour matcher le refresh outline
- Risques : aucun connu côté code (tsc/eslint 0/0, CSV + mailto validés par scripts) ; le mailto dépend du client mail du poste (comportement standard) ; chips ~26 px de haut comme les chips admin existantes — cibles < 44 px à ne pas généraliser aux actions principales ; QA navigateur (filtres, deep-link réel PWA, export, mailto, 375 px) à faire par le main

---
Task ID: 6-a
Agent: frontend-styling-expert
Task: Stats — comparaison hebdomadaire + partage en image (canvas → PNG/Web Share)

Work Log:
- Lu worklog.md (sections r3, r4, 5-b, R5), `statistiques-view.tsx` complet, `types.ts` (todayKey/frDate), `streaks.ts`, `csv.ts` (motif download), `globals.css` (tokens : --brand #ff6b5b, --card #17191e, --muted-foreground #9ba0ab, halo héros) ; icônes lucide vérifiées présentes (CalendarRange, ImageDown, TrendingUp/Down, Minus)
- **Feature 1 — carte « Comparaison hebdomadaire »** (statistiques-view.tsx, nouvelle `<section>` entre la grille KPI « Vue d’ensemble » et la carte Calendrier) : `weekCompare` useMemo — lundi de la semaine courante via `setDate(getDate() - ((getDay()+6)%7))` (même formule lundi-first que la heatmap), semaine précédente = lundi − 7 j ; `sumWeek(start)` additionne les 7 clés `dayKeyOf(y, m, d)` en parties locales (jours futurs absents de `daily` → 0) pour pomodoros + focusSeconds, focusLabel au format de la page (heures plancher, minutes plancher, « X h YY min » / « Y min »)
- Affichage : 2 colonnes `grid grid-cols-1 sm:grid-cols-2` (empilent à 375 px) — « Cette semaine » / « Semaine dernière », valeur `time-display text-2xl font-bold` + sous-ligne « N pomodoro(s) · X h YY min » ; bloc barres `role="img"` + aria-label FR avec accords (« Cette semaine : 12 pomodoros. Semaine dernière : 9 pomodoros. ») — 2 pistes `rounded-full bg-secondary/50` + remplissages `bg-brand` / `bg-muted-foreground/40`, largeur = pomodoros / max(des deux) (plancher 2 % si actif, convention des barres hebdo), `transition-all duration-500 ease-out`, compteurs tabular-nums à droite
- Ligne d’évolution `aria-live="polite"` (même motif que l’insight hebdo) : TrendingUp text-brand « +N % par rapport à la semaine dernière » / TrendingDown « −N % … » (signe moins typographique U+2212) / Minus « Stable par rapport à la semaine dernière » ; gardes anti-division par zéro : semaine dernière = 0 et courante > 0 → « N pomodoro(s) cette semaine, aucun la semaine dernière » ; les deux à 0 → « Aucun pomodoro cette semaine pour l’instant. » (text-faint) ; hint `text-faint text-xs` « semaine en cours (N jour(s) sur 7) » affiché sauf dimanche (dayIndex === 6)
- **Feature 2 — partage en image** (nouveau `src/lib/focusly/share-image.ts`, lib pure client, aucune lecture window au niveau module) : `buildStatsImage(options)` dessine sur `document.createElement("canvas")` 1200×630 hors écran — fond `#0f1013` + halo radial de marque en haut à droite (dégradé brand→transparent, globalAlpha 0.18, couleur lue via getComputedStyle(documentElement) `--brand` avec repli #f4633a), carte arrondie r=28 marge 40 remplie `#17191e` + trait `rgba(255,255,255,0.08)`, en-tête point de marque (cercle brand) + wordmark « Focusly » 700 44px + libellé de période 24px #9ba1ab aligné à droite (« 7/30/90 derniers jours » / « Historique complet »), ligne de 3 colonnes — POMODOROS (valeur 64px brand), TEMPS DE CONCENTRATION, SÉRIE RECORD (« N j ») — libellés 600 20px avec letterSpacing 1.5px (garde `"letterSpacing" in ctx`), valeurs rétrécies par measureText si elles débordent de leur colonne (ex. « 276 h 15 min »), pied « focusly — minuteur pomodoro » #6b7078 + date frDate(Date.now()) ; polices explicites `system-ui, -apple-system, "Segoe UI", sans-serif`, textAlign/textBaseline réinitialisés par section, roundedRectPath manuel (arcTo, roundRect non universel)
- `formatFocusDuration(seconds)` exportée : heures plancher + minutes ARRONDIES (consigne), avec retenue 60 min → 1 h (3599 s → « 1 h 00 min ») et cas « 0 min » < 60 s ; `shareOrDownloadStatsImage(options)` → canvas.toBlob PNG → si `navigator.canShare?.({ files })` (feature-detect share + canShare) : `navigator.share({ files, title: "Mes statistiques Focusly" })` — AbortError → `"cancelled"` (silence), autre erreur → repli téléchargement ; sinon téléchargement object URL + `<a download="focusly-statistiques-YYYY-MM-DD.png">` + revoke (même mécanique que downloadTextFile) ; retour `"shared" | "downloaded" | "cancelled"`
- Vue : bouton « Partager en image » (ImageDown, variant secondary rounded-xl active:scale-[0.98], disabled pendant la génération, aria-label « Partager les statistiques en image ») placé dans la rangée d’actions juste après « Exporter en CSV » ; `handleShareImage` appelle le helper avec les totaux FILTRÉS par la période (`shown.pomodoros` / `shown.focusSeconds` — champ `focusSeconds` ajouté aux retours des useMemo totals et periodTotals, additif), `streaks.best` et `imagePeriodLabel` condensé ; toast.success(« Image générée. ») uniquement sur le chemin téléchargement, toast.error(« Impossible de générer l’image. ») si échec canvas, rien sur shared/cancelled
- Vérifications : `bunx tsc --noEmit` filtré → vide ; `bunx eslint` sur les 2 fichiers → 0 erreur 0 warning ; dev.log → « ✓ Compiled » répétés sans erreur ; sanity-check `bun -e` : jeudi 2026-09-17 → lundi 2026-09-14 (getDay 4), dimanche 13/09 → lundi 07, lundi 21/09 → lui-même ; totaux semaine courante/dernière identiques par sommation 7 jours et par balayage lexicographique des clés (10 vs 5 pomodoros → +100 % up) ; formatFocusDuration validé sur 8 cas (0 s → « 0 min », 3599 s → « 1 h 00 min », 25 h → « 25 h 00 min ») ; pas de dev server ni build, pas de QA canvas navigateur (consigne — main en charge)

Stage Summary:
- Fichiers : `src/components/focusly/content/statistiques-view.tsx` (carte Comparaison hebdomadaire + bouton Partager en image + focusSeconds dans les 2 memos de totaux) et `src/lib/focusly/share-image.ts` (nouveau : buildStatsImage, shareOrDownloadStatsImage, formatFocusDuration, types StatsImageOptions/StatsShareResult) — store/contrats inchangés
- Décisions : bouton posé à côté d’« Exporter en CSV » dans la rangée d’actions (l’énoncé le plaçait « dans l’en-tête Vue d’ensemble à côté d’Exporter en CSV », mais l’export vit dans la rangée d’actions — l’adjacence réelle prime, et l’en-tête reste propre à 375 px) ; barres étiquetées « Cette semaine / Semaine dernière » en plus des colonnes (lisible de façon autonome) ; tendance en baisse neutre (text-foreground, pas de rouge — pas d’erreur, juste une baisse) ; image figée sur la palette dark (partage cohérent quel que soit le thème actif) avec brand lu en direct ; round des minutes uniquement dans l’image (consigne explicite, divergence ≤ 1 min possible avec les cartes KPI qui restent au plancher — sessions entières → identiques en pratique)
- Risques : aucun connu côté code (tsc/eslint 0/0, maths de semaine validées par script) ; navigator.share avec fichier non testable headless (chemin feature-détecté, repli téléchargement systématique) ; rendu canvas (halo, fit des valeurs 64px, letterSpacing selon navigateur) à vérifier visuellement par le main ; « cancelled » (annulation du share OS) volontairement sans toast

---
Task ID: R6 (cron webDevReview — tour 6)
Agent: main (Z.ai Code) + sous-agents frontend-styling-expert (6-a, 6-b)
Task: Assessment + QA agent-browser, nouvelles fonctionnalités (comparaison hebdo, partage image stats, filtres tâches, export CSV + réponse admin, PWA badge + raccourci), polish

## État du projet au départ
Stable : 0 erreur lint/tsc, dev.log 200, routes titrées OK. Suivi des recommandations du tour 5.

## Work Log (main)
- QA initiale : tsc/eslint 0/0, 5 routes smoke OK, 0 erreur console
- **Contrats (main)** : `focusly-app.tsx` (+ effet badge PWA : `navigator.setAppBadge(pomodorosDuJour)` / `clearAppBadge`, feature-détecté, silencieux) ; `public/manifest.webmanifest` (+ raccourci « Nouvelle tâche » → `/?tache=nouvelle#outils`)
- Bugs trouvés et corrigés ce tour :
  1. **Image stats : libellés qui se chevauchaient** (« TEMPS DE CONCENTRATION » empiétait sur « SÉRIE RECORD » ») → même mécanique de rétrécissement que les valeurs (boucle measureText 20→13 px) appliquée aux libellés + resserré vertical (valeurs y 388, libellés y 430) — vérifié visuellement sur l'image regénérée
  2. Fausse alerte test : paramètres écrits dans localStorage pendant qu'une session tournait écrasés par le persist de la page vive (artefact de test connu, pas un bug app) — protocole de test corrigé (écrire → recharger → vérifier l'affichage 01:00 avant Démarrer)

## Fonctionnalités livrées (détails dans les sections 6-a / 6-b)
1. **Comparaison hebdomadaire** (stats) : carte entre KPI et calendrier — cette semaine vs semaine dernière (pomodoros + temps), barres de progression animées (bg-brand vs gris, transition 500 ms, role=img + aria FR), ligne d'évolution TrendingUp/Down/Minus (« +N % » / « −N % » / « Stable »), gardes division par zéro, hint « semaine en cours (N jours sur 7) » — vérifié : 12 vs 14 → « −14 % », hint « 4 jours sur 7 », garde « 1 pomodoro cette semaine, aucun la semaine dernière »
2. **Partage en image** (stats) : bouton « Partager en image » → canvas 1200×630 hors écran (halo de marque lu depuis --brand, carte arrondie, wordmark + point, 3 KPI 64 px, libellés rétrécis, pied signature + date) → Web Share API si fichiers supportés (AbortError silencieux) sinon téléchargement PNG + toast — vérifié : PNG téléchargé et inspecté (corrections appliquées), toast « Image générée. »
3. **Filtres de tâches** : chips « Toutes / Aujourd'hui / En retard » (aria-pressed, rôle group), compteur « · N affichée(s) » si filtre actif, états vides dédiés (« Rien de prévu aujourd'hui… » / « Aucune tâche en retard. Vous êtes à jour. ») — vérifié : 4/2/1 tâches selon filtre, suppression en filtre En retard → état vide
4. **Deep-link « Nouvelle tâche »** : `/?tache=nouvelle#outils` → focus auto de l'input (+400 ms), nettoyage de l'URL (replaceState), garde anti-double-feu — vérifié : input focus:true, search vidé
5. **Export CSV des messages** (admin) : `messagesToCsv` (échappement `;`/guillemets/newlines, Lu oui/non, frDateTime) + bouton « Exporter en CSV » (toast info si vide, sinon téléchargement focusly-messages-AAAA-MM-JJ.csv) — vérifié : fichier téléchargé, 2 lignes parsées proprement avec sujet contenant « ; » et message multiligne
6. **Réponse par email** (admin) : bouton « Répondre à <nom> » → mailto prérempli (Re: sujet, corps FR avec citation « > » tronquée à 600 chars, signature L'équipe Focusly) — vérifié : bouton présent, clic sans erreur (délégation OS non testable en headless)
7. **Badge PWA** : setAppBadge(nb pomodoros du jour) à chaque changement — vérifié avec stub : [['set', 1]] après une session 1 min réelle, mode bascule auto pause courte

## QA Styling (obligatoire)
- Screenshots : r6-week-compare.png (carte desktop dark), r6-mobile-compare2.png (light 375 px + garde zéro), r6-light-chips2.png, r6-mobile-compare.png, image partagée inspectée ×2 (avant/après fix libellés)
- 375 px : 0 px d'overflow sur statistiques et outils ; carte comparaison empile proprement ; chips wrap OK
- Light/dark vérifiés ; vert constaté = marque du mode pause courte (par design, --brand par mode)

## Stage Summary
- 7 fonctionnalités/livrables vérifiés agent-browser, 1 bug canvas corrigé (chevauchement libellés), artefacts de test documentés (race persist localStorage)
- Fichiers : content/statistiques-view.tsx, lib/focusly/share-image.ts (nouveau), tools/tasks-panel.tsx, admin-view.tsx, lib/focusly/csv.ts, focusly-app.tsx, manifest.webmanifest
- Données remises à zéro (DB 0 message, localStorage usine) ; téléchargements de test dans /home/z/Downloads (inoffensifs)
- Risques : Web Share non testable en headless (chemin feature-détecté + repli téléchargement vérifié) ; mailto délégation OS ; chips < 44 px de haut (cohérent avec les chips existantes, actions principales ≥ 44 px)

## Recommandations tour suivant
- Back-office : marquer « traité/archivé », pagination ou recherche des messages
- Stats : objectif hebdomadaire (somme des objectifs quotidiens) + jauge dans la carte comparaison
- Tâches : récurrences (quotidien/hebdo) + vue « Aujourd'hui » regroupant échéances du jour et retards
- PWA : test réel d'installation (Chrome desktop/Android) du badge et du raccourci « Nouvelle tâche »

---
Task ID: r7 (assessment)
Agent: main (Z.ai Code)
Task: Assessment initial du tour 7 — QA agent-browser + plan des fonctionnalités

Work Log:
- Lu worklog.md intégral (tours 1→6, 5-a/5-b, 6-a/6-b) : projet Focusly stable, 0 bug connu
- QA smoke agent-browser : 9 routes (/, #outils, #statistiques, #guide, #blog, #contact, #plan-du-site, #admin, #a-propos) → titres FR tous corrects (lag initial = assertion du titre à 250 ms, comportement documenté tour 3), 0 erreur page/console
- tsc --noEmit : 0 erreur src/ (bruit préexistant examples/ + skills/ uniquement) ; eslint src : 0 erreur 0 warning
- Snapshots outils + statistiques : tous les composants rendent (minuteur, tâches + filtres, KPI, comparaison hebdo, calendrier, répartition)
- Schéma Prisma relu (ContactMessage : read, pas d'archivage) ; api/contact relu (GET/PATCH/DELETE + garde admin) ; store/types/tâches relus pour préparer les extensions

Stage Summary:
- Décision : aucune correction bloquante nécessaire → tour 7 = nouvelles fonctionnalités recommandées au tour 6
- Périmètre r7 : (a) admin — recherche + statut « archivé/traité » ; (b) stats — jauge d'objectif hebdomadaire dans la comparaison ; (c) tâches — récurrences quotidienne/hebdomadaire avec re-planification auto ; (d) polish styling global (mandatory)
- Aucun fichier modifié par le main lors de cette évaluation

---
Task ID: r7-b
Agent: frontend-styling-expert
Task: Stats — jauge d'objectif hebdomadaire dans la comparaison hebdo

Work Log:
- Lu worklog.md (sections r3-1, r4, 6-a) + statistiques-view.tsx complet + store.ts/types.ts (settings.dailyGoal 1–20, défaut 8) ; touché UNIQUEMENT src/components/focusly/content/statistiques-view.tsx (79 insertions, 0 suppressions)
- Abonnement réglages : `const settings = useFocusly((s) => s.settings)` (store déjà importé) ; imports lucide ajoutés en ordre alphabétique : Flag, Trophy
- Calcul dans un petit useMemo dérivé `weekGoal` (deps [settings.dailyGoal, weekCompare], réutilise weekCompare.current.pomodoros et weekCompare.daysElapsed — aucune duplication de math) : goal = dailyGoal × 7, progress = goal > 0 ? min(1, done/goal) : 0, remaining = max(0, goal − done), onPace = done >= dailyGoal × daysElapsed (convention lundi-first existante : dayIndex = (getDay()+6)%7, daysElapsed = dayIndex+1), daysLeft = 7 − daysElapsed
- Largeur jauge `goalPct` à côté de weekBarPct : plancher 2 % si done > 0 (convention des barres hebdo), 0 sinon
- UI dans la carte « Comparaison hebdomadaire », après la ligne d’évolution, séparée par `mt-4 border-t pt-4` : ligne « Objectif hebdomadaire » (text-sm font-medium) + valeur droite `time-display tabular-nums` « X / Y pomodoros » ; barre role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={goal} aria-label FR « Objectif hebdomadaire : X sur Y pomodoros », piste h-2 rounded-full bg-secondary/50, remplissage bg-brand transition-all duration-500 ease-out ; sous-ligne text-xs text-faint « Basé sur votre objectif quotidien : M pomodoro(s) par jour × 7 jours. » (toujours affichée)
- Ligne de statut aria-live="polite" text-sm, 3 branches : done >= goal → Trophy text-brand « Objectif hebdomadaire atteint, bravo ! » ; onPace → TrendingUp text-brand « En bonne voie — il reste N pomodoro(s) et J jour(s). » ; sinon Flag text-muted-foreground « N pomodoro(s) restant(s) pour atteindre l’objectif. » — pluriels FR, apostrophes typographiques ’, aucun bleu, aucun emoji
- Semaine vide (0 pomodoro) vérifiée : barre à 0 (aucun remplissage), statut « 56 pomodoros restants pour atteindre l’objectif. » (N = objectif hebdo), pas de division par zéro (garde goal > 0) ; dépassement : progress plafonné à 1 → 100 %, valuemax inchangé

Stage Summary:
- Jauge d’objectif hebdomadaire live dans la carte « Comparaison hebdomadaire » de statistiques-view.tsx (seul fichier modifié), réactive aux changements de settings.dailyGoal et de daily
- Vérifié : `bunx tsc --noEmit` → 0 erreur dans src/ (seul le bruit préexistant examples/ + skills/ reste ; les erreurs transitoires admin-view.tsx vues pendant la session appartenaient à un agent concurrent et ont disparu à la re-vérification) ; `bunx eslint src/components/focusly/content/statistiques-view.tsx` → 0 erreur 0 avertissement ; math semaine validée via `bun -e` ((getDay()+6)%7)+1 → lundi = 1, dimanche = 7, jeudi = 4 — conforme à la formule normative de la spec et au code weekCompare préexistant (l’exemple « jeudi = 5 » du brief contredisait la formule donnée ; la formule a prévalu, cohérente avec daysElapsed déjà utilisé par le hint « N jour(s) sur 7 »)
- Décisions : Flag plutôt que CircleDashed pour la branche « en retard » (rendu net en 16 px) ; sous-ligne simplifiée « Basé sur votre objectif quotidien… » comme proposé par la spec ; chiffres clés en font-semibold text-foreground pour rester cohérent avec la ligne d’évolution existante
- Risques : aucun bloquant — aria-valuenow peut dépasser aria-valuemax en cas de dépassement de l’objectif (conforme à la spec) ; la carte ne subsample pas settings (re-render sur tout changement de réglages, négligeable)

---
Task ID: r7-a
Agent: full-stack-developer
Task: Admin back-office — recherche de messages + statut « archivé (traité) » (schéma, API PATCH, vue admin, CSV)

Work Log:
- Lu worklog.md (contexte + sections 2-b, R5, 6-b) et les 4 fichiers du périmètre ; repéré le motif fold()/Search de blog-view.tsx et le motif optimiste de toggleRead à réutiliser
- `prisma/schema.prisma` : + `archived Boolean @default(false)` sur ContactMessage (après `read`) ; `bun run db:push` → OK (« database is now in sync », Prisma Client v6.19.2 régénéré)
- `src/app/api/contact/route.ts` : GET `take: 200` → `take: 300` (archivés inclus, filtrage côté UI) ; PATCH étendu à `{ id, read?, archived? }` — au moins un booléen requis sinon 400 « Paramètres invalides (id requis, read ou archived booléen requis). », mise à jour des seuls champs fournis (`data` construit dynamiquement), corps `{ id, read }` seul 100 % rétrocompatible ; POST/DELETE intacts ; bandeau de section PATCH mis à jour
- `src/lib/focusly/csv.ts` : `ContactCsvRow.archived?: boolean` (optionnel pour les appelants existants) ; en-tête `Date;Nom;Email;Sujet;Message;Lu;Archivé`, valeurs oui/non (vide si undefined) via le même csvField
- `src/components/focusly/admin-view.tsx` : ContactMsg.archived (défaut `m.archived ?? false` dans loadMessages/handleUnlock) ; `fold()` module-level (NFD + suppression diacritiques + lowercase) ; `visible` en useMemo = chip (actifs = !archived, non-lus = !archived && !read, archives = archived) PUIS recherche pliée sur name+email+subject+message ; input type="search" (Search absolute left + pl-9 pr-8, placeholder « Rechercher un nom, email, sujet… », aria-label « Rechercher dans les messages », bouton X « Effacer la recherche » si query non vide) sur la même ligne flex-wrap que les chips, `w-full sm:w-64` ; chips « Actifs / Non lus / Archivés » (même style pill aria-pressed, défaut « actifs ») ; toggleArchived (motif optimiste toggleRead, revert sur échec) + toasts « Message archivé. » / « Message restauré. » ; bouton Archiver (Archive)/Restaurer (ArchiveRestore) entre « Répondre » et « Supprimer » ; cartes : archived → opacity-60 + Badge secondary « Archivé » (Archive size-3) dans la ligne d’en-tête, read → opacity-75, unread → border-l-brand ; badge d’en-tête « N non lu(s) » compte les non-archivés uniquement ; états vides : « Aucun message pour le moment. » (aucun message) > « Aucun résultat pour « query ». » (recherche) > « Aucun message archivé. » / « Aucun message non lu. » / « Aucun message actif. » (chips, style dashed conservé) ; handleExportCsv exporte `visible` (chips + recherche), toast.info « Aucun message à exporter. » si vide ; handleSignOut remet filter « actifs » + query ""
- Vérifications : `bun run db:push` OK ; `bunx tsc --noEmit` → 0 erreur src/ (bruit examples/skills ignoré) ; `bunx eslint` sur les 3 fichiers TS/TSX → 0 erreur 0 warning ; dev.log → « ✓ Compiled » sans erreur après les modifications
- **Incident client Prisma périmé (même qu’au tour R5)** : le dev server en cours sert le client généré AVANT db:push (SELECT sans colonne `archived` visible dans dev.log ; instance cachée sur `globalThis.prisma` dans src/lib/db.ts → ni HMR ni recompile de la route ne peuvent la rafraîchir). Consigne « ne pas démarrer/redémarrer le serveur » respectée → le sanity test a été fait via script bun isolé (précédent 2-b) appelant les handlers GET/PATCH/POST/DELETE directement dans un process neuf qui charge le client régénéré
- Sanity test API (script jetable, supprimé après) : POST 200 {ok,id} → GET 200 avec archived:false → PATCH {id,archived:true} 200 → PATCH {id,read:true} 200 (read:true, archived conservé → rétrocompat OK) → PATCH {id} seul 400 avec le message FR exact → PATCH {id,archived:false} 200 (archived:false, read conservé) → DELETE 200 → GET final 0 message. DB laissée propre (0 message, vérifié aussi via le serveur en cours)
- Nettoyage : le 1er essai du sanity test contre le serveur en cours (client périmé, archived:undefined) a laissé un message de test, supprimé immédiatement via DELETE admin ; script supprimé

Stage Summary:
- 4 fichiers modifiés : `prisma/schema.prisma` (+archived), `src/app/api/contact/route.ts` (GET take 300, PATCH read/archived), `src/components/focusly/admin-view.tsx` (recherche + chips actifs/non-lus/archivés + archiver/restaurer + états vides + export visible + reset sign-out), `src/lib/focusly/csv.ts` (colonne Archivé)
- Contrat PATCH : `{ id, read?, archived? }` — au moins un booléen requis, champs absents inchangés, 400 « Paramètres invalides (id requis, read ou archived booléen requis). » ; réponses/erreurs et garde admin inchangées
- Décisions : recherche appliquée aux 3 chips (le spec citait Actifs, comportement générique choisi) ; chip « Actifs » vide (tout archivé, sans recherche) → « Aucun message actif. » (état non spécifié, complété dans le style) ; point brand d’unread conservé pour toute carte non lue (archivée comprise), seule la bordure suit la règle archived/read/unread
- ⚠️ À faire par le main AVANT la QA navigateur : **redémarrer le dev server** (double-fork R5) pour que le process charge le Prisma Client régénéré — tant que ce n’est pas fait, GET n’expose pas `archived` et PATCH {archived} renverra 404 « Message introuvable. » (fallback du catch) côté serveur en cours, alors que le code et la DB sont corrects (prouvé par le script isolé)
- Risques : mineur — l’état vide « Actifs » sans recherche n’était pas spécifié (libellé choisi) ; aucune autre limitation connue (tsc/eslint 0/0, séquence API complète validée, DB propre)

---
Task ID: r7-c
Agent: full-stack-developer
Task: Tâches — récurrences quotidienne/hebdomadaire avec re-planification auto

Work Log:
- Lu worklog.md (sections r4, 5-a, 6-b) puis les 3 fichiers du périmètre en entier ; horloge sandbox vérifiée : 2026-09-17 UTC (= todayKey() local) ; aucun autre appelant de addTask/updateTask/toggleTask hors tasks-panel (grep) → refactor sûr
- **types.ts** : + `TaskRecurrence` (« daily » | « weekly »), + `RECURRENCE_LABELS` (Quotidienne/Hebdomadaire), + `RECURRENCE_SHORT` (Quotid./Hebdo), + `TaskItem.recurrence?: TaskRecurrence`, + helper pur `nextDueDate(fromKey, recurrence)` — base = clé parsée via new Date(y, m-1, d) (parties locales) si valide sinon aujourd’hui ; ancre = max(base, aujourd’hui) pour ne jamais replanifier dans le passé ; daily +1 / weekly +7 via new Date(y, m-1, d+N) (normalisation auto fin de mois/année bissextile) puis relecture locale par todayKey (même padding, jamais ISO/UTC)
- **store.ts** : `addTask(text, estimate?, dueDate?, recurrence?)` — dueDate vide ignorée, récurrence posée sur la nouvelle tâche (1–2 args inchangés → rétrocompatible) ; `toggleTask` : sur done=true d’une tâche récurrente, spawn de l’occurrence suivante DANS le même set() que la bascule (id uid(), même texte/estimation, spent 0, done false, dueDate = nextDueDate, même récurrence, sans active — l’original garde son flag) + garde .slice(-200) ; done=false ne spawn jamais ; `updateTask` : patch étendu `recurrence?: TaskRecurrence | null` — null → efface (delete), valeur → pose, clé absente (patch partiel) → intacte ; importData inchangé (tasks passent telles quelles)
- **tasks-panel.tsx** : + composant module `RecurrencePicker` (role=group + 3 pills Aucune/Quotid./Hebdo, aria-pressed, classes des chips de filtre, mini-libellé « Répétition » text-faint text-[11px], type=button, flex-wrap) réutilisé dans le formulaire d’ajout (entre l’input date et « Ajouter ») et l’édition inline (entre la ligne texte/date et Enregistrer/Annuler) ; états `recurrence` (défaut null, reset après ajout comme le stepper) et `editRec` (init depuis la tâche dans startTaskEdit) ; saveTaskEdit passe `recurrence: editRec` (null → efface)
- Formulaire d’ajout refactoré : un seul appel `addTask(value, estimate, dueDate, recurrence ?? undefined)` — suppression du contournement addTask + updateTask(added.id) via useFocusly.getState() ; ligne : badge récurrence (Repeat size-3 + RECURRENCE_SHORT, pill rounded-full border bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground, title « Répétition quotidienne/hebdomadaire ») à côté du badge échéance ; si done && recurrence : « Prochaine occurrence : … » (frDateShort(nextDueDate), w-full text-xs text-faint sur sa propre ligne flex-wrap) ; checkbox : complétion récurrente → toggleTask puis toast.info(« Prochaine occurrence planifiée : … ») ; DnD (cibles done rejetées) et bornes chevrons intacts ; 375 px : nouveaux contrôles flex-wrap, 0 overflow
- Vérifications dans l’ordre : bunx tsc --noEmit → 0 erreur src/ (bruit examples/+skills/ filtré) ; bunx eslint sur les 3 fichiers → 0 erreur 0 warning ; bun -e nextDueDate → 9/9 PASS ; smoke test store bun -e (spawn/anti-respawn/patch null/patch partiel/legacy 1-arg) → tout conforme ; dev.log → « ✓ Compiled » sans erreur ; pas de dev server/build/agent-browser lancés (consigne)

Stage Summary:
- 3 fichiers modifiés, périmètre respecté, changements strictement additifs (aucun export/champ renommé ou supprimé) : `src/lib/focusly/types.ts`, `src/lib/focusly/store.ts`, `src/components/focusly/tools/tasks-panel.tsx` ; dossier `/agent-ctx/r7-c-full-stack-developer.md` créé
- Nouveaux contrats : `TaskItem.recurrence?: TaskRecurrence` ; `nextDueDate(fromKey: string | undefined, recurrence: TaskRecurrence): string` ; `addTask: (text: string, estimate?: number, dueDate?: string, recurrence?: TaskRecurrence) => void` ; `updateTask(id, patch & { recurrence?: TaskRecurrence | null })` ; constantes RECURRENCE_LABELS / RECURRENCE_SHORT
- Sanity nextDueDate (horloge 2026-09-17) : 2026-09-17 daily → 2026-09-18 ; weekly → 2026-09-24 ; undefined daily → demain 2026-09-18 ; rollover fin de mois prouvé via base future (2027-01-31 weekly → 2027-02-07, 2027-01-31 daily → 2027-02-01, 2028-02-28 daily → 2028-02-29) — NOTE : la vérif spec « 2026-01-31 weekly → 2026-02-07 » contredit la règle max(base, aujourd’hui) imposée par la même spec à cette horloge (base passée → ancre aujourd’hui → 2026-09-24) ; la règle max a été suivie et vérifiée (2026-09-16 daily → 2026-09-18), l’arithmétique 31 janv. + 7 → 7 févr. est prouvée par le cas 2027
- Décisions : patch recurrence — null → efface, valeur → pose, clé absente → intacte (convention Partial cohérente avec dueDate/text, évite qu’un patch partiel efface la récurrence) ; spawn en append (fin de liste, ordre existant intact) ; active non transféré (spec) ; toast.info émis au cochage uniquement (décoche silencieuse)
- Persistance/filtre : récurrence sérialisée via le JSON existant (partialize tasks inchangé), imports/exports compatibles ; l’occurrence suivante (demain/semaine prochaine, daysUntil > 0) n’apparaît pas dans « Aujourd’hui » — aucun changement requis (spec f)
- Risques : re-compléter la même tâche récurrente (bascule done↔à faire) re-spawn une copie à chaque complétion (voulu, « une fois par complétion ») ; l’occurrence n’hérite pas de la position de l’originale ; DnD tactile toujours inopérant (pré-existant, chevrons clavier couvrent)

---
Task ID: r7-d
Agent: frontend-styling-expert
Task: Polish styling global — focus-visible, scrollbar, selection, micro-interactions, safe-area

Work Log:
- Lu worklog.md (tours 1→6 + assessment r7) et les 3 fichiers du périmètre en entier ; vérifié par relecture + grep que .ring-pulse, .site-header-scrolled, .hero-glow, .time-display, .slim-scroll, .pulse-dot, .ring-fg, .skip-link, kbd et tous les tokens restent intacts
- globals.css — 3 raffinements demandés par la spec : ::selection en teinte de marque translucide `color-mix(in srgb, var(--brand) 28%, transparent)` + `color: var(--foreground)` (l’ancien fond brand plein avec texte #14161a était peu lisible en thème sombre) ; :focus-visible raffiné et scopé `:where(a, button, [role="button"], input, select, textarea, [tabindex])` avec outline 2px var(--brand) offset 2px — spécificité nulle donc les utilitaires shadcn (outline-none/ring) gagnent toujours via la couche utilities ; suppression du `border-radius: 4px` imposé au focus (déformait les éléments sans radius propre — l’outline suit désormais nativement le radius de chaque élément, conformément à « respecting existing radii ») ; transition body affinée 0.3s → 0.25s ease (spec g), gardée par le reduced-motion global existant
- globals.css — ajouts (design-tokens uniquement) : scrollbar globale fine brandée — `@supports (scrollbar-width: thin)` → `* { scrollbar-width: thin; scrollbar-color: var(--surface-3) transparent }` + `::-webkit-scrollbar` 10px (width/height), track transparent, pouce `var(--surface-3)` rounded-full, hover `var(--input)` (plus marqué) ; .slim-scroll conserve sa variante 6px (spécificité de classe gagnante) et les classes arbitraires `[&::-webkit-scrollbar]` de la vue admin s’empilent ; `.tnum` (font-variant-numeric: tabular-nums, miroir de .time-display) ; micro-interactions réutilisables pour les autres vues : `.press` (active: scale(0.98)), `.card-hover-glow` (hover : bordure teintée brand 35 % + halo var(--brand-glow)), `.lift` (hover : translateY(-2px) + ombre — déclarée après .press pour qu’un élément `.lift.press` garde la transition transform+box-shadow) ; aucune retro-application dans d’autres fichiers
- globals.css — garde prefers-reduced-motion explicite nommant .ring-pulse/.pulse-dot/.ring-fg/.lift/.press/.card-hover-glow (animation: none + transition: none !important), redondante avec la garde globale `*` existante conservée telle quelle (ceinture et bretelles si la garde globale est un jour assouplie)
- site-header.tsx — indicateur de lien actif : pastille brand 4px (`sm:after:*` : absolute, -bottom-[6px], centrée, rounded-full, bg-brand, content) sous le lien actif, desktop uniquement (préfixes sm: → menu mobile strictement inchangé) ; rendue sur TOUS les liens avec états scale-0/opacity-0 (inactif) → scale-100/opacity-100 (actif) + `sm:after:transition sm:after:duration-200` — un vrai fondu/scale-in au changement de route (un pseudo créé à la volée ne transitionnerait pas ; Tailwind 4.1.18 inclut translate/scale/opacity dans la propriété par défaut de `transition`, vérifié dans le dist)
- site-header.tsx — hover des liens inactifs enrichi sans conflit : `hover:underline hover:underline-offset-4 hover:decoration-brand/50` en plus du `transition-colors hover:bg-secondary hover:text-foreground` existant ; `.site-header-scrolled` conservé tel quel
- site-header.tsx — cibles tactiles : les 5 boutons icône sont size-10 = 40px (et non size-icon ≥ 44px comme le supposait la spec — vérifié dans ui/button.tsx : size-icon = size-9) → zone cliquable étendue à 44×48px SANS changer le visuel ni la hauteur du header : `relative before:absolute before:content-[''] before:-inset-y-1 before:-inset-x-0.5` (pseudo transparent, 2px par côté < gap-1.5 = 6px → aucun chevauchement entre boutons) ; aucun rétrécissement, aucun impact sur les offsets sticky top-[65px] des autres vues
- site-footer.tsx — pastille brand `size-2` + halo `shadow-[0_0_10px_var(--brand-glow)]` devant le wordmark (motif du header, sans pulse pour rester sobre) ; safe-area iOS : `py-10` → `pt-10` + `pb-[calc(var(--spacing)*10_+_env(safe-area-inset-bottom))]` (base 2,5rem = l’ancien py-10 exact, pas le --spacing(8)=2rem de l’exemple de spec ; mécanisme sticky mt-auto intact) ; liens : `transition-colors hover:text-foreground` déjà conformes — inchangés ; tous les libellés/liens FR conservés
- Vérifications : `bunx tsc --noEmit` → 0 erreur dans src/ (seul bruit préexistant examples/ + skills/) ; `bunx eslint` sur site-header.tsx + site-footer.tsx → 0 erreur 0 warning (globals.css hors config ESLint de ce projet, comme avant) ; relecture intégrale de globals.css de bout en bout (aucune typo de sélecteur, tout l’existant intact) ; pas de dev server ni build (consigne)

Stage Summary:
- 3 fichiers modifiés, aucun autre touché : `src/app/globals.css`, `src/components/focusly/site-header.tsx`, `src/components/focusly/site-footer.tsx`
- Nouveaux utilitaires/sélecteurs disponibles pour les vues : `.tnum`, `.lift`, `.press`, `.card-hover-glow`, scrollbar globale brandée (`@supports` + `*` côté Firefox/Chromium 121+, `::-webkit-*` côté anciens moteurs), garde reduced-motion nommée ; raffinements : ::selection lisible dans les 2 thèmes, :focus-visible scopé :where (spécificité 0, suit les radius natifs, ne fight plus shadcn), body 0.25s ease au changement de thème
- Décisions : pastille active animée via états opacity/scale sur tous les liens desktop (transition réelle au changement de route) ; cibles tactiles étendues par pseudo before plutôt que size-11 (size-11 aurait porté le header de ≈64 à 68px et désynchronisé les offsets sticky top-[65px] du blog/admin en pleine édition parallèle) ; safe-area calquée sur le py-10 existant ; .lift déclarée après .press pour composer les deux classes
- Risques : sur Chromium 121+/Safari 18.2+ la propriété standardisée scrollbar-color prend le pas sur tout style ::-webkit-scrollbar (y compris les classes arbitraires de la vue admin) → rendu légèrement différent mais cohérent (mêmes couleurs surface-3/transparent, scrollbar-width thin identique) ; les boutons du header restent 40px visuels (44×48 cliquables) — si un visuel size-11 (44px) est préféré, à coordonner avec les offsets sticky des autres vues ; rien d’autre de connu (tsc/eslint 0/0)

---
Task ID: R7 (cron webDevReview — tour 7)
Agent: main (Z.ai Code) + sous-agents full-stack-developer (r7-a, r7-c) et frontend-styling-expert (r7-b, r7-d)
Task: Assessment + QA agent-browser, nouvelles fonctionnalités (admin recherche + archivage, objectif hebdomadaire, tâches récurrentes), polish styling global

## 1. État du projet (évaluation initiale)
- Stable : tsc 0 erreur src/, eslint 0/0, dev.log 200 propres, 9 routes smoke OK (titres FR corrects, 0 erreur console/page)
- Aucun bug bloquant → décision : avancer les recommandations du tour 6 (4 agents en parallèle, périmètres de fichiers strictement disjoints)

## 2. Work Log (main)
- QA smoke initiale : routes, titres, snapshots outils/stats/admin, contrats relus (api/contact, store, types, tasks-panel)
- **Redémarrage dev server requis et effectué** (kill + setsid double-fork) : le push Prisma (`archived`) rendait le client Prisma du serveur en cours périmé (instance cachée sur globalThis dans src/lib/db.ts — incident identique au tour R5) ; GET sans `archived` avant redémarrage, complet après
- QA fonctionnelle complète détaillée ci-dessous + nettoyage (DB 0 message, localStorage usine, réglages focus=25/objectif=8 restaurés)
- Bugs faussement suspectés puis élucidés (artefacts d'automatisation, code sain) :
  1. « Titre en retard d'une route » → assertion du titre à 250 ms, boucle de test lisait trop tôt
  2. « Échéance non enregistrée » → les inputs date contrôlés React refusent fill/keyboard en headless dans ce sandbox ; le chemin réel (setter natif + événement input → onChange React) fonctionne et la sauvegarde est correcte (vérifié : dueDate persistée, badge « 17 septembre » rendu)
  3. « Chips d'édition non pré-remplies » → la requête de test visait les chips du formulaire d'ajout ; les 2 pickers sont indépendants et corrects (édition : Hebdo=true)
  4. Erreurs d'hydratation console → artefacts de hot-reload pendant l'édition parallèle des fichiers (warning « Fast Refresh performing full reload » présent) ; rechargement propre → 0 erreur

## Fonctionnalités livrées (détails dans les sections r7-a/b/c/d)
1. **Admin — recherche + archivage** (r7-a) : Prisma `ContactMessage.archived` (db:push OK) ; GET renvoie tout (take 300) ; PATCH {id, read?, archived?} rétrocompatible ; UI : recherche insensible casse+accents avec bouton d'effacement, chips Actifs/Non lus/Archivés, Archiver/Restaurer optimistes avec toasts, Badge « Archivé » + opacité, badge non-lus hors archivés, export CSV sur la liste visible, colonne « Archivé » dans le CSV — vérifié de bout en bout (archivage, restauration, recherche « TEST »→« Test QA », suppression via AlertDialog, DB propre)
2. **Stats — objectif hebdomadaire** (r7-b) : jauge dans la carte Comparaison hebdomadaire (objectif = objectif quotidien × 7), barre role=progressbar aria FR, ligne « Basé sur votre objectif quotidien… », statut aria-live (Trophy atteint / TrendingUp en bonne voie / Flag restant), gardes zéro — vérifié : 0/56 puis session réelle 1 min → 1/7, « 6 pomodoros restants »
3. **Tâches — récurrences** (r7-c) : types TaskRecurrence + RECURRENCE_LABELS/SHORT + nextDueDate (ancrage max(base, aujourd'hui), daily +1 / weekly +7, arithmétique locale, 9/9 tests bun dont rollovers fin de mois/bissextile) ; store addTask(text, estimate?, dueDate?, recurrence?) en un seul appel, toggleTask re-planifie la prochaine occurrence à la complétion (jamais au décochage, cap 200), updateTask accepte recurrence (null efface) ; UI : picker Aucune/Quotid./Hebdo dans ajout + édition inline, badge Repeat par ligne, hint « Prochaine occurrence : … » sur la tâche terminée, toast à la re-planification — vérifié : tâche hebdo due 17/09 cochée → copie due 24/09 + toast, filtre Aujourd'hui montre la terminée (due du jour) et pas la copie future, En retard vide
4. **Polish styling global** (r7-d) : globals.css — scrollbar fine et légère (Firefox scrollbar-width + WebKit, .slim-scroll inchangé), ::selection brand translucide lisible, :focus-visible annulaire brand 2px à spécificité nulle (:where), utilitaires .tnum/.lift/.press/.card-hover-glow, garde prefers-reduced-motion explicite sur les animations, transition de thème 0,25 s ; header — point brand animé sur le lien actif (after: 4px, scale/opacity 0,2 s), souligné hover sur liens inactifs, cibles tactiles 44×48 px via before: invisible ; footer — point brand + halo devant le wordmark, safe-area iOS (pb calc + env(safe-area-inset-bottom)), sticky-footer intact

## Vérifications agent-browser (récapitulatif)
- Admin : déverrouillage, chips, recherche casse/accents, effacement, archiver/restaurer (toasts), suppression AlertDialog, export CSV visible, DB rendue à 0 message
- Stats : jauge 0/56 → 1/7 après session réelle ; KPI réels ; comparaison hebdo intacte
- Session réelle 1 min : titre « 00:57 · Concentration — Focusly » → restauration, stats +1 pomodoro/71,8 s, cycle 1, bascule auto pause courte, history 1
- Tâches : récurrence hebdo complète (création → complétion → re-planification + toast), filtres, badges
- Styling : toutes les règles CSS présentes (tnum/lift/press/glow/focus-visible/scrollbar/selection), point de nav actif (after: bg var(--brand) 4px), Tab réel → outline 2px solid brand, footer safe-area 40px+inset
- Screenshots : r7-week-goal.png (jauge dark), r7-tasks-recurrence.png (récurrences), r7-light-stats.png (light)
- Mobile 375 px : 0 px d'overflow sur outils/statistiques/blog/contact
- Final : tsc 0 erreur src/, eslint 0/0 sur les fichiers modifiés, rechargement propre sans erreur console, 10 routes + 404 revérifiées, localStorage usine + DB vide

## Stage Summary
- 4 fonctionnalités livrées et vérifiées de bout en bout + polish styling global ; 1 incident d'infra résolu (redémarrage dev server après db:push) ; 4 fausses pistes d'automatisation élucidées (code sain)
- Fichiers : prisma/schema.prisma, api/contact/route.ts, admin-view.tsx, csv.ts, statistiques-view.tsx, types.ts, store.ts, tasks-panel.tsx, globals.css, site-header.tsx, site-footer.tsx
- Contrats étendus (additifs) : ContactMessage.archived, PATCH {read?, archived?}, TaskItem.recurrence, addTask 4 args, updateTask.recurrence, nextDueDate/RECURRENCE_* exportés
- Risques : aucun connu côté code ; headless ne peut pas tester navigator.share/vibrate/audio (chemins feature-détectés) ; les inputs date headless exigent le protocole setter natif (documentation test) ; take 300 sur GET admin (pagination non nécessaire à ce volume)

## 3. Non résolu / risques + priorités tour suivant
- Vérifier le rendu réel des scrollbars/focus sur Chrome desktop + iOS (safe-area) — non testable headless
- Admin : pagination/recherche serveur si > 300 messages ; réponse aux messages (brouillon) — le mailto existe déjà
- Tâches : vue « Aujourd'hui » regroupant échéances + retards avec sections ; récurrence « jours ouvrés »
- Stats : jauge similaire par mois (objectif mensuel = quotidien × jours du mois) ; filtre de période appliqué à la comparaison
- PWA : test réel d'installation (badge + raccourcis) sur Android Chrome
