import { afterEach, describe, expect, it, vi } from "vitest";
import { signIn, signOut } from "./portalAuth";

const BASE = "http://172.20.1.141:9995";
const CREDENTIALS = { email: "owner@client.example", password: "pa ss" };

function answer(status: number, body: unknown, headers: Record<string, string> = {}) {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", ...headers },
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("signIn", () => {
  it("posts the credentials in the body, with the browser's cookies", async () => {
    const fetchMock = answer(200, { step: "done", session: {} });
    vi.stubGlobal("fetch", fetchMock);

    await signIn(BASE, CREDENTIALS);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${BASE}/api/auth/login`);
    expect(url).not.toContain("pa");
    expect(init).toMatchObject({ method: "POST", credentials: "include", redirect: "error" });
    expect(JSON.parse(String(init.body))).toEqual(CREDENTIALS);
  });

  it("returns a completed sign-in's answer", async () => {
    const body = { step: "done", session: { user_name: "owner" } };
    vi.stubGlobal("fetch", answer(200, body));

    expect(await signIn(BASE, CREDENTIALS)).toEqual({ ok: true, answer: body });
  });

  it("reports a step that asks to choose a client or project", async () => {
    vi.stubGlobal("fetch", answer(200, { step: "choose_project" }));

    expect(await signIn(BASE, CREDENTIALS)).toEqual({ ok: false, reason: "choice_required" });
  });

  it.each([401, 422])("reports HTTP %i as wrong credentials", async (status) => {
    vi.stubGlobal(
      "fetch",
      answer(status, { success: false, statusCode: status, message: "Invalid email or password" }),
    );

    expect(await signIn(BASE, CREDENTIALS)).toEqual({ ok: false, reason: "invalid_credentials" });
  });

  it("reads Retry-After on 429", async () => {
    vi.stubGlobal("fetch", answer(429, {}, { "Retry-After": "120" }));

    expect(await signIn(BASE, CREDENTIALS)).toEqual({
      ok: false,
      reason: "too_many_attempts",
      retryAfterSeconds: 120,
    });
  });

  it("allows a 429 without a readable Retry-After", async () => {
    vi.stubGlobal("fetch", answer(429, {}));

    expect(await signIn(BASE, CREDENTIALS)).toMatchObject({ retryAfterSeconds: null });
  });

  it.each([
    ["the client's backend not answering (503)", answer(503, {})],
    ["a server error", answer(500, {})],
    ["a 200 that isn't an answer", answer(200, ["done"])],
    ["a body that isn't JSON", vi.fn(async () => new Response("<html>", { status: 200 }))],
    // A browser CORS block and a network failure both reject with TypeError.
    ["a blocked or failed request", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch")))],
  ])("reports %s as unavailable", async (_, fetchMock) => {
    vi.stubGlobal("fetch", fetchMock);

    expect(await signIn(BASE, CREDENTIALS)).toEqual({ ok: false, reason: "unavailable" });
  });
});

describe("signOut", () => {
  it("asks the backend to clear its cookie", async () => {
    const fetchMock = answer(200, { message: "Logged out successfully" });
    vi.stubGlobal("fetch", fetchMock);

    expect(await signOut(BASE)).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${BASE}/api/auth/logout`);
    expect(init).toMatchObject({ method: "POST", credentials: "include" });
  });

  it("is best effort", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));

    expect(await signOut(BASE)).toBe(false);
  });
});
