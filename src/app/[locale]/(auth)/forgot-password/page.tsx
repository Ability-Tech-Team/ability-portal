import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { highlight } from "@/src/components/highlight";
import LocaleSwitcher from "@/src/components/LocaleSwitcher";
import PortalShell from "@/src/components/PortalShell";
import { Link } from "@/src/i18n/navigation";
import AuthPanel from "../_shared/components/AuthPanel";
import ForgotPasswordForm from "./components/ForgotPasswordForm";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ForgotPassword");
  return { title: t("metaTitle") };
}

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("ForgotPassword");
  const tAuth = await getTranslations("Auth");
  const tHome = await getTranslations("Home");

  return (
    <PortalShell
      headerActions={<LocaleSwitcher href="/forgot-password" />}
      eyebrow={tHome("eyebrow")}
      title={t.rich("title", { highlight })}
      titleId="forgot-password-title"
      intro={t("intro")}
      centered
    >
      <AuthPanel title={t("formTitle")} titleId="forgot-password-form-title">
        <ForgotPasswordForm locale={locale} />
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
