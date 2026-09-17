# Task ID: r11-a — full-stack-developer — work record

## Scope (strictly respected — only these 3 files touched)
- `prisma/schema.prisma` (+ `search String?` on ContactMessage) + `bun run db:push` OK
- `src/app/api/contact/route.ts` (accent-insensitive search + search index maintenance + markAllRead)
- `src/components/focusly/admin-view.tsx` (« Tout marquer comme lu » toolbar action + 375 px overflow fix caused by the new button)
- store.ts / types.ts / other views / globals.css / focusly-app / sw.js / header-footer: untouched. No other file needed.

## 1. Accent-insensitive search (closes the R10 risk: « reponse » ≠ « réponse »)
- `fold()` (private in route.ts): NFD → strip [\u0300-\u036f] → lowercase. Contractual: the SAME
  implementation is used for BOTH indexing (search column writes) and query folding (?q=) — divergence
  impossible. Documented limitation: NFD does not decompose ligatures (œ, æ) — « cœur »↔« Cœur » matches
  (case folded), « coeur » does not match « cœur » (consistent on both sides).
- `buildSearchValue({name, email, subject, message, reply})` = fold(name + ' ' + email + ' ' +
  subject??'' + ' ' + message + ' ' + reply??'').
- Schema: `ContactMessage.search String?` (doc comment: API-maintained folded concat). db:push ran;
  dev server still holds the STALE cached Prisma client → all search writes go through $executeRaw with
  bound params (r9-a/r10-a pattern). Known-column typed paths NOT regressed.
- Write paths maintained:
  - POST: typed create (known columns) → $executeRaw UPDATE search (failure logged, non-fatal: the lazy
    backfill self-heals any search IS NULL row on the next GET).
  - PATCH reply: raw re-read BEFORE writing (NEVER recompute from the typed object — the stale client omits
    `reply`, which would WIPE the reply text from the index; regression test included) → ONE $executeRaw
    SET reply/repliedAt/read/search.
  - PATCH read/archived: typed update kept + search rewritten from the raw re-read (heals NULL rows too).
- Lazy backfill `ensureSearchBackfill()` on GET, BEFORE any filtered read: the `SELECT … WHERE search IS NULL`
  IS the guard — once everything is indexed, each GET pays one empty read (tiny contact table), no double
  work, never rewrites an indexed row, self-heals externally-inserted NULL rows, idempotent under concurrent
  GETs, try/catch so it never breaks the GET (retried next GET).
- GET ?q=: needle = fold(query.trim()) → `"search" LIKE %…% ESCAPE '\'` with %/_/\ escaped (literal
  wildcards). ?filter=, pagination (filtered total vs global unread), ?format=csv semantics UNCHANGED;
  CSV uses the same WHERE → export is accent-folded too. Code comments updated: search is now
  ACCENT-INSENSITIVE (was the documented LOWER()-based accent-sensitive limitation).

## 2. « Tout marquer comme lu »
- PATCH accepts `{ markAllRead: true }` — priority branch (id/read/archived/reply ignored), typed
  updateMany {archived:false, read:false} → read:true (read/archived are known to the stale client; raw SQL
  stays reserved for new columns). Reply semantics untouched. Response `{ ok, updated, unread: 0 }`.
- admin-view.tsx: toolbar button (CheckCheck icon / Loader2 while pending, outline sm, aria-label
  « Tout marquer comme lu », disabled when unreadCount === 0 or markingAll) wrapped in shadcn AlertDialog:
  title « Marquer tous les messages non lus comme lus ? », description « Tous les messages non archivés
  (N non lu(s)) seront marqués comme lus. Chacun pourra ensuite être remis en « non lu » individuellement. »,
  Annuler / Confirmer. Optimistic: visible active cards → read:true, badge → 0, under « non-lus » the list
  empties + total 0; success → toast « Messages marqués comme lus. »; failure → snapshot restore
  (messages/total/unreadCount) + error toast.
- Overflow fix (introduced by the new button): header actions row `flex items-center` → `flex flex-wrap
  justify-end` — at 375 px the row wraps to 2 lines, scrollWidth 375 re-verified.

## Verification (all green)
- `bunx tsc --noEmit` → 0 errors in src/ (pre-existing examples/ + skills/ noise only)
- `bunx eslint` on both files → 0 errors 0 warnings
- dev.log clean (the single historical 500 « near "?" » is r9-a's pre-Prisma.raw era, not this round)
- bun harness (fresh PrismaClient process + $executeRaw/$queryRawUnsafe + HTTP fetch vs dev server; 46/46
  PASS; scratch deleted after): 6 accented rows seeded with search NULL → first GET backfills exact fold
  values; POST creates WITH search indexed; PATCH reply reindexes (q=revenons → 1); PATCH read on a replied
  row keeps reply in the index (q=accessible → 1); q=reponse → « Réponse », q=eleve → 2 « élève »,
  q=REUNION → « réunion », q=cœur → « Cœur », q=coeur → 0 (documented œ limitation); literal wildcards
  q=50% / q=_ / q=% (under filter=archives where the row lives — Léa is archived, default filter=actifs
  excludes her: first harness run had 2 wrong expectations, fixed — API was correct); q+filter combos +
  global unread independent of filter; markAllRead → {updated:3, unread:0}, archived row untouched, already-
  read unchanged, non-lus 0 after; CSV ?q=reponse → BOM EF BB BF + header + 1 Zoé row, CSV default actifs
  (6 rows), CSV ?q=50%25&filter=archives → Léa (folded export); DELETE all → 0 rows, search column present
  (PRAGMA), final GET total 0. Exactly 1 HTTP POST used (rate limit 5/15 min respected).
- agent-browser (isolated session r11a): DB empty → button DISABLED + no badge + « Aucun message pour le
  moment. »; seed 3 rows (search NULL) + reload → badge « 2 non lus », button enabled, 3 cards (UI proof of
  the backfill); typing « reunion » → Zoé Étudiant card (« Réunion de rentrée »), « eleve » → 2 cards,
  « REUNION » → 1, « 50% » → « Aucun message ne correspond à votre recherche. » (literal wildcard), clear
  works; dialog: exact FR title/description/buttons, Annuler → badge unchanged + dialog closed, Confirmer →
  toast « Messages marqués comme lus. » + badge gone (0) + button re-disabled + 0 unread dots; DB after:
  3 active rows read=1; 375×667 scrollWidth−clientWidth = 0 (screenshot taken then deleted with the scratch
  dir); desktop 1280 single row; `agent-browser errors` empty; final cleanup → 0 DB rows, empty state +
  disabled button re-verified, session closed.

## Notes / risks
- No blocking risk. tsc/eslint clean, 46/46 API/DB checks, browser QA 0 errors, DB left at 0 messages.
- After a future dev-server restart the regenerated client would expose `search` typed — nothing consumes it
  typed, so no behavioral change expected.
- If the contact table ever grew very large, the per-GET NULL-detection scan could be replaced by a module
  flag (trade-off documented in the code).
- The œ/æ ligature limitation is a documented, consistent-on-both-sides product decision.
