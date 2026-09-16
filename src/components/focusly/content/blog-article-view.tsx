"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BLOG_POSTS } from "@/lib/focusly/blog";
import { frDate } from "@/lib/focusly/types";
import { ArticleBlocks } from "./article-blocks";
import { Breadcrumb } from "./breadcrumb";
import { NotView } from "./not-found-view";

const NAV_CARD_CLASS =
  "group block rounded-2xl border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-input hover:shadow-lg hover:shadow-black/10";

/** Shorten long titles for the breadcrumb trail. */
function truncate(text: string, max = 34): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export function BlogArticleView({ slug }: { slug: string }) {
  const index = BLOG_POSTS.findIndex((p) => p.slug === slug);
  if (index === -1) return <NotView />;

  const post = BLOG_POSTS[index];
  const prev = index > 0 ? BLOG_POSTS[index - 1] : undefined;
  const next = index < BLOG_POSTS.length - 1 ? BLOG_POSTS[index + 1] : undefined;

  return (
    <div className="mx-auto w-full max-w-[920px] px-5 py-8 sm:py-10">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "accueil" },
          { label: "Blog", href: "blog" },
          { label: truncate(post.title) },
        ]}
      />
      <article className="max-w-[720px]">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <Badge
            variant="secondary"
            className="text-[11px] font-bold uppercase tracking-[0.08em] text-brand"
          >
            {post.tag}
          </Badge>
          <p className="text-[13px] text-faint">
            Publié le {frDate(post.date)} · Lecture ~{post.readMinutes} minutes
          </p>
        </div>
        <div className="mt-6">
          <ArticleBlocks blocks={post.content} />
        </div>
      </article>

      <nav
        aria-label="Navigation entre articles"
        className="mt-12 border-t pt-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {prev ? (
            <Link href={`#blog/${prev.slug}`} className={NAV_CARD_CLASS}>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                <ArrowLeft className="size-3.5" aria-hidden />
                Article précédent
              </span>
              <span className="mt-1 block text-[15px] font-semibold tracking-tight">
                {prev.title}
              </span>
              <span className="mt-1 block text-[12px] text-faint">
                ~{prev.readMinutes} min
              </span>
            </Link>
          ) : (
            <span className="hidden sm:block" aria-hidden />
          )}
          {next ? (
            <Link href={`#blog/${next.slug}`} className={NAV_CARD_CLASS}>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-faint">
                Article suivant
                <ArrowRight className="size-3.5" aria-hidden />
              </span>
              <span className="mt-1 block text-[15px] font-semibold tracking-tight">
                {next.title}
              </span>
              <span className="mt-1 block text-[12px] text-faint">
                ~{next.readMinutes} min
              </span>
            </Link>
          ) : (
            <span className="hidden sm:block" aria-hidden />
          )}
        </div>
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" asChild>
            <Link href="#blog">
              <ArrowLeft aria-hidden />
              Retour au blog
            </Link>
          </Button>
        </div>
      </nav>
    </div>
  );
}
