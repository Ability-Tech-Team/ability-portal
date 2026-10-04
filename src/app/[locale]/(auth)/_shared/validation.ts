/**
 * Field rules shared by the sign-in and password pages. The limits mirror
 * docs/ACCOUNT-SERVICE-API.md (sections 6.1 and 6.5); the account service
 * stays the authority and rejects anything these checks let through.
 */

/** The HTML standard's "valid email address", which browsers check. */
const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const EMAIL_MAX_LENGTH = 254;
export const SIGN_IN_PASSWORD_MAX_LENGTH = 256;
export const NEW_PASSWORD_MIN_LENGTH = 15;
export const NEW_PASSWORD_MAX_LENGTH = 128;

export type EmailError = "email_required" | "email_invalid";

export type NewPasswordError =
  | "password_required"
  | "password_too_short"
  | "password_too_long";

export type ConfirmationError =
  | "confirmation_required"
  | "confirmation_mismatch";

/** Expects an already trimmed address. */
export function validateEmail(email: string): EmailError | null {
  if (!email) {
    return "email_required";
  }

  return email.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(email)
    ? null
    : "email_invalid";
}

/** Passwords are measured in Unicode code points, as the service does. */
export function countCharacters(value: string): number {
  return Array.from(value).length;
}

export function validateNewPassword(
  password: string,
  confirmation: string,
): { password?: NewPasswordError; confirmPassword?: ConfirmationError } {
  const length = countCharacters(password);
  const errors: {
    password?: NewPasswordError;
    confirmPassword?: ConfirmationError;
  } = {};

  if (length === 0) {
    errors.password = "password_required";
  } else if (length < NEW_PASSWORD_MIN_LENGTH) {
    errors.password = "password_too_short";
  } else if (length > NEW_PASSWORD_MAX_LENGTH) {
    errors.password = "password_too_long";
  }

  if (!confirmation) {
    errors.confirmPassword = "confirmation_required";
  } else if (!errors.password && confirmation !== password) {
    errors.confirmPassword = "confirmation_mismatch";
  }

  return errors;
}

/** `Retry-After` seconds as whole minutes for messages (at least 1). */
export function toRetryMinutes(seconds: number | null): number | null {
  return seconds === null ? null : Math.max(1, Math.ceil(seconds / 60));
}
