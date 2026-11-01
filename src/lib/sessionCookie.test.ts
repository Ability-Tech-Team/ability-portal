import { describe, expect, it } from "vitest";
import {
  buildSessionCookieOptions,
  parseCookieDomain,
  shouldUseSecureCookie,
} from "./sessionCookie";

describe("parseCookieDomain", () => {
  it.each([undefined, "", "  "])("treats %j as unset", (value) => {
    expect(parseCookieDomain(value)).toEqual({ status: "unset" });
  });

  it.each([
    ["apps.ability-tech.com", "apps.ability-tech.com"],
    [" .Apps.Example.com ", "apps.example.com"],
  ])("accepts %j", (value, domain) => {
    expect(parseCookieDomain(value)).toEqual({ status: "configured", domain });
  });

  it.each([
    "localhost",
    "https://apps.example.com",
    "apps.example.com:443",
    "apps.example.com/path",
    "-apps.example.com",
    "apps..example.com",
  ])("rejects %j", (value) => {
    expect(parseCookieDomain(value)).toEqual({ status: "invalid" });
  });
});

describe("shouldUseSecureCookie", () => {
  it.each([
    ["http://localhost:3300", false],
    ["http://127.0.0.1:3300", false],
    ["https://localhost:3300", true],
    ["https://portal.example.com", true],
    ["http://portal.example.com", true],
    [null, true],
    ["not a url", true],
  ])("for origin %j is %j", (origin, secure) => {
    expect(shouldUseSecureCookie(origin)).toBe(secure);
  });
});

describe("buildSessionCookieOptions", () => {
  const expires = new Date("2026-10-01T22:30:00Z");

  it("builds an httpOnly, SameSite=Lax cookie for the whole site", () => {
    expect(buildSessionCookieOptions({ expires, secure: true })).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires,
    });
  });

  it("adds the shared parent domain when configured", () => {
    expect(
      buildSessionCookieOptions({
        expires,
        secure: true,
        domain: "apps.example.com",
      }).domain,
    ).toBe("apps.example.com");
  });
});
