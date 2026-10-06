/**
 * Validation for base URLs (the Portal API, the account service, and the
 * product addresses the Portal API returns): an absolute `https:` URL, or
 * `http:` for loopback and private-network hosts (local development and
 * internal deployments), with an optional base path.
 */

export type BaseUrlProblem =
  | "malformed"
  | "unsupported-protocol"
  | "insecure-http"
  | "credentials"
  | "query-or-fragment";

export type ParsedBaseUrl =
  | { status: "configured"; baseUrl: string }
  | { status: "missing" }
  | { status: "invalid"; problem: BaseUrlProblem };

export function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "[::1]" ||
    /^127(?:\.\d{1,3}){3}$/.test(hostname)
  );
}

/** A private IPv4 address (10/8, 172.16/12, 192.168/16). */
export function isPrivateNetworkHost(hostname: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(hostname);

  if (!match) {
    return false;
  }

  const [first, second] = [Number(match[1]), Number(match[2])];
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

/**
 * Credentials, query strings, and fragments are rejected so that configured
 * URLs never carry secrets or tokens. The result has no trailing slash.
 */
export function parseBaseUrl(value: string | undefined): ParsedBaseUrl {
  const trimmed = value?.trim();

  if (!trimmed) {
    return { status: "missing" };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { status: "invalid", problem: "malformed" };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { status: "invalid", problem: "unsupported-protocol" };
  }

  if (
    url.protocol === "http:" &&
    !isLoopbackHost(url.hostname) &&
    !isPrivateNetworkHost(url.hostname)
  ) {
    return { status: "invalid", problem: "insecure-http" };
  }

  if (url.username || url.password) {
    return { status: "invalid", problem: "credentials" };
  }

  if (url.search || url.hash) {
    return { status: "invalid", problem: "query-or-fragment" };
  }

  return {
    status: "configured",
    baseUrl: `${url.origin}${url.pathname.replace(/\/+$/, "")}`,
  };
}
