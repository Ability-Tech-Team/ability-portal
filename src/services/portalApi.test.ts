import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logIn } from "./portalApi";

const fetchMock = vi.fn<typeof fetch>();
const EXP = Math.floor(Date.now() / 1000) + 6 * 60 * 60;

function jwt(payload: Record<string, unknown>) {
  const part = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${part({ alg: "HS256" })}.${part(payload)}.signature`;
}

const TOKEN = jwt({ employee_id: 7, exp: EXP });

function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function errorBody(statusCode: number, message: string) {
  return { success: false, statusCode, error: "Error", message };
}

const client = { code: "golf-marina", nameEn: "Golf Marina", nameAr: "جولف مارينا" };

const doneBody = {
  step: "done",
  client,
  platforms: [
    { key: "crm", url: "https://crm.golf-marina.example" },
    { key: "community-admin", url: "https://community.golf-marina.example" },
    { key: "mobile", url: "https://m.example" },
  ],
  mustChangePassword: false,
  session: { employee_name: " Ahmed Ali ", user_name: "ahmed" },
};

function lastRequest() {
  const [url, init] = fetchMock.mock.lastCall ?? [];
  return {
    url: String(url),
    init: init ?? {},
    headers: new Headers(init?.headers),
    body: JSON.parse(String(init?.body)),
  };
}

const credentials = {
  email: "ahmed@client.example",
  password: " pass with spaces ",
  locale: "ar",
};

beforeEach(() => {
  vi.stubEnv("PORTAL_API_URL", "http://172.20.1.141:9995/");
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

describe("logIn", () => {
  it("posts the credentials and returns the token, account, and platforms", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, doneBody, {
        "Set-Cookie": `access_token=${TOKEN}; Max-Age=21600; Path=/; HttpOnly; SameSite=Lax`,
      }),
    );

    const result = await logIn({ ...credentials, endUserIp: "203.0.113.7" });

    expect(result).toEqual({
      ok: true,
      step: "done",
      token: TOKEN,
      expiresAt: new Date(EXP * 1000),
      account: { email: "ahmed@client.example", name: "Ahmed Ali" },
      platforms: [
        { key: "crm", url: "https://crm.golf-marina.example" },
        { key: "communityAdmin", url: "https://community.golf-marina.example" },
      ],
    });

    const { url, init, headers, body } = lastRequest();
    expect(url).toBe("http://172.20.1.141:9995/api/auth/login");
    expect(init.method).toBe("POST");
    expect(init.redirect).toBe("error");
    expect(body).toEqual({
      email: "ahmed@client.example",
      password: " pass with spaces ",
    });
    expect(headers.get("accept-language")).toBe("ar");
    expect(headers.get("x-forwarded-for")).toBe("203.0.113.7");
  });

  it("sends the chosen client and project", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        step: "chooseProject",
        client,
        projects: [{ id: 3, nameEn: "Tower A", nameAr: "البرج أ" }],
      }),
    );

    expect(
      await logIn({ ...credentials, clientCode: "golf-marina", projectId: 3 }),
    ).toEqual({
      ok: true,
      step: "chooseProject",
      client,
      projects: [{ id: 3, nameEn: "Tower A", nameAr: "البرج أ" }],
    });
    expect(lastRequest().body).toMatchObject({
      clientCode: "golf-marina",
      projectId: 3,
    });
  });

  it("returns the clients to choose from", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { step: "chooseClient", clients: [client, client] }),
    );

    expect(await logIn(credentials)).toEqual({
      ok: true,
      step: "chooseClient",
      clients: [client, client],
    });
  });

  it.each([
    [401, { ok: false, reason: "invalid_credentials" }],
    [403, { ok: false, reason: "account_disabled" }],
  ])("maps %i", async (status, expected) => {
    fetchMock.mockResolvedValueOnce(jsonResponse(status, errorBody(status, "x")));

    expect(await logIn(credentials)).toEqual(expected);
  });

  it("reports throttling with the Retry-After delay", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(429, errorBody(429, "Too many"), { "Retry-After": "42" }),
    );

    expect(await logIn(credentials)).toEqual({
      ok: false,
      reason: "too_many_attempts",
      retryAfterSeconds: 42,
    });
  });

  it.each([
    ["a validation error", jsonResponse(422, errorBody(422, "invalid"))],
    ["an unreachable client backend", jsonResponse(503, errorBody(503, "down"))],
    ["an unknown step", jsonResponse(200, { step: "other" })],
    ["a non-JSON body", new Response("<html>", { status: 200 })],
    ["success without a token cookie", jsonResponse(200, doneBody)],
    [
      "an expired token",
      jsonResponse(200, doneBody, {
        "Set-Cookie": `access_token=${jwt({ exp: 1 })}; Path=/`,
      }),
    ],
  ])("treats %s as unavailable", async (_name, response) => {
    fetchMock.mockResolvedValueOnce(response);

    expect(await logIn(credentials)).toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("treats a network failure as unavailable without logging the password", async () => {
    fetchMock.mockRejectedValueOnce(
      new TypeError("fetch failed", { cause: { code: "ECONNREFUSED" } }),
    );

    expect(await logIn({ ...credentials, password: "hunter2" })).toEqual({
      ok: false,
      reason: "unavailable",
    });

    const logged = vi.mocked(console.error).mock.calls.flat().join(" ");
    expect(logged).toContain("ECONNREFUSED");
    expect(logged).not.toContain("hunter2");
  });

  it.each(["", "http://portal-api.example.com"])(
    "does not call the API when PORTAL_API_URL is %j",
    async (value) => {
      vi.stubEnv("PORTAL_API_URL", value);

      expect(await logIn(credentials)).toEqual({
        ok: false,
        reason: "unavailable",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});
