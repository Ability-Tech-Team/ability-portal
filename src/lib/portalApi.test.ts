import { afterEach, describe, expect, it, vi } from "vitest";
import { getPortalApiUrl } from "./portalApi";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getPortalApiUrl", () => {
  it("accepts https, and http on loopback or private-network dev hosts", () => {
    for (const [value, expected] of [
      ["https://portal-api.example.com/", "https://portal-api.example.com"],
      ["http://172.20.1.141:9995", "http://172.20.1.141:9995"],
      ["http://localhost:3498", "http://localhost:3498"],
    ]) {
      vi.stubEnv("NEXT_PUBLIC_PORTAL_API_URL", value);
      expect(getPortalApiUrl()).toBe(expected);
    }
  });

  it.each([undefined, "", "http://portal-api.example.com", "https://user:pw@portal-api.example.com", "https://x.example/?token=1"])(
    "has no address for %j",
    (value) => {
      vi.stubEnv("NEXT_PUBLIC_PORTAL_API_URL", value as string);
      expect(getPortalApiUrl()).toBeNull();
    },
  );
});
