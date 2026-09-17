"use client";

import { useSyncExternalStore } from "react";
import { Cookie } from "lucide-react";

import { ADS_CONFIG } from "@/lib/focusly/ads-config";
import { useConsent } from "@/lib/focusly/consent";
import { HashLink } from "../hash-link";

/** Compliant mounted-detection (react-hooks/set-state-in-effect): the client
 * snapshot flips to true AFTER hydration, so the first render always matches
 * the server (no SSR mismatch from the persisted consent store). */
const emptySubscribe = () => () => {};
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * Bandeau de consentement (RGPD / préparation AdSense).
 *
 * Rendu conditionné à `ADS_CONFIG.enabled` : tant qu'aucun traceur n'est
 * intégré, rien ne s'affiche — l'app est 100 % locale, aucun consentement
 * n'est nécessaire. Le jour où AdSense est activé (enabled: true), le
 * bandeau apparaît avant tout chargement de script publicitaire et stocke
 * la décision dans `focusly.consent.v1`.
 *
 * Anti-mismatch SSR : rien n'est rendu avant le montage (`mounted`) — le
 * store persisté (localStorage) ne doit jamais influencer le premier rendu,
 * qui doit être identique au rendu serveur (leçon r12-a/r12-b).
 */
export function ConsentBanner() {
  const mounted = useMounted();

  const ads = useConsent((s) => s.ads);
  const open = useConsent((s) => s.open);
  const setConsent = useConsent((s) => s.setConsent);
  const setOpen = useConsent((s) => s.setOpen);

  if (!mounted || !ADS_CONFIG.enabled) return null;
  if (ads !== null && !open) return null;

  return (
    <div
      role="region"
      aria-label="Préférences de confidentialité"
      className="animate-in fade-in slide-in-from-bottom-4 fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-[560px] rounded-2xl border bg-[var(--card,background)] p-4 shadow-lg backdrop-blur-md sm:inset-x-auto sm:left-4 sm:right-auto"
      style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"
          aria-hidden
        >
          <Cookie className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Publicité et confidentialité</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-soft">
            Focusly peut afficher des annonces financant le service. Vous
            gardez le contrôle — détails dans notre{" "}
            <HashLink
              href={`#${ADS_CONFIG.policyRoute}`}
              className="font-medium text-brand hover:underline"
              onClick={() => setOpen(false)}
            >
              politique de confidentialité
            </HashLink>
            .
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setConsent({ ads: "granted", analytics: "granted" })}
              className="min-h-9 rounded-xl bg-brand px-4 text-[13px] font-semibold text-[color:var(--brand-contrast,#fff)] transition-opacity hover:opacity-90"
            >
              Tout accepter
            </button>
            <button
              type="button"
              onClick={() => setConsent({ ads: "denied", analytics: "denied" })}
              className="min-h-9 rounded-xl border px-4 text-[13px] font-medium transition-colors hover:bg-secondary"
            >
              Continuer sans publicité personnalisée
            </button>
            {open && ads !== null && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-9 rounded-xl px-3 text-[13px] text-soft transition-colors hover:text-foreground"
              >
                Fermer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
