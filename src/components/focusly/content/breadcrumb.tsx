"use client";

import { HashLink } from "../hash-link";
import { Fragment } from "react";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-4 text-[13px] text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3 text-faint" aria-hidden />}
            {c.href ? (
              <HashLink
                href={`#${c.href}`}
                className="transition-colors hover:text-foreground"
              >
                {c.label}
              </HashLink>
            ) : (
              <span aria-current="page">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
