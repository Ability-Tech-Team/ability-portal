import "server-only";
import { parseBaseUrl } from "@/src/lib/baseUrl";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/src/lib/sessionCookie";

/**
 * A diagnostic call to the CRM's own API (crm-api), to check that the access
 * token the Portal stored is one the CRM accepts. It sends the token the way
 * the CRM's web app does, in the \`access_token\` cookie, to an endpoint that
 * needs a signed-in user and no particular role.
 *
 * The CRM answers every request with HTTP 200 and puts the real status in
 * the body (\`{ success, statusCode }\`): 401 means the token was rejected; any
 * other answer means it was accepted (403 still needs a valid token).
 */

const CHECK_PATH = "/definitions/contact-channels";
const REQUEST_TIMEOUT_MS = 10_000;

export type CrmTokenCheck =
  | { outcome: "not-configured" }
  | {
      outcome: "accepted" | "rejected" | "unexpected";
      url: string;
      httpStatus: number;
      /** The status the CRM put in its body, if any. */
      bodyStatusCode: number | null;
      message: string | null;
    }
  | { outcome: "unreachable"; url: string; error: string };

/** `CRM_API_URL`, server-only, e.g. `https://crm-api.example.com`. */
export function getCrmApiUrl(): string | null {
  const url = parseBaseUrl(process.env.CRM_API_URL);
  return url.status === "configured" ? url.baseUrl : null;
}

/** The endpoint the token check calls, or null without `CRM_API_URL`. */
export function getCrmCheckUrl(): string | null {
  const baseUrl = getCrmApiUrl();
  return baseUrl ? `${baseUrl}${CHECK_PATH}` : null;
}

export async function checkCrmToken(
  token: string,
  locale: string,
): Promise<CrmTokenCheck> {
  const url = getCrmCheckUrl();

  if (!url) {
    return { outcome: "not-configured" };
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": locale,
        lang: locale,
        Cookie: `${ACCESS_TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}`,
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body = await readJsonBody(response);
    const bodyStatusCode = readNumber(body, "statusCode");
    const success = body && typeof body === "object" && "success" in body
      ? body.success
      : null;
    const status = bodyStatusCode ?? response.status;

    return {
      outcome:
        status === 401
          ? "rejected"
          : success === true || (status >= 200 && status < 500)
            ? "accepted"
            : "unexpected",
      url,
      httpStatus: response.status,
      bodyStatusCode,
      message: readMessage(body),
    };
  } catch (error) {
    return {
      outcome: "unreachable",
      url,
      error: error instanceof Error ? error.message : "unknown error",
    };
  }
}

async function readJsonBody(response: Response): Promise<unknown> {
  try {
    return JSON.parse(await response.text());
  } catch {
    return null;
  }
}

function readNumber(body: unknown, key: string): number | null {
  if (!body || typeof body !== "object" || !(key in body)) {
    return null;
  }

  const value = (body as Record<string, unknown>)[key];
  return typeof value === "number" ? value : null;
}

/** The CRM's message or error code, for the log; never the data. */
function readMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const result =
    record.result && typeof record.result === "object"
      ? (record.result as Record<string, unknown>)
      : {};

  for (const value of [record.message, record.code, result.message, result.code]) {
    if (typeof value === "string" && value) {
      return value.slice(0, 200);
    }
  }

  return null;
}
