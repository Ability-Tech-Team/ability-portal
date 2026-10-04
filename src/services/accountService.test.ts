import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSession,
  requestPasswordReset,
  setPassword,
  signIn,
  signOut,
} from "./accountService";

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

describe("signIn", () => {
  it("posts the credentials with the app's credentials and returns the session", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        session: { token: TOKEN, expiresAt: "2026-10-01T22:30:00Z" },
        account: { id: "acc_1", email: "owner@client.example", name: "Client" },
      }),
    );

    const result = await signIn({
      email: "owner@client.example",
      password: " pass with spaces ",
      endUserIp: "203.0.113.7",
    });

    expect(result).toEqual({
      ok: true,
      session: { token: TOKEN, expiresAt: new Date("2026-10-01T22:30:00Z") },
    });

    const { url, init, headers } = lastRequest();
    expect(url).toBe("http://localhost:3400/v1/auth/sign-in");
    expect(init.method).toBe("POST");
    expect(init.redirect).toBe("error");
    expect(JSON.parse(String(init.body))).toEqual({
      email: "owner@client.example",
      password: " pass with spaces ",
    });
    expect(headers.get("authorization")).toBe(
      `Basic ${Buffer.from("ability-portal:s3cret").toString("base64")}`,
    );
    expect(headers.get("x-end-user-ip")).toBe("203.0.113.7");
    expect(headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
  });

  it.each([
    [401, "invalid_credentials", { ok: false, reason: "invalid_credentials" }],
    [403, "account_disabled", { ok: false, reason: "account_disabled" }],
  ])("maps %i %s", async (status, code, expected) => {
    fetchMock.mockResolvedValueOnce(jsonResponse(status, errorBody(code)));

    expect(await signIn({ email: "a@b.co", password: "x" })).toEqual(expected);
  });

  it("reports throttling with the Retry-After delay", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(429, errorBody("too_many_attempts"), { "Retry-After": "90" }),
    );

    expect(await signIn({ email: "a@b.co", password: "x" })).toEqual({
      ok: false,
      reason: "too_many_attempts",
      retryAfterSeconds: 90,
    });
  });

  it("reads a Retry-After date", async () => {
    const inTwoMinutes = new Date(Date.now() + 120_000).toUTCString();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(429, errorBody("too_many_attempts"), {
        "Retry-After": inTwoMinutes,
      }),
    );

    const result = await signIn({ email: "a@b.co", password: "x" });

    expect(result.ok).toBe(false);
    expect(
      !result.ok && result.reason === "too_many_attempts"
        ? result.retryAfterSeconds
        : null,
    ).toBeGreaterThan(100);
  });

  it.each([
    ["wrong app credentials", jsonResponse(401, errorBody("invalid_client"))],
    ["a server error", jsonResponse(500, errorBody("internal"))],
    [
      "a malformed token",
      jsonResponse(200, {
        session: { token: "short", expiresAt: "2026-10-01T22:30:00Z" },
      }),
    ],
    ["a non-JSON body", new Response("<html>", { status: 200 })],
  ])("treats %s as unavailable", async (_name, response) => {
    fetchMock.mockResolvedValueOnce(response);

    expect(await signIn({ email: "a@b.co", password: "x" })).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("treats a network failure as unavailable without logging the request", async () => {
    fetchMock.mockRejectedValueOnce(
      new TypeError("fetch failed", { cause: { code: "ECONNREFUSED" } }),
    );

    expect(await signIn({ email: "a@b.co", password: "hunter2" })).toEqual({
      ok: false,
      reason: "unavailable",
    });

    const logged = vi.mocked(console.error).mock.calls.flat().join(" ");
    expect(logged).toContain("ECONNREFUSED");
    expect(logged).not.toContain("hunter2");
  });

  it("does not call the service without its configuration", async () => {
    vi.stubEnv("ACCOUNT_SERVICE_CLIENT_SECRET", "");

    expect(await signIn({ email: "a@b.co", password: "x" })).toEqual({
      ok: false,
      reason: "unavailable",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("getSession", () => {
  it("returns the account and each product's state", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        account: { id: "acc_1", email: "owner@client.example", name: "Client" },
        session: { expiresAt: "2026-10-01T22:30:00Z" },
        products: {
          crm: { state: "available" },
          communityAdmin: { state: "not_subscribed" },
        },
      }),
    );

    expect(await getSession(TOKEN)).toEqual({
      status: "active",
      account: { id: "acc_1", email: "owner@client.example", name: "Client" },
      products: { crm: "available", communityAdmin: "not_subscribed" },
    });

    const { url, init, headers } = lastRequest();
    expect(url).toBe("http://localhost:3400/v1/auth/session");
    expect(init.method).toBe("GET");
    expect(headers.get("x-session-token")).toBe(TOKEN);
  });

  it("treats missing and unknown product states as unknown, never available", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        account: { id: "acc_1", email: "owner@client.example", name: "Client" },
        products: { crm: { state: "trial_expired" } },
      }),
    );

    const result = await getSession(TOKEN);

    expect(result.status === "active" ? result.products : null).toEqual({
      crm: "unknown",
      communityAdmin: "unknown",
    });
  });

  it("reports an ended session", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, errorBody("session_invalid")));

    expect(await getSession(TOKEN)).toEqual({ status: "invalid" });
  });

  it.each([
    ["a server error", () => Promise.resolve(jsonResponse(503, errorBody("unavailable")))],
    ["wrong app credentials", () => Promise.resolve(jsonResponse(401, errorBody("invalid_client")))],
    ["a timeout", () => Promise.reject(new DOMException("timed out", "TimeoutError"))],
    ["a body without products", () => Promise.resolve(jsonResponse(200, { account: { id: "1", email: "a@b.co", name: "" } }))],
  ])("treats %s as unavailable", async (_name, respond) => {
    fetchMock.mockImplementationOnce(respond);

    expect(await getSession(TOKEN)).toEqual({ status: "unavailable" });
  });
});

describe("signOut", () => {
  it("ends the session in the service", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await signOut(TOKEN);

    const { url, init, headers } = lastRequest();
    expect(url).toBe("http://localhost:3400/v1/auth/sign-out");
    expect(init.method).toBe("POST");
    expect(headers.get("x-session-token")).toBe(TOKEN);
    expect(console.error).not.toHaveBeenCalled();
  });
});

describe("requestPasswordReset", () => {
  it("accepts the service's answer, whatever the address", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 202 }));

    expect(
      await requestPasswordReset({ email: "a@b.co", locale: "ar" }),
    ).toEqual({ ok: true });
    expect(JSON.parse(String(lastRequest().init.body))).toEqual({
      email: "a@b.co",
      locale: "ar",
    });
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
