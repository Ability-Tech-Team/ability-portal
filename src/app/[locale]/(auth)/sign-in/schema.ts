import {
  SIGN_IN_PASSWORD_MAX_LENGTH,
  validateEmail,
} from "../_shared/validation";
import type { SignInFieldErrors } from "./types";

/**
 * Checks the sign-in fields before calling the account service. The email is
 * expected trimmed; the password is checked exactly as typed.
 */
export function validateSignInFields({
  email,
  password,
}: {
  email: string;
  password: string;
}): SignInFieldErrors {
  const errors: SignInFieldErrors = {};
  const emailError = validateEmail(email);

  if (emailError) {
    errors.email = emailError;
  }

  if (!password) {
    errors.password = "password_required";
  } else if (password.length > SIGN_IN_PASSWORD_MAX_LENGTH) {
    errors.password = "password_too_long";
  }

  return errors;
}
