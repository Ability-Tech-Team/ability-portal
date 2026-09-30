import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { routing } from "@/src/i18n/routing";

/** Links to the portal home in each other supported language. */
export default function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const otherLocales = routing.locales.filter((item) => item !== locale);

  return (
    <nav aria-label={t("label")} className="flex items-center gap-1">
      <Languages
        aria-hidden
        className="size-4 text-slate-500 dark:text-slate-400"
      />
      {otherLocales.map((item) => (
        <Link
          key={item}
          href="/"
          locale={item}
          lang={item}
          className="rounded-md px-2 py-1 text-sm font-medium text-slate-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:text-slate-300"
        >
          {t("locale", { locale: item })}
        </Link>
      ))}
    </nav>
  );
}
