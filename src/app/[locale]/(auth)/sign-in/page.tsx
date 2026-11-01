import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { highlight } from "@/src/components/highlight";
import LocaleSwitcher from "@/src/components/LocaleSwitcher";
import PortalShell from "@/src/components/PortalShell";
import { redirect } from "@/src/i18n/navigation";
import { getProductDestinations } from "@/src/lib/productDestinations";
import { resolveReturnTo } from "@/src/lib/returnTo";
import { getCurrentSession } from "@/src/lib/session";
import AuthPanel from "../_shared/components/AuthPanel";
import SignInForm from "./components/SignInForm";
import { firstSearchParam, parseSignInNotice } from "./utils";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("SignIn");
  return { title: t("metaTitle") };
}

export default async function SignInPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const query = await searchParams;
  const returnTarget = resolveReturnTo(
    firstSearchParam(query.returnTo),
    getProductDestinations(),
  );
  const session = await getCurrentSession();

  // A product sends a signed-in user here only when its API no longer accepts
  // the session, so the form is shown again instead of going back, which
  // would loop.
  if (session.status === "active" && !returnTarget) {
    return redirect({ href: "/", locale });
  }

  const t = await getTranslations("SignIn");
  const tHome = await getTranslations("Home");
  const tProducts = await getTranslations("Products");
  const notice =
    parseSignInNotice(firstSearchParam(query.notice)) ??
    (session.status === "active" ? "session-ended" : null);

  return (
    <PortalShell
      headerActions={
        <LocaleSwitcher
          href={{
            pathname: "/sign-in",
            query: returnTarget ? { returnTo: returnTarget.url } : {},
          }}
        />
      }
      eyebrow={tHome("eyebrow")}
      title={t.rich("title", { highlight })}
      titleId="sign-in-title"
      intro={t("intro")}
      centered
    >
      <AuthPanel title={t("formTitle")} titleId="sign-in-form-title">
        {returnTarget ? (
          <p className="-mt-3 mb-6 text-sm text-at-ink-muted dark:text-white/70">
            {t("continueTo", {
              product: tProducts(`${returnTarget.product}.name`),
            })}
          </p>
        ) : null}
        <SignInForm
          locale={locale}
          returnTo={returnTarget?.url ?? null}
          notice={notice}
        />
        <p className="mt-6 border-t border-at-line-soft pt-5 text-sm leading-relaxed text-at-ink-muted dark:border-white/10 dark:text-white/70">
          {t("noAccount")}
        </p>
      </AuthPanel>
    </PortalShell>
  );
}
