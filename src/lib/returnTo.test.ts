import { describe, expect, it } from "vitest";
import type { ProductDestination, ProductKey } from "./productDestinations";
import { resolveReturnTo } from "./returnTo";

const destinations: Record<ProductKey, ProductDestination> = {
  crm: { status: "configured", baseUrl: "https://apps.example.com/crm" },
  communityAdmin: {
    status: "configured",
    baseUrl: "https://community.example.com",
  },
};

describe("resolveReturnTo", () => {
  it.each([
    ["https://apps.example.com/crm", "crm"],
    ["https://apps.example.com/crm/ar/customers?page=2", "crm"],
    ["https://community.example.com/en", "communityAdmin"],
  ])("accepts %j inside a configured product", (value, product) => {
    expect(resolveReturnTo(value, destinations)).toEqual({
      url: value,
      product,
    });
  });

  it("drops a fragment", () => {
    expect(
      resolveReturnTo("https://community.example.com/en#section", destinations),
    ).toEqual({ url: "https://community.example.com/en", product: "communityAdmin" });
  });

  it.each([
    undefined,
    "",
    "/en",
    "//evil.example",
    "https://evil.example/crm",
    "https://apps.example.com/other",
    "https://apps.example.com/crmx",
    "https://apps.example.com/crm/../other",
    "http://apps.example.com/crm",
    "https://user:pass@apps.example.com/crm",
    "javascript:alert(1)",
    "https://community.example.com.evil.example/en",
    `https://community.example.com/${"a".repeat(2100)}`,
  ])("rejects %j", (value) => {
    expect(resolveReturnTo(value, destinations)).toBeNull();
  });

  it("ignores products without a configured destination", () => {
    expect(
      resolveReturnTo("https://community.example.com/en", {
        ...destinations,
        communityAdmin: { status: "missing" },
      }),
    ).toBeNull();
  });
});
