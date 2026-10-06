import { isLoopbackHost, isPrivateNetworkHost } from "./baseUrl";

/**
 * The client's token from the Portal API, shared with Ability CRM and
 * Community Admin: the same name and options as the products' own cookie, so
 * they read it and their sign-out clears it.
 */
export const ACCESS_TOKEN_COOKIE_NAME = "access_token";

/**
 * What the Portal shows for the session (who signed in and their platforms),
 * on the Portal's own host only. Presentation, never an access decision.
 */
export const PORTAL_SESSION_COOKIE_NAME = "portal_session";

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
 * from a plain-HTTP origin on a loopback host (local development) or a
 * private IPv4 address (an internal deployment opened by IP), where browsers
 * would drop a `Secure` cookie. A missing or unreadable origin keeps
 * `Secure`.
 */
export function shouldUseSecureCookie(origin: string | null): boolean {
  if (!origin) {
    return true;
  }

  try {
    const url = new URL(origin);
    return !(
      url.protocol === "http:" &&
      (isLoopbackHost(url.hostname) || isPrivateNetworkHost(url.hostname))
    );
  } catch {
    return true;
  }
}

/**
 * The `Domain` for the shared cookie: the configured parent domain when the
 * Portal is served from a host inside it (browsers reject any other), and
 * none otherwise, which keeps the cookie on the Portal's own host. So one
 * build works both on portal.ability-tech.com and when opened by IP.
 */
export function cookieDomainForHost(
  setting: CookieDomainSetting,
  host: string | null,
): string | undefined {
  if (setting.status !== "configured" || !host) {
    return undefined;
  }

  const hostname = host.trim().toLowerCase().replace(/:\d+$/, "");
  return hostname === setting.domain || hostname.endsWith(`.${setting.domain}`)
    ? setting.domain
    : undefined;
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
