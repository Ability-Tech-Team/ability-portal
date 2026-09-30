import { describe, expect, it } from "vitest";
import { buildProductCards } from "./utils";

describe("buildProductCards", () => {
  it("links only products whose destination is configured", () => {
    expect(
      buildProductCards(
        {
          crm: { status: "configured", baseUrl: "http://localhost:3100" },
          communityAdmin: { status: "invalid", problem: "credentials" },
        },
        "ar",
      ),
    ).toEqual([
      {
        key: "crm",
        state: "linked",
        href: "http://localhost:3100/ar",
        hrefLang: "ar",
      },
      { key: "communityAdmin", state: "configuration-pending" },
    ]);
  });

  it("gives missing destinations no link", () => {
    const cards = buildProductCards(
      { crm: { status: "missing" }, communityAdmin: { status: "missing" } },
      "en",
    );

    expect(cards.map((card) => card.state)).toEqual([
      "configuration-pending",
      "configuration-pending",
    ]);
    expect(cards.some((card) => "href" in card)).toBe(false);
  });
});
