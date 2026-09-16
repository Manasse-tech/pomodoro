"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";

/**
 * Structured blocks used by the guide and blog articles.
 * Keeping content as data (instead of raw HTML) keeps rendering safe and typed.
 */
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "cta"; href: string; label: string };

export function ArticleBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2 key={i} className="mt-9 mb-3 text-2xl font-semibold tracking-tight">
                {b.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="mt-7 mb-2.5 text-lg font-semibold tracking-tight">
                {b.text}
              </h3>
            );
          case "p":
            return (
              <p key={i} className="mb-4 leading-relaxed text-soft">
                {inline(b.text)}
              </p>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="my-6 rounded-r-xl border-l-[3px] border-brand bg-brand/5 px-5 py-3.5 italic text-soft"
              >
                {inline(b.text)}
              </blockquote>
            );
          case "list": {
            const Tag = b.ordered ? "ol" : "ul";
            return (
              <Tag
                key={i}
                className={`mb-4 space-y-1.5 pl-6 text-soft ${
                  b.ordered ? "list-decimal" : "list-disc"
                }`}
              >
                {b.items.map((it, j) => (
                  <li key={j} className="leading-relaxed">
                    {inline(it)}
                  </li>
                ))}
              </Tag>
            );
          }
          case "cta":
            return (
              <p key={i} className="mt-8">
                <Link
                  href={`#${b.href}`}
                  className="font-medium text-brand hover:underline"
                >
                  {b.label}
                </Link>
              </p>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

/**
 * Minimal inline markdown: **bold** only (content authored with it).
 * Anything else is rendered verbatim, so no dangerouslySetInnerHTML.
 */
function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
}
