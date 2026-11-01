import { parseBaseUrl } from "./baseUrl";

/**
 * The portal backend (`NEXT_PUBLIC_PORTAL_API_URL`), which signs users in. The
 * browser calls it directly, so that it receives the backend's HttpOnly
 * `access_token` cookie, which the products' APIs accept; the value is
 * therefore public and inlined at build time. Plain `http:` is accepted for
 * loopback and private-network development hosts only.
 */
export function getPortalApiUrl(): string | null {
  // Literal access, so that Next.js inlines the value.
  const parsed = parseBaseUrl(process.env.NEXT_PUBLIC_PORTAL_API_URL, {
    allowPrivateNetworkHttp: true,
  });

  return parsed.status === "configured" ? parsed.baseUrl : null;
}
