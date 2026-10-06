import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import PortalShell from "@/src/components/PortalShell";
import { redirect } from "@/src/i18n/navigation";
import { readTokenExpiry } from "@/src/lib/accessToken";
import { describeCookieTravel } from "@/src/lib/cookieTravel";
import { getCurrentSession, readAccessToken } from "@/src/lib/session";
import { checkCrmToken, getCrmCheckUrl } from "@/src/services/crmApi";
import SignOutForm from "../components/SignOutForm";
import BrowserTokenCheck from "./components/BrowserTokenCheck";
import CheckRow from "./components/CheckRow";

type Props = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: "Token check – Ability Portal",
  robots: { index: false },
};

/**
 * Diagnostic, on only while CRM_API_URL is set (the Ability CRM card links
 * here instead of the CRM): does the access token reach the CRM's API and
 * does the API accept it? The server check sends the token from the Portal's
 * server; the browser check makes the same call from this page with the
 * browser's cookies, as the CRM's web app will. English only; remove it once
 * sign-in into the products is confirmed.
 */
export default async function TokenCheckPage({ params }: Props) {
  const { locale } = await params;
  const checkUrl = getCrmCheckUrl();

  if (!checkUrl) {
    notFound();
  }

  const session = await getCurrentSession();

  if (session.status === "signed-out") {
    return redirect({ href: "/sign-in", locale });
  }

  const token = await readAccessToken();
  const expiresAt = readTokenExpiry(token);
  const server = token
    ? await checkCrmToken(token, locale)
    : { outcome: "not-configured" as const };
  const requestHeaders = await headers();
  const portalHost = (requestHeaders.get("host") ?? "").replace(/:\d+$/, "");
  const apiUrl = new URL(checkUrl);
  const travel = describeCookieTravel(
    portalHost,
    apiUrl.hostname,
    process.env.SESSION_COOKIE_DOMAIN,
  );
  const crm = session.destinations.crm;

  return (
    <PortalShell
      headerActions={<SignOutForm locale={locale} />}
      eyebrow="Diagnostic"
      title="Token check"
      titleId="token-check-title"
      intro="Does the access token from the Portal reach the CRM's API, and does the API accept it?"
    >
      <div
        dir="ltr"
        lang="en"
        className="mx-auto flex max-w-3xl flex-col gap-6 text-start"
      >
        <section className="rounded-3xl bg-white p-6 ring-1 ring-at-line ring-inset dark:bg-at-navy-800 dark:ring-white/10">
          <h2 className="font-display text-lg font-bold text-at-navy-800 dark:text-white">
            The token
          </h2>
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="font-semibold">Signed in as</dt>
            <dd>
              <bdi>{session.account.name || session.account.email}</bdi>
            </dd>
            <dt className="font-semibold">access_token cookie</dt>
            <dd>{token ? "present on the Portal" : "missing"}</dd>
            <dt className="font-semibold">Expires</dt>
            <dd>{expiresAt ? expiresAt.toISOString() : "unknown"}</dd>
            <dt className="font-semibold">API called</dt>
            <dd className="break-all">GET {checkUrl}</dd>
          </dl>
        </section>

        <CheckRow
          title="1. Server check: is the token valid for this API?"
          description="The Portal's server sends the token to the API in the access_token cookie. This doesn't depend on the browser."
          tone={
            server.outcome === "accepted"
              ? "pass"
              : server.outcome === "rejected"
                ? "fail"
                : "warn"
          }
          result={serverSummary(server)}
        />

        <BrowserTokenCheck url={checkUrl} travel={travel} />

        {crm.status === "configured" ? (
          <p className="text-sm">
            <a
              href={crm.baseUrl}
              className="font-semibold text-at-blue-500 underline-offset-4 hover:underline dark:text-at-blue-300"
            >
              Continue to Ability CRM
            </a>{" "}
            <span className="break-all text-at-ink-muted dark:text-white/70">
              ({crm.baseUrl})
            </span>
          </p>
        ) : null}
      </div>
    </PortalShell>
  );
}

function serverSummary(
  server: Awaited<ReturnType<typeof checkCrmToken>>,
): string {
  switch (server.outcome) {
    case "not-configured":
      return "Not run: no access_token cookie.";
    case "accepted":
      return `Accepted (status ${server.bodyStatusCode ?? server.httpStatus}). The token is valid for this API.`;
    case "rejected":
      return `Rejected (401${server.message ? `, ${server.message}` : ""}). This API doesn't accept the token: it was issued by another CRM backend (a different signing key or database), or the employee's role, type, or department changed since sign-in.`;
    case "unexpected":
      return `The API answered status ${server.bodyStatusCode ?? server.httpStatus}${server.message ? ` (${server.message})` : ""}, which isn't about the token.`;
    case "unreachable":
      return `The Portal's server couldn't reach the API: ${server.error}.`;
  }
}
