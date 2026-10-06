import type { ProductKey } from "@/src/lib/productDestinations";

/** Who signed in, from the Portal API's login answer. */
export type AccountSummary = {
  email: string;
  /** The employee's name in the client's system; may be empty. */
  name: string;
};

/**
 * A platform the client's backend lets this user open, at the address the
 * Portal API has for this client. The address is validated before use.
 */
export type Platform = { key: ProductKey; url: string };

/**
 * A product's state for the signed-in client. "unknown" stands for a missing
 * entry or a state this app doesn't recognize; like the locked states, it
 * never opens the product.
 */
export type ProductAccessState =
  | "available"
  | "not_subscribed"
  | "locked"
  | "unknown";

export type ProductAccess = Record<ProductKey, ProductAccessState>;

/** Why the account service rejected a new password (section 6.5). */
export type PasswordRule = "too_short" | "too_long" | "too_common" | "other";
