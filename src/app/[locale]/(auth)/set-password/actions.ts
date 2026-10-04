"use server";

import { redirect } from "next/navigation";
import { formLocale, formString } from "@/src/lib/formData";
import { getEndUserIp } from "@/src/lib/session";
import { isWellFormedToken } from "@/src/lib/tokens";
import { setPassword } from "@/src/services/accountService";
import {
  NEW_PASSWORD_MAX_LENGTH,
  NEW_PASSWORD_MIN_LENGTH,
  toRetryMinutes,
  validateNewPassword,
} from "../_shared/validation";
import type { SetPasswordFormState } from "./types";
import { toPasswordFieldError } from "./utils";

/**
 * Sets the client's password from an invitation or reset link. The account
 * service ends every session of the account, so the client signs in again.
 */
export async function setNewPassword(
  _previous: SetPasswordFormState,
  formData: FormData,
): Promise<SetPasswordFormState> {
  const locale = formLocale(formData);
  const token = formString(formData, "token");
  const password = formString(formData, "password");
  const confirmation = formString(formData, "confirmPassword");

  if (!isWellFormedToken(token)) {
    return { status: "failed", error: "token_invalid", retryAfterMinutes: null };
  }

  const fieldErrors = validateNewPassword(password, confirmation);

  if (fieldErrors.password || fieldErrors.confirmPassword) {
    return {
      status: "invalid",
      fieldErrors,
      minLength: NEW_PASSWORD_MIN_LENGTH,
      maxLength: NEW_PASSWORD_MAX_LENGTH,
    };
  }

  const result = await setPassword({
    token,
    password,
    endUserIp: await getEndUserIp(),
  });

  if (result.ok) {
    redirect(`/${locale}/sign-in?notice=password-set`);
  }

  if (result.reason === "password_rejected") {
    return {
      status: "invalid",
      fieldErrors: { password: toPasswordFieldError(result.rule) },
      minLength: result.minLength ?? NEW_PASSWORD_MIN_LENGTH,
      maxLength: result.maxLength ?? NEW_PASSWORD_MAX_LENGTH,
    };
  }

  return {
    status: "failed",
    error: result.reason,
    retryAfterMinutes:
      result.reason === "too_many_attempts"
        ? toRetryMinutes(result.retryAfterSeconds)
        : null,
  };
}
