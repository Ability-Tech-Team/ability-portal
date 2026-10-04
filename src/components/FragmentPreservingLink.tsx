"use client";

import { useSyncExternalStore, type AnchorHTMLAttributes } from "react";

type FragmentPreservingLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/**
 * A plain link that carries the current URL fragment along, such as the
 * token of a set-password link when switching languages. Only the browser
 * knows the fragment, so it is added after hydration.
 */
export default function FragmentPreservingLink({
  href,
  ...anchorProps
}: FragmentPreservingLinkProps) {
  const hash = useSyncExternalStore(
    subscribeToHash,
    () => window.location.hash,
    () => "",
  );

  return <a {...anchorProps} href={`${href}${hash}`} />;
}
