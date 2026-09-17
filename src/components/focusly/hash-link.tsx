"use client";

import type { AnchorHTMLAttributes } from "react";

type HashLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

/**
 * Native anchor for same-document hash routes.
 *
 * WHY NOT next/link: Focusly's router IS the URL hash (see
 * lib/focusly/router.ts — location.hash + "hashchange"). Next's <Link>
 * intercepts anchor clicks and performs a soft navigation via
 * history.pushState, which updates the URL but does NOT fire
 * "hashchange" — the router is never notified, the view never switches
 * and every nav link appears dead (audit r12-b). A plain <a href="#…">
 * lets the browser do the same-document navigation natively: hashchange
 * fires, the router reacts, middle-click/new-tab keep working.
 *
 * Anchor semantics are preserved (href, keyboard, screen readers); any
 * onClick passed by callers runs WITHOUT preventDefault, so the native
 * hash navigation still happens (e.g. the header closes the mobile menu
 * on link click and the router then switches the view).
 */
export function HashLink({ href, ...rest }: HashLinkProps) {
  return <a href={href} {...rest} />;
}
