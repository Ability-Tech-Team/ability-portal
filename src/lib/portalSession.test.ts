import { describe, expect, it } from "vitest";
import { readAccessTokenCookie, readTokenExpiry } from "./accessToken";
import {
  decodePortalSession,
  encodePortalSession,
  toProductAccess,
  toProductDestinations,
  toReturnDestinations,
  type PortalSession,
} from "./portalSession";

function jwt(payload: unknown) {
  const part = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${part({ alg: "HS256" })}.${part(payload)}.signature`;
}

const session: PortalSession = {
  account: { email: "ahmed@client.example", name: "أحمد علي" },
  platforms: [{ key: "crm", url: "https://crm.client.example" }],
};

describe("readTokenExpiry", () => {
  it("reads the exp claim", () => {
    expect(readTokenExpiry(jwt({ exp: 1_800_000_000 }))).toEqual(
      new Date(1_800_000_000_000),
    );
  });

  it.each([
    ["a missing exp", jwt({ sub: "1" })],
    ["a string exp", jwt({ exp: "1800000000" })],
    ["a non-JWT", "a".repeat(43)],
    ["an unreadable payload", "aaa.%%%.ccc"],
    ["a payload that isn't JSON", "aaa.bm90LWpzb24.ccc"],
    ["an oversized token", jwt({ exp: 1, pad: "x".repeat(5000) })],
    ["no token", undefined],
  ])("returns null for %s", (_name, token) => {
    expect(readTokenExpiry(token)).toBeNull();
  });
});

describe("readAccessTokenCookie", () => {
  it("reads the access_token value among other cookies", () => {
    expect(
      readAccessTokenCookie([
        "other=1; Path=/",
        "access_token=a.b%2Bc; Max-Age=21600; Path=/; HttpOnly",
      ]),
    ).toBe("a.b+c");
  });

  it.each([[[]], [["access_token=; Path=/"]], [["x_access_token=a.b.c"]]])(
    "returns null for %j",
    (headers) => {
      expect(readAccessTokenCookie(headers)).toBeNull();
    },
  );
});

describe("portal session cookie", () => {
  it("round-trips", () => {
    expect(decodePortalSession(encodePortalSession(session))).toEqual(session);
  });

  it.each([
    ["no value", undefined],
    ["an empty value", ""],
    ["a value that isn't base64url JSON", "not json"],
    [
      "an unknown platform",
      Buffer.from(
        JSON.stringify({ ...session, platforms: [{ key: "x", url: "y" }] }),
      ).toString("base64url"),
    ],
    ["an oversized value", "a".repeat(4000)],
  ])("rejects %s", (_name, value) => {
    expect(decodePortalSession(value)).toBeNull();
  });
});

describe("toProductAccess", () => {
  it("makes only listed platforms available", () => {
    expect(toProductAccess(session.platforms)).toEqual({
      crm: "available",
      communityAdmin: "not_subscribed",
    });
    expect(toProductAccess([])).toEqual({
      crm: "not_subscribed",
      communityAdmin: "not_subscribed",
    });
  });
});

describe("toReturnDestinations", () => {
  it("keeps only each platform's site", () => {
    expect(
      toReturnDestinations([
        {
          key: "crm",
          url: "https://crm.ability-tech.com/en/dashboard/statistics",
        },
      ]),
    ).toEqual({
      crm: { status: "configured", baseUrl: "https://crm.ability-tech.com" },
      communityAdmin: { status: "missing" },
    });
  });
});

describe("toProductDestinations", () => {
  it("validates each platform address", () => {
    expect(
      toProductDestinations([
        { key: "crm", url: "https://crm.client.example/" },
        { key: "communityAdmin", url: "javascript:alert(1)" },
      ]),
    ).toEqual({
      crm: { status: "configured", baseUrl: "https://crm.client.example" },
      communityAdmin: { status: "invalid", problem: "unsupported-protocol" },
    });
    expect(toProductDestinations([]).crm).toEqual({ status: "missing" });
  });
});
