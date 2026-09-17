"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumb } from "@/components/focusly/content/breadcrumb";

/* ------------------------------------------------------------------ */
/* Types & validation client                                           */
/* ------------------------------------------------------------------ */

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  consent: boolean;
  website: string; // honeypot : doit rester vide
}

type FieldErrors = Partial<Record<"name" | "email" | "subject" | "message" | "consent", string>>;

const INITIAL_FORM: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
  consent: false,
  website: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  const name = form.name.trim();
  if (name.length === 0) {
    errors.name = "Veuillez indiquer votre nom.";
  } else if (name.length < 2) {
    errors.name = "Le nom doit contenir au moins 2 caractères.";
  } else if (name.length > 100) {
    errors.name = "Le nom ne peut pas dépasser 100 caractères.";
  }

  const email = form.email.trim();
  if (email.length === 0) {
    errors.email = "Veuillez indiquer votre adresse email.";
  } else if (email.length > 200 || !EMAIL_RE.test(email)) {
    errors.email = "Veuillez saisir une adresse email valide.";
  }

  const subject = form.subject.trim();
  if (subject.length > 150) {
    errors.subject = "Le sujet ne peut pas dépasser 150 caractères.";
  }

  const message = form.message.trim();
  if (message.length === 0) {
    errors.message = "Veuillez écrire votre message.";
  } else if (message.length < 10) {
    errors.message = "Votre message doit contenir au moins 10 caractères.";
  } else if (message.length > 5000) {
    errors.message = "Votre message ne peut pas dépasser 5000 caractères.";
  }

  if (!form.consent) {
    errors.consent = "Veuillez cocher cette case pour continuer.";
  }

  return errors;
}

/* ------------------------------------------------------------------ */
/* Vue Contact                                                         */
/* ------------------------------------------------------------------ */

export function ContactView() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key as keyof FieldErrors];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submitting) return;

      const fieldErrors = validate(form);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return;
      }

      setSubmitting(true);
      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            subject: form.subject.trim(),
            message: form.message.trim(),
            consent: form.consent,
            website: form.website,
          }),
        });
        const data: { ok?: boolean; id?: string; error?: string } =
          await response.json().catch(() => ({}));

        if (response.ok && data.ok) {
          setForm(INITIAL_FORM);
          setErrors({});
          setSent(true);
          toast.success("Message envoyé ! Nous vous répondrons sous 48 h.");
        } else {
          toast.error(
            data.error ?? "Une erreur est survenue. Réessayez.",
          );
        }
      } catch {
        toast.error("Impossible de contacter le serveur. Vérifiez votre connexion.");
      } finally {
        setSubmitting(false);
      }
    },
    [form, submitting],
  );

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
        Une question, une suggestion ou un retour ? Écrivez-nous.
      </p>
      <p className="fade-up fade-up-1 mt-1 text-[13px] text-faint">
        Nous répondons généralement dans les 48 heures (jours ouvrés).
      </p>

      {sent ? (
        <section
          aria-live="polite"
          className="fade-up mt-10 flex max-w-[560px] flex-col items-start rounded-2xl border bg-card p-6 sm:p-8"
        >
          <CheckCircle2 className="size-12 text-brand" aria-hidden />
          <h2 className="mt-4 text-xl font-semibold tracking-tight">
            Message envoyé !
          </h2>
          <p className="mt-2 text-sm text-soft">
            Merci pour votre message. Notre équipe vous répondra sous 48 heures
            (jours ouvrés) à l&apos;adresse email que vous avez indiquée.
          </p>
          <Button
            type="button"
            variant="outline"
            className="press mt-6 min-h-[44px] rounded-xl"
            onClick={() => {
              setSent(false);
              setErrors({});
            }}
          >
            Envoyer un autre message
          </Button>
        </section>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="fade-up fade-up-2 mt-8 max-w-[560px] rounded-2xl border bg-card p-6 sm:p-8"
        >
          {/* Carte formulaire : même traitement que la carte de succès
              (rounded-2xl border bg-card) + entrée .fade-up (reduced-motion OK). */}
          {/* Honeypot anti-spam : invisible pour les humains */}
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <div className="space-y-5">
            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="contact-name">
                Votre nom{" "}
                <span className="text-brand" aria-hidden>
                  *
                </span>
                <span className="sr-only">(obligatoire)</span>
              </Label>
              <Input
                id="contact-name"
                name="name"
                type="text"
                placeholder="Ex. Camille Dupont"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "contact-name-error" : undefined}
                aria-required="true"
                autoComplete="name"
                maxLength={200}
                className="min-h-[44px] rounded-xl border bg-card"
              />
              {errors.name && (
                <p id="contact-name-error" className="text-sm text-destructive">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="contact-email">
                Votre email{" "}
                <span className="text-brand" aria-hidden>
                  *
                </span>
                <span className="sr-only">(obligatoire)</span>
              </Label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                placeholder="Ex. camille@exemple.fr"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "contact-email-error" : undefined}
                aria-required="true"
                autoComplete="email"
                maxLength={250}
                className="min-h-[44px] rounded-xl border bg-card"
              />
              {errors.email && (
                <p id="contact-email-error" className="text-sm text-destructive">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Sujet */}
            <div className="space-y-2">
              <Label htmlFor="contact-subject">Sujet</Label>
              <Input
                id="contact-subject"
                name="subject"
                type="text"
                placeholder="Ex. Suggestion pour le minuteur"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
                aria-invalid={Boolean(errors.subject)}
                aria-describedby={errors.subject ? "contact-subject-error" : undefined}
                maxLength={200}
                className="min-h-[44px] rounded-xl border bg-card"
              />
              {errors.subject && (
                <p id="contact-subject-error" className="text-sm text-destructive">
                  {errors.subject}
                </p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor="contact-message">
                  Votre message{" "}
                  <span className="text-brand" aria-hidden>
                    *
                  </span>
                  <span className="sr-only">(obligatoire)</span>
                </Label>
                <span className="tnum text-xs text-faint" aria-hidden>
                  {form.message.length}/5000
                </span>
              </div>
              <Textarea
                id="contact-message"
                name="message"
                placeholder="Décrivez votre demande en quelques lignes…"
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "contact-message-error" : undefined}
                aria-required="true"
                maxLength={5000}
                rows={6}
                className="min-h-[120px] rounded-xl border bg-card"
              />
              {errors.message && (
                <p id="contact-message-error" className="text-sm text-destructive">
                  {errors.message}
                </p>
              )}
            </div>

            {/* Consentement */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="contact-consent"
                  checked={form.consent}
                  onCheckedChange={(checked) => update("consent", checked === true)}
                  aria-invalid={Boolean(errors.consent)}
                  aria-describedby={errors.consent ? "contact-consent-error" : undefined}
                  aria-required="true"
                  className="mt-1 size-4.5"
                />
                <Label
                  htmlFor="contact-consent"
                  className="cursor-pointer text-sm font-normal leading-relaxed text-soft"
                >
                  J&apos;accepte que mes données soient utilisées pour traiter ma
                  demande.{" "}
                  <span className="text-brand" aria-hidden>
                    *
                  </span>
                  <span className="sr-only">(obligatoire)</span>
                </Label>
              </div>
              {errors.consent && (
                <p id="contact-consent-error" className="text-sm text-destructive">
                  {errors.consent}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="press mt-7 min-h-[44px] w-full rounded-xl font-semibold sm:w-auto sm:px-8"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Envoi…
              </>
            ) : (
              <>
                <Send className="size-4" aria-hidden />
                Envoyer le message
              </>
            )}
          </Button>
        </form>
      )}

      <p className="mt-6 text-[13px] text-faint">
        Ou par email direct : contact [arobase] focusly.example
      </p>
    </div>
  );
}
