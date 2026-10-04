import { isWellFormedToken } from "@/src/lib/tokens";
import type { PasswordRule } from "@/src/types/account";
import type { SetPasswordFieldErrors } from "./types";

/**
 * The token of an invitation or reset link, `…/set-password#token=…`. It sits
 * in the fragment, so the browser never sends it to a server.
 */
export function readTokenFromHash(hash: string): string | null {
  const value = new URLSearchParams(hash.replace(/^#/, "")).get("token");
  return isWellFormedToken(value) ? value : null;
}

/** The field error for a password the account service rejected. */
export function toPasswordFieldError(
  rule: PasswordRule,
): NonNullable<SetPasswordFieldErrors["password"]> {
  switch (rule) {
    case "too_short":
      return "password_too_short";
    case "too_long":
      return "password_too_long";
    case "too_common":
      return "password_too_common";
    case "other":
      return "password_rejected";
  }
}
