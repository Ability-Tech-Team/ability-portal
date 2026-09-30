import { ArrowUpRight, CircleAlert, type LucideIcon } from "lucide-react";
import type { ProductCardModel } from "../types";

type ProductCardProps = {
  card: ProductCardModel;
  icon: LucideIcon;
  name: string;
  description: string;
  openLabel: string;
  pendingTitle: string;
  pendingDescription: string;
};

export default function ProductCard({
  card,
  icon: Icon,
  name,
  description,
  openLabel,
  pendingTitle,
  pendingDescription,
}: ProductCardProps) {
  const titleId = `product-${card.key}-title`;
  const isLinked = card.state === "linked";

  return (
    <article
      aria-labelledby={titleId}
      className={`group relative flex w-full flex-col rounded-2xl border p-6 sm:p-8 ${
        isLinked
          ? "border-slate-200 bg-white shadow-sm transition hover:border-sky-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700"
          : "border-dashed border-slate-300 bg-slate-100/60 dark:border-slate-700 dark:bg-slate-900/40"
      }`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${
            isLinked
              ? "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
              : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          <Icon aria-hidden className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 id={titleId} className="text-xl font-semibold tracking-tight">
            {name}
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-8">
        {card.state === "linked" ? (
          // The ::after overlay makes the whole card clickable and shows the
          // focus ring around the card while the link name stays short.
          <a
            href={card.href}
            hrefLang={card.hrefLang}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition group-hover:bg-sky-800 after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-hidden focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-sky-600"
          >
            {openLabel}
            <ArrowUpRight aria-hidden className="size-4 rtl:-scale-x-100" />
          </a>
        ) : (
          <p className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
            <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-semibold">{pendingTitle}</span>{" "}
              {pendingDescription}
            </span>
          </p>
        )}
      </div>
    </article>
  );
}
