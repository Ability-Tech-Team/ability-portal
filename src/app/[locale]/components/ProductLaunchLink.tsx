"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useProductLaunch } from "../hooks/useProductLaunch";

type ProductLaunchLinkProps = {
  href: string;
  hrefLang?: string;
  label: string;
  openingLabel: string;
};

/**
 * The product link. Its ::after overlay covers the whole card, so the card is
 * one large target while the link's name stays short; the card draws the
 * focus ring. The link itself must not be positioned or transformed (nor any
 * ancestor below the card), or the overlay would shrink to it; the pill
 * inside it may be, so it carries the gradient fill that fades in.
 */
export default function ProductLaunchLink({
  href,
  hrefLang,
  label,
  openingLabel,
}: ProductLaunchLinkProps) {
  const { isOpening, onClick } = useProductLaunch();

  return (
    <a
      href={href}
      hrefLang={hrefLang}
      onClick={onClick}
      data-opening={isOpening ? "" : undefined}
      className="inline-flex rounded-full after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-hidden"
    >
      <span className="relative isolate inline-flex items-center gap-2 overflow-hidden rounded-full bg-at-navy-800 px-5 py-2.5 font-display text-sm font-bold text-white shadow-sm transition-[color,box-shadow] duration-300 dark:bg-white dark:text-at-navy-900 card-active:text-on-product card-active:shadow-lg card-active:shadow-product/30">
        <span
          aria-hidden
          className="absolute inset-0 -z-10 bg-(image:--product-fill) opacity-0 transition-opacity duration-300 card-active:opacity-100"
        />
        {isOpening ? openingLabel : label}
        {isOpening ? (
          <LoaderCircle aria-hidden className="size-4 animate-spin" />
        ) : (
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-300 ease-out-soft rtl:-scale-x-100 motion-safe:ltr:card-active:translate-x-1 motion-safe:rtl:card-active:-translate-x-1"
          />
        )}
      </span>
    </a>
  );
}
