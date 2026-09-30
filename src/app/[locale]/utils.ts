import {
  getProductEntry,
  PRODUCT_KEYS,
  type ProductDestination,
  type ProductKey,
} from "@/src/lib/productDestinations";
import type { ProductCardModel } from "./types";

/** Builds the cards in display order; only valid destinations get a link. */
export function buildProductCards(
  destinations: Record<ProductKey, ProductDestination>,
  locale: string,
): ProductCardModel[] {
  return PRODUCT_KEYS.map((key): ProductCardModel => {
    const destination = destinations[key];

    if (destination.status !== "configured") {
      return { key, state: "configuration-pending" };
    }

    return {
      key,
      state: "linked",
      ...getProductEntry(key, destination.baseUrl, locale),
    };
  });
}
