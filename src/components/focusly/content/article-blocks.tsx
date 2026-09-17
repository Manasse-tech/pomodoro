"use client";

import { HashLink } from "../hash-link";
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

/* ---------- Round 10: heading anchors (additive — ids only, no visual change) ---------- */

/**
 * Deterministic slug from a heading's text: Unicode NFD accent-folding
 * (É→E, ç→c…), œ→oe, lowercase, runs of non-alphanumerics collapsed to
 * single dashes, capped at 60 chars (trailing dash trimmed after the cut).
 * Locale-independent on purpose (no toLocaleLowerCase, fixed NFD tables):
 * server and client renders always agree. Empty result falls back to
 * "section" so an id is never blank.
 */
export function slugifyHeading(text: string): string {
  const slug = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/gi, "oe")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || "section";
}

/**
 * One deterministic id per h2/h3 block, assigned in document order;
 * colliding slugs get a numeric suffix (-2, -3…). Exported so a table of
 * contents can be derived from the SAME blocks array and get IDENTICAL ids
 * (blog-article-view.tsx builds its "Sommaire" with this). Returns an array
 * aligned with `blocks` — undefined entries for non-heading blocks.
 */
export function headingIds(blocks: Block[]): (string | undefined)[] {
  const seen = new Map<string, number>();
  return blocks.map((b) => {
    if (b.type !== "h2" && b.type !== "h3") return undefined;
    const base = slugifyHeading(b.text);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  });
}

export interface HeadingRef {
  id: string;
  level: 2 | 3;
  text: string;
}

/** h2/h3 blocks as TOC entries, with the exact ids ArticleBlocks renders. */
export function collectHeadings(blocks: Block[]): HeadingRef[] {
  const ids = headingIds(blocks);
  const out: HeadingRef[] = [];
  blocks.forEach((b, i) => {
    const id = ids[i];
    if (id === undefined) return;
    if (b.type === "h2" || b.type === "h3") {
      out.push({ id, level: b.type === "h2" ? 2 : 3, text: b.text });
    }
  });
  return out;
}

export function ArticleBlocks({ blocks }: { blocks: Block[] }) {
  // Pre-pass: stable ids for h2/h3 (same pass the TOC uses → always in sync).
  const ids = headingIds(blocks);
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2
                key={i}
                id={ids[i]}
                className="mt-9 mb-3 text-2xl font-semibold tracking-tight"
              >
                {b.text}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                id={ids[i]}
                className="mt-7 mb-2.5 text-lg font-semibold tracking-tight"
              >
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
                <HashLink
                  href={`#${b.href}`}
                  className="font-medium text-brand hover:underline"
                >
                  {b.label}
                </HashLink>
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
