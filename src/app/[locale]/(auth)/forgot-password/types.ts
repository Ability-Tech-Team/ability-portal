import type { EmailError } from "../_shared/validation";

/**
 * What the forgot-password action returns. "sent" is shown whether or not an
 * account uses the address, so the page never reveals which ones exist.
 */
export type ForgotPasswordFormState =
  | { status: "idle"; email: string }
  | { status: "invalid"; email: string; emailError: EmailError }
  | { status: "sent"; email: string }
  | {
      status: "failed";
      email: string;
      error: "too_many_attempts" | "unavailable";
      retryAfterMinutes: number | null;
    };
