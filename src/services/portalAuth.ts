/**
 * The portal backend's sign-in and sign-out, called from the browser so that
 * the browser itself receives (and later drops) the backend's HttpOnly
 * `access_token` cookie, which Ability CRM's and Community Admin's APIs accept.
 * The password goes only to the backend, never to the Portal's server.
 *
 * Statuses follow the backend's OpenAPI description (`/docs-json`). Anything
 * else, including a network error or a browser CORS block, is "unavailable".
 */

const REQUEST_TIMEOUT_MS = 10_000;

export type PortalSignInResult =
  /** The answer is checked again on the Portal's server before it is stored. */
  | { ok: true; answer: unknown }
  | {
      ok: false;
      /**
       * `choice_required`: the email belongs to several clients or projects,
       * and the backend asks to choose one (not offered yet).
       */
      reason: "invalid_credentials" | "choice_required" | "unavailable";
    }
  | { ok: false; reason: "too_many_attempts"; retryAfterSeconds: number | null };

const UNAVAILABLE = { ok: false, reason: "unavailable" } as const;

export async function signIn(
  baseUrl: string,
  credentials: { email: string; password: string },
): Promise<PortalSignInResult> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      redirect: "error",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(credentials),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return UNAVAILABLE;
  }

  switch (response.status) {
    case 200:
      break;
    // 422 is the backend's field validation, which the form mirrors.
    case 401:
    case 422:
      return { ok: false, reason: "invalid_credentials" };
    case 429:
      return {
        ok: false,
        reason: "too_many_attempts",
        retryAfterSeconds: parseRetryAfter(response.headers.get("retry-after")),
      };
    default:
      return UNAVAILABLE;
  }

  const body: unknown = await response.json().catch(() => null);
  const step =
    typeof body === "object" && body !== null && "step" in body
      ? body.step
      : undefined;

  if (step === "done") {
    return { ok: true, answer: body };
  }

  return typeof step === "string"
    ? { ok: false, reason: "choice_required" }
    : UNAVAILABLE;
}

/**
 * Asks the backend to clear its `access_token` cookie. Best effort: false
 * when it couldn't be reached.
 */
export async function signOut(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
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
