import { parseCookieDomain } from "./sessionCookie";

export type CookieTravel = {
  /** The host the Portal sets the cookie from. */
  portalHost: string;
  targetHost: string;
  /** `SESSION_COOKIE_DOMAIN`, if valid. */
  cookieDomain: string | null;
  /** Where the browser keeps the cookie. */
  cookieScope: string;
  /** Whether the target host is inside that scope. */
  hostMatches: boolean;
  /**
   * Whether a `SameSite=Lax` cookie goes along with a script's request (fetch)
   * from the Portal to the target: only between hosts of the same site.
   */
  sameSite: boolean;
  /** Both: the browser attaches the cookie to the request. */
  browserSendsCookie: boolean;
};

/**
 * Whether the browser would attach the `access_token` cookie the Portal sets
 * to a request for `targetHost`. A cookie without `Domain` goes only to the
 * exact host that set it; with `Domain`, to that domain and its subdomains,
 * and the browser ignores a `Domain` the setting host isn't inside.
 */
export function describeCookieTravel(
  portalHost: string,
  targetHost: string,
  cookieDomainSetting: string | undefined,
): CookieTravel {
  const setting = parseCookieDomain(cookieDomainSetting);
  const cookieDomain = setting.status === "configured" ? setting.domain : null;
  const sharedDomain =
    cookieDomain && within(portalHost, cookieDomain) ? cookieDomain : null;
  const hostMatches = sharedDomain
    ? within(targetHost, sharedDomain)
    : targetHost === portalHost;
  const sameSite = siteOf(portalHost) === siteOf(targetHost);

  return {
    portalHost,
    targetHost,
    cookieDomain,
    cookieScope: sharedDomain
      ? `.${sharedDomain} and its subdomains`
      : `${portalHost} only`,
    hostMatches,
    sameSite,
    browserSendsCookie: hostMatches && sameSite,
  };
}

function within(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

/**
 * The site a host belongs to, approximated as its last two labels
 * (`crm.ability-tech.com` → `ability-tech.com`); an IP address is its own
 * site. Enough for `.com`-style domains; not for suffixes like `.co.uk`.
 */
function siteOf(host: string): string {
  if (/^[\d.]+$/.test(host) || host.includes(":")) {
    return host;
  }

  return host.split(".").slice(-2).join(".");
}
