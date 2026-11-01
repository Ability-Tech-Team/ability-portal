import { z } from "zod";
import type { ProductKey } from "./productDestinations";

/**
 * The portal backend's sign-in answer (`POST /api/auth/login`, `step: "done"`),
 * as the Portal keeps it in the `ability_portal_session` cookie for Ability
 * CRM and Community Admin, which never receive the answer themselves. The
 * products parse the cookie with the same rules (Ability CRM:
 * `src/lib/sessionDetails.ts`), so a cookie the Portal writes never sends a
 * user back to sign in. Unknown fields are dropped.
 *
 * The answer reaches the Portal's server from the browser, so it is display
 * data only: who is signed in and which products appear. The backend's
 * `access_token` cookie is the session, and the products' APIs decide every
 * request.
 */

const id = z.union([z.string().min(1), z.number()]);
const optionalText = z.string().nullish();

const sessionSchema = z.object({
  employee_id: id,
  user_name: z.string(),
  employee_name: optionalText,
  role_id: id.nullish(),
  role_name: optionalText,
  department_id: id.nullish(),
  company_project_id: id.nullish(),
  company_code: optionalText,
  project_code: optionalText,
  project_name: optionalText,
  employee_type_id: id.nullish(),
  employee_type_name: optionalText,
  safe_id: z.number().nullish(),
  safe_name: optionalText,
  platforms: z.array(z.string()).nullish(),
});

const clientSchema = z.object({
  code: z.string(),
  nameEn: z.string(),
  nameAr: z.string(),
  branding: z
    .object({
      nameEn: optionalText,
      nameAr: optionalText,
      logoUrl: optionalText,
    })
    .nullish(),
});

const platformSchema = z.object({
  key: z.string(),
  url: optionalText,
  apiUrl: optionalText,
});

const answerSchema = z.object({
  session: sessionSchema,
  client: clientSchema.nullish(),
  platforms: z.array(platformSchema).nullish(),
});

export type SignInAnswer = z.infer<typeof answerSchema>;

/** Each product's key in the answer's `platforms`. */
const PLATFORM_KEYS: Record<ProductKey, string> = {
  crm: "crm",
  communityAdmin: "community-admin",
};

/**
 * The cookie's name, value, and attributes must fit the browsers' 4 KB limit;
 * this leaves room for the name.
 */
export const MAX_COOKIE_VALUE_LENGTH = 4000;

/** The answer, or null when it isn't a completed sign-in in this format. */
export function parseSignInAnswer(value: unknown): SignInAnswer | null {
  const parsed = answerSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** The cookie value (base64url JSON), or null when it would be too long. */
export function encodeSignInAnswer(answer: SignInAnswer): string | null {
  const bytes = new TextEncoder().encode(JSON.stringify(answer));
  const base64 = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
  const value = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return value.length <= MAX_COOKIE_VALUE_LENGTH ? value : null;
}

/** The cookie's answer, or null when it is missing or not in this format. */
export function decodeSignInAnswer(
  raw: string | undefined | null,
): SignInAnswer | null {
  if (!raw || raw.length > MAX_COOKIE_VALUE_LENGTH || !/^[A-Za-z0-9_-]+$/.test(raw)) {
    return null;
  }

  try {
    const binary = atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return parseSignInAnswer(JSON.parse(json));
  } catch {
    return null;
  }
}

export type ProductAccessState = "available" | "not_included";

export type ProductAccess = Record<ProductKey, ProductAccessState>;

/**
 * Which products the signed-in user may open, from the session's `platforms`:
 * what the client bought, narrowed to what the user's role has screens in. A
 * product that isn't listed, or a session without the list, is never
 * available.
 */
export function productAccessFromPlatforms(
  platforms: readonly string[] | null | undefined,
): ProductAccess {
  const listed = (key: ProductKey): ProductAccessState =>
    platforms?.includes(PLATFORM_KEYS[key]) ? "available" : "not_included";

  return { crm: listed("crm"), communityAdmin: listed("communityAdmin") };
}

/** Who is signed in, for the Portal's header band. */
export type PortalAccount = {
  name: string;
  organizationEn: string | null;
  organizationAr: string | null;
};

export function accountFromAnswer(answer: SignInAnswer): PortalAccount {
  const { session, client } = answer;

  return {
    name: session.employee_name?.trim() || session.user_name,
    organizationEn: client?.nameEn.trim() || null,
    organizationAr: client?.nameAr.trim() || null,
  };
}
