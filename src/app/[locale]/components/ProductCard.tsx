import { CircleAlert, LockKeyhole, type LucideIcon } from "lucide-react";
import type { ProductCardModel } from "../types";
import ProductCardSurface from "./ProductCardSurface";
import ProductLaunchLink from "./ProductLaunchLink";
import ProductPreview from "./ProductPreview";

type ProductCardProps = {
  card: ProductCardModel;
  icon: LucideIcon;
  name: string;
  description: string;
  openLabel: string;
  openingLabel: string;
  /** Why a card without a link can't be opened; null for available cards. */
  notice: { title: string; description: string } | null;
};

/** Locks are about the subscription; the other states are problems. */
const lockedStates: ReadonlySet<ProductCardModel["state"]> = new Set([
  "not-subscribed",
  "locked",
]);

const linkedCardClassName = [
  "relative isolate flex w-full flex-col overflow-hidden rounded-3xl p-3",
  "bg-white shadow-[0_24px_60px_-28px_rgb(0_33_68/0.35)] ring-1 ring-at-line/80 ring-inset dark:bg-at-navy-800 dark:shadow-black/40 dark:ring-white/10",
  "transition-[translate,transform,scale,box-shadow] duration-300 ease-out-soft",
  // Tilt toward a mouse pointer (CSS variables from useProductCardPointer).
  "motion-safe:pointer-fine:rotate-x-(--tilt-x) motion-safe:pointer-fine:rotate-y-(--tilt-y)",
  "card-active:shadow-2xl card-active:shadow-product/25 card-active:ring-product/45 motion-safe:card-active:-translate-y-1.5",
  "has-[a:active]:scale-[.985]",
  // The card shows the link's focus ring: overflow-hidden would clip it on
  // the link's full-card overlay.
  "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-product-ink",
].join(" ");

export default function ProductCard({
  card,
  icon: Icon,
  name,
  description,
  openLabel,
  openingLabel,
  notice,
}: ProductCardProps) {
  const titleId = `product-${card.key}-title`;

  if (card.state !== "available") {
    const locked = lockedStates.has(card.state);
    const NoticeIcon = locked ? LockKeyhole : CircleAlert;

    return (
      <article
        data-product={card.key}
        data-state={card.state}
        aria-labelledby={titleId}
        className="flex w-full cursor-default flex-col rounded-3xl border border-dashed border-at-line bg-white p-3 dark:border-white/15 dark:bg-at-navy-800"
      >
        <ProductPreview product={card.key} muted />
        <div className="flex flex-1 flex-col px-3 pt-6 pb-3 sm:px-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-at-mist text-at-ink-muted dark:bg-white/5 dark:text-white/60">
              <Icon aria-hidden className="size-5" />
            </span>
            <h2
              id={titleId}
              className="font-display text-xl font-bold text-at-navy-800/80 ltr:tracking-[-0.012em] dark:text-white/80"
            >
              {name}
            </h2>
          </div>
          <p className="mt-3 text-at-ink-muted dark:text-white/70">
            {description}
          </p>
          {notice ? (
            <p
              className={`mt-auto flex items-start gap-2 pt-8 text-sm ${
                locked
                  ? "text-at-navy-800 dark:text-white/85"
                  : "text-amber-800 dark:text-amber-300"
              }`}
            >
              <NoticeIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>
                <span className="font-semibold">{notice.title}</span>{" "}
                {notice.description}
              </span>
            </p>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <ProductCardSurface
      product={card.key}
      labelledBy={titleId}
      className={linkedCardClassName}
    >
      <div
        aria-hidden
        className="card-spotlight pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 card-active:opacity-100"
      />

      <ProductPreview product={card.key} />

      {/* Not positioned or transformed: the link's overlay must reach the
          whole card. */}
      <div className="flex flex-1 flex-col px-3 pt-6 pb-3 sm:px-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-(image:--product-fill) text-on-product shadow-md shadow-product/25 transition-[rotate,scale,box-shadow] duration-300 ease-out-soft card-active:shadow-lg card-active:shadow-product/40 motion-safe:card-active:-rotate-6 motion-safe:card-active:scale-110">
            <Icon aria-hidden className="size-5" />
          </span>
          <h2
            id={titleId}
            className="font-display text-xl font-bold text-at-navy-800 ltr:tracking-[-0.012em] dark:text-white"
          >
            {name}
          </h2>
        </div>
        <p className="mt-3 text-at-ink-muted dark:text-white/70">
          {description}
        </p>
        <div className="mt-auto pt-8">
          <ProductLaunchLink
            href={card.href}
            label={openLabel}
            openingLabel={openingLabel}
          />
        </div>
      </div>

      <div
        aria-hidden
        className="card-border-glow pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 card-active:opacity-100"
      />
      <div
        aria-hidden
        className="card-opening-ring pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 card-opening:opacity-100 motion-safe:card-opening:animate-border-spin"
      />
    </ProductCardSurface>
  );
}
