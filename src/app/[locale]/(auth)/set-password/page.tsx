import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { highlight } from "@/src/components/highlight";
import LocaleSwitcher from "@/src/components/LocaleSwitcher";
import PortalShell from "@/src/components/PortalShell";
import { Link } from "@/src/i18n/navigation";
import AuthPanel from "../_shared/components/AuthPanel";
import SetPasswordForm from "./components/SetPasswordForm";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SetPassword");

  // The link token stays in the fragment, which browsers never send; this
  // also keeps the page address out of Referer headers.
  return { title: t("metaTitle"), referrer: "no-referrer" };
}

export default async function SetPasswordPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("SetPassword");
  const tAuth = await getTranslations("Auth");
  const tHome = await getTranslations("Home");

  return (
    <PortalShell
      // The link token is in the fragment, which the language switch carries.
      headerActions={<LocaleSwitcher href="/set-password" keepFragment />}
      eyebrow={tHome("eyebrow")}
      title={t.rich("title", { highlight })}
      titleId="set-password-title"
      intro={t("intro")}
      centered
    >
      <AuthPanel title={t("formTitle")} titleId="set-password-form-title">
        <SetPasswordForm locale={locale} />
        <p className="mt-6 border-t border-at-line-soft pt-5 dark:border-white/10">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 text-sm font-semibold text-at-blue-500 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-at-blue-500 dark:text-at-blue-300"
          >
            <ArrowLeft aria-hidden className="size-4 rtl:-scale-x-100" />
            {tAuth("backToSignIn")}
          </Link>
        </p>
      </AuthPanel>
    </PortalShell>
  );
}
