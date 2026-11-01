import { describe, expect, it } from "vitest";
import type { ProductDestination, ProductKey } from "@/src/lib/productDestinations";
import type { ProductAccess } from "@/src/lib/signInAnswer";
import type { ProductCardModel } from "./types";
import { buildProductCards, orderCardsForScreen } from "./utils";

const configured: Record<ProductKey, ProductDestination> = {
  crm: { status: "configured", baseUrl: "http://localhost:3100" },
  communityAdmin: { status: "configured", baseUrl: "http://localhost:3200" },
};

const bothAvailable: ProductAccess = {
  crm: "available",
  communityAdmin: "available",
};

describe("buildProductCards", () => {
  it("links available products in the page's locale", () => {
    expect(buildProductCards(configured, "ar", bothAvailable)).toEqual([
      {
        key: "crm",
        state: "available",
        href: "http://localhost:3100/ar",
        hrefLang: "ar",
      },
      {
        key: "communityAdmin",
        state: "available",
        href: "http://localhost:3200/ar",
        hrefLang: "ar",
      },
    ]);
  });

  it("gives products the sign-in doesn't include no link", () => {
    const cards = buildProductCards(configured, "en", {
      crm: "available",
      communityAdmin: "not_included",
    });

    expect(cards[0].state).toBe("available");
    expect(cards[1]).toEqual({ key: "communityAdmin", state: "not-included" });
  });

  it("gives available products without a valid destination no link", () => {
    const cards = buildProductCards(
      {
        crm: { status: "missing" },
        communityAdmin: { status: "invalid", problem: "credentials" },
      },
      "en",
      bothAvailable,
    );

    expect(cards.map((card) => card.state)).toEqual([
      "configuration-pending",
      "configuration-pending",
    ]);
    expect(cards.some((card) => "href" in card)).toBe(false);
  });

  it("shows the access state, not the configuration, for products the client can't open", () => {
    const cards = buildProductCards(
      { crm: { status: "missing" }, communityAdmin: { status: "missing" } },
      "en",
      { crm: "not_included", communityAdmin: "not_included" },
    );

    expect(cards.map((card) => card.state)).toEqual([
      "not-included",
      "not-included",
    ]);
  });
});

describe("orderCardsForScreen", () => {
  const cards: ProductCardModel[] = [
    { key: "crm", state: "available", href: "http://localhost:3100/en" },
    { key: "communityAdmin", state: "configuration-pending" },
  ];

  it("reads Community Admin first in left-to-right pages, keeping CRM on the right", () => {
    expect(orderCardsForScreen(cards, "ltr").map((card) => card.key)).toEqual([
      "communityAdmin",
      "crm",
    ]);
  });

  it("reads Ability CRM first in right-to-left pages, keeping CRM on the right", () => {
    expect(orderCardsForScreen(cards, "rtl").map((card) => card.key)).toEqual([
      "crm",
      "communityAdmin",
    ]);
  });

  it("does not change the cards it is given", () => {
    const copy = structuredClone(cards);
    orderCardsForScreen(cards, "ltr");
    expect(cards).toEqual(copy);
  });
});
