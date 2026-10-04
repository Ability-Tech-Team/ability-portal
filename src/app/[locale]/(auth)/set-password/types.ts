import type { ConfirmationError, NewPasswordError } from "../_shared/validation";

export type SetPasswordFieldErrors = {
  password?: NewPasswordError | "password_too_common" | "password_rejected";
  confirmPassword?: ConfirmationError;
};

/**
 * What the set-password action returns. Success redirects to the sign-in
 * page instead. The length limits come from the account service when it
 * rejects a password, so messages quote its actual policy.
 */
export type SetPasswordFormState =
  | { status: "idle" }
  | {
      status: "invalid";
      fieldErrors: SetPasswordFieldErrors;
      minLength: number;
      maxLength: number;
    }
  | {
      status: "failed";
      error: "token_invalid" | "too_many_attempts" | "unavailable";
      retryAfterMinutes: number | null;
    };
