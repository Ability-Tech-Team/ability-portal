import { z } from "zod";
import type {
  AccountSummary,
  Platform,
  ProductAccess,
} from "@/src/types/account";
import { parseBaseUrl } from "./baseUrl";
import {
  PRODUCT_KEYS,
  type ProductDestination,
  type ProductKey,
} from "./productDestinations";

/**
 * What the Portal keeps from the login answer to show the home page: who
 * signed in and the platforms they may open. It is stored in an HttpOnly
 * cookie because the Portal API has no endpoint to ask again. It is
 * presentation, never an access decision: each product checks the access
 * token itself.
 */
export type PortalSession = {
  account: AccountSummary;
  platforms: Platform[];
};

const MAX_COOKIE_VALUE_LENGTH = 3072;

const portalSessionSchema = z.object({
  account: z.object({
    email: z.string().min(1).max(254),
    name: z.string().max(200),
  }),
  platforms: z
    .array(
      z.object({
        key: z.enum(PRODUCT_KEYS),
        url: z.string().max(2048),
      }),
    )
    .max(PRODUCT_KEYS.length),
});

export function encodePortalSession(session: PortalSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

/** The stored session, or null for a missing, oversized, or altered value. */
export function decodePortalSession(value: unknown): PortalSession | null {
  if (
    typeof value !== "string" ||
    !value ||
    value.length > MAX_COOKIE_VALUE_LENGTH
  ) {
    return null;
  }

  try {
    const parsed = portalSessionSchema.safeParse(
      JSON.parse(Buffer.from(value, "base64url").toString("utf8")),
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * A product is available only when the login answer listed it; anything
 * else reads as not subscribed.
 */
export function toProductAccess(platforms: readonly Platform[]): ProductAccess {
  const listed = (key: ProductKey) =>
    platforms.some((platform) => platform.key === key);

  return {
    crm: listed("crm") ? "available" : "not_subscribed",
    communityAdmin: listed("communityAdmin") ? "available" : "not_subscribed",
  };
}

/**
 * Each listed platform's site (its origin): a product may send a client back
 * to any page there after sign-in, not only below the entry link's path.
 */
export function toReturnDestinations(
  platforms: readonly Platform[],
): Record<ProductKey, ProductDestination> {
  const destinations = toProductDestinations(platforms);
  const site = (destination: ProductDestination): ProductDestination =>
    destination.status === "configured"
      ? { status: "configured", baseUrl: new URL(destination.baseUrl).origin }
      : destination;

  return {
    crm: site(destinations.crm),
    communityAdmin: site(destinations.communityAdmin),
  };
}

/**
 * Each listed platform's address, validated like any configured base URL; an
 * invalid one renders its card as "configuration pending".
 */
export function toProductDestinations(
  platforms: readonly Platform[],
): Record<ProductKey, ProductDestination> {
  const destination = (key: ProductKey): ProductDestination => {
    const platform = platforms.find((entry) => entry.key === key);
    return platform ? parseBaseUrl(platform.url) : { status: "missing" };
  };

  return {
    crm: destination("crm"),
    communityAdmin: destination("communityAdmin"),
  };
}
