# r9-d — full-stack-developer — Tâches : récurrence personnalisée « Tous les N jours » (2–365)

Horloge sandbox au moment des tests : jeudi 2026-09-17 (UTC, identique à `todayKey()` local).

## Fichiers du périmètre

1. `src/lib/focusly/types.ts` — modifié (additif)
2. `src/components/focusly/tools/tasks-panel.tsx` — modifié
3. `src/lib/focusly/store.ts` — touché MINIMalement (passage du paramètre, cf. détail ci-dessous ; lastTick/sanitizeDaily et toute la logique ajoutée par r9-fix-1 intacts)

## Contrats (signatures exactes)

- `export type TaskRecurrence = "daily" | "weekdays" | "weekly" | "custom";` (sémantique des 3 premières valeurs 100 % intacte)
- `RECURRENCE_DAYS_MIN = 2`, `RECURRENCE_DAYS_MAX = 365`, `DEFAULT_RECURRENCE_DAYS = 3` (nouveaux exports)
- `RECURRENCE_LABELS.custom = "Tous les X jours…"`, `RECURRENCE_SHORT.custom = "X j"` (Records restés exhaustifs sur l'union — 4 clés chacun)
- `export function clampRecurrenceDays(v: number): number` — réutilise `clamp` (round + bornes 2–365)
- `TaskItem` : + `recurrenceDays?: number` (optionnel → persistance focusly.v4 rétrocompatible ; les anciennes tâches sans le champ se comportent exactement comme avant)
- `nextDueDate(fromKey, recurrence, intervalDays?)` — 3e paramètre optionnel (rétrocompatible) ; pour `custom` : N = clampRecurrenceDays(intervalDays ?? 3), ancre = max(base, today) puis + N jours locaux, week-end NON sauté, résultat strictement postérieur à l'ancre ; daily/weekdays/weekly inchangés (36/36 PASS dont tout l'ensemble de régression r8-a)

## Changements store.ts (minimaux, listés exhaustivement)

1. `addTask` : 5e paramètre optionnel `recurrenceDays?: number` + 1 ligne `if (recurrence === "custom" && recurrenceDays != null) task.recurrenceDays = clampRecurrenceDays(recurrenceDays);` — nécessaire pour créer une tâche custom avec son N (appel à 4 args ou moins inchangé, N absent → champ absent).
2. `toggleTask` : le spawn passe `src.recurrenceDays` à `nextDueDate(...)` ET le porte sur la copie (`recurrenceDays: src.recurrenceDays`) — sinon la copie perdrait son N et sa propre complétion retomberait sur le défaut 3. 2 lignes, dans le même set()/cap 200.
3. `updateTask` : patch type + `recurrenceDays?: number | null` + handler miroir de `recurrence` (valeur → clamp 2–365, `null` → delete, clé absente → intacte) — requis par la spec (édition inline du N dans la ligne d'édition, même picker partagé que l'ajout).

Rien d'autre : lastTick/partialize/onRehydrateStorage/merge/sanitizeDaily/importData/exportData intacts.

## UI (tasks-panel.tsx)

- `RecurrencePicker` : props + `days: number` / `onDaysChange: (n: number) => void` ; pilules TOUJOURS dérivées de `Object.entries(RECURRENCE_SHORT)` (« Aucune » + 4) → la 5e pilule « X j » apparaît automatiquement dans le formulaire d'ajout ET l'édition inline ; quand custom est sélectionnée la pilule affiche la valeur live (« 3 j ») ; `key` passée de `o.label` à `o.value ?? "none"` (le label custom changeant avec N, ça évite un remount).
- Entrée N : révélée quand `value === "custom"`, dans une `label` pill assortie aux pilules actives (`rounded-full border-brand/40 bg-brand/15 text-brand px-2.5 py-1 text-xs`) « Tous les [input] jours » ; input `type=number` `inputMode=numeric` min/max/step 2/365/1, `w-11` centré, `.tnum`, spinners natifs masqués (`[appearance:textfield]` + webkit), `outline-none focus-visible:ring-2 focus-visible:ring-brand/60` (cohérent shadcn) ; title « Répéter tous les N jours (2 à 365) », aria-label « Nombre de jours entre chaque répétition, entre 2 et 365 ».
- Saisie : état local `rawDays` (string | null) — pendant la frappe, texte brut affiché (saisie « 12 » jamais écrasée par le clamp intermédiaire) et commit immédiat de la valeur clampée dès qu'elle est parsable ; `onBlur` → retour à la valeur committée. Enter/submit utilisent toujours la dernière valeur valide (jamais de N invalide dans le store).
- États : `recDays` (ajout, défaut 3, reset après ajout) et `editDays` (édition, initialisé `t.recurrenceDays ?? 3` dans startTaskEdit) ; `saveTaskEdit` envoie `recurrenceDays: editRec === "custom" ? editDays : null` (N effacé si on quitte custom).
- Badge de ligne : custom → Repeat + `${N} j` + title « Répétition tous les N jours » ; autres récurrences inchangées (title « Répétition quotidienne/jours ouvrés/hebdomadaire »). Toast de complétion et hint « Prochaine occurrence : … » passent `t.recurrenceDays` à `nextDueDate`.

## Vérifications

1. `bunx tsc --noEmit` → 0 erreur dans src/ (bruit préexistant examples/ + skills/ filtré ; re-vérifié après suppression des scripts de test).
2. `bunx eslint` sur les 3 fichiers → 0 erreur, 0 warning.
3. `bun -e` nextDueDate → **37/37 PASS** : régression r8-a complète (ven/sam/dim→lun, lun→mar, jeu→ven, ancre clamp, ven passé, undefined, base future) ; régressions daily/weekly (+1/+7, rollovers 2027-01-31, bissextile 2028-02-28, clé invalide) ; custom : N=3 jeu 17/09→dim 20/09, N=2 ven→dim (week-end NON sauté), ancre clamp 01/09→today+3, défaut sans 3e arg, bornes 1/0/négatif→2, 366→365 (+365 j exact = 2027-09-17), rollover 30/09→03/10, 2.7→3 ; clampRecurrenceDays (bornes 2/365, arrondis) ; Records exhaustifs 4 clés. (Le script vivait dans analysis/ et a été supprimé après PASS — tsc ne voit plus les imports .ts.)
4. `bun -e` store (protocole r7-c) → **26/26 PASS** : addTask custom N=3 persiste ; toggle(true) → spawn dueDate 2026-09-20 (+3), custom, recurrenceDays 3, non-done, non-active, originale done ; toggle(false) ×2 → aucun spawn ; patch 999→365, patch 10, patch partiel {text} → N intacte, patch null → effacée ; re-complétion d'une copie sans N → défaut 3 (ancre = sa propre dueDate future 20/09 → 23/09, règle max(base, today)) ; addTask custom sans N → champ absent ; legacy 1-arg ; tâche en retard → ancre clampée today+2 héritée. (Une seule fausse attente dans MON test initial, corrigée — le code était juste : l'ancre d'un re-spawn est la dueDate de la copie, future.) Script supprimé après PASS.
5. dev.log → « ✓ Compiled » propres, GET / 200, aucune erreur.
6. agent-browser (CLI) sur http://localhost:3000/#outils :
   - 5 pilules « Aucune / Quotid. / Ouvrés / Hebdo / X j » rendues ; clic « X j » → pilule passe à « 3 j » + input N révélé (valeur 3) ;
   - tâche « Test récurrence custom » créée → badge Repeat + « 3 j », title exact « Répétition tous les 3 jours », localStorage : `recurrence:"custom", recurrenceDays:3` ;
   - complétion → spawn dueDate 2026-09-20 (+3 j, NOT in « Aujourd'hui » : daysUntil=6, la vue « Aujourd'hui » affiche l'état vide « Rien de prévu aujourd'hui ») ;
   - complétion de la copie → toast « Prochaine occurrence planifiée : 23 septembre » (ancre = dueDate future de la copie, conforme au contrat) ;
   - édition inline : picker partagé, pilule custom sélectionnée « 3 j », N prérempli 3 ; changé en 5 → Enregistrer → recurrenceDays:5 persisté, badge « 5 j » ; la copie garde son N=3 indépendant ;
   - 375×667 : `scrollWidth`=375 (0 px d'overflow), le label « Tous les [3] jours » passe proprement à la ligne dans le groupe (groupH 58 px) ; screenshot `analysis/r9-tasks-custom.png` ;
   - les 3 tâches de test supprimées via l'UI → état vide « Aucune tâche pour le moment. », localStorage `tasks:[]` (usine) ; `agent-browser errors` → 0.

## Décisions

- « custom » + `recurrenceDays` séparé (recommandation spec) plutôt qu'un encoded value — Record exhaustifs préservés, anciennes tâches intouchées.
- Défaut N = 3 partout (UI, nextDueDate sans 3e arg) — spec.
- Le badge et la pilule substituent le nombre réel au « X » de RECURRENCE_SHORT.custom (« X j » reste la valeur générique du Record).
- Dérivation des pilules conservée (Object.entries) — future preuve ; seule l'étiquette custom est surchargée quand sélectionnée.
- Store : les 3 extensions ci-dessus étaient le minimum pour que création/spawn/édition du N fonctionnent ; documentées ligne par ligne (la consigne limitait strictement le store, l'extension updateTask est justifiée par l'exigence spec « inline edit row » — même picker partagé).

## Risques

- `rawDays` : tant que l'utilisateur ne quitte pas le champ, l'affichage peut montrer une valeur hors bornes (ex. « 999 ») pendant que la valeur committée est 365 — retour visuel correct au blur ; submit ne peut jamais produire de N invalide.
- Une tâche custom sans dueDate se spawn à today+N à la complétion (comportement cohérent avec daily/weekly existants).
- Anciennes tâches persistées sans `recurrenceDays` mais avec recurrence custom (impossible avant ce round, mais par dérive d'import) : nextDueDate retombe sur le défaut 3 — dégradation douce.
- QA : light/dark non testés visuellement headless (couleurs = var(--brand) existantes, même pairing que les pilules actives) ; DnD/chevrons non rejoués (intacts, aucun changement de cette zone).
