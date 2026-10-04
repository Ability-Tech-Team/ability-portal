import { useLocale, useTranslations } from "next-intl";
import { getPathname, Link } from "@/src/i18n/navigation";
import { routing } from "@/src/i18n/routing";
import FragmentPreservingLink from "./FragmentPreservingLink";

const itemClassName =
  "inline-flex h-8 min-w-11 items-center justify-center rounded-full px-3 text-sm font-bold";

const linkClassName = `${itemClassName} text-at-navy-800 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-at-blue-500 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:outline-at-blue-300`;

type LocaleSwitcherProps = {
  /** The page to open in the other language; the portal home by default. */
  href?: Parameters<typeof getPathname>[0]["href"];
  /** Carries the URL fragment along, for pages that keep a token in it. */
  keepFragment?: boolean;
};

/**
 * The language toggle, styled like the Ability Tech site's "ع | EN" pill: the
 * current language is highlighted, and each other language is a link to the
 * same page in that language. Screen readers hear the full language names.
 */
export default function LocaleSwitcher({
  href = "/",
  keepFragment = false,
}: LocaleSwitcherProps) {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();

  return (
    <nav
      aria-label={t("label")}
      className="flex items-center gap-1 rounded-full bg-at-mist p-1 ring-1 ring-at-line ring-inset dark:bg-white/5 dark:ring-white/10"
    >
      {routing.locales.map((item) => {
        const content = (
          <>
            <span aria-hidden>{t("short", { locale: item })}</span>
            <span className="sr-only">{t("locale", { locale: item })}</span>
          </>
        );

        return item === locale ? (
          <span
            key={item}
            lang={item}
            aria-current="true"
            className={`${itemClassName} bg-at-navy-800 text-white dark:bg-white dark:text-at-navy-900`}
          >
            {content}
          </span>
        ) : keepFragment ? (
          <FragmentPreservingLink
            key={item}
            href={getPathname({ href, locale: item })}
            hrefLang={item}
            lang={item}
            className={linkClassName}
          >
            {content}
          </FragmentPreservingLink>
        ) : (
          <Link
            key={item}
            href={href}
            locale={item}
            lang={item}
            className={linkClassName}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
