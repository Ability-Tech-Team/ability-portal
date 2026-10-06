import type {
  ClientOption,
  ProjectOption,
} from "@/src/services/portalApi";
import type { EmailError } from "../_shared/validation";

export type { ClientOption, ProjectOption };

export type SignInFieldErrors = {
  email?: EmailError;
  password?: "password_required" | "password_too_long";
};

export type SignInError =
  | "invalid_credentials"
  | "account_disabled"
  | "too_many_attempts"
  | "unavailable";

/**
 * What the sign-in action returns to the form. The email is sent back so the
 * field keeps it; the password never is. When the email belongs to several
 * clients, or the account to several projects, the form asks which one and
 * signs in again with the choice.
 */
export type SignInFormState =
  | { status: "idle"; email: string }
  | { status: "invalid"; email: string; fieldErrors: SignInFieldErrors }
  | {
      status: "failed";
      email: string;
      error: SignInError;
      retryAfterMinutes: number | null;
    }
  | {
      status: "choose-client";
      email: string;
      clients: ClientOption[];
      choiceMissing?: boolean;
    }
  | {
      status: "choose-project";
      email: string;
      client: ClientOption;
      projects: ProjectOption[];
      choiceMissing?: boolean;
    };

/** Messages the sign-in page can show from its `notice` query parameter. */
export type SignInNotice = "signed-out" | "session-ended" | "password-set";
