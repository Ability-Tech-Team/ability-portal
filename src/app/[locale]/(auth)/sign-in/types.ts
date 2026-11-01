import type { EmailError } from "../_shared/validation";

export type SignInFieldErrors = {
  email?: EmailError;
  password?: "password_required" | "password_too_long";
};

export type SignInError =
  | "invalid_credentials"
  | "too_many_attempts"
  | "choice_required"
  | "unavailable";

/**
 * What the sign-in action returns to the form. The email is sent back so the
 * field keeps it; the password never is.
 */
export type SignInFormState =
  | { status: "idle"; email: string }
  | { status: "invalid"; email: string; fieldErrors: SignInFieldErrors }
  | {
      status: "failed";
      email: string;
      error: SignInError;
      retryAfterMinutes: number | null;
    };

/** Messages the sign-in page can show from its `notice` query parameter. */
export type SignInNotice = "signed-out" | "session-ended";
