# r11-b — full-stack-developer — Tâches : re-planification rapide (1 clic « Aujourd'hui » pour les retards + menu Reprogrammer par ligne)

Horloge sandbox au moment des tests : jeudi 2026-09-17 (identique à `todayKey()` local).

## Fichiers du périmètre

1. `src/components/focusly/tools/tasks-panel.tsx` — **SEUL fichier modifié** (propriétaire r11-b)
2. `src/lib/focusly/store.ts` — **NON touché** : lecture préalable → le patch `updateTask` accepte DÉJÀ `dueDate?: string` (`""`/null → `undefined`, clé absente → intacte). Aucune extension nécessaire (consigne « minimal touch » respectée à zéro ligne).
3. `src/lib/focusly/types.ts` — lu uniquement (contrat confirmé : `TaskItem.dueDate` = clé jour locale `YYYY-MM-DD`, même format que `todayKey`).

## Contrats utilisés (inchangés)

- `updateTask(id, patch: Partial<Pick<TaskItem, "text" | "dueDate" | "estimate">> & { recurrence?; recurrenceDays? })` — `dueDate: "<clé jour>"` pose, `dueDate: ""` efface, patch partiel → récurrence intacte.
- `nextDueDate(fromKey, recurrence, intervalDays?)` — ancre `max(dueDate, today)` : une tâche récurrente reprogrammée puis complétée spawn depuis la NOUVELLE dueDate (prouvé par test de désambiguïsation).
- `todayKey(d)` — arithmétique en parties locales ; le panneau ajoute `dayKeyFromToday(offset)` (même formule, +0/+1/+7 j).

## UI (tasks-panel.tsx)

- `RescheduleChoice` = `"today" | "tomorrow" | "week" | "none"` ; `RESCHEDULE_TOASTS` (FR courts) ; `rescheduleKey(choice)` (clés jour réelles, jamais inventées).
- `RescheduleControl` (par ligne, après le badge de récurrence) :
  - to-do EN RETARD (dueDays < 0 && !done) → bouton 1-clic direct (pas de menu), title « Reprogrammer pour aujourd'hui », aria-label « Reprogrammer pour aujourd'hui : {texte} », toast « Tâche reprogrammée pour aujourd'hui. » ;
  - autres lignes → shadcn DropdownMenu (trigger CalendarClock size-4, aria-label « Reprogrammer : {texte} ») : « Aujourd'hui » (masqué si déjà aujourd'hui ; présent pour les tâches SANS échéance et à échéance future, + hint frDateShort aligné à droite), « Demain », « Dans une semaine », séparateur + « Retirer l'échéance » (seulement si dueDate existe).
- Handler panneau `rescheduleTask(id, choice)` = UN site d'appel `updateTask` + `toast.success` ; position choisie pour que le padding du bouton ne chevauche que des éléments non interactifs (pills/texte).
- Cible tactile ≥ 44 px : `size-11` + `-m-3.5` (padding symétrique annulé → rendu identique aux autres icônes de ligne, toujours visible sur mobile, pas de hover-reveal).
- Non touché : compteur « · N affichée(s) », comptes de sections, logique de filtres, clic de ligne, checkbox, DnD, chevrons, édition inline.

## Vérifications

1. `bunx tsc --noEmit` → 0 erreur src/ (bruit préexistant examples/+skills/).
2. `bunx eslint src/components/focusly/tools/tasks-panel.tsx` → 0 erreur 0 warning.
3. Smoke store `bun` (analysis/r11-store-smoke.ts, miroir r9-d, supprimé après PASS) → **15/15 PASS**, dont : patch `dueDate: today` persiste (daysUntil 0, récurrence intacte) ; complétion de la tâche reprogrammée → spawn depuis la NOUVELLE ancre (today+7 = 2026-09-24) ; désambiguïsation (retard 09-11 reprogrammée demain 09-18 → spawn 09-25, PAS 09-24 → l'ancre est la nouvelle dueDate) ; `dueDate: ""` → undefined (clé absente du JSON persisté) ; tâche sans échéance → today ; toggle(false) → pas de spawn ; usine restaurée.
4. agent-browser (--session r11b isolée) sur #outils : 3 tâches créées via l'UI (dont 1 en retard via l'input date du formulaire) ; vue sectionnée : « EN RETARD · 1 » → 1 clic → toast + section disparue + « ÉCHÉANCES DU JOUR · 2 » ; menu → Demain / Dans une semaine / Retirer l'échéance OK (toasts + localStorage vérifiés à chaque étape) ; menu de la tâche sans échéance contient « Aujourd'hui » → OK ; clavier : Enter ouvre, flèches naviguent, Enter sélectionne, focus RENDU au trigger ; filtre plat « En retard » : bouton 1-clic présent → clic → « · 1 affichée » devient « · 0 affichée » + état vide « Aucune tâche en retard. Vous êtes à jour. » ; 375×667 : scrollWidth 375 (0 overflow), menu 208 px entièrement visible (Radix collision), screenshot `analysis/r11-tasks-reschedule.png` (menu ouvert) ; 4 tâches de test supprimées via l'UI → `tasks:[]` (usine) ; `agent-browser errors` → 0 ; dev.log propre.
5. Piège QA noté : `find text "Aujourd'hui"` clique la PILULE de filtre (même libellé) — utiliser un locator par rôle (`role menuitem`) pour les items du menu. Aucune implication code.

## Risques

- Aucun côté store (0 modification) ; récurrence intouchée par construction (patch partiel).
- Reprogrammer une tâche récurrente DÉJÀ terminée est possible via le menu (sans effet sur l'occurrence déjà spawnée — ancrage nextDueDate inchangé).
- Le padding de la cible 44 px chevauche au pire des éléments non interactifs (placement après les badges) ; voisin interactif éventuel (stepper d'estimation) gagne le strip car postérieur au DOM — aucun clic détourné.
- QA en session navigateur isolée (agents parallèles) → localStorage isolé, rien à restaurer.
