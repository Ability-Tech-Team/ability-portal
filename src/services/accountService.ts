import "server-only";
import { z } from "zod";
import { getAccountServiceConfig } from "@/src/lib/accountServiceConfig";
import type { PasswordRule } from "@/src/types/account";

/**
 * Calls to the central account service for the password pages (forgot
 * password, set password); sign-in goes to the Portal API
 * (`portalApi.ts`). docs/ACCOUNT-SERVICE-API.md defines every endpoint,
 * status, and error code handled here. Anything outside the contract (no configuration,
 * network errors, timeouts, 5xx, unexpected bodies) is reported as
 * "unavailable", which never grants access.
 */

const REQUEST_TIMEOUT_MS = 10_000;

type Unavailable = { ok: false; reason: "unavailable" };

type TooManyAttempts = {
  ok: false;
  reason: "too_many_attempts";
  retryAfterSeconds: number | null;
};

export type PasswordResetResult = { ok: true } | TooManyAttempts | Unavailable;

export type SetPasswordResult =
  | { ok: true }
  | { ok: false; reason: "token_invalid" }
  | {
      ok: false;
      reason: "password_rejected";
      rule: PasswordRule;
      minLength?: number;
      maxLength?: number;
    }
  | TooManyAttempts
  | Unavailable;

const UNAVAILABLE: Unavailable = { ok: false, reason: "unavailable" };

const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    reason: z.string().optional(),
    minLength: z.number().int().positive().optional(),
    maxLength: z.number().int().positive().optional(),
  }),
});

type ServiceError = z.infer<typeof errorResponseSchema>["error"];

type ServiceResponse = {
  status: number;
  body: unknown;
  retryAfterSeconds: number | null;
};

type CallOptions = {
  method: "GET" | "POST";
  body?: Record<string, string>;
  endUserIp?: string;
  timeoutMs: number;
};

export async function requestPasswordReset(input: {
  email: string;
  locale: string;
  endUserIp?: string;
}): Promise<PasswordResetResult> {
  const path = "/v1/auth/password-reset";
  const response = await callAccountService(path, {
    method: "POST",
    body: { email: input.email, locale: input.locale },
    endUserIp: input.endUserIp,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });

  if (!response) {
    return UNAVAILABLE;
  }

  if (isSuccess(response.status)) {
    return { ok: true };
  }

  if (response.status === 429) {
    return tooManyAttempts(response);
  }

  reportUnexpected("POST", path, response);
  return UNAVAILABLE;
}

export async function setPassword(input: {
  token: string;
  password: string;
  endUserIp?: string;
}): Promise<SetPasswordResult> {
  const path = "/v1/auth/password";
  const response = await callAccountService(path, {
    method: "POST",
    body: { token: input.token, password: input.password },
    endUserIp: input.endUserIp,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });

  if (!response) {
    return UNAVAILABLE;
  }

  if (isSuccess(response.status)) {
    return { ok: true };
  }

  const error = readError(response.body);

  if (response.status === 400 && error?.code === "token_invalid") {
    return { ok: false, reason: "token_invalid" };
  }

  if (response.status === 422 && error?.code === "password_rejected") {
    return {
      ok: false,
      reason: "password_rejected",
      rule: toPasswordRule(error.reason),
      minLength: error.minLength,
      maxLength: error.maxLength,
    };
  }

  if (response.status === 429) {
    return tooManyAttempts(response);
  }

  reportUnexpected("POST", path, response);
  return UNAVAILABLE;
}

async function callAccountService(
  path: string,
  options: CallOptions,
): Promise<ServiceResponse | null> {
  const config = getAccountServiceConfig();

  if (!config) {
    return null;
  }

  const requestId = crypto.randomUUID();
  const headers = new Headers({
    Accept: "application/json",
    Authorization: config.authorization,
    "X-Request-Id": requestId,
  });

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.endUserIp) {
    headers.set("X-End-User-IP", options.endUserIp);
  }

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      // The service never redirects; following one could send the app's
      // credentials elsewhere.
      redirect: "error",
      signal: AbortSignal.timeout(options.timeoutMs),
    });

    return {
      status: response.status,
      body: await readJsonBody(response),
      retryAfterSeconds: parseRetryAfter(response.headers.get("retry-after")),
    };
  } catch (error) {
    // Never log the request itself: it can hold a password or a token.
    console.error(
      `Account service ${options.method} ${path} failed (request ${requestId}): ${describeError(error)}`,
    );
    return null;
  }
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

function readError(body: unknown): ServiceError | null {
  const parsed = errorResponseSchema.safeParse(body);
  return parsed.success ? parsed.data.error : null;
}

function isSuccess(status: number): boolean {
  return status >= 200 && status < 300;
}

function tooManyAttempts(response: ServiceResponse): TooManyAttempts {
  return {
    ok: false,
    reason: "too_many_attempts",
    retryAfterSeconds: response.retryAfterSeconds,
  };
}

function toPasswordRule(reason: string | undefined): PasswordRule {
  return reason === "too_short" ||
    reason === "too_long" ||
    reason === "too_common"
    ? reason
    : "other";
}

function reportUnexpected(
  method: string,
  path: string,
  response: ServiceResponse,
) {
  const code = readError(response.body)?.code;
  console.error(
    `Account service ${method} ${path} answered ${response.status}${code ? ` (${code})` : ""}; treated as unavailable.`,
  );
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
