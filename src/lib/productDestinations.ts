/**
 * Where each product card links. The destinations are public navigation
 * metadata supplied at build time, not access decisions: each product app and
 * its API enforce access themselves, including on direct entry.
 */

import { parseBaseUrl, type BaseUrlProblem, type ParsedBaseUrl } from "./baseUrl";

export const PRODUCT_KEYS = ["crm", "communityAdmin"] as const;

export type ProductKey = (typeof PRODUCT_KEYS)[number];

export type DestinationProblem = BaseUrlProblem;

export type ProductDestination = ParsedBaseUrl;

export type ProductEntry = {
  href: string;
  hrefLang?: string;
};

const envVariableNames: Record<ProductKey, string> = {
  crm: "NEXT_PUBLIC_CRM_APP_URL",
  communityAdmin: "NEXT_PUBLIC_COMMUNITY_ADMIN_APP_URL",
};

/** Locales each product app serves under a `/<locale>` path prefix. */
const productLocales: Record<ProductKey, readonly string[]> = {
  crm: ["en", "ar"],
  communityAdmin: ["en", "ar"],
};

/**
 * Validates a configured product base URL (see `parseBaseUrl`): product links
 * never carry credentials, query strings, or fragments.
 */
export function parseProductDestination(
  value: string | undefined,
): ProductDestination {
  return parseBaseUrl(value);
}

function reportDestinationProblem(
  key: ProductKey,
  destination: ProductDestination,
) {
  if (destination.status === "configured") {
    return;
  }

  const detail =
    destination.status === "missing"
      ? "is not set"
      : `is invalid (${destination.problem})`;

  // The rejected value is not logged because it may contain credentials.
  console.warn(
    `${envVariableNames[key]} ${detail}; its product card shows "configuration pending".`,
  );
}

/**
 * Reads and validates the configured destinations. Next.js inlines
 * `NEXT_PUBLIC_*` values at build time only for literal `process.env.NAME`
 * accesses, so keep them spelled out.
 */
export function getProductDestinations(): Record<
  ProductKey,
  ProductDestination
> {
  const destinations: Record<ProductKey, ProductDestination> = {
    crm: parseProductDestination(process.env.NEXT_PUBLIC_CRM_APP_URL),
    communityAdmin: parseProductDestination(
      process.env.NEXT_PUBLIC_COMMUNITY_ADMIN_APP_URL,
    ),
  };

  for (const key of PRODUCT_KEYS) {
    reportDestinationProblem(key, destinations[key]);
  }

  return destinations;
}

/**
 * Returns the product entry link for the portal's current locale. The locale
 * is kept only when the product serves it; otherwise the product root chooses
 * a language itself.
 */
export function getProductEntry(
  key: ProductKey,
  baseUrl: string,
  locale: string,
): ProductEntry {
  if (productLocales[key].includes(locale)) {
    return { href: `${baseUrl}/${locale}`, hrefLang: locale };
  }

  return { href: `${baseUrl}/` };
}
