import {
  PRODUCT_KEYS,
  type ProductDestination,
  type ProductKey,
} from "./productDestinations";

const MAX_RETURN_TO_LENGTH = 2048;

export type ReturnTarget = { url: string; product: ProductKey };

/**
 * Where to go after signing in, when a product sent the client here
 * (`?returnTo=`). Only addresses inside a configured product destination are
 * accepted: same origin, and the destination's base path or below. Anything
 * else returns null, and the Portal home opens instead, so the sign-in page
 * can never redirect to an arbitrary site.
 */
export function resolveReturnTo(
  value: unknown,
  destinations: Record<ProductKey, ProductDestination>,
): ReturnTarget | null {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_RETURN_TO_LENGTH
  ) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (
    (url.protocol !== "https:" && url.protocol !== "http:") ||
    url.username ||
    url.password
  ) {
    return null;
  }

  for (const product of PRODUCT_KEYS) {
    const destination = destinations[product];

    if (destination.status !== "configured") {
      continue;
    }

    const base = new URL(destination.baseUrl);
    const basePath = base.pathname.replace(/\/+$/, "");
    const insideBasePath =
      basePath === "" ||
      url.pathname === basePath ||
      url.pathname.startsWith(`${basePath}/`);

    if (url.origin === base.origin && insideBasePath) {
      url.hash = "";
      return { url: url.toString(), product };
    }
  }

  return null;
}
