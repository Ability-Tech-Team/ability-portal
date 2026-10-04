import { isLoopbackHost } from "./baseUrl";

/**
 * The session cookie shared by the Portal, Ability CRM, and Community Admin
 * (docs/ACCOUNT-SERVICE-API.md, section 7). Only the Portal sets and deletes
 * it; the products only read it.
 */
export const SESSION_COOKIE_NAME = "ability_session";

export type CookieDomainSetting =
  | { status: "unset" }
  | { status: "configured"; domain: string }
  | { status: "invalid" };

/**
 * Validates `SESSION_COOKIE_DOMAIN`: a bare host name such as
 * `apps.example.com` (no scheme, port, or path). Unset means a host-only
 * cookie, which is what local development on `localhost` needs.
 */
export function parseCookieDomain(value: string | undefined): CookieDomainSetting {
  const trimmed = value?.trim().toLowerCase().replace(/^\./, "");

  if (!trimmed) {
    return { status: "unset" };
  }

  const label = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";
  const hostName = new RegExp(`^${label}(?:\\.${label})+$`);

  return hostName.test(trimmed) && trimmed.length <= 253
    ? { status: "configured", domain: trimmed }
    : { status: "invalid" };
}

/**
 * Whether the cookie gets `Secure`: always, except when the request comes
 * from a plain-HTTP loopback origin during local development. A missing or
 * unreadable origin keeps `Secure`.
 */
export function shouldUseSecureCookie(origin: string | null): boolean {
  if (!origin) {
    return true;
  }

  try {
    const url = new URL(origin);
    return !(url.protocol === "http:" && isLoopbackHost(url.hostname));
  } catch {
    return true;
  }
}

export type SessionCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  domain?: string;
  expires: Date;
};

export function buildSessionCookieOptions({
  expires,
  secure,
  domain,
}: {
  expires: Date;
  secure: boolean;
  domain?: string;
}): SessionCookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    ...(domain ? { domain } : {}),
    expires,
  };
}
