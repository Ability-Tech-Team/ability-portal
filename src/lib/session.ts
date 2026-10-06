import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import type {
  AccountSummary,
  Platform,
  ProductAccess,
} from "@/src/types/account";
import { readTokenExpiry } from "./accessToken";
import { parseEndUserIp } from "./endUserIp";
import type { ProductDestination, ProductKey } from "./productDestinations";
import {
  decodePortalSession,
  encodePortalSession,
  toProductAccess,
  toProductDestinations,
} from "./portalSession";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  buildSessionCookieOptions,
  cookieDomainForHost,
  parseCookieDomain,
  PORTAL_SESSION_COOKIE_NAME,
  shouldUseSecureCookie,
} from "./sessionCookie";

export type CurrentSession =
  | {
      status: "active";
      account: AccountSummary;
      products: ProductAccess;
      destinations: Record<ProductKey, ProductDestination>;
    }
  /** `ended`: a token was sent, but it has expired or can't be read. */
  | { status: "signed-out"; ended: boolean };

export type NewSession = {
  token: string;
  expiresAt: Date;
  account: AccountSummary;
  platforms: Platform[];
};

let reportedInvalidDomain = false;

/**
 * The signed-in client, from the cookies the sign-in set (once per render).
 * The Portal API has no endpoint to check a session, so the Portal only
 * checks that the access token hasn't expired; the products verify it.
 * Call it where the data is used, not only in a layout.
 */
export const getCurrentSession = cache(async (): Promise<CurrentSession> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return { status: "signed-out", ended: false };
  }

  const expiresAt = readTokenExpiry(token);

  if (!expiresAt || expiresAt.getTime() <= Date.now()) {
    return { status: "signed-out", ended: true };
  }

  // A token without the Portal's record (e.g. set by a product's own
  // sign-in) can't show who is signed in or their platforms.
  const session = decodePortalSession(
    cookieStore.get(PORTAL_SESSION_COOKIE_NAME)?.value,
  );

  if (!session) {
    return { status: "signed-out", ended: false };
  }

  return {
    status: "active",
    account: session.account,
    products: toProductAccess(session.platforms),
    destinations: toProductDestinations(session.platforms),
  };
});

/**
 * Stores the access token in the cookie shared with the products, and the
 * Portal's record of the session on the Portal's own host. Both expire with
 * the token. Server Actions only.
 */
export async function startSession(session: NewSession): Promise<void> {
  const cookieStore = await cookies();
  const options = await sessionCookieOptions(session.expiresAt);

  cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, session.token, {
    ...options,
    domain: await getCookieDomain(),
  });
  cookieStore.set(
    PORTAL_SESSION_COOKIE_NAME,
    encodePortalSession({
      account: session.account,
      platforms: session.platforms,
    }),
    options,
  );
}

/**
 * Deletes both cookies, with the attributes they were set with, which also
 * signs the client out of the products that read the shared token. The
 * Portal API's own logout only clears a cookie in its response, so it isn't
 * called. Server Actions only.
 */
export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  const options = {
    ...(await sessionCookieOptions(new Date(0))),
    maxAge: 0,
  };

  cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, "", {
    ...options,
    domain: await getCookieDomain(),
  });
  cookieStore.set(PORTAL_SESSION_COOKIE_NAME, "", options);
}

/**
 * The raw access token, for server-side calls on the client's behalf (the
 * token-check page). Never pass it to a client component.
 */
export async function readAccessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)?.value ?? null;
}

/** The client's IP address for the services' rate limits. */
export async function getEndUserIp(): Promise<string | undefined> {
  const requestHeaders = await headers();
  return parseEndUserIp(
    requestHeaders.get("x-real-ip"),
    requestHeaders.get("x-forwarded-for"),
  );
}

/** Host-only options; the shared token adds `getCookieDomain()`. */
async function sessionCookieOptions(expires: Date) {
  const origin = (await headers()).get("origin");

  return buildSessionCookieOptions({
    expires,
    secure: shouldUseSecureCookie(origin),
  });
}

/**
 * `SESSION_COOKIE_DOMAIN`, the parent domain shared with the products. An
 * invalid value is reported and ignored: the cookie then stays on the Portal's
 * own host, and the products send clients back to sign in.
 */
async function getCookieDomain(): Promise<string | undefined> {
  const setting = parseCookieDomain(process.env.SESSION_COOKIE_DOMAIN);
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (setting.status === "invalid" && !reportedInvalidDomain) {
    reportedInvalidDomain = true;
    console.warn(
      "SESSION_COOKIE_DOMAIN is invalid (expected a host name such as apps.example.com); the session cookie stays on the Portal's own host.",
    );
  }

  return cookieDomainForHost(setting, host);
}
