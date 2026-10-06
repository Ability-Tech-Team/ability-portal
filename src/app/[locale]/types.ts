import type { ProductKey } from "@/src/lib/productDestinations";

/**
 * A card on the product-selection page. Only "available" links to the
 * product: the signed-in client's subscription includes it, Ability-Tech has
 * not locked it, and its destination is configured. The other states never
 * link, and nothing defaults to "available". The card is presentation; each
 * product checks access again itself.
 */
export type ProductCardModel =
  | { key: ProductKey; state: "available"; href: string }
  | {
      key: ProductKey;
      state:
        | "not-subscribed"
        | "locked"
        | "unavailable"
        | "configuration-pending";
    };
