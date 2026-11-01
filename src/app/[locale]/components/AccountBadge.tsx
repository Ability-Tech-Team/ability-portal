import { useLocale, useTranslations } from "next-intl";
import type { PortalAccount } from "@/src/lib/signInAnswer";

type AccountBadgeProps = {
  account: PortalAccount;
};

/** Who is signed in, and for which organization, shown in the hero band. */
export default function AccountBadge({ account }: AccountBadgeProps) {
  const t = useTranslations("Account");
  const locale = useLocale();
  const organization =
    locale === "ar"
      ? (account.organizationAr ?? account.organizationEn)
      : (account.organizationEn ?? account.organizationAr);
  const initial = Array.from(account.name)[0]?.toLocaleUpperCase() ?? "";

  return (
    <p className="inline-flex max-w-full items-center gap-3 rounded-full bg-white/10 py-1.5 ps-1.5 pe-5 text-start ring-1 ring-white/15 ring-inset">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(image:--at-grad-accent) font-display text-base font-bold text-at-navy-900"
      >
        {initial}
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-white/70">{t("signedInAs")}</span>
        {/* Name and organization are isolated, so a Latin name's punctuation
            stays with it in Arabic; the flex gap spaces them in both
            directions. */}
        <span className="flex min-w-0 items-baseline gap-2">
          <bdi className="truncate font-bold text-white">{account.name}</bdi>
          {organization ? (
            <>
              <span className="sr-only">, </span>
              <bdi className="truncate text-sm text-white/70 max-sm:hidden">
                {organization}
              </bdi>
            </>
          ) : null}
        </span>
      </span>
    </p>
  );
}
