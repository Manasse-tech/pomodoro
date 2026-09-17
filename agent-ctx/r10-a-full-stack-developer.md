# Task ID: r10-a — full-stack-developer — work record

## Scope (strictly respected — only these 2 files touched)
- `src/components/focusly/admin-view.tsx` (server search/filter wiring + endpoint CSV export)
- `src/app/api/contact/route.ts` (GET: ?q=, ?filter=, ?format=csv)
- NO schema change, NO db:push this round (as instructed). No other file needed.

## New GET /api/contact contract (admin key required)
- `?page=1&pageSize=25&filter=actifs&q=…` → `{ ok, items, total, page, pageSize, unread, messages }`
  - `total` = count of messages matching q + filter (pagination across the WHOLE filtered set, not the page)
  - `unread` = GLOBAL non-archived unread count (badge semantics unchanged, independent of q/filter)
  - `q` trimmed, capped at 100 chars ; `filter` ∈ actifs (default) / non-lus / archives, unknown → actifs
- `?format=csv` → text/csv; charset=utf-8 with UTF-8 BOM, Content-Disposition
  `attachment; filename="focusly-messages-YYYY-MM-DD.csv"`, ALL filtered rows (no pagination limit),
  format byte-compatible with the client-side `messagesToCsv()` from `@/lib/focusly/csv` (reused import)
- Search: `LOWER(col) LIKE pattern ESCAPE '\'` on name/email/subject(COALESCE)/message/reply(COALESCE) —
  ASCII-case-insensitive, **accent-sensitive** (documented honestly in code: "reponse" ≠ "réponse") ;
  user `%`, `_`, `\` escaped → literal search
- Implementation stays 100% raw SQL (`Prisma.sql` / `Prisma.join` / `Prisma.raw`) — consistent with the
  r9-a stale-Prisma-client decision ; `unread` typed count untouched (read/archived known to both client generations)

## Client (admin-view.tsx)
- `search` state debounced ~300 ms from the raw input (effect + timer cleanup) → `?q=` ; clear button resets instantly (race-safe)
- Load effect: search/filter change → page reset to 1 in the same commit (prevQueryRef) + lastFetchRef signature guard
  (single fetch verified when searching from page 2) + loadSeq guard (latest response wins)
- Chips now server-side ; `visible` memo + `fold()` removed (list = server page)
- CSV button → endpoint fetch (x-admin-key) → blob download named from Content-Disposition, Loader2 spinner,
  401 → gate, `total===0` → info toast without request
- `dropFromList()`: under a server filter, messages that stop matching leave the list optimistically
  (read under « non-lus », archive/restore, reply) + total-1 + last-item-of-page>1 → previous page
- Preserved: reply dialog + template + hint, Répondu badge, optimistic unread deltas with revert,
  delete/archive/read, page-clamp sync, logout reset (now also resets search + lastFetchRef)
- Empty states: « Aucun message ne correspond à votre recherche. » vs « Aucun message pour le moment. »
  / « Aucun message archivé. » / « Aucun message non lu. »

## Verification (all green)
- tsc: 0 errors in src/ (noise: examples/, skills/, parallel agent's analysis/r10-b scratch) ; eslint 0/0 on both files
- curl battery on 40 direct-DB-seeded rows (fresh PrismaClient process, distinct createdAt, accented FR text,
  one reply, one literal "50%"): page1=25 / page2=5 (30 actifs), page=99 → clamp, non-lus=12, archives=10,
  bogus filter → actifs, q case-insensitivity + accent-sensitivity (both directions), reply-column match,
  wildcard escaping, q+filter combined, 100-char cap, CSV BOM/headers/rows (30/10/1), 401 without key ;
  deleteMany → 0 rows, seed script deleted
- agent-browser #admin: debounce (no fetch while typing, one fetch after idle), search from page 2 → single
  page-1 fetch, chips 12/10/25, mark-as-read removes card + badge 12→11, reply dialog + Échap + full send
  (toast + badge), CSV click → 200 + success toast, empty states, sign-out/reset/re-unlock, 375 px overflow=0,
  `agent-browser errors` empty

## Notes / risks
- LIKE accent-sensitivity is now an explicit, documented product limitation (no accent-insensitive collation in SQLite)
- `total` semantic change (filtered count, was all rows) — admin UI is the only consumer, updated in step
- The single historical 500 in dev.log (« near "?" ») is r9-a's pre-Prisma.raw era, not this round
- Dev server not restarted (per rules) — raw SQL keeps everything working regardless of client generation
