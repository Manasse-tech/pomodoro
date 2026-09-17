# r8-a — full-stack-developer — Tâches : vue « Aujourd’hui » sectionnée + récurrence jours ouvrés

Horloge sandbox au moment des tests : 2026-09-17 (jeudi, UTC, identique à `todayKey()` local).

## Fichiers du périmètre (strictement respecté)

1. `src/lib/focusly/types.ts` — modifié
2. `src/lib/focusly/store.ts` — **aucun changement requis** (contrat auto-étendu par l’union élargie)
3. `src/components/focusly/tools/tasks-panel.tsx` — modifié

## Contrats (signatures exactes)

- `export type TaskRecurrence = "daily" | "weekdays" | "weekly";`
- `RECURRENCE_LABELS: Record<TaskRecurrence, string>` → daily « Quotidienne », weekdays « Jours ouvrés », weekly « Hebdomadaire »
- `RECURRENCE_SHORT: Record<TaskRecurrence, string>` → daily « Quotid. », weekdays « Ouvrés », weekly « Hebdo »
- `nextDueDate(fromKey, recurrence)` pour weekdays : base = clé parsée (parties locales) sinon aujourd’hui ; ancre = `max(base, today)` ; puis **+1 jour local, saut du week-end** : le lendemain de l’ancre est samedi → +2 (lundi), dimanche → +1 (lundi), sinon 0. Résultat **toujours strictement postérieur à l’ancre** (ven→lun, sam→lun, dim→lun, lun–jeu→lendemain). Même arithmétique locale que le reste (new Date(y, m-1, d+N), relecture par todayKey, jamais ISO/UTC).
- Store inchangé : `addTask(text, estimate?, dueDate?, recurrence?)`, `toggleTask` (spawn dans le même set(), cap 200), `updateTask(patch & { recurrence?: TaskRecurrence | null })` — fonctionnent tels quels avec « weekdays ».

## UI (tasks-panel.tsx)

- `RecurrencePicker` : options désormais dérivées de `Object.entries(RECURRENCE_SHORT)` après « Aucune » → pilule « Ouvrés » rendue automatiquement (formulaire d’ajout + édition inline, composant partagé) ; badge `Repeat` + `RECURRENCE_SHORT`, title « Répétition jours ouvrés », hint « Prochaine occurrence : … » (done) et toast « Prochaine occurrence planifiée : … » valables pour weekdays sans autre changement.
- Vue « Aujourd’hui » sectionnée (filtre `filter === "aujourdhui"` uniquement) : `visibleTasks` partitionné en `overdueTasks` (!done, daysUntil < 0) / `dueTodayTasks` (!done, === 0) / `doneInView` (done) — partition exacte. Rendu : conteneur `slim-scroll max-h-96 overflow-y-auto` avec jusqu’à 3 `<section aria-labelledby="tasks-{overdue|today|done}-heading">` + h3 `text-[11px] font-semibold uppercase tracking-wide text-faint` : « En retard · N » (précédé d’un point `size-1.5 rounded-full bg-destructive/70` aria-hidden — sobre, ni ambre ni bleu), « Échéances du jour · N », « Terminées · N ». Sections vides jamais rendues. Filtres « Toutes » / « En retard » : liste plate inchangée.
- Ligne de tâche extraite dans `renderTask(t)` (fonction locale) partagée par la liste plate et les 3 sections — diff normalisé espace-insensible contre l’original : seules 2 ternaires re-wrappées sur une ligne, sémantique identique. DnD (dragstart/dragover rejetant done/drop → moveTaskTo), chevrons (bornes sur l’ordre du store via `storeIndex`), cap 200 (store), états vides, compteur « · N affichée(s) » : préservés.

## Vérifications

1. `bunx tsc --noEmit` → 0 erreur dans src/ (bruit préexistant examples/ + skills/ filtré).
2. `bunx eslint` sur les 3 fichiers → 0 erreur, 0 warning.
3. `bun -e` nextDueDate → **15/15 PASS** : ven 18/09→lun 21/09 ; sam 19/09→lun 21/09 ; dim 20/09→lun 21/09 ; lun 21/09→mar 22/09 ; jeu 17/09→ven 18/09 ; ancre passée dim 13/09 → clamp aujourd’hui (jeu) → ven 18/09 ; ven passée 11/09 → ven 18/09 ; undefined → ven 18/09 ; base future ven 25/09 → lun 28/09 ; régressions daily (+1), weekly (+7), clé invalide weekly → today+7, rollovers 2027-01-31 daily→01-02 / weekly→07-02.
4. `bun -e` store (protocole r7-c) → **16/16 PASS** : addTask weekdays persiste ; toggle(true) → 2 tâches (originale done, spawn dueDate 2026-09-21, recurrence weekdays, done false, spent 0, estimate hérité, id neuf, active non transféré) ; toggle(false) → aucun spawn ; patch partiel {text} → récurrence intacte ; `recurrence: null` → efface ; valeur → pose ; addTask legacy 1-arg OK ; tâche en retard (due 10/09) → spawn clampé à aujourd’hui puis ven 18/09.
5. Simulation `bun -e` de la partition « Aujourd’hui » → **6/6 PASS** (futur et sans-échéance exclus ; chip « En retard » = overdue + done overdue, plat).
6. dev.log → « ✓ Compiled » propres après les écritures, aucune erreur. Pas de dev server, build ni agent-browser lancés (consigne).

## Décisions

- Pilules du picker dérivées de RECURRENCE_SHORT (Object.entries) : plus de liste codée en dur, toute future valeur de TaskRecurrence apparaît seule.
- Tâches terminées du filtre « Aujourd’hui » regroupées dans une 3e section « Terminées · N » : le placement inline exact est impossible dans une vue sectionnée (la spec anticipait « groupe ou inline ») — cohérent au sein de la vue, compteur global et bouton « Effacer les tâches terminées » inchangés.
- Accent « En retard » : point destructif discret (6 px, aria-hidden) — pas d’ambre, pas de bleu, sobre.
- Sémantique weekdays documentée : l’occurrence spawnée est toujours strictement après l’ancre (daysUntil ≥ 1) → elle n’apparaît jamais dans « Aujourd’hui » le jour du spawn.

## Risques

- DnD inter-sections reste possible au niveau du store (comportement déjà existant sous filtre, préservé tel quel ; cibles done rejetées).
- La section « Terminées » n’existe que sous « Aujourd’hui » — les autres filtres gardent les terminées inline (intentionnel).
- QA navigateur à faire par le main : rendu des 3 sections (dark/light, 375 px), toasts weekdays, DnD/chevrons sous filtre.
