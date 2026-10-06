import { describe, expect, it } from "vitest";
import { describeCookieTravel } from "./cookieTravel";

describe("describeCookieTravel", () => {
  it("sends a shared-domain cookie to a sibling subdomain (production)", () => {
    expect(
      describeCookieTravel(
        "portal.ability-tech.com",
        "crm-api.ability-tech.com",
        "ability-tech.com",
      ),
    ).toMatchObject({
      cookieScope: ".ability-tech.com and its subdomains",
      hostMatches: true,
      sameSite: true,
      browserSendsCookie: true,
    });
  });

  it("keeps a localhost cookie away from an API on another host", () => {
    expect(
      describeCookieTravel("localhost", "172.20.1.141", undefined),
    ).toMatchObject({
      cookieScope: "localhost only",
      browserSendsCookie: false,
    });
  });

  it("ignores a domain the Portal isn't inside", () => {
    expect(
      describeCookieTravel("localhost", "crm-api.ability-tech.com", "ability-tech.com"),
    ).toMatchObject({ cookieScope: "localhost only", browserSendsCookie: false });
  });

  it("doesn't send a Lax cookie to another site", () => {
    expect(
      describeCookieTravel(
        "portal.ability-tech.com",
        "dev-api.amer-group.com",
        "ability-tech.com",
      ),
    ).toMatchObject({ hostMatches: false, sameSite: false, browserSendsCookie: false });
  });
});
