import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestPasswordReset, setPassword } from "./accountService";

const TOKEN = "a".repeat(43);
const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function errorBody(code: string, extra: Record<string, unknown> = {}) {
  return { error: { code, message: "for logs", ...extra } };
}

function lastRequest() {
  const [url, init] = fetchMock.mock.lastCall ?? [];
  return { url: String(url), init: init ?? {}, headers: new Headers(init?.headers) };
}

beforeEach(() => {
  vi.stubEnv("ACCOUNT_SERVICE_URL", "http://localhost:3400/");
  vi.stubEnv("ACCOUNT_SERVICE_CLIENT_ID", "ability-portal");
  vi.stubEnv("ACCOUNT_SERVICE_CLIENT_SECRET", "s3cret");
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("requestPasswordReset", () => {
  it("accepts the service's answer, whatever the address", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 202 }));

    expect(
      await requestPasswordReset({
        email: "a@b.co",
        locale: "ar",
        endUserIp: "203.0.113.7",
      }),
    ).toEqual({ ok: true });

    const { url, init, headers } = lastRequest();
    expect(url).toBe("http://localhost:3400/v1/auth/password-reset");
    expect(init.redirect).toBe("error");
    expect(JSON.parse(String(init.body))).toEqual({
      email: "a@b.co",
      locale: "ar",
    });
    expect(headers.get("authorization")).toBe(
      `Basic ${Buffer.from("ability-portal:s3cret").toString("base64")}`,
    );
    expect(headers.get("x-end-user-ip")).toBe("203.0.113.7");
    expect(headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("reads a Retry-After date", async () => {
    const inTwoMinutes = new Date(Date.now() + 120_000).toUTCString();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(429, errorBody("too_many_attempts"), {
        "Retry-After": inTwoMinutes,
      }),
    );

    const result = await requestPasswordReset({ email: "a@b.co", locale: "en" });

    expect(
      !result.ok && result.reason === "too_many_attempts"
        ? result.retryAfterSeconds
        : null,
    ).toBeGreaterThan(100);
  });

  it.each([
    ["wrong app credentials", jsonResponse(401, errorBody("invalid_client"))],
    ["a server error", jsonResponse(500, errorBody("internal"))],
  ])("treats %s as unavailable", async (_name, response) => {
    fetchMock.mockResolvedValueOnce(response);

    expect(
      await requestPasswordReset({ email: "a@b.co", locale: "en" }),
    ).toEqual({ ok: false, reason: "unavailable" });
  });

  it("treats a network failure as unavailable without logging the request", async () => {
    fetchMock.mockRejectedValueOnce(
      new TypeError("fetch failed", { cause: { code: "ECONNREFUSED" } }),
    );

    expect(
      await requestPasswordReset({ email: "secret@b.co", locale: "en" }),
    ).toEqual({ ok: false, reason: "unavailable" });

    const logged = vi.mocked(console.error).mock.calls.flat().join(" ");
    expect(logged).toContain("ECONNREFUSED");
    expect(logged).not.toContain("secret@b.co");
  });

  it("does not call the service without its configuration", async () => {
    vi.stubEnv("ACCOUNT_SERVICE_CLIENT_SECRET", "");

    expect(
      await requestPasswordReset({ email: "a@b.co", locale: "en" }),
    ).toEqual({ ok: false, reason: "unavailable" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports throttling", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(429, errorBody("too_many_attempts")),
    );

    expect(
      await requestPasswordReset({ email: "a@b.co", locale: "en" }),
    ).toEqual({ ok: false, reason: "too_many_attempts", retryAfterSeconds: null });
  });
});

describe("setPassword", () => {
  it("sets the password", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    expect(await setPassword({ token: TOKEN, password: "p".repeat(15) })).toEqual(
      { ok: true },
    );
    expect(lastRequest().url).toBe("http://localhost:3400/v1/auth/password");
  });

  it("reports an invalid link", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(400, errorBody("token_invalid")));

    expect(await setPassword({ token: TOKEN, password: "x" })).toEqual({
      ok: false,
      reason: "token_invalid",
    });
  });

  it("passes on the policy rule and its limit", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        422,
        errorBody("password_rejected", { reason: "too_short", minLength: 16 }),
      ),
    );

    expect(await setPassword({ token: TOKEN, password: "x" })).toEqual({
      ok: false,
      reason: "password_rejected",
      rule: "too_short",
      minLength: 16,
      maxLength: undefined,
    });
  });

  it("maps an unknown rejection reason to a generic rule", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(422, errorBody("password_rejected", { reason: "contains_email" })),
    );

    const result = await setPassword({ token: TOKEN, password: "x" });

    expect(
      !result.ok && result.reason === "password_rejected" ? result.rule : null,
    ).toBe("other");
  });
});
