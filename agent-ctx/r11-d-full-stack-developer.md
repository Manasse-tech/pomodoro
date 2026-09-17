# Task ID: r11-d — Mode zen (fullscreen distraction-free timer overlay)

Agent: full-stack-developer
Date (sandbox): 2026-09-17
Session: agent-browser `--session r11d` (isolated; default session untouched)

## What was delivered

1. **src/components/focusly/tools/zen-mode.tsx (NEW)** — fullscreen overlay:
   - Plain fixed layer `z-[70]` (above header z-50 / article progress z-60), `role="dialog"` `aria-modal="true"` `aria-label="Mode zen"`, NOT a shadcn Dialog (avoids nested-dialog quirks + renders `null` when closed with hooks in a stable order).
   - Content: mode label (MODE_LABELS), giant time (`.time-display text-7xl sm:text-8xl lg:text-9xl`), thin progress line `scaleX(1 − timeLeft/duration)` inline per tick (no transition → reduced-motion safe), hint line (running → « Session en cours… » else MODE_HINTS), controls: contextual toggle Démarrer/Reprendre/Pause (timer-card vocabulary), Réinitialiser, Passer au mode suivant, prominent « Quitter le mode zen » top-right (X icon + label). All touch targets h-11 (44 px). Brand = `bg-brand` + inline `color-mix(var(--brand))` radial tint; Tailwind only, zero new CSS classes.
   - Store sync via `useFocusly` selectors (mode/running/timeLeft/settings) — same source as timer-card; tick loop/chime/notification/auto-start remain store/focusly-app-owned.
   - Scroll lock: inline `overflow:hidden` on documentElement+body, previous inline values restored on close/unmount.
   - Keyboard: Escape closes; Tab trapped inside overlay; initial focus on Quitter; **Ctrl/Cmd+K closes zen** (palette must never open beneath the overlay); focus returned to trigger by outils-view on close.
   - Extra coordination (read-only store subscribe): zen closes itself when settingsOpen/helpOpen/navOpen flips true, and on `focusly:open-command` (header palette button) — prevents any invisible second modal layer.
   - Fullscreen API: `document.documentElement.requestFullscreen()` on open in try/catch + `.catch()` (silent; never blocks); exit on close ONLY if we initiated (weWentFullscreen flag + fullscreenchange tracking, cleared if user exits manually).
   - document.title: NEVER written here — owner is focusly-app.tsx (running → `${formatTime(timeLeft)} · ${MODE_LABELS[mode]} — Focusly` via effect [running, timeLeft, mode, route]; idle → route title). Verified live: title counted down while running inside zen, restored on pause.

2. **outils-view.tsx** — minimal integration: « Mode zen » trigger (Maximize2 ghost icon button in the h1 header row, `aria-label="Activer le mode zen"`, `title="Mode zen (plein écran)"`), `<ZenMode open={zenOpen} onClose={closeZen} />` at view root, view-local `useState` (NOT the store), window listener for `focusly:toggle-zen`, focus return to trigger via ref on close.

3. **command-palette.tsx** — ADDITIVE command « Mode zen » (Maximize2) at the end of the Minuteur group: dispatches `window CustomEvent("focusly:toggle-zen")`; if the current route isn't outils it navigates first and dispatches after 200 ms (outils-view must be mounted to listen). Mirrors the `focusly:open-command` window-event pattern.

## QA highlights (all PASS, `agent-browser errors` = 0 throughout)
- Open via trigger: overlay renders, aria correct, time matches card, overflow hidden, focus on Quitter, fullscreen=true (headless granted it).
- Wheel scroll blocked; inline overflow restored after close; fullscreen exited on close.
- Démarrer in zen → countdown sampled twice (24:58→24:56) + document.title counting down; Pause freezes (title back to route title); Reprendre label correct; Réinitialiser → 25:00; Passer → Pause courte 05:00.
- Ctrl+K while zen open → zen closes itself, palette visible above nothing; palette item « Mode zen » → zen opens (also verified cross-route from #accueil: navigates to #outils then opens).
- Escape: windowed → closes immediately; in NATIVE FULLSCREEN the first Escape is consumed by the browser (exits fullscreen only), second Escape closes zen — standard native behavior, documented.
- 1-min session to completion inside zen (focus=1 set via the settings dialog UI): pomodoros 2→3, history 2→3, cycle 0→1, next mode short, zen shows the next state, no console errors. Canonical state then restored via localStorage and verified after reload (daily 2/120/0, history 2, focus 25, dark).
- Mobile 375×667: scrollWidth===375, Quitter 199×44, toggle 168×44 (bottom 461 < 667), screenshots `analysis/r11-zen-mode.png` (desktop dark) + `analysis/r11-zen-mobile.png`, both VLM-reviewed clean.
- `bunx tsc --noEmit` → 0 errors in src/; `bunx eslint` on the 3 files → 0/0; dev.log ✓ Compiled only.

## Notes for the next agents
- A transient tsc error in `src/app/api/contact/route.ts` (buildSearchValue) seen mid-round belonged to a parallel agent's in-progress edit; resolved before my final check. Do not confuse ownership.
- PRE-EXISTING observation (out of scope, store.ts read-only this round): focusSeconds accrual inflates ~+10–20 % because `tick()` rounds each ~0.25 s delta to 0.1 s with Math.round half-up (0.25→0.3 per tick). Any running session accrues this way (timer-card included). Candidate fix in a future store round.
- shadcn `Button` accepts `ref` here because React 19 passes ref as a regular prop — used for the trigger + Quitter focus management.
