"use server";

import { formLocale, formString } from "@/src/lib/formData";
import { getEndUserIp } from "@/src/lib/session";
import { requestPasswordReset } from "@/src/services/accountService";
import { toRetryMinutes, validateEmail } from "../_shared/validation";
import type { ForgotPasswordFormState } from "./types";

/**
 * Asks the account service to email a link for setting a new password, in
 * the page's language. The service answers the same way for every address.
 */
export async function requestPasswordLink(
  _previous: ForgotPasswordFormState,
  formData: FormData,
): Promise<ForgotPasswordFormState> {
  const locale = formLocale(formData);
  const email = formString(formData, "email").trim();
  const emailError = validateEmail(email);

  if (emailError) {
    return { status: "invalid", email, emailError };
  }

  const result = await requestPasswordReset({
    email,
    locale,
    endUserIp: await getEndUserIp(),
  });

  if (result.ok) {
    return { status: "sent", email };
  }

  return {
    status: "failed",
    email,
    error: result.reason,
    retryAfterMinutes:
      result.reason === "too_many_attempts"
        ? toRetryMinutes(result.retryAfterSeconds)
        : null,
  };
}
