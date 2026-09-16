"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BLOG_POSTS } from "@/lib/focusly/blog";
import { Breadcrumb } from "./breadcrumb";

const CARD_CLASS =
  "group block rounded-2xl border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-input hover:shadow-lg hover:shadow-black/10";

export function BlogView() {
  return (
    <div className="mx-auto w-full max-w-[920px] px-5 py-8 sm:py-10">
      <Breadcrumb
        items={[{ label: "Accueil", href: "accueil" }, { label: "Blog" }]}
      />
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Le blog de Focusly
      </h1>
      <p className="mt-3 text-[17px] text-muted-foreground">
        Articles et guides sur la concentration, la productivité et la gestion
        du temps.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BLOG_POSTS.map((post) => (
          <Link
            key={post.slug}
            href={`#blog/${post.slug}`}
            className={CARD_CLASS}
          >
            <span className="mb-2 inline-block text-[11px] font-bold uppercase tracking-[0.08em] text-brand">
              {post.tag}
            </span>
            <h2 className="text-[17px] font-semibold tracking-tight">
              {post.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
            <ArrowRight
              className="mt-3 size-4 text-faint transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand"
              aria-hidden
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
