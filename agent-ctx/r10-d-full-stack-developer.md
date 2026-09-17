# Task ID: r10-d — full-stack-developer — PWA round 10 (SW update toast + install button)

## Scope owned
- `public/sw.js`
- `src/components/focusly/focusly-app.tsx` (root client component — surgical, additive changes only)
- `src/components/focusly/site-header.tsx` (install button)

Explicitly NOT touched: layout.tsx, globals.css, views, admin/api routes, stats/tasks/notes panels, types.ts, store.ts. No new files created.

## What was implemented

### 1. Service worker update flow (`public/sw.js`)
- `VERSION` bumped `"focusly-v3"` → `"focusly-v4"` (activation cleanup provably ran: v5/v4 swaps deleted non-matching cache keys — verified E2E).
- REMOVED automatic `self.skipWaiting()` from `install`. The new worker installs and WAITS.
- Added `self.addEventListener("message", ...)` → `{ action: "SKIP_WAITING" }` → `self.skipWaiting()`.
- Activate cleanup + clients.claim + all caching strategies unchanged.

### 2. Update toast (`focusly-app.tsx`)
- Module-scope flags: `swHadControllerAtLoad` (captured at bundle eval, SSR-guarded), `swUpdateReloaded`, plus install-prompt state.
- Registration effect (still delayed 1.5 s, never blocks first paint, listeners removed in cleanup):
  - `announceWaitingUpdate(reg)`: fires ONLY when `reg.waiting` exists AND `navigator.serviceWorker.controller` exists (real update, not first install). Covers both the "already waiting from a previous visit" path and updatefound → statechange "installed".
  - Toast (sonner, the app's system): `toast("Nouvelle version disponible.", { id: "focusly-sw-update", duration: 12000, action: { label: "Recharger", onClick: () => reg.waiting?.postMessage({ action: "SKIP_WAITING" }) } })` — dismissible, fixed id dedupes, re-announces on next load if ignored.
  - `controllerchange` → `window.location.reload()` ONCE: guarded by `swHadControllerAtLoad` (cold-start first claim never reloads) + `swUpdateReloaded` (max one reload per page load).

### 3. Install button (`focusly-app.tsx` + `site-header.tsx`)
- `beforeinstallprompt` captured in focusly-app (preventDefault; ignored if standalone — `display-mode: standalone` or `navigator.standalone`). Deferred event is module-scoped in focusly-app.
- Signal to header WITHOUT the store: window CustomEvents `focusly:install-available` / `focusly:install-hidden` — deliberately mirrors the existing `focusly:open-command` pattern (command-palette.tsx already listens this way). Click action flows through the `onInstallClick` prop (`handleInstallClick`): one-shot `prompt()` → `userChoice` → accepted ⇒ `toast.success("Focusly a été installée.", { description: "Elle est disponible sur votre écran d'accueil." })`; button always hidden after click (event consumed). `appinstalled` ⇒ hide + same toast, deduped via `installAnnounced` (userChoice + appinstalled never double-fire).
- Header button: between Help and the mobile Menu toggle (hamburger stays right-anchored; last icon on desktop), variant/size/classes IDENTICAL to sibling icon buttons (`outline`, `icon`, `size-10 rounded-xl` + before hit-area), lucide `Download` `size-[18px]`, aria-label + title "Installer l'application". No reserved space; renders `null` until signalled (no hydration mismatch).

## Verification (all green)
- `bunx tsc --noEmit` → 0 errors in src/ (only pre-existing examples/+skills/ noise). `bunx eslint` on the 2 TSX files → 0/0. dev.log clean (✓ Compiled, GET / 200).
- agent-browser (isolated session r10d): registration resolves (scope "/", active, controller true after first load); cold-start claim did NOT reload (navigation type stayed "navigate"); errors empty at every step.
- E2E update flow (sw.js temporarily bumped to focusly-v5, reverted right after): toast appeared ~1.5 s after load with "Recharger"; click → exactly ONE reload (perf navigation type "reload", timeOrigin stable afterwards — no loop); activation cleanup deleted the previous version's cache keys; full cycle replayed after revert → final `caches.keys()` = `["focusly-v4-shell","focusly-v4-immutable","focusly-v4-runtime"]`, no waiting worker.
- Shell cache contains exactly `/`, `/offline.html`, `/manifest.webmanifest`, `/icon-192.png`, `/icon-512.png`. Offline reload boots the app from the shell.
- Install button hidden headless (correct — beforeinstallprompt doesn't fire headless). Signal path simulated via the CustomEvents: button appears/disappears, header height unchanged (65 px) and scrollWidth 375 at 375×667 — no layout jump/overflow. Screenshot: `analysis/r10-install-button-375.png`.

## Decisions / risks for the next agent
- Do NOT reintroduce `skipWaiting()` in sw.js install — the toast flow depends on the waiting worker + message handshake.
- A tab that announced the update reloads when ANY tab accepts it (standard takeover); the timer survives reloads (r9-fix-1 lastTick fix).
- The temporary focusly-v5 bump was live ~3 min during QA and could have flashed the update toast in other open sessions; final state verified back to focusly-v4.
- Real install-prompt behaviour (native dialog, standalone detection) needs a real Chrome/Android + iOS Safari pass; headless covered signal path, layout and cold-start guard only.
