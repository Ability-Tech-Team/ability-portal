import { CircleAlert, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";

/**
 * Shown instead of the product cards when the account service can't confirm
 * the session: without an answer, no product is shown as available.
 */
export default function AccessCheckFailed() {
  const t = useTranslations("Home");

  return (
    <section
      aria-labelledby="access-check-failed-title"
      className="mx-auto max-w-xl rounded-3xl bg-white p-6 shadow-[0_24px_60px_-28px_rgb(0_33_68/0.35)] ring-1 ring-at-line/80 ring-inset motion-safe:animate-enter enter-delay-360 sm:p-8 dark:bg-at-navy-800 dark:shadow-black/40 dark:ring-white/10"
    >
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">
          <CircleAlert aria-hidden className="size-5" />
        </span>
        <div className="min-w-0">
          <h2
            id="access-check-failed-title"
            className="font-display text-xl font-bold text-at-navy-800 dark:text-white"
          >
            {t("accessCheckFailedTitle")}
          </h2>
          <p className="mt-2 text-at-ink-muted dark:text-white/70">
            {t("accessCheckFailedDescription")}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-at-navy-800 px-5 font-display text-sm font-bold text-white shadow-sm transition-colors hover:bg-at-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-at-blue-500 dark:bg-white dark:text-at-navy-900 dark:hover:bg-at-mist dark:focus-visible:outline-at-blue-300"
          >
            <RotateCw aria-hidden className="size-4" />
            {t("tryAgain")}
          </Link>
        </div>
      </div>
    </section>
  );
}
