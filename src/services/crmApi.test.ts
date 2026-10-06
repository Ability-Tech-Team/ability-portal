import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkCrmToken } from "./crmApi";

const fetchMock = vi.fn<typeof fetch>();

function envelope(statusCode: number, success: boolean) {
  return new Response(JSON.stringify({ success, statusCode, result: {} }), {
    status: 200,
  });
}

beforeEach(() => {
  vi.stubEnv("CRM_API_URL", "https://crm-api.example.com/");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("checkCrmToken", () => {
  it("sends the token in the access_token cookie", async () => {
    fetchMock.mockResolvedValueOnce(envelope(200, true));

    expect(await checkCrmToken("a.b.c", "en")).toMatchObject({
      outcome: "accepted",
      url: "https://crm-api.example.com/definitions/contact-channels",
    });

    const init = fetchMock.mock.lastCall?.[1];
    expect(new Headers(init?.headers).get("cookie")).toBe("access_token=a.b.c");
  });

  it.each([
    [401, false, "rejected"],
    [403, false, "accepted"],
    [500, false, "unexpected"],
  ])("reads a body status of %i as %s", async (statusCode, success, outcome) => {
    fetchMock.mockResolvedValueOnce(envelope(statusCode, success));

    expect((await checkCrmToken("a.b.c", "en")).outcome).toBe(outcome);
  });

  it("reports an unreachable API", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    expect((await checkCrmToken("a.b.c", "en")).outcome).toBe("unreachable");
  });

  it("does nothing without CRM_API_URL", async () => {
    vi.stubEnv("CRM_API_URL", "");

    expect(await checkCrmToken("a.b.c", "en")).toEqual({
      outcome: "not-configured",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
