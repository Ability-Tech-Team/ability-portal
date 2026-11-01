import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import {
  accountFromAnswer,
  decodeSignInAnswer,
  encodeSignInAnswer,
  productAccessFromPlatforms,
  type PortalAccount,
  type ProductAccess,
  type SignInAnswer,
} from "./signInAnswer";
import {
  buildSessionCookieOptions,
  parseCookieDomain,
  SESSION_COOKIE_NAME,
  SESSION_LIFETIME_MS,
  shouldUseSecureCookie,
} from "./sessionCookie";

export type CurrentSession =
  | { status: "active"; account: PortalAccount; products: ProductAccess }
  | { status: "signed-out" };

let reportedInvalidDomain = false;

/**
 * Who is signed in, from the Portal's cookie (once per render). It is
 * display data: the products' APIs check the backend's `access_token` on
 * every request.
 */
export const getCurrentSession = cache(async (): Promise<CurrentSession> => {
  const answer = decodeSignInAnswer(
    (await cookies()).get(SESSION_COOKIE_NAME)?.value,
  );

  if (!answer) {
    return { status: "signed-out" };
  }

  return {
    status: "active",
    account: accountFromAnswer(answer),
    products: productAccessFromPlatforms(answer.session.platforms),
  };
});

/**
 * Stores the sign-in answer for the products. False when it doesn't fit in
 * a cookie. Server Actions only.
 */
export async function startSession(answer: SignInAnswer): Promise<boolean> {
  const value = encodeSignInAnswer(answer);

  if (value === null) {
    console.warn("The sign-in answer is too long for the session cookie.");
    return false;
  }

  (await cookies()).set(
    SESSION_COOKIE_NAME,
    value,
    await sessionCookieOptions(new Date(Date.now() + SESSION_LIFETIME_MS)),
  );
  return true;
}

/** Deletes the cookie, with the attributes it was set with. Server Actions only. */
export async function endSession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE_NAME, "", {
    ...(await sessionCookieOptions(new Date(0))),
    maxAge: 0,
  });
}

async function sessionCookieOptions(expires: Date) {
  const origin = (await headers()).get("origin");

  return buildSessionCookieOptions({
    expires,
    secure: shouldUseSecureCookie(origin),
    domain: getCookieDomain(),
  });
}

/**
 * `SESSION_COOKIE_DOMAIN`, the parent domain shared with the products. An
 * invalid value is reported and ignored: the cookie then stays on the Portal's
 * own host, and the products send users back to sign in.
 */
function getCookieDomain(): string | undefined {
  const setting = parseCookieDomain(process.env.SESSION_COOKIE_DOMAIN);

  if (setting.status === "invalid" && !reportedInvalidDomain) {
    reportedInvalidDomain = true;
    console.warn(
      "SESSION_COOKIE_DOMAIN is invalid (expected a host name such as apps.example.com); the session cookie stays on the Portal's own host.",
    );
  }

  return setting.status === "configured" ? setting.domain : undefined;
}
