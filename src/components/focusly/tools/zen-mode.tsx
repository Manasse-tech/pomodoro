"use client";

import { useEffect, useRef } from "react";
import { Pause, Play, RotateCcw, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFocusly } from "@/lib/focusly/store";
import { formatTime, MODE_HINTS, MODE_LABELS } from "@/lib/focusly/types";

/**
 * Mode zen — fullscreen, distraction-free timer overlay (round 11).
 *
 * A plain fixed layer (role="dialog") instead of a shadcn Dialog: it must sit
 * ABOVE the header (z-50) and the article progress bar (z-60) without any
 * nested-dialog quirks, and it renders nothing when closed (hooks stay in a
 * stable order). It subscribes to the same zustand store as TimerCard, so the
 * countdown, mode switches and session completions stay perfectly in sync —
 * the tick loop, sounds and stats belong to the store / focusly-app and are
 * untouched. document.title is owned by focusly-app: never written here.
 */
export function ZenMode({ open, onClose }: { open: boolean; onClose: () => void }) {
  const mode = useFocusly((s) => s.mode);
  const running = useFocusly((s) => s.running);
  const timeLeft = useFocusly((s) => s.timeLeft);
  const settings = useFocusly((s) => s.settings);
  const startTimer = useFocusly((s) => s.startTimer);
  const pauseTimer = useFocusly((s) => s.pauseTimer);
  const resetTimer = useFocusly((s) => s.resetTimer);
  const skipMode = useFocusly((s) => s.skipMode);

  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  /** True only when THIS overlay requested fullscreen — never exit someone else's. */
  const weWentFullscreen = useRef(false);

  /* Lock page scroll while open, restore the previous inline values on close */
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const body = document.body;
    const prevRoot = root.style.overflow;
    const prevBody = body.style.overflow;
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      root.style.overflow = prevRoot;
      body.style.overflow = prevBody;
    };
  }, [open]);

  /* Escape closes; Tab is trapped inside the overlay; initial focus on « Quitter » */
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      // Ctrl/Cmd+K opens the command palette — a second modal layer that
      // would render beneath this overlay: leave zen first (no
      // preventDefault, the palette's own handler still runs).
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        onClose();
        return;
      }
      if (e.key === "Tab" && rootRef.current) {
        const focusables = Array.from(
          rootRef.current.querySelectorAll<HTMLElement>("button:not([disabled])"),
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const inside = rootRef.current.contains(document.activeElement);
        if (!inside) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  /* The palette (Ctrl+K) is a second modal layer beneath this overlay: close
   * zen first so it is never opened invisibly. Same for settings/help/nav —
   * read-only store subscription, no store write. */
  useEffect(() => {
    if (!open) return;
    const onOpenCommand = () => onClose();
    window.addEventListener("focusly:open-command", onOpenCommand);
    const unsub = useFocusly.subscribe((s, prev) => {
      if ((s.settingsOpen || s.helpOpen || s.navOpen) && !(prev.settingsOpen || prev.helpOpen || prev.navOpen)) {
        onClose();
      }
    });
    return () => {
      window.removeEventListener("focusly:open-command", onOpenCommand);
      unsub();
    };
  }, [open, onClose]);

  /* Best-effort native fullscreen on open; exit on close ONLY if we asked.
   * Headless browsers / iOS may refuse — silently continue, never block. */
  useEffect(() => {
    if (!open) return;
    try {
      const el = document.documentElement;
      if (!document.fullscreenElement && typeof el.requestFullscreen === "function") {
        weWentFullscreen.current = true;
        el.requestFullscreen().catch(() => {
          weWentFullscreen.current = false;
        });
      }
    } catch {
      weWentFullscreen.current = false;
    }
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) weWentFullscreen.current = false;
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (weWentFullscreen.current && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      weWentFullscreen.current = false;
    };
  }, [open]);

  if (!open) return null;

  const total = Math.round(settings[mode]) * 60;
  const progress = total > 0 ? Math.min(1, Math.max(0, (total - timeLeft) / total)) : 0;
  const isPartial = timeLeft > 0 && timeLeft < total;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Mode zen"
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-y-auto bg-background px-5 py-16"
    >
      {/* Subtle brand radial tint over the app background (decorative) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 44% at 50% 40%, color-mix(in srgb, var(--brand) 9%, transparent), transparent 72%)",
        }}
      />

      <Button
        ref={closeRef}
        variant="ghost"
        onClick={onClose}
        aria-label="Quitter le mode zen"
        title="Quitter le mode zen (Échap)"
        className="press absolute right-4 top-4 z-10 h-11 gap-2 rounded-xl px-4 text-[13.5px] font-semibold text-muted-foreground hover:text-foreground sm:right-6 sm:top-6"
      >
        <X className="size-4" aria-hidden />
        Quitter le mode zen
      </Button>

      <div className="relative flex flex-col items-center gap-6 text-center sm:gap-7">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {MODE_LABELS[mode]}
        </div>

        <div
          role="timer"
          aria-live="polite"
          aria-atomic
          className="time-display text-7xl font-light leading-none sm:text-8xl lg:text-9xl"
        >
          {formatTime(timeLeft)}
        </div>

        {/* Thin progress line — scaleX per tick, no transition (reduced-motion safe) */}
        <div aria-hidden className="h-1 w-64 overflow-hidden rounded-full bg-secondary sm:w-80">
          <div
            className="h-full w-full origin-left rounded-full bg-brand"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>

        <p aria-live="polite" className="max-w-[420px] text-[13.5px] text-faint">
          {running ? "Session en cours…" : MODE_HINTS[mode]}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          <Button
            size="lg"
            className="h-11 min-w-[168px] rounded-2xl bg-brand text-[15px] font-semibold text-[#14161a] shadow-[0_12px_32px_-14px_var(--brand)] transition-transform hover:bg-brand hover:brightness-110 active:scale-[0.98]"
            onClick={running ? pauseTimer : startTimer}
          >
            {running ? (
              <>
                <Pause className="size-4" aria-hidden /> Pause
              </>
            ) : (
              <>
                <Play className="size-4" aria-hidden /> {isPartial ? "Reprendre" : "Démarrer"}
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="press h-11 w-11 px-0"
            onClick={resetTimer}
            aria-label="Réinitialiser le minuteur"
            title="Réinitialiser (R)"
          >
            <RotateCcw className="size-4" aria-hidden />
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="press h-11 w-11 px-0"
            onClick={skipMode}
            aria-label="Passer au mode suivant"
            title="Mode suivant (S)"
          >
            <SkipForward className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
