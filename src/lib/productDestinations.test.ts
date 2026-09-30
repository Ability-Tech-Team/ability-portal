import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getProductDestinations,
  getProductEntry,
  parseProductDestination,
} from "./productDestinations";

describe("parseProductDestination", () => {
  it.each([undefined, "", "   "])("treats %j as missing", (value) => {
    expect(parseProductDestination(value)).toEqual({ status: "missing" });
  });

  it.each([
    ["http://localhost:3100", "http://localhost:3100"],
    ["http://localhost:3100/", "http://localhost:3100"],
    ["  https://crm.example.com  ", "https://crm.example.com"],
    ["HTTPS://CRM.Example.com", "https://crm.example.com"],
    ["https://apps.example.com/crm/", "https://apps.example.com/crm"],
    ["http://127.0.0.1:3200", "http://127.0.0.1:3200"],
    ["http://[::1]:3200", "http://[::1]:3200"],
    ["http://crm.localhost:3100", "http://crm.localhost:3100"],
  ])("accepts %j", (value, baseUrl) => {
    expect(parseProductDestination(value)).toEqual({
      status: "configured",
      baseUrl,
    });
  });

  it.each([
    ["crm.example.com", "malformed"],
    ["/crm", "malformed"],
    ["//crm.example.com", "malformed"],
    ["localhost:3100", "unsupported-protocol"],
    ["javascript:alert(1)", "unsupported-protocol"],
    ["data:text/html,hello", "unsupported-protocol"],
    ["ftp://crm.example.com", "unsupported-protocol"],
    ["http://crm.example.com", "insecure-http"],
    ["http://localhost.example.com", "insecure-http"],
    ["https://user:secret@crm.example.com", "credentials"],
    ["https://token@crm.example.com", "credentials"],
    ["https://crm.example.com/?token=abc", "query-or-fragment"],
    ["https://crm.example.com/#access_token=abc", "query-or-fragment"],
  ])("rejects %j (%s)", (value, problem) => {
    expect(parseProductDestination(value)).toEqual({
      status: "invalid",
      problem,
    });
  });
});

describe("getProductDestinations", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("reads each product from its own variable", () => {
    vi.stubEnv("NEXT_PUBLIC_CRM_APP_URL", "https://crm.example.com");
    vi.stubEnv(
      "NEXT_PUBLIC_COMMUNITY_ADMIN_APP_URL",
      "https://apps.example.com/community/",
    );

    expect(getProductDestinations()).toEqual({
      crm: { status: "configured", baseUrl: "https://crm.example.com" },
      communityAdmin: {
        status: "configured",
        baseUrl: "https://apps.example.com/community",
      },
    });
  });

  it("reports problems without logging the rejected value", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv(
      "NEXT_PUBLIC_CRM_APP_URL",
      "https://user:secret@crm.example.com",
    );
    vi.stubEnv("NEXT_PUBLIC_COMMUNITY_ADMIN_APP_URL", "");

    expect(getProductDestinations()).toEqual({
      crm: { status: "invalid", problem: "credentials" },
      communityAdmin: { status: "missing" },
    });
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls.flat().join(" ")).not.toContain("secret");
  });
});

describe("getProductEntry", () => {
  it("keeps the selected locale for products that serve it", () => {
    expect(getProductEntry("crm", "http://localhost:3100", "ar")).toEqual({
      href: "http://localhost:3100/ar",
      hrefLang: "ar",
    });
    expect(
      getProductEntry(
        "communityAdmin",
        "https://apps.example.com/community",
        "en",
      ),
    ).toEqual({
      href: "https://apps.example.com/community/en",
      hrefLang: "en",
    });
  });

  it("links to the product root for a locale the product does not serve", () => {
    expect(getProductEntry("crm", "http://localhost:3100", "fr")).toEqual({
      href: "http://localhost:3100/",
    });
  });
});
