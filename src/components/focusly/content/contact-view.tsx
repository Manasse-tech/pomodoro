"use client";

import { useCallback, useState } from "react";
import { Bug, Check, Copy, HelpCircle, Lightbulb, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/focusly/content/breadcrumb";
import { SITE_INFO } from "@/lib/focusly/site-config";

/* ------------------------------------------------------------------ */
/* Vue Contact — email direct UNIQUEMENT (r12-j)                       */
/*                                                                     */
/* Le formulaire (nom/email/message stockés en base) a été retiré à   */
/* la demande de l'éditeur : le contact passe désormais exclusivement  */
/* par un email envoyé depuis la messagerie du visiteur vers           */
/* SITE_INFO.contactEmail — aucun stockage côté serveur.               */
/* L'adresse vient de site-config.ts : un seul endroit à modifier.     */
/* ------------------------------------------------------------------ */

const SUBJECT = encodeURIComponent("Contact Focusly");

const TOPICS = [
  {
    icon: Bug,
    text: "Signaler un bug ou un comportement étrange (dites-nous sur quel appareil !)",
  },
  {
    icon: Lightbulb,
    text: "Proposer une idée d'amélioration pour le minuteur, les tâches ou les statistiques",
  },
  {
    icon: HelpCircle,
    text: "Poser une question sur la méthode Pomodoro ou sur vos données",
  },
] as const;

export function ContactView() {
  const [copied, setCopied] = useState(false);

  const mailtoHref = `mailto:${SITE_INFO.contactEmail}?subject=${SUBJECT}`;

  const copyEmail = useCallback(async () => {
    // 1) API moderne (contexte sécurisé) ; 2) repli universel execCommand
    //    (vieilles navigations / permissions clipboard refusées).
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SITE_INFO.contactEmail);
      } else {
        throw new Error("clipboard API indisponible");
      }
    } catch {
      try {
        const helper = document.createElement("textarea");
        helper.value = SITE_INFO.contactEmail;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        document.body.removeChild(helper);
      } catch {
        toast.error(
          "Impossible de copier — sélectionnez l'adresse manuellement.",
        );
        return;
      }
    }
    setCopied(true);
    toast.success("Adresse email copiée !");
    window.setTimeout(() => setCopied(false), 2500);
  }, []);

  return (
    <div className="mx-auto w-full max-w-[920px] px-5 py-8 sm:py-10">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "accueil" },
          { label: "Contact" },
        ]}
      />

      <h1 className="fade-up text-3xl font-bold tracking-tight sm:text-4xl">Contact</h1>
      <p className="fade-up fade-up-1 mt-3 text-soft">
        Une question, une suggestion ou un retour ? Écrivez-nous directement par
        email — votre message arrive dans notre boîte de réception, sans
        intermédiaire.
      </p>
      <p className="fade-up fade-up-1 mt-1 text-[13px] text-faint">
        Nous répondons généralement sous 48 heures (jours ouvrés).
      </p>

      {/* Carte principale — email direct (canal unique) */}
      <section
        aria-labelledby="contact-email-title"
        className="fade-up fade-up-2 mt-8 max-w-[560px] rounded-2xl border bg-card p-6 sm:p-8"
      >
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"
            aria-hidden
          >
            <Mail className="size-5" />
          </span>
          <h2 id="contact-email-title" className="text-lg font-semibold tracking-tight">
            Par email direct
          </h2>
        </div>

        <a
          href={mailtoHref}
          className="press mt-5 block break-all text-xl font-semibold text-brand hover:underline sm:text-2xl"
        >
          {SITE_INFO.contactEmail}
        </a>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="press min-h-[44px] flex-1 rounded-xl font-semibold"
          >
            <a href={mailtoHref}>
              <Mail className="size-4" aria-hidden />
              Écrire un email
            </a>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={copyEmail}
            className="press min-h-[44px] rounded-xl"
          >
            {copied ? (
              <Check className="size-4 text-brand" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
            Copier l&apos;adresse
          </Button>
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-faint">
          Le bouton ouvre votre application de messagerie habituelle : vous
          gardez une copie de vos échanges, et rien n&apos;est stocké sur le
          site.
        </p>
      </section>

      {/* Aide — quoi écrire */}
      <section
        aria-labelledby="contact-topics-title"
        className="fade-up fade-up-3 mt-6 max-w-[560px] rounded-2xl border bg-card p-6"
      >
        <h2 id="contact-topics-title" className="text-base font-semibold tracking-tight">
          Que pouvez-vous nous écrire ?
        </h2>
        <ul className="mt-4 space-y-3.5 text-sm leading-relaxed text-soft">
          {TOPICS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand"
                aria-hidden
              >
                <Icon className="size-4" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
