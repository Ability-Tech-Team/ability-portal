import { describe, expect, it } from "vitest";
import type { ProductDestination, ProductKey } from "@/src/lib/productDestinations";
import type { ProductAccess } from "@/src/types/account";
import type { ProductCardModel } from "./types";
import { buildProductCards, orderCardsForScreen } from "./utils";

const configured: Record<ProductKey, ProductDestination> = {
  crm: {
    status: "configured",
    baseUrl: "https://crm.ability-tech.com/en/dashboard/statistics",
  },
  communityAdmin: { status: "configured", baseUrl: "http://localhost:3200" },
};

const bothAvailable: ProductAccess = {
  crm: "available",
  communityAdmin: "available",
};

describe("buildProductCards", () => {
  it("links available products to the returned entry link, unchanged", () => {
    expect(buildProductCards(configured, bothAvailable)).toEqual([
      {
        key: "crm",
        state: "available",
        href: "https://crm.ability-tech.com/en/dashboard/statistics",
      },
      {
        key: "communityAdmin",
        state: "available",
        href: "http://localhost:3200",
      },
    ]);
  });

  it("locks products outside the subscription or locked for the client, without a link", () => {
    const cards = buildProductCards(configured, {
      crm: "not_subscribed",
      communityAdmin: "locked",
    });

    expect(cards).toEqual([
      { key: "crm", state: "not-subscribed" },
      { key: "communityAdmin", state: "locked" },
    ]);
  });

  it("never opens a product whose state is unknown", () => {
    const cards = buildProductCards(configured, {
      crm: "unknown",
      communityAdmin: "available",
    });

    expect(cards[0]).toEqual({ key: "crm", state: "unavailable" });
    expect(cards[1].state).toBe("available");
  });

  it("gives available products without a valid destination no link", () => {
    const cards = buildProductCards(
      {
        crm: { status: "missing" },
        communityAdmin: { status: "invalid", problem: "credentials" },
      },
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
      { crm: "locked", communityAdmin: "not_subscribed" },
    );

    expect(cards.map((card) => card.state)).toEqual([
      "locked",
      "not-subscribed",
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
