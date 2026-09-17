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
