# r7-c — full-stack-developer — Tâches : récurrences (quotidienne / hebdomadaire) avec re-planification automatique

Horloge sandbox au moment des tests : 2026-09-17 (UTC, identique à `todayKey()` local).

## Fichiers modifiés (périmètre exact, strictement additif)

1. `src/lib/focusly/types.ts`
2. `src/lib/focusly/store.ts`
3. `src/components/focusly/tools/tasks-panel.tsx`

## Contrats (signatures exactes)

- `export type TaskRecurrence = "daily" | "weekly";`
- `export const RECURRENCE_LABELS: Record<TaskRecurrence, string>` → daily « Quotidienne », weekly « Hebdomadaire »
- `export const RECURRENCE_SHORT: Record<TaskRecurrence, string>` → daily « Quotid. », weekly « Hebdo »
- `TaskItem` : + `recurrence?: TaskRecurrence`
- `export function nextDueDate(fromKey: string | undefined, recurrence: TaskRecurrence): string`
  - base = clé parsée (`new Date(y, m-1, d)`, parties locales) si valide, sinon aujourd’hui ;
  - ancre = `max(base, today)` → jamais de replanification dans le passé ;
  - daily → +1 jour, weekly → +7 jours via `new Date(y, m-1, d+N)` (normalisation auto mois/année) puis relecture des parties locales par `todayKey` (même padding, jamais ISO/UTC).
- `addTask: (text: string, estimate?: number, dueDate?: string, recurrence?: TaskRecurrence) => void` — dueDate vide → ignorée ; 1–2 args inchangés (rétrocompatible).
- `toggleTask: (id: string, done: boolean) => void` — sur `done=true` d’une tâche récurrente : spawn de `{ id: uid(), text, done: false, created: Date.now(), estimate: idem, spent: 0, dueDate: nextDueDate(...), recurrence: idem }` dans le MÊME `set()` (une fois par complétion), garde `.slice(-200)` ; `done=false` ne spawn jamais ; `active` non transféré, l’original garde le sien.
- `updateTask(id, patch: Partial<Pick<TaskItem, "text" | "dueDate" | "estimate">> & { recurrence?: TaskRecurrence | null })` — null → efface (`delete`), valeur → pose, clé absente (patch partiel) → intacte (convention Partial, cohérente avec dueDate/text).
- `importData` : inchangé, les tâches passent telles quelles (aucune erreur de type).

## UI (tasks-panel.tsx)

- Nouveau composant module `RecurrencePicker` (Aucune / Quotid. / Hebdo) : `role="group"` + `aria-pressed`, classes des chips de filtre existantes (`rounded-full border px-2.5 py-1 text-xs`, actif `border-brand/40 bg-brand/15 font-medium text-brand`), mini-libellé visible « Répétition » (`text-[11px] text-faint`), boutons `type="button"`, `flex-wrap` → 375 px sans overflow.
- Formulaire d’ajout : picker entre l’input date et « Ajouter » ; état `recurrence` (défaut null, reset après ajout comme l’estimateur) ; refactoré pour tout passer en UN appel `addTask(value, estimate, dueDate, recurrence ?? undefined)` — suppression du contournement `addTask` + `updateTask(getState)`.
- Édition inline : même picker entre la ligne texte/date et Enregistrer/Annuler ; état `editRec` initialisé depuis la tâche (`startTaskEdit`) ; `updateTask(id, { text, dueDate, recurrence: editRec })` (null → efface).
- Ligne : badge `Repeat` (size-3) + `RECURRENCE_SHORT` en pill subtile (`rounded-full border bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground`, title « Répétition quotidienne/hebdomadaire ») à côté du badge échéance ; si `done && recurrence` : ligne dédiée `w-full text-xs text-faint` « Prochaine occurrence : … » (`frDateShort(nextDueDate(...))`).
- Checkbox : complétion d’une tâche récurrente → `toggleTask(t.id, true)` puis `toast.info("Prochaine occurrence planifiée : …")` ; sinon toggle normal (décoche incluse). DnD (cibles done rejetées) et bornes chevrons intacts.
- Filtre « Aujourd’hui » : l’occurrence suivante (demain / semaine prochaine, `daysUntil > 0`) n’y apparaît pas — aucun changement requis (spec f).

## Vérifications

1. `bunx tsc --noEmit` → 0 erreur dans src/ (bruit examples/ + skills/ filtré).
2. `bunx eslint` sur les 3 fichiers → 0 erreur, 0 warning.
3. `bun -e` nextDueDate → 9/9 PASS :
   - 2026-09-17 daily → 2026-09-18 ; weekly → 2026-09-24 ;
   - undefined daily → demain (2026-09-18) ;
   - rollover fin de mois prouvé avec base FUTURE : 2027-01-31 weekly → 2027-02-07, 2027-01-31 daily → 2027-02-01, 2028-02-28 daily → 2028-02-29 (bissextile) ;
   - clamp passé : 2026-09-16 daily → 2026-09-18 ; clé invalide → aujourd’hui + 7.
4. Smoke test store (`bun -e`) : ajout avec dueDate+récurrence OK ; toggle(true) → 2 tâches (originale done, copie dueDate=2026-09-18 daily) ; toggle(false) → aucun spawn ; patch `recurrence: null` → efface ; patch partiel `{text}` → récurrence intacte ; patch `recurrence: "weekly"` → posée ; `addTask("x")` 1-arg legacy OK.
5. dev.log → hot-reload « ✓ Compiled », aucune erreur. Pas de dev server/build/agent-browser lancés (consigne).

## Note sur la vérif spec n° 3 (rollover)

La liste de vérification de la spec attend « 2026-01-31 weekly → 2026-02-07 », ce qui suppose une horloge antérieure au 2026-01-31. À l’horloge réelle (2026-09-17), la règle `max(base, today)` imposée par la même spec (bullet « weekly: max(base, today) + 7 days ») ancre la base passée sur aujourd’hui → 2026-09-24. L’implémentation suit la règle max (choix spec + meilleur comportement produit : pas d’occurrence déjà en retard) ; l’arithmétique fin de mois (31 janv. + 7 → 7 févr.) est prouvée via une base future (2027-01-31 → 2027-02-07). Cas 2026-01-31 vérifié conforme à la règle max.

## Risques

- Bascules répétées done↔à faire : chaque re-complétion de la MÊME tâche récurrente re-spawn une copie (comportement « une fois par complétion » voulu par la spec) — les doublons éventuels restent supprimables individuellement / via « Effacer les tâches terminées ».
- L’occurrence spawn en fin de liste (append) : l’ordre existant n’est pas perturbé, mais elle n’hérite pas de la position de l’originale.
- DnD tactile toujours inopérant (pré-existant, couvert par les chevrons clavier).
