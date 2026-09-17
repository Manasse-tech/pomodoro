"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { HelpDialog } from "./tools/help-dialog";
import { CommandPalette } from "./tools/command-palette";
import { ConsentBanner } from "./tools/consent-banner";
import { SettingsDialog } from "./tools/settings-dialog";
import { OutilsView } from "./tools/outils-view";
import { AdminView } from "./admin-view";
import { AccueilView } from "./content/accueil-view";
import { GuideView } from "./content/guide-view";
import { StatistiquesView } from "./content/statistiques-view";
import { BlogView } from "./content/blog-view";
import { BlogArticleView } from "./content/blog-article-view";
import { AProposView } from "./content/a-propos-view";
import { ContactView } from "./content/contact-view";
import {
  ConditionsView,
  ConfidentialiteView,
  MentionsLegalesView,
  PlanDuSiteView,
} from "./content/legal-views";
import { NotFoundView } from "./content/not-found-view";
import { playEndSound, notify, playCountdownTick, vibrateDevice } from "@/lib/focusly/chime";
import { useFocusly } from "@/lib/focusly/store";
import { useHashRoute, titleFor } from "@/lib/focusly/router";
import { todayKey, MODE_LABELS, formatTime } from "@/lib/focusly/types";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Focusly",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  description:
    "Minuteur Pomodoro gratuit, gestionnaire de tâches, notes et guides sur la concentration.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  inLanguage: "fr-FR",
};

/* ------------------------------------------------------------------ *
 * PWA — service worker update + install prompt (module scope = one
 * lifetime per page load; the flags below reset naturally on reload).
 * ------------------------------------------------------------------ */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/** True when an old service worker already controlled the page when this
 * bundle evaluated. The very first `controllerchange` after a cold start
 * (no prior controller → first worker claims the page) must NEVER reload. */
let swHadControllerAtLoad = false;
/** Ensures the update reload happens at most once per page load. */
let swUpdateReloaded = false;
/** One-shot captured install prompt (consumed by prompt()). */
let deferredInstall: BeforeInstallPromptEvent | null = null;
/** Dedupes the “Focusly a été installée.” toast (userChoice + appinstalled). */
let installAnnounced = false;

if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  swHadControllerAtLoad = Boolean(navigator.serviceWorker.controller);
}

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true
  );
}

function CurrentView({ route }: { route: string }) {
  if (route === "accueil") return <AccueilView />;
  if (route === "outils") return <OutilsView />;
  if (route === "statistiques") return <StatistiquesView />;
  if (route === "guide") return <GuideView />;
  if (route === "blog") return <BlogView />;
  if (route.startsWith("blog/")) return <BlogArticleView slug={route.slice(5)} />;
  if (route === "a-propos") return <AProposView />;
  if (route === "contact") return <ContactView />;
  if (route === "confidentialite") return <ConfidentialiteView />;
  if (route === "conditions") return <ConditionsView />;
  if (route === "mentions-legales") return <MentionsLegalesView />;
  if (route === "plan-du-site") return <PlanDuSiteView />;
  if (route === "admin") return <AdminView />;
  return <NotFoundView />;
}

export function FocuslyApp() {
  const { route } = useHashRoute();
  const reduceMotion = useReducedMotion();
  const goalCelebrated = useRef(false);
  /** last second for which the countdown tick already fired */
  const lastCountdown = useRef(0);
  const theme = useFocusly((s) => s.theme);
  const mode = useFocusly((s) => s.mode);
  const running = useFocusly((s) => s.running);
  const timeLeft = useFocusly((s) => s.timeLeft);
  const settings = useFocusly((s) => s.settings);
  const setSettingsOpen = useFocusly((s) => s.setSettingsOpen);
  const setHelpOpen = useFocusly((s) => s.setHelpOpen);
  const setNavOpen = useFocusly((s) => s.setNavOpen);

  /* Theme + timer mode reflected on the document */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.body.setAttribute("data-mode", mode);
  }, [mode]);

  /* Ticker: advances the countdown while running */
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const ev = useFocusly.getState().tick();
      if (ev === "completed") {
        const s = useFocusly.getState();
        const finished = s.history[s.history.length - 1];
        const nextMode = s.mode;
        if (s.settings.sound) playEndSound(s.settings.soundKind, s.settings.volume);
        vibrateDevice(s.settings.vibrate);
        if (s.settings.notifications) {
          notify(
            nextMode === "focus"
              ? "Session terminée. On reprend ?"
              : "Session terminée. Pause bien méritée !",
          );
        }
        const finishedWasFocus = finished?.mode === "focus";
        toast.success(
          finishedWasFocus
            ? `Pomodoro terminé ! Prochaine étape : ${MODE_LABELS[nextMode].toLowerCase()}.`
            : `Pause terminée. C'est reparti pour ${MODE_LABELS[nextMode].toLowerCase()} !`,
          {
            description:
              MODE_LABELS[nextMode] + " · " + Math.round(s.settings[nextMode]) + " min",
          },
        );
        if (
          finishedWasFocus &&
          !goalCelebrated.current &&
          (s.daily[todayKey()]?.pomodoros ?? 0) >= s.settings.dailyGoal
        ) {
          goalCelebrated.current = true;
          if (s.settings.sound) playEndSound("carillon", s.settings.volume);
          toast.success("Objectif du jour atteint, bravo !", {
            description:
              s.settings.dailyGoal + " pomodoros accomplis. Chaque jour compte, à demain.",
            duration: 8000,
          });
        }
        if (s.settings.autoStart) {
          useFocusly.getState().startTimer();
        }
      } else {
        // Countdown ticks during the final 5 seconds (once per second)
        const st = useFocusly.getState();
        if (
          st.running &&
          st.settings.sound &&
          st.settings.tickLast &&
          st.timeLeft <= 5 &&
          st.timeLeft >= 1
        ) {
          if (lastCountdown.current !== st.timeLeft) {
            lastCountdown.current = st.timeLeft;
            playCountdownTick(st.settings.volume);
          }
        } else if (st.timeLeft > 5) {
          lastCountdown.current = 0;
        }
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  /* Live countdown in the tab title while a session runs */
  useEffect(() => {
    if (!running) return;
    document.title = `${formatTime(timeLeft)} · ${MODE_LABELS[mode]} — Focusly`;
  }, [running, timeLeft, mode, route]);

  /* Restore the route title when the timer is idle (pause, reset, completion) */
  useEffect(() => {
    if (running) return;
    document.title = titleFor(route);
  }, [running, route]);

  /* App badge (installed PWA, Chromium): number of pomodoros done today */
  const pomodorosToday = useFocusly((s) => s.daily[todayKey()]?.pomodoros ?? 0);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (typeof nav.setAppBadge !== "function") return;
    if (pomodorosToday > 0) nav.setAppBadge(pomodorosToday).catch(() => {});
    else nav.clearAppBadge?.().catch(() => {});
  }, [pomodorosToday]);

  /* Catch up when the tab becomes visible again */
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && useFocusly.getState().running) useFocusly.getState().tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  /* Register the service worker for offline support (PWA) + update flow.
   * Registration stays delayed (1.5 s) and never blocks first paint. A new
   * worker installs and WAITS (no auto skipWaiting in sw.js); when it reaches
   * “installed” while a controller already exists, it IS an update for this
   * page → French toast with a “Recharger” action → SKIP_WAITING → reload once
   * on controllerchange (cold-start first claim is guarded by swHadControllerAtLoad).
   *
   * v5 upgrade note (audit 2026-09-17): sw.js v4 cached Turbopack dev chunks
   * + the HTML shell, so a transient network failure served a stale tree
   * (hydration useId mismatch) mixed with fresh bundles → every click dead.
   * Recovery: sw.js v5 skipWaitings itself when legacy caches exist and this
   * effect ALSO purges them from the page side, so even the first visit after
   * the upgrade heals without user action. */
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const secure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!secure) return;

    // Defense in depth: drop every cache left by an older focusly worker
    // (focusly-v4-shell/-runtime/-immutable…). v5's activate does the same,
    // but this runs even before the new worker finishes installing.
    if ("caches" in window) {
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((k) => k.startsWith("focusly-") && !k.startsWith("focusly-v5"))
              .map((k) => caches.delete(k)),
          ),
        )
        .catch(() => {
          /* storage unavailable — ignore */
        });
    }

    const onControllerChange = () => {
      if (swHadControllerAtLoad && !swUpdateReloaded) {
        swUpdateReloaded = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const announceWaitingUpdate = (reg: ServiceWorkerRegistration) => {
      if (swUpdateReloaded) return;
      const waiting = reg.waiting;
      // A waiting worker + an existing controller = a real update for this page
      // (not a first install — on a cold start the controller is still null).
      if (!waiting || !navigator.serviceWorker.controller) return;
      toast("Nouvelle version disponible.", {
        id: "focusly-sw-update",
        duration: 12000,
        action: {
          label: "Recharger",
          onClick: () => {
            reg.waiting?.postMessage({ action: "SKIP_WAITING" });
          },
        },
      });
    };

    const id = window.setTimeout(() => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Update already waiting from a previous visit → announce right away.
          announceWaitingUpdate(reg);
          reg.addEventListener("updatefound", () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              if (installing.state === "installed") announceWaitingUpdate(reg);
            });
          });
        })
        .catch(() => {
          /* offline support unavailable — ignore */
        });
    }, 1500);

    return () => {
      window.clearTimeout(id);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  /* PWA install: capture beforeinstallprompt (prevents Chrome's own banner) and
   * mirror availability to the header through window events — the same
   * lightweight channel as the existing "focusly:open-command" event (no store,
   * no new file). The deferred prompt itself stays module-scoped here and is
   * consumed via the onInstallClick prop handed to SiteHeader. */
  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      // Already installed / running standalone → never offer the install button.
      if (isStandaloneDisplay()) return;
      deferredInstall = e as BeforeInstallPromptEvent;
      window.dispatchEvent(new CustomEvent("focusly:install-available"));
    };
    const onInstalled = () => {
      deferredInstall = null;
      window.dispatchEvent(new CustomEvent("focusly:install-hidden"));
      if (!installAnnounced) {
        installAnnounced = true;
        toast.success("Focusly a été installée.", {
          description: "Elle est disponible sur votre écran d'accueil.",
        });
      }
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstallClick = () => {
    const ev = deferredInstall;
    if (!ev) return;
    deferredInstall = null; // the captured event is one-shot → hide the button
    window.dispatchEvent(new CustomEvent("focusly:install-hidden"));
    ev
      .prompt()
      .then(() => ev.userChoice)
      .then((choice) => {
        if (choice.outcome === "accepted" && !installAnnounced) {
          installAnnounced = true;
          toast.success("Focusly a été installée.", {
            description: "Elle est disponible sur votre écran d'accueil.",
          });
        }
      })
      .catch(() => {
        /* install prompt unavailable or dismissed — ignore */
      });
  };

  /* Keyboard shortcuts (disabled while typing or when a dialog is open) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useFocusly.getState();
      if (e.key === "Escape") {
        if (st.settingsOpen || st.helpOpen || st.navOpen) {
          st.setSettingsOpen(false);
          st.setHelpOpen(false);
          st.setNavOpen(false);
        }
        return;
      }
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.tagName === "BUTTON" ||
          t.isContentEditable)
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (st.running) st.pauseTimer();
          else st.startTimer();
          break;
        case "r":
        case "R":
          e.preventDefault();
          st.resetTimer();
          break;
        case "s":
        case "S":
          e.preventDefault();
          st.skipMode();
          break;
        case ",":
          e.preventDefault();
          st.setSettingsOpen(true);
          break;
        case "t":
        case "T":
          e.preventDefault();
          st.toggleTheme();
          break;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* Warn before leaving while a focus session runs (same UX as original) */
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (useFocusly.getState().running) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          // "#main" is an element id, NOT a hash route: a native navigation
          // would push "#main" into the hash router and render the 404 view.
          // Standard skip-link pattern: focus the main landmark instead.
          e.preventDefault();
          const el = document.getElementById("main");
          if (!el) return;
          el.scrollIntoView({ block: "start" });
          el.focus({ preventScroll: true });
        }}
      >
        Aller au contenu principal
      </a>
      <SiteHeader
        route={route}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        onInstallClick={handleInstallClick}
      />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <motion.div
          key={route}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <CurrentView route={route} />
        </motion.div>
      </main>
      <SiteFooter />
      <SettingsDialog />
      <HelpDialog />
      <CommandPalette />
      <ConsentBanner />
      {route === "accueil" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      )}
    </div>
  );
}
