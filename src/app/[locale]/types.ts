import type { ProductKey } from "@/src/lib/productDestinations";

/**
 * A card on the product-selection page. "linked" only means that the product
 * has a valid configured destination; it is not an entitlement. Purchased,
 * not-purchased, access-denied, and checking states are added with the central
 * access contract, and none of them may default to access.
 */
export type ProductCardModel =
  | { key: ProductKey; state: "linked"; href: string; hrefLang?: string }
  | { key: ProductKey; state: "configuration-pending" };
