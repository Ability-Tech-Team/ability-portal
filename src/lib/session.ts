import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import {
  getSession,
  signOut,
  type NewSession,
} from "@/src/services/accountService";
import type { AccountSummary, ProductAccess } from "@/src/types/account";
import { parseEndUserIp } from "./endUserIp";
import {
  buildSessionCookieOptions,
  parseCookieDomain,
  SESSION_COOKIE_NAME,
  shouldUseSecureCookie,
} from "./sessionCookie";
import { isWellFormedToken } from "./tokens";

export type CurrentSession =
  | { status: "active"; account: AccountSummary; products: ProductAccess }
  /** `ended`: a session cookie was sent, but the session is no longer valid. */
  | { status: "signed-out"; ended: boolean }
  | { status: "unavailable" };

let reportedInvalidDomain = false;

async function readSessionToken(): Promise<string | null> {
  const value = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return isWellFormedToken(value) ? value : null;
}

/**
 * The signed-in client, checked with the account service on every request
 * (once per render), so locks and sign-outs apply immediately. Call it where
 * the data is used, not only in a layout.
 */
export const getCurrentSession = cache(async (): Promise<CurrentSession> => {
  const token = await readSessionToken();

  if (!token) {
    return { status: "signed-out", ended: false };
  }

  const result = await getSession(token);

  switch (result.status) {
    case "active":
      return {
        status: "active",
        account: result.account,
        products: result.products,
      };
    case "invalid":
      return { status: "signed-out", ended: true };
    case "unavailable":
      return { status: "unavailable" };
  }
});

/**
 * Stores a new session in the shared cookie, after ending the browser's
 * previous session, if any. Server Actions only.
 */
export async function startSession(session: NewSession): Promise<void> {
  const previousToken = await readSessionToken();

  if (previousToken && previousToken !== session.token) {
    await signOut(previousToken);
  }

  (await cookies()).set(
    SESSION_COOKIE_NAME,
    session.token,
    await sessionCookieOptions(session.expiresAt),
  );
}

/**
 * Ends the session in the account service (best effort) and deletes the
 * cookie, with the attributes it was set with. Server Actions only.
 */
export async function endSession(): Promise<void> {
  const token = await readSessionToken();

  if (token) {
    await signOut(token);
  }

  (await cookies()).set(SESSION_COOKIE_NAME, "", {
    ...(await sessionCookieOptions(new Date(0))),
    maxAge: 0,
  });
}

/** The client's IP address for the account service's rate limits. */
export async function getEndUserIp(): Promise<string | undefined> {
  const requestHeaders = await headers();
  return parseEndUserIp(
    requestHeaders.get("x-real-ip"),
    requestHeaders.get("x-forwarded-for"),
  );
}

async function sessionCookieOptions(expires: Date) {
  const origin = (await headers()).get("origin");

  return buildSessionCookieOptions({
    expires,
    secure: shouldUseSecureCookie(origin),
    domain: getCookieDomain(),
  });
}

/**
 * `SESSION_COOKIE_DOMAIN`, the parent domain shared with the products. An
 * invalid value is reported and ignored: the cookie then stays on the Portal's
 * own host, and the products send clients back to sign in.
 */
function getCookieDomain(): string | undefined {
  const setting = parseCookieDomain(process.env.SESSION_COOKIE_DOMAIN);

  if (setting.status === "invalid" && !reportedInvalidDomain) {
    reportedInvalidDomain = true;
    console.warn(
      "SESSION_COOKIE_DOMAIN is invalid (expected a host name such as apps.example.com); the session cookie stays on the Portal's own host.",
    );
  }

  return setting.status === "configured" ? setting.domain : undefined;
}
