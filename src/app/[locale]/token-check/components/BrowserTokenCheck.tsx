"use client";

import { useEffect, useState } from "react";
import type { CookieTravel } from "@/src/lib/cookieTravel";
import CheckRow from "./CheckRow";

type BrowserTokenCheckProps = {
  url: string;
  travel: CookieTravel;
};

type Outcome =
  | { status: "running" }
  | { status: "blocked"; error: string }
  | {
      status: "answered";
      httpStatus: number;
      bodyStatusCode: number | null;
      message: string | null;
    };

/**
 * Calls the CRM's API from the browser with its cookies, as the CRM's web app
 * does, and explains the outcome: the browser must send the access_token
 * cookie (same site, inside the cookie's domain) and the API must allow this
 * page's origin with credentials (CORS) for the script to read the answer.
 */
export default function BrowserTokenCheck({
  url,
  travel,
}: BrowserTokenCheckProps) {
  const [run, setRun] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>({ status: "running" });

  useEffect(() => {
    const controller = new AbortController();

    fetch(url, {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body: unknown = await response.json().catch(() => null);
        const record =
          body && typeof body === "object"
            ? (body as Record<string, unknown>)
            : {};
        const result =
          record.result && typeof record.result === "object"
            ? (record.result as Record<string, unknown>)
            : {};
        const message = result.message_code ?? result.message ?? null;

        setOutcome({
          status: "answered",
          httpStatus: response.status,
          bodyStatusCode:
            typeof record.statusCode === "number" ? record.statusCode : null,
          message: typeof message === "string" ? message : null,
        });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setOutcome({
            status: "blocked",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

    return () => controller.abort();
  }, [url, run]);

  const status =
    outcome.status === "answered"
      ? (outcome.bodyStatusCode ?? outcome.httpStatus)
      : null;
  const tone =
    outcome.status === "running"
      ? "running"
      : outcome.status === "blocked" || status === 401
        ? "fail"
        : status !== null && status < 500
          ? "pass"
          : "warn";

  return (
    <CheckRow
      title="2. Browser check: does the cookie travel with the browser's request?"
      description="This page calls the same API from the browser with credentials: 'include', the way the CRM's web app does. The token is never read by this page's code: the browser attaches the HttpOnly cookie on its own, or doesn't."
      tone={tone}
      result={browserSummary(outcome, travel)}
    >
      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="font-semibold">Cookie set from</dt>
        <dd>{travel.portalHost}</dd>
        <dt className="font-semibold">SESSION_COOKIE_DOMAIN</dt>
        <dd>{travel.cookieDomain ?? "not set"}</dd>
        <dt className="font-semibold">Cookie scope</dt>
        <dd>{travel.cookieScope}</dd>
        <dt className="font-semibold">API host</dt>
        <dd>{travel.targetHost}</dd>
        <dt className="font-semibold">Inside the cookie scope</dt>
        <dd>{travel.hostMatches ? "yes" : "no"}</dd>
        <dt className="font-semibold">Same site as the Portal</dt>
        <dd>{travel.sameSite ? "yes" : "no (SameSite=Lax blocks it)"}</dd>
        <dt className="font-semibold">Browser sends the cookie</dt>
        <dd>{travel.browserSendsCookie ? "yes" : "no"}</dd>
      </dl>
      <button
        type="button"
        onClick={() => {
          setOutcome({ status: "running" });
          setRun((value) => value + 1);
        }}
        className="mt-4 rounded-full bg-at-navy-800 px-5 py-2 text-sm font-bold text-white hover:bg-at-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-at-blue-500 dark:bg-white dark:text-at-navy-900"
      >
        Run again
      </button>
    </CheckRow>
  );
}

function browserSummary(outcome: Outcome, travel: CookieTravel): string {
  const notSent = travel.browserSendsCookie
    ? ""
    : ` The browser doesn't send the cookie to ${travel.targetHost}: it's kept for ${travel.cookieScope}. In production, put the Portal and the API under one domain (e.g. portal.ability-tech.com and crm-api.ability-tech.com) and set SESSION_COOKIE_DOMAIN=ability-tech.com.`;

  switch (outcome.status) {
    case "running":
      return "Calling the API…";
    case "blocked":
      // Only reached in the browser, after the request failed.
      return `The browser blocked the request or couldn't reach the API (${outcome.error}). Usually CORS: the API must allow the origin ${window.location.origin} with credentials (crm-api's CORS_ALLOWED_ORIGINS). An https page also can't call an http API.${notSent}`;
    case "answered": {
      const status = outcome.bodyStatusCode ?? outcome.httpStatus;
      const detail = outcome.message ? `, ${outcome.message}` : "";

      if (status === 401) {
        return `The API answered 401${detail}: no valid token arrived with the request.${notSent}`;
      }

      return status < 500
        ? `The API answered ${status}${detail}: the cookie travelled and the token was accepted.`
        : `The API answered ${status}${detail}, an error that isn't about the token.`;
    }
  }
}
