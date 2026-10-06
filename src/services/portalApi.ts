import "server-only";
import { z } from "zod";
import {
  readAccessTokenCookie,
  readTokenExpiry,
} from "@/src/lib/accessToken";
import { getPortalApiUrl } from "@/src/lib/portalApiConfig";
import type { ProductKey } from "@/src/lib/productDestinations";
import type { AccountSummary, Platform } from "@/src/types/account";

/**
 * Calls to the Portal API (`POST /api/auth/login`), which finds the client
 * an email address belongs to and signs in with that client's own backend.
 * Its Swagger document is served at `/docs` outside production. Anything
 * unexpected (no configuration, network errors, timeouts, 5xx, unknown
 * bodies) is reported as "unavailable", which never signs anyone in.
 */

const REQUEST_TIMEOUT_MS = 15_000;

export type ClientOption = { code: string; nameEn: string; nameAr: string };

export type ProjectOption = { id: number; nameEn: string; nameAr: string };

export type LoginResult =
  | {
      ok: true;
      step: "done";
      token: string;
      expiresAt: Date;
      account: AccountSummary;
      platforms: Platform[];
    }
  | { ok: true; step: "chooseClient"; clients: ClientOption[] }
  | {
      ok: true;
      step: "chooseProject";
      client: ClientOption;
      projects: ProjectOption[];
    }
  | { ok: false; reason: "invalid_credentials" | "account_disabled" }
  | { ok: false; reason: "too_many_attempts"; retryAfterSeconds: number | null }
  | { ok: false; reason: "unavailable" };

const UNAVAILABLE: LoginResult = { ok: false, reason: "unavailable" };

/** The Portal API's platform keys. */
const platformKeys: Record<string, ProductKey> = {
  crm: "crm",
  "community-admin": "communityAdmin",
};

const clientSchema = z.object({
  code: z.string().min(1).max(30),
  nameEn: z.string(),
  nameAr: z.string(),
});

const loginResponseSchema = z.discriminatedUnion("step", [
  z.object({
    step: z.literal("done"),
    client: clientSchema,
    platforms: z.array(z.object({ key: z.string(), url: z.string() })),
    // The client backend's own login answer, without the token.
    session: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({
    step: z.literal("chooseClient"),
    clients: z.array(clientSchema).min(1),
  }),
  z.object({
    step: z.literal("chooseProject"),
    client: clientSchema,
    projects: z
      .array(
        z.object({
          id: z.number().int().positive(),
          nameEn: z.string(),
          nameAr: z.string(),
        }),
      )
      .min(1),
  }),
]);

export async function logIn(input: {
  email: string;
  password: string;
  clientCode?: string;
  projectId?: number;
  locale: string;
  endUserIp?: string;
}): Promise<LoginResult> {
  const baseUrl = getPortalApiUrl();

  if (!baseUrl) {
    return UNAVAILABLE;
  }

  const headers = new Headers({
    Accept: "application/json",
    "Accept-Language": input.locale,
    "Content-Type": "application/json",
  });

  // The Portal API trusts one proxy hop, so its rate limit counts the
  // client's address rather than the Portal's.
  if (input.endUserIp) {
    headers.set("X-Forwarded-For", input.endUserIp);
  }

  let response: Response;
  let body: unknown;

  try {
    response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        ...(input.clientCode ? { clientCode: input.clientCode } : {}),
        ...(input.projectId ? { projectId: input.projectId } : {}),
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    body = await readJsonBody(response);
  } catch (error) {
    // Never log the request itself: it holds a password.
    console.error(`Portal API login failed: ${describeError(error)}`);
    return UNAVAILABLE;
  }

  switch (response.status) {
    case 200:
      return readLoginAnswer(response, body, input.email);
    case 401:
      return { ok: false, reason: "invalid_credentials" };
    case 403:
      return { ok: false, reason: "account_disabled" };
    case 429:
      return {
        ok: false,
        reason: "too_many_attempts",
        retryAfterSeconds: parseRetryAfter(response.headers.get("retry-after")),
      };
    default:
      console.error(
        `Portal API login answered ${response.status}; treated as unavailable.`,
      );
      return UNAVAILABLE;
  }
}

function readLoginAnswer(
  response: Response,
  body: unknown,
  email: string,
): LoginResult {
  const parsed = loginResponseSchema.safeParse(body);

  if (!parsed.success) {
    console.error("Portal API login answered an unexpected body.");
    return UNAVAILABLE;
  }

  const answer = parsed.data;

  if (answer.step === "chooseClient") {
    return { ok: true, step: "chooseClient", clients: answer.clients };
  }

  if (answer.step === "chooseProject") {
    return {
      ok: true,
      step: "chooseProject",
      client: answer.client,
      projects: answer.projects,
    };
  }

  const token = readAccessTokenCookie(response.headers.getSetCookie());
  const expiresAt = readTokenExpiry(token);

  if (!token || !expiresAt || expiresAt.getTime() <= Date.now()) {
    console.error(
      "Portal API login succeeded without a usable access_token cookie.",
    );
    return UNAVAILABLE;
  }

  const name = answer.session?.employee_name;

  return {
    ok: true,
    step: "done",
    token,
    expiresAt,
    account: {
      email,
      name: typeof name === "string" ? name.trim().slice(0, 200) : "",
    },
    platforms: answer.platforms.flatMap((platform) => {
      const key = platformKeys[platform.key];
      return key ? [{ key, url: platform.url }] : [];
    }),
  };
}

async function readJsonBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** `Retry-After` as seconds: a number of seconds or an HTTP date. */
function parseRetryAfter(value: string | null): number | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const date = Date.parse(trimmed);
  return Number.isNaN(date)
    ? null
    : Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

function describeError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "unknown error";
  }

  const cause = error.cause;
  const causeCode =
    cause && typeof cause === "object" && "code" in cause
      ? String(cause.code)
      : null;

  return causeCode ? `${error.name} (${causeCode})` : error.name;
}
