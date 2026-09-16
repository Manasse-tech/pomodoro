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
        <p
          className="text-[88px] font-bold leading-none tracking-tight text-brand sm:text-[120px]"
          aria-hidden
        >
          404
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
          Page introuvable
        </h1>
        <p className="mt-3 max-w-[520px] text-[17px] text-muted-foreground">
          La page que vous cherchez n’existe pas ou a été déplacée. Vérifiez
          l’adresse, ou revenez à l’accueil pour retrouver vos outils et vos
          articles.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="#accueil">
              <ArrowLeft aria-hidden />
              Retour à l’accueil
            </Link>
          </Button>
          <Button variant="secondary" asChild>
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
