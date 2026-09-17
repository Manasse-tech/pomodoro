"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { HelpDialog } from "./tools/help-dialog";
import { CommandPalette } from "./tools/command-palette";
import { SettingsDialog } from "./tools/settings-dialog";
import { OutilsView } from "./tools/outils-view";
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

  /* Catch up when the tab becomes visible again */
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && useFocusly.getState().running) useFocusly.getState().tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  /* Register the service worker for offline support (PWA) */
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const secure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!secure) return;
    const id = window.setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support unavailable — ignore */
      });
    }, 1500);
    return () => window.clearTimeout(id);
  }, []);

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
      <a href="#main" className="skip-link">
        Aller au contenu principal
      </a>
      <SiteHeader
        route={route}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />
      <main id="main" className="flex-1">
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
      {route === "accueil" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      )}
    </div>
  );
}
