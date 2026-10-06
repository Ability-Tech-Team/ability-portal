import { ACCESS_TOKEN_COOKIE_NAME } from "./sessionCookie";

/**
 * The client's access token is a JWT signed by their own backend. The Portal
 * can't verify it (it doesn't hold the key) and doesn't need to: each product
 * verifies it. The Portal only reads `exp`, so its cookies never outlive the
 * token.
 */
const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const MAX_TOKEN_LENGTH = 4096;

/** The token's `exp` claim, or null for anything that isn't a JWT with one. */
export function readTokenExpiry(token: unknown): Date | null {
  if (
    typeof token !== "string" ||
    token.length > MAX_TOKEN_LENGTH ||
    !JWT_PATTERN.test(token)
  ) {
    return null;
  }

  try {
    const payload: unknown = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
    );
    const exp =
      payload && typeof payload === "object" && "exp" in payload
        ? payload.exp
        : null;

    return typeof exp === "number" && Number.isFinite(exp)
      ? new Date(exp * 1000)
      : null;
  } catch {
    return null;
  }
}

/** The `access_token` value from a response's `Set-Cookie` headers. */
export function readAccessTokenCookie(setCookies: string[]): string | null {
  const prefix = `${ACCESS_TOKEN_COOKIE_NAME}=`;

  for (const header of setCookies) {
    if (!header.startsWith(prefix)) {
      continue;
    }

    const value = header.slice(prefix.length).split(";")[0].trim();

    try {
      return decodeURIComponent(value) || null;
    } catch {
      return null;
    }
  }

  return null;
}
