/**
 * Where each product card links. The addresses come from the Portal API's
 * login answer (each client has its own deployments) and are navigation
 * metadata, not access decisions: each product app and its API enforce
 * access themselves, including on direct entry.
 */

import { parseBaseUrl, type BaseUrlProblem, type ParsedBaseUrl } from "./baseUrl";

export const PRODUCT_KEYS = ["crm", "communityAdmin"] as const;

export type ProductKey = (typeof PRODUCT_KEYS)[number];

export type DestinationProblem = BaseUrlProblem;

export type ProductDestination = ParsedBaseUrl;

/**
 * Validates a product base URL (see `parseBaseUrl`): product links never
 * carry credentials, query strings, or fragments.
 */
export function parseProductDestination(
  value: string | undefined,
): ProductDestination {
  return parseBaseUrl(value);
}
