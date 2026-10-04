import {
  getProductEntry,
  PRODUCT_KEYS,
  type ProductDestination,
  type ProductKey,
} from "@/src/lib/productDestinations";
import type { ProductAccess } from "@/src/types/account";
import type { ProductCardModel } from "./types";

/**
 * Products from left to right on screen. Ability CRM sits on the right in
 * both languages (the user's choice), so the reading order differs by
 * direction: Community Admin first in English, Ability CRM first in Arabic.
 */
export const PRODUCTS_LEFT_TO_RIGHT: readonly ProductKey[] = [
  "communityAdmin",
  "crm",
];

/**
 * Builds one card per product for the signed-in client, in `PRODUCT_KEYS`
 * order (see `orderCardsForScreen` for the display order). The access state
 * decides first, so a locked product never shows its link; an available
 * product links only when its destination is configured.
 */
export function buildProductCards(
  destinations: Record<ProductKey, ProductDestination>,
  locale: string,
  access: ProductAccess,
): ProductCardModel[] {
  return PRODUCT_KEYS.map((key): ProductCardModel => {
    switch (access[key]) {
      case "not_subscribed":
        return { key, state: "not-subscribed" };
      case "locked":
        return { key, state: "locked" };
      case "available":
        break;
      default:
        return { key, state: "unavailable" };
    }

    const destination = destinations[key];

    if (destination.status !== "configured") {
      return { key, state: "configuration-pending" };
    }

    return {
      key,
      state: "available",
      ...getProductEntry(key, destination.baseUrl, locale),
    };
  });
}

/**
 * Puts cards in reading order for the page direction so that each product
 * keeps its side of the screen (see PRODUCTS_LEFT_TO_RIGHT). The DOM order
 * is the reading and focus order, so the layout never reorders visually.
 */
export function orderCardsForScreen(
  cards: readonly ProductCardModel[],
  direction: "ltr" | "rtl",
): ProductCardModel[] {
  const readingOrder =
    direction === "rtl"
      ? [...PRODUCTS_LEFT_TO_RIGHT].reverse()
      : [...PRODUCTS_LEFT_TO_RIGHT];
  const position = (key: ProductKey) => {
    const index = readingOrder.indexOf(key);
    return index === -1 ? readingOrder.length : index;
  };

  return [...cards].sort((a, b) => position(a.key) - position(b.key));
}
