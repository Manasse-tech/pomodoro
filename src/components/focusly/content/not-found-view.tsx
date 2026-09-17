"use client";

import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Shared 404 UI. Used by the top-level NotFoundView and reused inside
 * BlogArticleView when a slug does not match any article.
 */
export function NotView() {
  return (
    <div className="mx-auto w-full max-w-[920px] px-5 py-8 sm:py-10">
      <div className="flex flex-col items-center py-16 text-center sm:py-24">
        {/* Round 11 editorial pass: entrance cascade via .fade-up-soft
            (fill: backwards — composes safely with the .press hover/active
            transforms on the actions below) and the round-8 brand-gradient
            treatment on the display-size « 404 », mirroring the accueil hero. */}
        <p
          aria-hidden
          className="fade-up-soft brand-gradient-text text-[88px] font-bold leading-none tracking-tight [text-shadow:0_2px_20px_var(--brand-glow)] sm:text-[120px]"
        >
          404
        </p>
        <h1 className="fade-up-soft fade-up-1 mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
          Page introuvable
        </h1>
        <div
          aria-hidden
          className="fade-up-soft fade-up-2 mt-5 h-0.5 w-14 rounded-full bg-brand/40"
        />
        <p className="fade-up-soft fade-up-2 mt-6 max-w-[520px] text-[17px] text-muted-foreground">
          La page que vous cherchez n’existe pas ou a été déplacée. Vérifiez
          l’adresse, ou revenez à l’accueil pour retrouver vos outils et vos
          articles.
        </p>
        <div className="fade-up-soft fade-up-3 mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="press">
            <Link href="#accueil">
              <ArrowLeft aria-hidden />
              Retour à l’accueil
            </Link>
          </Button>
          <Button variant="secondary" asChild className="press">
            <Link href="#plan-du-site">
              <Map aria-hidden />
              Plan du site
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NotFoundView() {
  return <NotView />;
}
