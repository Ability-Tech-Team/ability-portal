import type { ProductKey } from "@/src/lib/productDestinations";

/** The signed-in client (docs/ACCOUNT-SERVICE-API.md, section 6.2). */
export type AccountSummary = {
  id: string;
  email: string;
  name: string;
};

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
