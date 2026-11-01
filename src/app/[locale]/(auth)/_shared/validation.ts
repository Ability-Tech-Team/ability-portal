/**
 * Field rules for the sign-in form. The limits mirror the portal backend's own
 * validation of `POST /api/auth/login` (a valid email address, a password of
 * at most 128 characters); the backend stays the authority and rejects
 * anything these checks let through.
 */

/** The HTML standard's "valid email address", which browsers check. */
const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const EMAIL_MAX_LENGTH = 254;
export const SIGN_IN_PASSWORD_MAX_LENGTH = 128;

export type EmailError = "email_required" | "email_invalid";

/** Expects an already trimmed address. */
export function validateEmail(email: string): EmailError | null {
  if (!email) {
    return "email_required";
  }

  return email.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(email)
    ? null
    : "email_invalid";
}

/** Passwords are measured in Unicode code points, as the backend does. */
export function countCharacters(value: string): number {
  return Array.from(value).length;
}

/** `Retry-After` seconds as whole minutes for messages (at least 1). */
export function toRetryMinutes(seconds: number | null): number | null {
  return seconds === null ? null : Math.max(1, Math.ceil(seconds / 60));
}
